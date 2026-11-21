import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/zoom/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const declaredLength = Number(request.headers.get("content-length") || "0");
        if (declaredLength > 16_384) {
          return Response.json({ error: "Solicitud demasiado grande." }, { status: 413 });
        }
        let body: unknown;
        try {
          const raw = await request.clone().text();
          if (new TextEncoder().encode(raw).byteLength > 16_384) {
            return Response.json({ error: "Solicitud demasiado grande." }, { status: 413 });
          }
          body = JSON.parse(raw);
        } catch {
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }

        const [
          { checkPublicRegistrationAbuse },
          { createRegistrationHandler },
          { zoomClientFromEnv },
          { registrationMailerFromEnv },
          { createSupabaseZoomStore },
          { supabaseAdmin },
        ] = await Promise.all([
          import("@/lib/zoom/abuse.server"),
          import("@/lib/zoom/registration.server"),
          import("@/lib/zoom/client.server"),
          import("@/lib/zoom/email.server"),
          import("@/lib/zoom/supabase-store.server"),
          import("@/integrations/supabase/client.server"),
        ]);
        const abuse = await checkPublicRegistrationAbuse({
          body: body as Record<string, unknown>,
          request,
        });
        if (!abuse.allowed) {
          if (abuse.trapped) return Response.json({ ok: true, accepted: false });
          if (abuse.response) return abuse.response;
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }

        try {
          const mailer = registrationMailerFromEnv();
          if (!mailer) {
            // The public response deliberately withholds the join link, so
            // without a mailer registrants have no way to receive it. Log
            // loudly; the registration itself still proceeds.
            console.error(
              "Zoom registration mailer is not configured (RESEND_API_KEY/LOVABLE_API_KEY missing); confirmations will not be sent",
            );
          }
          const response = await createRegistrationHandler({
            store: createSupabaseZoomStore(supabaseAdmin),
            zoom: zoomClientFromEnv(),
            mailer,
            now: () => new Date(),
          })(request);
          if (response.ok) {
            const b = body as Record<string, unknown>;
            const { sendSpineEvent } = await import("@/lib/spine.server");
            const name = typeof b.fullName === "string" ? b.fullName : typeof b.nombre === "string" ? b.nombre : "";
            const phone = typeof b.phone === "string" ? b.phone : typeof b.telefono === "string" ? b.telefono : "";
            await sendSpineEvent({
              email: typeof b.email === "string" ? b.email : "",
              event: "lead_captured",
              ...(name ? { name } : {}),
              ...(phone ? { phone } : {}),
              props: {
                source: "zoom_sobremesa_registration",
                language: "es",
                marketing_consent: b.newsletter === true,
              },
            });
          }
          return response;
        } catch (error) {
          console.error(
            "Zoom registration configuration error",
            error instanceof Error ? error.message : "unknown error",
          );
          return Response.json(
            { error: "El registro de Zoom no está configurado todavía." },
            { status: 503 },
          );
        }
      },
    },
  },
});
