import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { membershipAllowsRecordingAccess } from "@/lib/zoom/recording-access";

export const getMemberZoomRecordings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from("memberships")
      .select("id, status, access_ends_at")
      .eq("user_id", context.userId)
      .in("status", ["active", "cancelled"]);
    if (membershipError) throw new Error(membershipError.message);
    const hasAccess = membershipAllowsRecordingAccess(memberships ?? [], now);
    if (!hasAccess) throw new Error("Membership required");

    const { data, error } = await supabaseAdmin
      .from("zoom_recordings")
      .select(
        "id, title, description, public_url, public_play_passcode, started_at, duration_minutes",
      )
      .eq("published", true)
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    // Provider file URLs, Zoom meeting identities, and unpublished rows never cross this boundary.
    return data ?? [];
  });

// Explicit allowlist: never publish provider IDs, host URLs or personalized links.
export const getPublicNextMeeting = createServerFn({ method: "GET" }).handler(async () => {
  const [{ supabaseAdmin }, { createSupabaseZoomStore }] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/lib/zoom/supabase-store.server"),
  ]);
  const occurrence = await createSupabaseZoomStore(supabaseAdmin).getUpcomingReadyOccurrence(
    new Date().toISOString(),
  );
  return occurrence ? { startsAt: occurrence.startsAt } : null;
});
