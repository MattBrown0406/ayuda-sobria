import type { Database } from "@/integrations/supabase/types";
import { getAccessToken, getSubscriptionDetails } from "./paypal.server";

type Membership = Database["public"]["Tables"]["memberships"]["Row"];

const DAY_MS = 24 * 60 * 60 * 1000;
// PayPal retries a failed charge for a few days before suspending; don't re-check sooner.
const BILLING_GRACE_MS = 3 * DAY_MS;
const PENDING_RECHECK_WINDOW_MS = 30 * DAY_MS;

/**
 * Activation used to happen only in the browser on /membresia/exito, so a closed tab left
 * a paid subscription "pending" forever, and nothing ever noticed a cancellation or a
 * suspension made in PayPal. Before trusting a row we ask PayPal about:
 * - pending rows from the last 30 days (paid but never activated?);
 * - active rows whose next billing date is missing or passed (still being paid?).
 * PayPal errors leave the row unchanged.
 */
export function membershipNeedsCheck(row: Membership, now = Date.now()): boolean {
  if (row.status === "pending") {
    return now - Date.parse(row.created_at) < PENDING_RECHECK_WINDOW_MS;
  }
  if (row.status === "active") {
    const next = row.next_billing_date ? Date.parse(row.next_billing_date) : NaN;
    return !Number.isFinite(next) || next + BILLING_GRACE_MS < now;
  }
  return false;
}

export function membershipUpdateFromPayPal(
  row: Membership,
  details: Awaited<ReturnType<typeof getSubscriptionDetails>>,
  nowIso: string,
): Partial<Membership> | null {
  const status = String(details.status || "").toUpperCase();
  if (status === "ACTIVE") {
    return {
      status: "active",
      start_date: row.start_date ?? details.start_time ?? null,
      next_billing_date: details.billing_info?.next_billing_time ?? row.next_billing_date,
    };
  }
  if (status === "CANCELLED") {
    if (row.status === "pending") return { status: "cancelled", access_ends_at: nowIso };
    // Paid through the current period, as when cancelling from /membresia.
    return {
      status: "cancelled",
      cancelled_at: row.cancelled_at ?? nowIso,
      access_ends_at: row.next_billing_date ?? nowIso,
    };
  }
  if (status === "SUSPENDED" || status === "EXPIRED") {
    return { status: "expired", access_ends_at: nowIso };
  }
  return null; // APPROVAL_PENDING / APPROVED: still waiting on the buyer or PayPal.
}

export async function reconcileUserMemberships(userId: string): Promise<Membership[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const due = rows.filter((row) => membershipNeedsCheck(row)).slice(0, 5);
  if (!due.length) return rows;
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (tokenError) {
    console.error("Membership reconcile skipped", tokenError);
    return rows;
  }
  const nowIso = new Date().toISOString();
  for (const row of due) {
    try {
      const details = await getSubscriptionDetails(accessToken, row.paypal_subscription_id);
      const update = membershipUpdateFromPayPal(row, details, nowIso);
      if (!update) continue;
      const { error: updateError } = await supabaseAdmin
        .from("memberships")
        .update(update)
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
      Object.assign(row, update);
    } catch (syncError) {
      console.error("Membership reconcile failed", row.id, syncError);
    }
  }
  return rows;
}
