import { createFileRoute } from "@tanstack/react-router";

// Confirms weekly La Sobremesa registration from the signed link in the confirmation
// email. The public form never turns it on by itself (anyone can type anyone's email);
// only the mailbox owner can click this link.
export const Route = createFileRoute("/api/zoom/semanal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ZOOM_AUTOMATION_SECRET ?? "";
        let body: { correo?: unknown; t?: unknown } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }
        const email = typeof body.correo === "string" ? body.correo.trim().toLowerCase() : "";
        const token = typeof body.t === "string" ? body.t : "";
        const { verifyOptInToken } = await import("@/lib/zoom/security");
        if (!verifyOptInToken(secret, email, token)) {
          return Response.json({ error: "El enlace no es válido." }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // The newest registration for this email carries the choice.
        const { data: latest, error: readError } = await supabaseAdmin
          .from("meeting_registrations")
          .select("id")
          .eq("email", email)
          .not("occurrence_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (readError || !latest) {
          return Response.json(
            {
              error: "No encontramos tu registro. Regístrate de nuevo en ayudasobria.com/registro.",
            },
            { status: readError ? 500 : 404 },
          );
        }
        const { error } = await supabaseAdmin
          .from("meeting_registrations")
          .update({ auto_register: true, updated_at: new Date().toISOString() })
          .eq("id", latest.id);
        if (error) {
          console.error("Weekly opt-in failed", error.message);
          return Response.json(
            { error: "No pudimos activar el registro semanal." },
            { status: 500 },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
