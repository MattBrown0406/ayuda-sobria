import type { RegistrationMailer } from "./types.ts";

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

interface MailerOptions {
  resendApiKey: string;
  lovableApiKey: string;
  from: string;
  adminTo: string;
  fetchImpl?: typeof fetch;
}

async function sendGatewayEmail(
  options: MailerOptions,
  payload: Record<string, unknown>,
  idempotencyKey: string,
) {
  const response = await (options.fetchImpl ?? fetch)(
    "https://connector-gateway.lovable.dev/resend/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.lovableApiKey}`,
        "X-Connection-Api-Key": options.resendApiKey,
        "Idempotency-Key": idempotencyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: options.from, ...payload }),
    },
  );
  if (!response.ok) throw new Error(`Email provider failed (${response.status})`);
}

export function createRegistrationMailer(options: MailerOptions): RegistrationMailer {
  return {
    async sendConfirmation(input) {
      const safeName = escapeHtml(input.fullName);
      const safeJoinUrl = escapeHtml(input.joinUrl);
      const meetingDate = new Intl.DateTimeFormat("es-US", {
        timeZone: "America/Los_Angeles",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(input.occurrence.startsAt));
      await sendGatewayEmail(
        options,
        {
          to: [input.email],
          subject: "Tu enlace personal para La Sobremesa — lunes 8 PM Pacífico",
          html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937">
          <h1 style="color:#166534">Ya estás registrado/a, ${safeName}</h1>
          <p>Tu lugar para <strong>La Sobremesa</strong> está confirmado para el ${escapeHtml(meetingDate)} a las <strong>8:00 PM, hora del Pacífico</strong>.</p>
          <p>Este enlace es personal para esta reunión:</p>
          <p style="text-align:center;margin:28px 0"><a href="${safeJoinUrl}" style="display:inline-block;padding:14px 24px;background:#166534;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Entrar a La Sobremesa</a></p>
          <p style="font-size:13px;color:#6b7280">Si el botón no funciona, copia este enlace en tu navegador: ${safeJoinUrl}</p>
          <p>¿Necesitas ayuda? Llama al <strong>(458) 298-8011</strong>.</p>
          <p style="font-size:12px;color:#6b7280">AyudaSobria — apoyo práctico para familias.</p>
        </div>`,
        },
        `zoom-confirmation-${input.registrationId}`,
      );

      // Admin notification is useful but must not turn a successfully delivered attendee
      // confirmation into a false client-facing failure.
      try {
        await sendGatewayEmail(
          options,
          {
            to: [options.adminTo],
            reply_to: input.email,
            subject: `Nuevo registro de La Sobremesa — ${input.fullName}`,
            html: `<p><strong>Nombre:</strong> ${safeName}</p><p><strong>Correo:</strong> ${escapeHtml(input.email)}</p><p><strong>Fecha:</strong> ${escapeHtml(input.occurrence.occurrenceDate)}</p><p><strong>ID de registro:</strong> ${escapeHtml(input.registrationId)}</p>`,
          },
          `zoom-admin-registration-${input.registrationId}`,
        );
      } catch (error) {
        console.error(
          "Zoom admin notification failed",
          error instanceof Error ? error.message : "unknown error",
        );
      }
    },

    async sendReminder(input) {
      const safeName = escapeHtml(input.fullName);
      const safeJoinUrl = escapeHtml(input.joinUrl);
      await sendGatewayEmail(
        options,
        {
          to: [input.email],
          subject: "Recordatorio: La Sobremesa es hoy a las 8 PM Pacífico",
          html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937">
          <h1 style="color:#166534">Nos vemos esta noche, ${safeName}</h1>
          <p><strong>La Sobremesa</strong> comienza hoy a las <strong>8:00 PM, hora del Pacífico</strong>.</p>
          <p style="text-align:center;margin:28px 0"><a href="${safeJoinUrl}" style="display:inline-block;padding:14px 24px;background:#166534;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Entrar a La Sobremesa</a></p>
          <p style="font-size:13px;color:#6b7280">Tu enlace es personal para esta reunión. Si necesitas ayuda, llama al (458) 298-8011.</p>
        </div>`,
        },
        `zoom-reminder-${input.registrationId}`,
      );
    },

    async sendFollowup(input) {
      const safeName = escapeHtml(input.fullName);
      const content =
        input.sequenceStep === 1
          ? {
              subject: "Después de La Sobremesa: elige un próximo paso",
              copy: "Anota la pregunta que más necesitas responder antes de la próxima conversación familiar. No tienes que resolver todo hoy.",
              label: "Ver recursos para familias",
              url: "https://ayudasobria.com/recursos",
            }
          : input.sequenceStep === 2
            ? {
                subject: "Cuando la reunión gratuita no es suficiente",
                copy: "Si la situación es urgente, privada, insegura o está estancada en el rechazo al tratamiento, pide ayuda para ordenar el próximo paso.",
                label: "Conocer el coaching familiar",
                url: "https://ayudasobria.com/coaching-familiar",
              }
            : {
                subject: "Sigue trabajando entre reuniones",
                copy: "Una reunión puede dar alivio. Un plan ayuda a no volver al mismo rescate, discusión, silencio o pánico.",
                label: "Volver a La Sobremesa",
                url: "https://ayudasobria.com/circulo-familiar",
              };
      await sendGatewayEmail(
        options,
        {
          to: [input.email],
          subject: content.subject,
          html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;line-height:1.6"><p>Hola ${safeName},</p><p>${content.copy}</p><p style="text-align:center;margin:28px 0"><a href="${content.url}" style="display:inline-block;padding:13px 22px;background:#166534;color:white;text-decoration:none;border-radius:8px;font-weight:bold">${content.label}</a></p><p>Con respeto,<br>Matt Brown<br>AyudaSobria</p><p style="font-size:12px;color:#6b7280">Ayuda: (458) 298-8011</p></div>`,
        },
        `zoom-followup-${input.queueId}`,
      );
    },
  };
}

export function registrationMailerFromEnv(
  fetchImpl?: typeof fetch,
): RegistrationMailer | undefined {
  const resendApiKey = process.env.RESEND_API_KEY;
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  if (!resendApiKey || !lovableApiKey) return undefined;
  return createRegistrationMailer({
    resendApiKey,
    lovableApiKey,
    from: process.env.REGISTRATION_FROM_EMAIL ?? "AyudaSobria <registro@ayudasobria.com>",
    adminTo: process.env.REGISTRATION_TO_EMAIL ?? "matt@soberhelpline.com",
    fetchImpl,
  });
}
