import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMemberZoomRecordings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userHasMemberAccess } = await import("@/lib/membership-sync.server");
    // Website membership (confirmed with PayPal when pending or past its billing date)
    // or a current Sober Helpline app membership.
    const hasAccess = await userHasMemberAccess(context.userId);
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
