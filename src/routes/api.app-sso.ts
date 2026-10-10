import { createFileRoute } from "@tanstack/react-router";

// The Sober Helpline app opens AyudaSobria pages with ?sso_token=… (single use, short
// lived). The browser posts it here; we redeem it with the app backend, find or create the
// website account for the member's verified email, record their app membership, and
// return a one-time magic-link hash the browser exchanges for a session (verifyOtp).
// Same flow as soberhelpline.com's app-sso-exchange.
export const Route = createFileRoute("/api/app-sso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
        const token = typeof body?.token === "string" ? body.token.trim() : "";
        if (!/^[0-9a-f-]{36}$/i.test(token)) {
          return Response.json({ error: "invalid token" }, { status: 400 });
        }
        const { limitKey, requestIp, withinRateLimit } = await import("@/lib/rate-limit.server");
        if (!(await withinRateLimit(limitKey("app-sso-ip", requestIp(request)), 30, 600))) {
          return Response.json({ error: "too many requests" }, { status: 429 });
        }
        const [{ supabaseAdmin }, { appSyncSecret, redeemAppSsoToken }] = await Promise.all([
          import("@/integrations/supabase/client.server"),
          import("@/lib/app-bridge.server"),
        ]);
        const secret = appSyncSecret();
        if (!secret) return Response.json({ error: "not configured" }, { status: 503 });
        try {
          const member = await redeemAppSsoToken(token, secret);
          if (!member) return Response.json({ error: "invalid token" }, { status: 400 });

          // Website account for this verified email: existing, or created confirmed
          // (the app already verified the address).
          const { data: existingId, error: lookupError } = await supabaseAdmin.rpc(
            "auth_user_id_by_email",
            { p_email: member.email },
          );
          if (lookupError) throw new Error(lookupError.message);
          if (typeof existingId === "string" && existingId) {
            // Staff accounts (admin) never sign in through an app link; they use the
            // site's own sign-in.
            const { data: roles, error: rolesError } = await supabaseAdmin
              .from("user_roles")
              .select("role")
              .eq("user_id", existingId)
              .limit(1);
            if (rolesError) throw new Error(rolesError.message);
            if (roles?.length) return Response.json({ error: "use site sign-in" }, { status: 403 });
            // An unconfirmed website account with this email may have been opened by
            // someone else; the app proves the real owner, so lock out its password first.
            const { data: existing, error: existingError } =
              await supabaseAdmin.auth.admin.getUserById(existingId);
            if (existingError || !existing?.user) {
              throw new Error(existingError?.message ?? "account lookup failed");
            }
            if (!existing.user.email_confirmed_at) {
              const { error: lockError } = await supabaseAdmin.auth.admin.updateUserById(
                existingId,
                { password: crypto.randomUUID() + crypto.randomUUID(), email_confirm: true },
              );
              if (lockError) throw new Error(lockError.message);
            }
          } else {
            const { error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: member.email,
              email_confirm: true,
              user_metadata: member.firstName ? { first_name: member.firstName } : {},
            });
            if (createError) throw new Error(createError.message);
          }

          if (member.member) {
            const tier = member.tier === "premier" ? "premier" : "essential";
            const { error: accessError } = await supabaseAdmin.from("app_member_access").upsert(
              {
                email: member.email,
                tier,
                expires_at: null,
                source: "sso",
                synced_at: new Date().toISOString(),
              },
              { onConflict: "email" },
            );
            if (accessError) throw new Error(accessError.message);
          }

          const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: member.email,
          });
          const tokenHash = link?.properties?.hashed_token;
          if (linkError || !tokenHash) throw new Error(linkError?.message ?? "no link");
          return Response.json({ tokenHash, member: member.member });
        } catch (error) {
          console.error(
            "App sign-in exchange failed",
            error instanceof Error ? error.message : "unknown error",
          );
          return Response.json({ error: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
