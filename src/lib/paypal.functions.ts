import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAYPAL_API_BASE, getAccessToken, getSubscriptionDetails } from "./paypal.server";

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

// PayPal catalog products and billing plans are permanent, non-deletable records.
// Creating one per checkout click would pile up thousands of them in the live
// account and add two API round-trips to every subscribe. Reuse instead:
// operator-pinned IDs win, otherwise create once and cache for the worker's life.
// The plan cache is keyed by price so editing PLAN_CONFIG cannot resurrect a
// stale plan that still charges the old amount.
let productPromise: Promise<string> | null = null;
const planPromises = new Map<string, Promise<string>>();

async function resolveProductId(accessToken: string): Promise<string> {
  const pinned = process.env.PAYPAL_PRODUCT_ID;
  if (pinned) return pinned;
  if (!productPromise) {
    productPromise = createProduct(accessToken).catch((error) => {
      // Never cache a rejection: the next checkout must be able to retry.
      productPromise = null;
      throw error;
    });
  }
  return productPromise;
}

type PlanType = "monthly" | "annual";

const SITE_ORIGIN = "https://ayudasobria.com";

// PayPal sends the payer back to these URLs, so never take them from the caller as-is:
// keep the caller's origin only when it is this site (or local dev)
// and always use our own path.
function trustedReturnUrl(requested: unknown, path: string): string {
  try {
    const url = new URL(String(requested));
    const host = url.hostname;
    // Only this site (and local dev): anyone can create a *.lovable.app subdomain.
    const trusted =
      host === "ayudasobria.com" || host === "www.ayudasobria.com" || host === "localhost";
    if (trusted && (url.protocol === "https:" || host === "localhost")) {
      return `${url.origin}${path}`;
    }
  } catch {
    /* fall through */
  }
  return `${SITE_ORIGIN}${path}`;
}

const PLAN_CONFIG: Record<PlanType, { interval: "MONTH" | "YEAR"; price: string; name: string }> = {
  monthly: { interval: "MONTH", price: "9.99", name: "Family Membership - Monthly" },
  annual: { interval: "YEAR", price: "100.00", name: "Family Membership - Annual" },
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

const pinnedPlanChecks = new Map<string, Promise<boolean>>();

/** True when the pinned PayPal plan still charges PLAN_CONFIG's price. */
async function pinnedPlanMatchesPrice(
  accessToken: string,
  planId: string,
  planType: PlanType,
): Promise<boolean> {
  const key = `${planId}:${PLAN_CONFIG[planType].price}`;
  let check = pinnedPlanChecks.get(key);
  if (!check) {
    check = (async () => {
      const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans/${encodeURIComponent(planId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`PayPal plan lookup failed (${res.status})`);
      const plan = (await res.json()) as {
        status?: string;
        billing_cycles?: Array<{
          tenure_type?: string;
          pricing_scheme?: { fixed_price?: { value?: string } };
        }>;
      };
      const regular = plan.billing_cycles?.find((cycle) => cycle.tenure_type === "REGULAR");
      const value = Number(regular?.pricing_scheme?.fixed_price?.value);
      return plan.status === "ACTIVE" && value === Number(PLAN_CONFIG[planType].price);
    })().catch((error) => {
      pinnedPlanChecks.delete(key);
      throw error;
    });
    pinnedPlanChecks.set(key, check);
  }
  return check;
}

async function resolvePlanId(accessToken: string, planType: PlanType): Promise<string> {
  const pinned =
    planType === "annual" ? process.env.PAYPAL_PLAN_ID_ANNUAL : process.env.PAYPAL_PLAN_ID_MONTHLY;
  // A plan pinned before a price change would keep charging the old price.
  if (pinned) {
    if (await pinnedPlanMatchesPrice(accessToken, pinned, planType)) return pinned;
    console.error(
      `Pinned PayPal ${planType} plan does not charge US$${PLAN_CONFIG[planType].price}; using a plan at the current price instead. Update or remove the pinned plan id.`,
    );
  }
  const cacheKey = `${planType}:${PLAN_CONFIG[planType].price}`;
  const cached = planPromises.get(cacheKey);
  if (cached) return cached;
  const pending = (async () => {
    const productId = await resolveProductId(accessToken);
    return createPlan(accessToken, productId, planType);
  })().catch((error) => {
    planPromises.delete(cacheKey);
    throw error;
  });
  planPromises.set(cacheKey, pending);
  return pending;
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

export const createMembershipSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { returnUrl: string; cancelUrl: string; planType?: PlanType }) => input)
  .handler(async ({ data, context }) => {
    const planType: PlanType = data.planType === "annual" ? "annual" : "monthly";
    // Never open a second PayPal subscription for someone already paying for one: a
    // pending row may be a paid checkout whose return page never loaded.
    const { reconcileUserMemberships } = await import("./membership-sync.server");
    const existing = await reconcileUserMemberships(context.userId);
    if (existing.some((row) => row.status === "active")) {
      throw new Error("Ya tienes una membresía activa.");
    }
    const accessToken = await getAccessToken();
    const planId = await resolvePlanId(accessToken, planType);
    const { subscriptionId, approvalUrl } = await createSubscription(
      accessToken,
      planId,
      trustedReturnUrl(data.returnUrl, "/membresia/exito"),
      trustedReturnUrl(data.cancelUrl, "/membresia/cancelado"),
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
    const { reconcileUserMemberships } = await import("./membership-sync.server");
    const rows = await reconcileUserMemberships(context.userId);
    // A newer abandoned "pending" checkout must not shadow a live membership.
    const active = rows.find((r) => r.status === "active");
    if (active) return active;
    const cancelledWithAccess = rows.find(
      (r) =>
        r.status === "cancelled" && r.access_ends_at && new Date(r.access_ends_at) > new Date(),
    );
    return cancelledWithAccess ?? rows[0] ?? null;
  });

// Sober Helpline app members get member benefits here too (same as soberhelpline.com).
export const getMyAppAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ supabaseAdmin }, { appAccessForUser }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("./app-bridge.server"),
    ]);
    try {
      return await appAccessForUser(supabaseAdmin, context.userId);
    } catch (error) {
      console.error("App access lookup failed", error);
      return null;
    }
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
  const { userHasMemberAccess } = await import("./membership-sync.server");
  return userHasMemberAccess(userId);
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
    if (!Object.hasOwn(COACHING_SESSIONS, data.sessionType)) {
      throw new Error("Invalid session type");
    }
    const cfg = COACHING_SESSIONS[data.sessionType];
    const customerEmail = String(data.customerEmail ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 254);
    const customerName = String(data.customerName ?? "")
      .trim()
      .slice(0, 120);
    if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      throw new Error("Completa tu nombre y un correo válido.");
    }

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

    // Every call creates a PayPal order and a database row: cap per visitor.
    {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const { limitKey, withinRateLimit } = await import("./rate-limit.server");
      const ip =
        getRequestHeader("cf-connecting-ip") ||
        getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      if (!(await withinRateLimit(limitKey("coaching-order-ip", ip), 10, 3600))) {
        throw new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
      }
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
          return_url: trustedReturnUrl(data.returnUrl, "/coaching-pago/exito"),
          cancel_url: trustedReturnUrl(data.cancelUrl, "/coaching-pago"),
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
      customer_email: customerEmail,
      customer_name: customerName,
    });
    if (error) throw new Error(`DB insert failed: ${error.message}`);

    return { orderId: order.id, approvalUrl, price, isMember };
  });

export const captureCoachingOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) => {
    // PayPal order ids are short uppercase alphanumerics. Anything else must never reach
    // the URL below: "../" segments would point the merchant's token at other endpoints.
    const orderId = String(input?.orderId ?? "");
    if (!/^[A-Z0-9]{10,30}$/.test(orderId)) throw new Error("Orden inválida.");
    return { orderId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only capture orders this site created.
    const { data: order, error: orderError } = await supabaseAdmin
      .from("coaching_orders")
      .select("id, status, session_type, amount, customer_email, customer_name")
      .eq("paypal_order_id", data.orderId)
      .maybeSingle();
    if (orderError) throw new Error("No pudimos verificar la orden.");
    if (!order) throw new Error("Orden no encontrada.");
    if (order.status === "completed") return { success: true };

    const accessToken = await getAccessToken();
    const res = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(data.orderId)}/capture`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      },
    );
    const result = (await res.json().catch(() => ({}))) as {
      status?: string;
      details?: Array<{ issue?: string }>;
    };
    if (!res.ok && res.status !== 422) {
      console.error("PayPal capture failed", res.status, JSON.stringify(result).slice(0, 500));
      throw new Error("No pudimos confirmar el pago con PayPal.");
    }
    // A refresh/re-run of the success page re-captures; PayPal answers 422
    // ORDER_ALREADY_CAPTURED, which is a completed payment, not a failure.
    const issues = (result.details ?? []).map((d) => d.issue);
    const alreadyCaptured = res.status === 422 && issues.includes("ORDER_ALREADY_CAPTURED");

    if (result.status === "COMPLETED" || alreadyCaptured) {
      // Only the request that flips pending → completed sends the emails.
      const { data: flipped, error: updateErr } = await supabaseAdmin
        .from("coaching_orders")
        .update({ status: "completed", captured_at: new Date().toISOString() })
        .eq("id", order.id)
        .eq("status", "pending")
        .select("id");
      if (updateErr) throw new Error("No pudimos guardar el pago. Escríbenos y lo verificamos.");
      if (flipped?.length) await notifyCoachingPaid(order);
      return { success: true };
    }
    return {
      success: false,
      status: result.status ?? "UNKNOWN",
      declined: issues.includes("INSTRUMENT_DECLINED"),
    };
  });

async function notifyCoachingPaid(order: {
  id: string;
  session_type: string;
  amount: number;
  customer_email: string | null;
  customer_name: string | null;
}) {
  const { sendSiteEmail, escapeHtml, adminEmail } = await import("./site-email.server");
  const label =
    order.session_type in COACHING_SESSIONS
      ? COACHING_SESSIONS[order.session_type as SessionType].label
      : order.session_type;
  const name = order.customer_name ?? "";
  const email = order.customer_email ?? "";
  const amount = `US$${Number(order.amount).toFixed(2)}`;
  try {
    await sendSiteEmail({
      to: adminEmail(),
      replyTo: email || undefined,
      subject: `Coaching pagado — ${name || email} (${amount})`,
      html: `<p>Nuevo pago de coaching en AyudaSobria. Escribe a la familia para coordinar el horario.</p>
        <p><strong>Nombre:</strong> ${escapeHtml(name || "—")}<br>
        <strong>Correo:</strong> ${escapeHtml(email || "—")}<br>
        <strong>Sesión:</strong> ${escapeHtml(label)}<br>
        <strong>Monto:</strong> ${amount}<br>
        <strong>Orden:</strong> ${escapeHtml(order.id)}</p>`,
      idempotencyKey: `coaching-paid-admin-${order.id}`,
    });
  } catch (error) {
    console.error("Coaching admin email failed", error);
  }
  if (!email) return;
  try {
    await sendSiteEmail({
      to: email,
      subject: "Recibimos tu pago — coaching familiar AyudaSobria",
      html: `<div style="max-width:600px;font-family:Arial,sans-serif;color:#1f2937;line-height:1.55">
        <p>Hola ${escapeHtml(name || "")},</p>
        <p>Gracias. Recibimos tu pago de <strong>${amount}</strong> por <strong>${escapeHtml(label)}</strong>.</p>
        <p>Matt te escribirá a este correo para coordinar el horario de tu sesión. Si necesitas algo antes, responde a este mensaje o llama al (458) 298-8011.</p>
        <p>Con respeto,<br>Matt Brown<br>AyudaSobria</p></div>`,
      replyTo: adminEmail(),
      idempotencyKey: `coaching-paid-customer-${order.id}`,
    });
  } catch (error) {
    console.error("Coaching customer email failed", error);
  }
}
