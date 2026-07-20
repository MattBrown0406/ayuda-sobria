import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

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

export const adminGetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [regs, memberships, coaching, profiles] = await Promise.all([
      supabaseAdmin
        .from("meeting_registrations")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("memberships").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("coaching_orders").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id, first_name, last_name"),
    ]);

    const profileMap = new Map<string, { first_name: string | null; last_name: string | null }>();
    (profiles.data ?? []).forEach((profile) => profileMap.set(profile.id, profile));

    return {
      registrations: regs.data ?? [],
      memberships: (memberships.data ?? []).map((membership) => ({
        ...membership,
        profile: profileMap.get(membership.user_id) ?? null,
      })),
      coaching: coaching.data ?? [],
      stats: {
        registrations: regs.data?.length ?? 0,
        activeMembers:
          memberships.data?.filter((membership) => membership.status === "active").length ?? 0,
        coachingOrders: coaching.data?.length ?? 0,
      },
    };
  });

export const adminDeleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("meeting_registrations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
