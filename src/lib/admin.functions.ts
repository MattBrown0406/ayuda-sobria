import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export const adminGetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const [regs, mems, orders] = await Promise.all([
      context.supabase
        .from("meeting_registrations")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("memberships")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("coaching_orders")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (regs.error) throw new Error(regs.error.message);
    if (mems.error) throw new Error(mems.error.message);
    if (orders.error) throw new Error(orders.error.message);
    return {
      registrations: regs.data ?? [],
      memberships: mems.data ?? [],
      coachingOrders: orders.data ?? [],
    };
  });

export const adminCheckAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const adminDeleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("meeting_registrations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });