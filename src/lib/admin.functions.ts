import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { assertAdminRoleResult } from "@/lib/zoom/admin-auth";

const AYUDA_ZOOM_SERIES_KEY = "ayuda_sobria_la_sobremesa_es_8pm";

export async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  assertAdminRoleResult(data, error);
}

export const adminCheckAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    assertAdminRoleResult(data, error);
    return { isAdmin: true };
  });

export const adminGetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: typedAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = typedAdmin as any;

    const [regs, memberships, coaching, profiles, occurrences, attendance, recordings] =
      await Promise.all([
        supabaseAdmin
          .from("meeting_registrations")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("memberships").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("coaching_orders").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("profiles").select("id, first_name, last_name"),
        supabaseAdmin
          .from("zoom_occurrences")
          .select("*")
          .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
          .order("starts_at", { ascending: false }),
        supabaseAdmin.from("zoom_attendance").select("*").order("joined_at", { ascending: false }),
        supabaseAdmin.from("zoom_recordings").select("*").order("started_at", { ascending: false }),
      ]);

    for (const result of [
      regs,
      memberships,
      coaching,
      profiles,
      occurrences,
      attendance,
      recordings,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }

    const profileMap = new Map<string, { first_name: string | null; last_name: string | null }>();
    (profiles.data ?? []).forEach((profile: any) => profileMap.set(profile.id, profile));
    const occurrenceIds = new Set((occurrences.data ?? []).map((occurrence: any) => occurrence.id));
    const zoomRegistrations = (regs.data ?? []).filter(
      (registration) =>
        registration.occurrence_id !== null && occurrenceIds.has(registration.occurrence_id),
    );
    const zoomAttendance = (attendance.data ?? []).filter((entry: any) =>
      occurrenceIds.has(entry.occurrence_id),
    );
    const zoomRecordings = (recordings.data ?? []).filter((recording: any) =>
      occurrenceIds.has(recording.occurrence_id),
    );

    return {
      registrations: zoomRegistrations,
      memberships: (memberships.data ?? []).map((membership: any) => ({
        ...membership,
        profile: profileMap.get(membership.user_id) ?? null,
      })),
      coaching: coaching.data ?? [],
      occurrences: occurrences.data ?? [],
      attendance: zoomAttendance,
      recordings: zoomRecordings,
      stats: {
        registrations: zoomRegistrations.length,
        activeMembers:
          memberships.data?.filter((membership: any) => membership.status === "active").length ?? 0,
        coachingOrders: coaching.data?.length ?? 0,
      },
    };
  });

export const adminUpdateZoomRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      id: string;
      published: boolean;
      title?: string | null;
      description?: string | null;
      publicUrl?: string | null;
      publicPasscode?: string | null;
    }) => {
      if (!data?.id) throw new Error("id required");
      const publicUrl =
        data.publicUrl === undefined ? undefined : data.publicUrl?.trim().slice(0, 2048) || null;
      if (publicUrl) {
        const parsed = new URL(publicUrl);
        if (parsed.protocol !== "https:") throw new Error("Recording URL must use HTTPS");
      }
      return {
        id: data.id,
        published: data.published === true,
        title: data.title === undefined ? undefined : data.title?.trim().slice(0, 200) || null,
        description:
          data.description === undefined
            ? undefined
            : data.description?.trim().slice(0, 4000) || null,
        publicUrl,
        publicPasscode:
          data.publicPasscode === undefined
            ? undefined
            : data.publicPasscode?.trim().slice(0, 128) || null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: typedAdmin2 } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = typedAdmin2 as any;
    const { data: current, error: readError } = await supabaseAdmin
      .from("zoom_recordings")
      .select("id, public_url")
      .eq("id", data.id)
      .single();
    if (readError || !current) throw new Error(readError?.message || "Recording not found");
    const publicUrl = data.publicUrl === undefined ? current.public_url : data.publicUrl;
    if (data.published && !publicUrl) throw new Error("Add a recording URL before publishing");
    const { data: updated, error } = await supabaseAdmin
      .from("zoom_recordings")
      .update({
        published: data.published,
        published_at: data.published ? new Date().toISOString() : null,
        public_url: publicUrl,
        public_play_passcode: data.publicPasscode,
        title: data.title,
        description: data.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const adminDeleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: typedAdmin3 } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = typedAdmin3 as any;
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from("meeting_registrations")
      .select("id,occurrence_id,zoom_registrant_id,zoom_registration_status")
      .eq("id", data.id)
      .single();
    if (registrationError || !registration) {
      throw new Error(registrationError?.message || "Registration not found");
    }
    if (registration.occurrence_id && registration.zoom_registration_status === "registered") {
      if (!registration.zoom_registrant_id) {
        throw new Error("Zoom registrant identity is missing; access was not revoked");
      }
      const { data: occurrence, error: occurrenceError } = await supabaseAdmin
        .from("zoom_occurrences")
        .select("zoom_meeting_id")
        .eq("id", registration.occurrence_id)
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .single();
      if (occurrenceError || !occurrence?.zoom_meeting_id) {
        throw new Error(occurrenceError?.message || "Managed Zoom meeting not found");
      }
      const { zoomClientFromEnv } = await import("@/lib/zoom/client.server");
      await zoomClientFromEnv().removeRegistrant(
        occurrence.zoom_meeting_id,
        registration.zoom_registrant_id,
      );
    }
    const { error } = await supabaseAdmin.from("meeting_registrations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
