import { createFileRoute } from "@tanstack/react-router";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 16_384;

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function verifyTurnstile(token: string, request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { configured: false, valid: false };
  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  const ip = clientIp(request);
  if (ip !== "unknown") formData.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) return { configured: true, valid: false };
  const result = (await response.json()) as { success?: boolean };
  return { configured: true, valid: result.success === true };
}

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export const Route = createFileRoute("/api/registro")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const declaredLength = Number(request.headers.get("content-length") || "0");
        if (declaredLength > MAX_BODY_BYTES) {
          return Response.json({ error: "Solicitud demasiado grande." }, { status: 413 });
        }
        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
          return Response.json({ error: "Solicitud demasiado grande." }, { status: 413 });
        }
        let body: unknown = null;
        try {
          body = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }
        if (!body || typeof body !== "object") {
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }

        const record = body as Record<string, unknown>;
        if (clean(record.website)) return Response.json({ ok: true });
        const turnstile = await verifyTurnstile(clean(record.turnstileToken, 2048), request);
        if (!turnstile.configured) {
          return Response.json(
            { error: "La verificación de seguridad no está configurada todavía." },
            { status: 503 },
          );
        }
        if (!turnstile.valid) {
          return Response.json(
            {
              error:
                "No pudimos verificar que eres una persona. Actualiza la página e inténtalo de nuevo.",
            },
            { status: 400 },
          );
        }

        const nombre = clean(record.nombre, 120);
        const email = clean(record.email, 254).toLowerCase();
        const relacion = clean(record.relacion, 120);
        if (!nombre || !EMAIL_PATTERN.test(email) || !relacion) {
          return Response.json(
            { error: "Completa nombre, correo y relación familiar." },
            { status: 400 },
          );
        }

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "El registro no está configurado todavía." },
            { status: 503 },
          );
        }

        const fields = [
          ["Nombre", nombre],
          ["Correo", email],
          ["Teléfono", clean(record.telefono, 50)],
          ["País o estado", clean(record.pais, 120)],
          ["Relación", relacion],
          ["Primera vez", clean(record.primera, 10)],
          ["Consentimiento SMS", record.consentSms ? "Sí" : "No"],
          ["Situación", clean(record.situacion, 2000)],
        ];
        const html = fields
          .map(
            ([label, value]) =>
              `<p><strong>${escapeHtml(String(label))}:</strong> ${escapeHtml(String(value || "—"))}</p>`,
          )
          .join("");
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.REGISTRATION_FROM_EMAIL ?? "AyudaSobria <registro@ayudasobria.com>",
            to: [process.env.REGISTRATION_TO_EMAIL ?? "matt@soberhelpline.com"],
            reply_to: email,
            subject: `Registro al Círculo Familiar — ${nombre}`,
            html,
          }),
        });
        if (!response.ok) {
          console.error("Registration email failed", response.status, await response.text());
          return Response.json(
            { error: "No se pudo enviar el registro. Inténtalo de nuevo." },
            { status: 502 },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
