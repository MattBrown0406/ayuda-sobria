import { createFileRoute } from "@tanstack/react-router";

// One-click opt-out from weekly La Sobremesa auto-registration. The link in every
// email carries an HMAC of the address, so nobody can unsubscribe someone else.
export const Route = createFileRoute("/api/zoom/baja")({
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
        const { verifyOptOutToken } = await import("@/lib/zoom/security");
        if (!verifyOptOutToken(secret, email, token)) {
          return Response.json({ error: "El enlace no es válido." }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("meeting_registrations")
          .update({ auto_register: false, updated_at: new Date().toISOString() })
          // Every write path stores the address trimmed and lowercased.
          .eq("email", email);
        if (error) {
          console.error("Opt-out failed", error.message);
          return Response.json({ error: "No pudimos completar la baja." }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
