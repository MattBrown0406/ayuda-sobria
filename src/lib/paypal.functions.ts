import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET_KEY;
  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function createProduct(accessToken: string): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ayuda Sobria Family Membership",
      description: "Monthly family membership for AyudaSobria",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!res.ok) throw new Error(`PayPal product creation failed: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function createPlan(accessToken: string, productId: string): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      name: "Family Membership - Monthly",
      description: "Monthly family membership subscription",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: "14.99", currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal plan creation failed: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function createSubscription(
  accessToken: string,
  planId: string,
  returnUrl: string,
  cancelUrl: string,
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "Ayuda Sobria",
        locale: "es-ES",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal subscription creation failed: ${await res.text()}`);
  const data = (await res.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };
  const approval = data.links.find((l) => l.rel === "approve");
  return { subscriptionId: data.id, approvalUrl: approval?.href ?? "" };
}

async function getSubscriptionDetails(accessToken: string, subscriptionId: string) {
  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`PayPal get subscription failed: ${await res.text()}`);
  return res.json() as Promise<{
    status: string;
    start_time?: string;
    billing_info?: { next_billing_time?: string };
  }>;
}

export const createMembershipSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { returnUrl: string; cancelUrl: string }) => input)
  .handler(async ({ data, context }) => {
    const accessToken = await getAccessToken();
    const productId = await createProduct(accessToken);
    const planId = await createPlan(accessToken, productId);
    const { subscriptionId, approvalUrl } = await createSubscription(
      accessToken,
      planId,
      data.returnUrl,
      data.cancelUrl,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("memberships").insert({
      user_id: context.userId,
      paypal_subscription_id: subscriptionId,
      status: "pending",
      amount: 14.99,
    });
    if (error) throw new Error(`DB insert failed: ${error.message}`);

    return { subscriptionId, approvalUrl };
  });

export const activateMembershipSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error: fetchErr } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .eq("paypal_subscription_id", data.subscriptionId)
      .maybeSingle();
    if (fetchErr || !sub) throw new Error("Subscription not found");
    if (sub.user_id !== context.userId) throw new Error("Unauthorized");

    const accessToken = await getAccessToken();
    const details = await getSubscriptionDetails(accessToken, data.subscriptionId);

    if (details.status === "ACTIVE") {
      await supabaseAdmin
        .from("memberships")
        .update({
          status: "active",
          start_date: details.start_time,
          next_billing_date: details.billing_info?.next_billing_time,
        })
        .eq("paypal_subscription_id", data.subscriptionId);
      return { success: true, status: "active" as const };
    }
    return { success: false, status: details.status };
  });

export const cancelMembershipSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subscriptionId: string; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error: fetchErr } = await supabaseAdmin
      .from("memberships")
      .select("id, user_id, status, next_billing_date")
      .eq("paypal_subscription_id", data.subscriptionId)
      .maybeSingle();
    if (fetchErr || !sub) throw new Error("Subscription not found");
    if (sub.user_id !== context.userId) throw new Error("Unauthorized");
    if (sub.status === "cancelled") return { success: true, alreadyCancelled: true };

    const accessToken = await getAccessToken();
    const res = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${data.subscriptionId}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: data.reason || "User requested cancellation" }),
      },
    );
    if (res.status !== 204) {
      const details = await getSubscriptionDetails(accessToken, data.subscriptionId);
      const s = String(details?.status || "").toUpperCase();
      if (s !== "CANCELLED" && s !== "EXPIRED") {
        throw new Error("PayPal cancellation failed");
      }
    }

    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("memberships")
      .update({
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: data.reason || null,
        access_ends_at: sub.next_billing_date || null,
      })
      .eq("id", sub.id);
    return { success: true, accessEndsAt: sub.next_billing_date || null };
  });

export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("memberships")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });