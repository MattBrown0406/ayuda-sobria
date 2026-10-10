import { createFileRoute } from "@tanstack/react-router";

// The Sober Helpline app's "Reservar mi lugar" for La Sobremesa. Server to server from
// the app backend (x-membership-sync-secret = AYUDA_SYNC_SECRET), which sends the
// member's VERIFIED app email. Registers them for the upcoming meeting exactly like the
// public form (confirmation email with link and calendar, admin notice) and returns
// their personal join link, which the public form never returns because there the email
// is unproven. Same person again = same registration and link.
export const Route = createFileRoute("/api/zoom/app-register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ safeEqualUtf8 }, { appSyncSecret, normalizeEmail }] = await Promise.all([
          import("@/lib/zoom/security"),
          import("@/lib/app-bridge.server"),
        ]);
        const secret = appSyncSecret();
        const provided = request.headers.get("x-membership-sync-secret") ?? "";
        if (!secret || !provided || !safeEqualUtf8(provided, secret)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const body = (await request.json().catch(() => null)) as {
          email?: unknown;
          fullName?: unknown;
        } | null;
        const email = normalizeEmail(body?.email);
        // Same clean-up as the public form: no control characters (it reaches email headers).
        const fullName =
          typeof body?.fullName === "string"
            ? body.fullName
                // eslint-disable-next-line no-control-regex
                .replace(/[\u0000-\u001f\u007f]+/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 120)
            : "";
        if (!email || !fullName) {
          return Response.json({ error: "invalid request" }, { status: 400 });
        }

        const [
          { registerForOccurrence },
          { zoomClientFromEnv },
          { registrationMailerFromEnv },
          { createSupabaseZoomStore },
          { supabaseAdmin },
        ] = await Promise.all([
          import("@/lib/zoom/registration.server"),
          import("@/lib/zoom/client.server"),
          import("@/lib/zoom/email.server"),
          import("@/lib/zoom/supabase-store.server"),
          import("@/integrations/supabase/client.server"),
        ]);
        try {
          const result = await registerForOccurrence({
            registration: {
              occurrenceId: "",
              fullName,
              email,
              location: "App Sober Helpline",
              autoRegister: false,
              requestFollowUp: false,
              // The app shows the confidentiality note on the reserve button.
              consentConfidentiality: true,
              consentUpdates: false,
            },
            store: createSupabaseZoomStore(supabaseAdmin),
            zoom: zoomClientFromEnv(),
            mailer: registrationMailerFromEnv(),
            source: "app",
          });
          const joinUrl = result.registration.zoomJoinUrl;
          if (!joinUrl) throw new Error("registration has no join link");
          return Response.json({
            joinUrl,
            startsAt: result.occurrence.startsAt,
            occurrenceDate: result.occurrence.occurrenceDate,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          if (message === "OCCURRENCE_NOT_AVAILABLE") {
            return Response.json({ error: "not available" }, { status: 404 });
          }
          if (message === "REGISTRATION_BUSY") {
            return Response.json({ error: "busy" }, { status: 409 });
          }
          console.error("App registration failed", message);
          return Response.json({ error: "unavailable" }, { status: 502 });
        }
      },
    },
  },
});
