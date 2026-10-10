import { createHash } from "node:crypto";

// Rate limits shared by every server instance (public.hit_rate_limit). The in-memory
// limits only ever held inside one Worker isolate. If the database check itself fails
// the request is allowed (logged): a broken limiter must not take registration down.

export function requestIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Hashed so raw IPs and emails never sit in the limits table. */
export function limitKey(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32)}`;
}

export async function withinRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("hit_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Rate limit check failed", error.message);
      return true;
    }
    return data === true;
  } catch (error) {
    console.error("Rate limit check failed", error instanceof Error ? error.message : "unknown");
    return true;
  }
}
