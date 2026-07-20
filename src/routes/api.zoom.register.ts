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
          return abuse.trapped ? Response.json({ ok: true, accepted: false }) : abuse.response!;
        }

        try {
          return createRegistrationHandler({
            store: createSupabaseZoomStore(supabaseAdmin),
            zoom: zoomClientFromEnv(),
            mailer: registrationMailerFromEnv(),
            now: () => new Date(),
          })(request);
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
