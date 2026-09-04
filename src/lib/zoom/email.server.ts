import type { ConfirmationDelivery, RegistrationInput, RegistrationMailer } from "./types.ts";

export const APP_STORE_URL = "https://apps.apple.com/us/app/sober-helpline/id6780034996";
const SUPPORT_PHONE = "(458) 298-8011";

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

function meetingDateLabel(startsAt: string) {
  return new Intl.DateTimeFormat("es-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(startsAt));
}

const WRAPPER_STYLE =
  "max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;line-height:1.55";
const BUTTON_STYLE =
  "display:inline-block;padding:14px 24px;background:#166534;color:white;text-decoration:none;border-radius:8px;font-weight:bold";

function joinButton(safeJoinUrl: string) {
  return `<p style="text-align:center;margin:28px 0"><a href="${safeJoinUrl}" style="${BUTTON_STYLE}">Entrar a La Sobremesa</a></p>
          <p style="font-size:13px;color:#6b7280">Si el botón no funciona, copia este enlace en tu navegador: ${safeJoinUrl}</p>`;
}

/** Promotes the Sober Helpline app; the app is available in English and Spanish. */
function appStoreBlock() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
          <p style="margin:0 0 6px"><strong>La app Sober Helpline — en inglés y en español</strong></p>
          <p style="margin:0 0 12px">Practica conversaciones difíciles, entra a las reuniones y mira las grabaciones desde tu teléfono. La app funciona en inglés y en español.</p>
          <p style="margin:0 0 4px"><a href="${APP_STORE_URL}" style="color:#166534;font-weight:bold">Descargar Sober Helpline en el App Store</a></p>`;
}

function signature() {
  return `<p style="margin-top:24px">Te espero el lunes.<br>Matt Brown<br>AyudaSobria · ${SUPPORT_PHONE}</p>`;
}

/** The admin notification lists everything the person typed into the form. */
function adminDetailRows(registration: RegistrationInput, occurrenceDate: string, id: string) {
  const yesNo = (value: boolean) => (value ? "Sí" : "No");
  const followUp = registration.requestFollowUp
    ? `Sí · ${registration.preferredContactDate ?? "sin fecha"} · ${registration.preferredContactTime ?? "sin hora"} · ${registration.preferredTimezone ?? "sin zona horaria"}`
    : "No";
  const rows: Array<[string, string]> = [
    ["Nombre", registration.fullName],
    ["Correo", registration.email],
    ["Teléfono", registration.phone ?? "—"],
    ["País o estado", registration.location ?? "—"],
    ["Relación", registration.relationship ?? "—"],
    ["Situación", registration.situation ?? "—"],
    ["Pregunta", registration.question ?? "—"],
    ["Registro automático semanal", yesNo(registration.autoRegister)],
    ["Pide que Matt le contacte", followUp],
    ["Acepta correos de seguimiento", yesNo(registration.consentUpdates)],
    ["Reunión", occurrenceDate],
    ["ID de registro", id],
  ];
  return rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 6px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join("");
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

export function renderConfirmationEmail(input: ConfirmationDelivery) {
  const safeName = escapeHtml(input.registration.fullName);
  const safeJoinUrl = escapeHtml(input.joinUrl);
  const meetingDate = escapeHtml(meetingDateLabel(input.occurrence.startsAt));
  const automatic = input.source === "automatic";
  const heading = automatic
    ? `Tu lugar de esta semana está reservado, ${safeName}`
    : `Ya estás registrado/a, ${safeName}`;
  const intro = automatic
    ? `<p>Como pediste, te registramos automáticamente para <strong>La Sobremesa</strong> del ${meetingDate} a las <strong>8:00 PM, hora del Pacífico</strong>. Cada semana el enlace es nuevo; este es el tuyo para esta reunión:</p>`
    : `<p>Tu lugar para <strong>La Sobremesa</strong> está confirmado para el ${meetingDate} a las <strong>8:00 PM, hora del Pacífico</strong>.</p>
          <p>Este enlace es personal para esta reunión:</p>`;
  return {
    subject: automatic
      ? `Tu enlace para La Sobremesa del lunes — ${meetingDate}`
      : "Tu enlace personal para La Sobremesa — lunes 8 PM Pacífico",
    html: `<div style="${WRAPPER_STYLE}">
          <h1 style="color:#166534">${heading}</h1>
          ${intro}
          ${joinButton(safeJoinUrl)}
          <p>¿Necesitas ayuda para entrar? Llama al <strong>${SUPPORT_PHONE}</strong>.</p>
          ${appStoreBlock()}
          ${signature()}
        </div>`,
  };
}

export function renderReminderEmail(input: {
  fullName: string;
  joinUrl: string;
  startsAt: string;
}) {
  const safeName = escapeHtml(input.fullName);
  const safeJoinUrl = escapeHtml(input.joinUrl);
  const meetingDate = escapeHtml(meetingDateLabel(input.startsAt));
  return {
    subject: "Recordatorio: La Sobremesa es hoy a las 8 PM Pacífico",
    html: `<div style="${WRAPPER_STYLE}">
          <h1 style="color:#166534">Nos vemos esta noche, ${safeName}</h1>
          <p>Ya estás registrado/a para <strong>La Sobremesa</strong> de hoy, ${meetingDate}, a las <strong>8:00 PM, hora del Pacífico</strong>. Me da mucho gusto que nos acompañes a la mesa.</p>
          ${joinButton(safeJoinUrl)}
          <p style="font-size:13px;color:#6b7280">Tu enlace es personal para esta reunión. Si necesitas ayuda, llama al ${SUPPORT_PHONE}.</p>
          <p style="margin-top:24px">Te espero esta noche.<br>Matt Brown<br>AyudaSobria</p>
        </div>`,
  };
}

export function createRegistrationMailer(options: MailerOptions): RegistrationMailer {
  return {
    async sendConfirmation(input) {
      const email = renderConfirmationEmail(input);
      await sendGatewayEmail(
        options,
        { to: [input.registration.email], subject: email.subject, html: email.html },
        `zoom-confirmation-${input.registrationId}`,
      );

      // Only a person who just signed up through the form is "new". The weekly
      // automatic re-registration of existing attendees must not page the admin.
      if (input.source === "automatic") return;

      // Admin notification is useful but must not turn a successfully delivered attendee
      // confirmation into a false client-facing failure.
      try {
        await sendGatewayEmail(
          options,
          {
            to: [options.adminTo],
            reply_to: input.registration.email,
            subject: `Nuevo registro de La Sobremesa — ${input.registration.fullName}`,
            html: `<div style="${WRAPPER_STYLE}">${adminDetailRows(
              input.registration,
              input.occurrence.occurrenceDate,
              input.registrationId,
            )}</div>`,
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
      const email = renderReminderEmail({
        fullName: input.fullName,
        joinUrl: input.joinUrl,
        startsAt: input.occurrence.startsAt,
      });
      await sendGatewayEmail(
        options,
        { to: [input.email], subject: email.subject, html: email.html },
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
          html: `<div style="${WRAPPER_STYLE}"><p>Hola ${safeName},</p><p>${content.copy}</p><p style="text-align:center;margin:28px 0"><a href="${content.url}" style="display:inline-block;padding:13px 22px;background:#166534;color:white;text-decoration:none;border-radius:8px;font-weight:bold">${content.label}</a></p><p>Con respeto,<br>Matt Brown<br>AyudaSobria</p><p style="font-size:12px;color:#6b7280">Ayuda: ${SUPPORT_PHONE}</p></div>`,
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
