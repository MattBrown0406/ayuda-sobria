// Plain transactional email through the Lovable Resend gateway (same transport as the
// Zoom mailer). Throws when the provider is not configured or rejects the message.
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c] ?? c,
  );
}

export async function sendSiteEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  idempotencyKey: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  if (!resendApiKey || !lovableApiKey) throw new Error("Email provider is not configured");
  const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
      "Idempotency-Key": input.idempotencyKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.REGISTRATION_FROM_EMAIL ?? "AyudaSobria <registro@ayudasobria.com>",
      to: [input.to],
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      subject: input.subject,
      html: input.html,
    }),
  });
  if (!response.ok) throw new Error(`Email provider failed (${response.status})`);
}

export function adminEmail() {
  return process.env.REGISTRATION_TO_EMAIL ?? "matt@soberhelpline.com";
}
