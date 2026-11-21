// Best-effort delivery only: the hub must never interrupt registration.
export async function sendSpineEvent(evt: {
  email: string;
  event: string;
  name?: string;
  phone?: string;
  props?: Record<string, unknown>;
}): Promise<void> {
  const url = process.env['HUB_INGEST_URL'];
  const key = process.env['HUB_INGEST_KEY'];
  if (!url || !key || !evt.email.trim()) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ ...evt, email: evt.email.trim().toLowerCase(), property: "ayudasobria" }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("[spine] hub returned", res.status);
  } catch {
    // Avoid logging request details, addresses or credentials from fetch errors.
    console.error("[spine] send failed");
  }
}