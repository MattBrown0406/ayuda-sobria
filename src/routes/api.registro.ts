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

// Layered anti-bot defenses, no third-party captcha:
// 1. Honeypot — a hidden "website" field humans never see; bots fill it.
// 2. Time trap — the form reports how long it was open; bots submit in <3s.
// 3. Rate limit — per-IP cap so a runaway script can't flood the inbox.
// Trapped submissions get a fake "ok" so bots don't learn what failed.
const MIN_FORM_MS = 3_000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const submissionLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entries = (submissionLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  entries.push(now);
  submissionLog.set(ip, entries);
  if (submissionLog.size > 5000) {
    for (const [key, times] of submissionLog) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) submissionLog.delete(key);
    }
  }
  return entries.length > RATE_LIMIT_MAX;
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
        // Honeypot: hidden field only bots fill in.
        if (clean(record.website)) return Response.json({ ok: true });
        // Time trap: humans don't complete this form in under 3 seconds.
        const formMs = Number(record.formMs);
        if (!Number.isFinite(formMs) || formMs < MIN_FORM_MS) {
          return Response.json({ ok: true });
        }
        // Rate limit per IP.
        if (isRateLimited(clientIp(request))) {
          return Response.json(
            { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
            { status: 429 },
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
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!apiKey || !lovableKey) {
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
        const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.REGISTRATION_FROM_EMAIL ?? "AyudaSobria <registro@ayudasobria.com>",
            to: [process.env.REGISTRATION_TO_EMAIL ?? "matt@soberhelpline.com"],
            reply_to: email,
            subject: `Registro a La Sobremesa — ${nombre}`,
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
