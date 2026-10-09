import { createFileRoute } from "@tanstack/react-router";

// Called by the Sober Helpline app backend (sync-web-membership), server to server with
// x-membership-sync-secret = AYUDA_SYNC_SECRET: "does this email hold an active
// AyudaSobria membership?" A yes gives that person the app's Essential tier, exactly as
// soberhelpline.com's check-membership-email does. Only PayPal memberships bought here
// count, never access mirrored from the app (or the two would keep each other alive).
export const Route = createFileRoute("/api/membership/check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ safeEqualUtf8 }, { appSyncSecret, normalizeEmail }] = await Promise.all([
          import("@/lib/zoom/security"),
          import("@/lib/app-bridge.server"),
        ]);
        const secret = appSyncSecret();
        // Not set up yet: the app reads 404 as "nobody is a member here", never as an outage.
        if (!secret) return Response.json({ error: "not configured" }, { status: 404 });
        const provided = request.headers.get("x-membership-sync-secret") ?? "";
        if (!provided || !safeEqualUtf8(provided, secret)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
        const email = normalizeEmail(body?.email);
        if (!email) return Response.json({ isMember: false });

        const [
          { supabaseAdmin },
          { reconcileUserMemberships },
          { membershipAllowsRecordingAccess },
        ] = await Promise.all([
          import("@/integrations/supabase/client.server"),
          import("@/lib/membership-sync.server"),
          import("@/lib/zoom/recording-access"),
        ]);
        try {
          // Website account by LOGIN email (never a user-editable profile field).
          const { data: userId, error } = await supabaseAdmin.rpc("auth_user_id_by_email", {
            p_email: email,
          });
          if (error) throw new Error(error.message);
          if (typeof userId !== "string" || !userId) return Response.json({ isMember: false });
          const { data: user, error: userError } =
            await supabaseAdmin.auth.admin.getUserById(userId);
          if (userError) throw new Error(userError.message);
          if (!user?.user?.email_confirmed_at) return Response.json({ isMember: false });
          const rows = await reconcileUserMemberships(userId);
          return Response.json({
            isMember: membershipAllowsRecordingAccess(rows, new Date().toISOString()),
          });
        } catch (error) {
          console.error(
            "Membership check failed",
            error instanceof Error ? error.message : "unknown error",
          );
          // A non-2xx makes the app keep its current state instead of revoking.
          return Response.json({ error: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
