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

type PlanType = "monthly" | "annual";

const PLAN_CONFIG: Record<PlanType, { interval: "MONTH" | "YEAR"; price: string; name: string }> = {
  monthly: { interval: "MONTH", price: "14.99", name: "Family Membership - Monthly" },
  annual: { interval: "YEAR", price: "149.00", name: "Family Membership - Annual" },
};

async function createPlan(
  accessToken: string,
  productId: string,
  planType: PlanType,
): Promise<string> {
  const cfg = PLAN_CONFIG[planType];
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      name: cfg.name,
      description: cfg.name,
      billing_cycles: [
        {
          frequency: { interval_unit: cfg.interval, interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: cfg.price, currency_code: "USD" } },
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
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`PayPal get subscription failed: ${await res.text()}`);
  return res.json() as Promise<{
    status: string;
    start_time?: string;
    billing_info?: { next_billing_time?: string };
  }>;
}

export const createMembershipSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { returnUrl: string; cancelUrl: string; planType?: PlanType }) => input)
  .handler(async ({ data, context }) => {
    const planType: PlanType = data.planType === "annual" ? "annual" : "monthly";
    const accessToken = await getAccessToken();
    const productId = await createProduct(accessToken);
    const planId = await createPlan(accessToken, productId, planType);
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
      amount: Number(PLAN_CONFIG[planType].price),
      plan_type: planType,
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
      const { error: updateErr } = await supabaseAdmin
        .from("memberships")
        .update({
          status: "active",
          start_date: details.start_time,
          next_billing_date: details.billing_info?.next_billing_time,
        })
        .eq("paypal_subscription_id", data.subscriptionId);
      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);
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
    let accessEndsAt: string | null = sub.next_billing_date;
    if (!accessEndsAt) {
      try {
        const details = await getSubscriptionDetails(accessToken, data.subscriptionId);
        accessEndsAt = details.billing_info?.next_billing_time ?? null;
      } catch {
        /* keep null; PayPal cancel below still proceeds */
      }
    }
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
    const { error: updateErr } = await supabaseAdmin
      .from("memberships")
      .update({
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason: data.reason || null,
        access_ends_at: accessEndsAt,
      })
      .eq("id", sub.id);
    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);
    return { success: true, accessEndsAt };
  });

export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("memberships")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    // A newer abandoned "pending" checkout must not shadow a live membership.
    const active = rows.find((r) => r.status === "active");
    if (active) return active;
    const cancelledWithAccess = rows.find(
      (r) =>
        r.status === "cancelled" && r.access_ends_at && new Date(r.access_ends_at) > new Date(),
    );
    return cancelledWithAccess ?? rows[0] ?? null;
  });

// ---- Coaching one-time payments ----

const COACHING_SESSIONS = {
  initial: { label: "Consulta inicial (60 min)", memberPrice: "125.00", nonMemberPrice: "150.00" },
  followup: {
    label: "Sesión de seguimiento (60 min)",
    memberPrice: "125.00",
    nonMemberPrice: "150.00",
  },
} as const;
type SessionType = keyof typeof COACHING_SESSIONS;

async function userHasActiveMembership(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { membershipAllowsRecordingAccess } = await import("@/lib/zoom/recording-access");
  const { data } = await supabaseAdmin
    .from("memberships")
    .select("status, access_ends_at")
    .eq("user_id", userId)
    .in("status", ["active", "cancelled"]);
  return membershipAllowsRecordingAccess(data ?? [], new Date().toISOString());
}

export const getCoachingPricing = createServerFn({ method: "GET" }).handler(async () => {
  // Determine membership status from the request bearer if present.
  let isMember = false;
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
        global: { headers: { Authorization: auth } },
        auth: { persistSession: false },
      });
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) isMember = await userHasActiveMembership(userData.user.id);
    }
  } catch {
    /* ignore, treat as non-member */
  }
  return {
    isMember,
    sessions: {
      initial: {
        label: COACHING_SESSIONS.initial.label,
        price: isMember
          ? COACHING_SESSIONS.initial.memberPrice
          : COACHING_SESSIONS.initial.nonMemberPrice,
      },
      followup: {
        label: COACHING_SESSIONS.followup.label,
        price: isMember
          ? COACHING_SESSIONS.followup.memberPrice
          : COACHING_SESSIONS.followup.nonMemberPrice,
      },
    },
  };
});

export const createCoachingOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sessionType: SessionType;
      returnUrl: string;
      cancelUrl: string;
      customerEmail: string;
      customerName: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const cfg = COACHING_SESSIONS[data.sessionType];
    if (!cfg) throw new Error("Invalid session type");

    // Detect signed-in member for pricing
    let userId: string | null = null;
    let isMember = false;
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const auth = getRequestHeader("authorization");
      if (auth?.startsWith("Bearer ")) {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false },
        });
        const { data: userData } = await sb.auth.getUser();
        if (userData.user) {
          userId = userData.user.id;
          isMember = await userHasActiveMembership(userId);
        }
      }
    } catch {
      /* guest checkout */
    }

    const price = isMember ? cfg.memberPrice : cfg.nonMemberPrice;
    const accessToken = await getAccessToken();
    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: `Ayuda Sobria — ${cfg.label}`,
            amount: { currency_code: "USD", value: price },
          },
        ],
        application_context: {
          brand_name: "Ayuda Sobria",
          locale: "es-ES",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: data.returnUrl,
          cancel_url: data.cancelUrl,
        },
      }),
    });
    if (!res.ok) throw new Error(`PayPal order creation failed: ${await res.text()}`);
    const order = (await res.json()) as { id: string; links: Array<{ rel: string; href: string }> };
    const approvalUrl = order.links.find((l) => l.rel === "approve")?.href ?? "";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coaching_orders").insert({
      user_id: userId,
      paypal_order_id: order.id,
      session_type: data.sessionType,
      amount: Number(price),
      status: "pending",
      customer_email: data.customerEmail,
      customer_name: data.customerName,
    });
    if (error) throw new Error(`DB insert failed: ${error.message}`);

    return { orderId: order.id, approvalUrl, price, isMember };
  });

export const captureCoachingOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data }) => {
    const accessToken = await getAccessToken();
    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${data.orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    if (!res.ok && res.status !== 422)
      throw new Error(`PayPal capture failed: ${await res.text()}`);
    const result = (await res.json()) as {
      status?: string;
      details?: Array<{ issue?: string }>;
    };
    // A refresh/re-run of the success page re-captures; PayPal answers 422
    // ORDER_ALREADY_CAPTURED, which is a completed payment, not a failure.
    const alreadyCaptured =
      res.status === 422 && (result.details ?? []).some((d) => d.issue === "ORDER_ALREADY_CAPTURED");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (result.status === "COMPLETED" || alreadyCaptured) {
      const { error: updateErr } = await supabaseAdmin
        .from("coaching_orders")
        .update({ status: "completed", captured_at: new Date().toISOString() })
        .eq("paypal_order_id", data.orderId);
      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);
      return { success: true };
    }
    return { success: false, status: result.status ?? "UNKNOWN" };
  });
