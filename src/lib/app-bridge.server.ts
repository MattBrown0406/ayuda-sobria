import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Server-to-server bridge with the Sober Helpline app backend, the same contracts
// soberhelpline.com uses. Every call carries AYUDA_SYNC_SECRET in the
// x-membership-sync-secret header (the app project holds the same value).
//
// - membership-export: every verified app account with app-paid access (never access
//   a website granted), mirrored nightly into public.app_member_access.
// - validate-sso-token: redeems the single-use token the app appends to links it opens,
//   returning the member's verified email and tier.
// Emails are never logged.

type Client = SupabaseClient<Database>;

export const APP_FUNCTIONS_URL = "https://rjlkbxqxshohgjmomyro.supabase.co/functions/v1";
const DAY_MS = 24 * 60 * 60 * 1000;
/** An app grant counts while it was confirmed within this window (nightly sync + slack). */
export const APP_ACCESS_FRESH_MS = 3 * DAY_MS;
const APP_TIERS = new Set(["essential", "premier", "org"]);
const EXPORT_PAGE_LIMIT = 1000;
const EXPORT_MAX_PAGES = 200;

export function appSyncSecret(): string {
  return process.env.AYUDA_SYNC_SECRET?.trim() ?? "";
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length >= 3 && email.length <= 320 && email.includes("@") ? email : null;
}

export interface AppMember {
  email: string;
  tier: "essential" | "premier" | "org";
  expires_at: string | null;
}

/** Validates one membership-export page; throws on anything malformed. */
export function parseExportPage(payload: unknown): {
  members: AppMember[];
  nextCursor: string | null;
} {
  const record =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  if (!record || !Array.isArray(record.members)) throw new Error("bad export page");
  const members = record.members.map((raw) => {
    const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const email = normalizeEmail(row.email);
    const tier = row.tier === "premium" ? "premier" : row.tier;
    const expires = row.expires_at;
    const expiresOk =
      expires === null ||
      expires === undefined ||
      (typeof expires === "string" && Number.isFinite(Date.parse(expires)));
    if (!email || typeof tier !== "string" || !APP_TIERS.has(tier) || !expiresOk) {
      throw new Error("bad export row");
    }
    return {
      email,
      tier: tier as AppMember["tier"],
      expires_at: typeof expires === "string" ? new Date(expires).toISOString() : null,
    };
  });
  const next = record.next_cursor;
  if (next !== null && next !== undefined && (typeof next !== "string" || !next)) {
    throw new Error("bad export cursor");
  }
  return { members, nextCursor: typeof next === "string" ? next : null };
}

/** Reads every export page; throws unless the whole list was read. */
export async function fetchAppMembers(
  secret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AppMember[]> {
  const out: AppMember[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < EXPORT_MAX_PAGES; page += 1) {
    const res = await fetchImpl(`${APP_FUNCTIONS_URL}/membership-export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-membership-sync-secret": secret },
      body: JSON.stringify({ cursor, limit: EXPORT_PAGE_LIMIT }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`app membership-export failed (${res.status})`);
    const { members, nextCursor } = parseExportPage(await res.json());
    out.push(...members);
    if (!nextCursor) return out;
    if (seen.has(nextCursor)) throw new Error("app membership-export repeated a cursor");
    seen.add(nextCursor);
    cursor = nextCursor;
  }
  throw new Error("app membership-export had too many pages");
}

/** Nightly mirror. Rows not in the export simply age out of APP_ACCESS_FRESH_MS. */
export async function syncAppMembers(client: Client, secret: string, now = new Date()) {
  if (!secret) return { skipped: "AYUDA_SYNC_SECRET is not configured" };
  const members = await fetchAppMembers(secret);
  const syncedAt = now.toISOString();
  for (let i = 0; i < members.length; i += 500) {
    const { error } = await client.from("app_member_access").upsert(
      members.slice(i, i + 500).map((member) => ({
        ...member,
        source: "export",
        synced_at: syncedAt,
      })),
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);
  }
  return { members: members.length };
}

export function appAccessIsCurrent(
  row: { expires_at: string | null; synced_at: string } | null,
  now = Date.now(),
): boolean {
  if (!row) return false;
  const synced = Date.parse(row.synced_at);
  if (!Number.isFinite(synced) || now - synced > APP_ACCESS_FRESH_MS) return false;
  if (row.expires_at === null) return true;
  const expires = Date.parse(row.expires_at);
  return Number.isFinite(expires) && expires > now;
}

/** The app grant for this website user (by their verified login email), if current. */
export async function appAccessForUser(
  client: Client,
  userId: string,
): Promise<{ tier: string; expires_at: string | null } | null> {
  const { data: user } = await client.auth.admin.getUserById(userId);
  const email = normalizeEmail(user?.user?.email);
  if (!email || !user?.user?.email_confirmed_at) return null;
  const { data, error } = await client
    .from("app_member_access")
    .select("tier, expires_at, synced_at")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return appAccessIsCurrent(data) && data ? { tier: data.tier, expires_at: data.expires_at } : null;
}

export interface RedeemedAppToken {
  email: string;
  firstName: string | null;
  tier: string | null;
  member: boolean;
}

/** Redeems the app's single-use sign-in token. null when invalid, used or expired. */
export async function redeemAppSsoToken(
  token: string,
  secret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RedeemedAppToken | null> {
  const res = await fetchImpl(`${APP_FUNCTIONS_URL}/validate-sso-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-membership-sync-secret": secret },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (res.status === 401) throw new Error("app refused the sync secret");
  if (!res.ok && res.status !== 400)
    throw new Error(`app validate-sso-token failed (${res.status})`);
  if (!body || body.valid !== true) return null;
  const email = normalizeEmail(body.email);
  if (!email) return null;
  return {
    email,
    firstName: typeof body.first_name === "string" ? body.first_name : null,
    tier: typeof body.tier === "string" ? body.tier : null,
    member: body.member === true,
  };
}
