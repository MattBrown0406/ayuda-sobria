const MIN_FORM_MS = 3_000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const submissionLog = new Map<string, number[]>();

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isRateLimited(ip: string, now = Date.now()): boolean {
  const entries = (submissionLog.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  entries.push(now);
  submissionLog.set(ip, entries);
  if (submissionLog.size > 5_000) {
    for (const [key, times] of submissionLog) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) submissionLog.delete(key);
    }
  }
  return entries.length > RATE_LIMIT_MAX;
}

export async function checkPublicRegistrationAbuse(input: {
  body: Record<string, unknown>;
  request: Request;
  fetchImpl?: typeof fetch;
}): Promise<{ allowed: boolean; trapped?: boolean; response?: Response }> {
  if (clean(input.body.website, 200)) return { allowed: false, trapped: true };
  const formMs = Number(input.body.formMs);
  if (!Number.isFinite(formMs) || formMs < MIN_FORM_MS) {
    return {
      allowed: false,
      response: Response.json(
        { error: "El formulario se envió demasiado rápido. Revísalo e inténtalo de nuevo." },
        { status: 400 },
      ),
    };
  }
  if (isRateLimited(clientIp(input.request))) {
    return {
      allowed: false,
      response: Response.json(
        { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
        { status: 429 },
      ),
    };
  }

  return { allowed: true };
}
