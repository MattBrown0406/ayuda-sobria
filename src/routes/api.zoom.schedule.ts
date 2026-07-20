import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/zoom/schedule")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ZOOM_AUTOMATION_SECRET;
        if (!secret)
          return Response.json({ error: "Zoom automation is not configured" }, { status: 503 });
        try {
          const [
            { createScheduleHandler },
            { zoomClientFromEnv },
            { createSupabaseZoomStore },
            { supabaseAdmin },
          ] = await Promise.all([
            import("@/lib/zoom/schedule.server"),
            import("@/lib/zoom/client.server"),
            import("@/lib/zoom/supabase-store.server"),
            import("@/integrations/supabase/client.server"),
          ]);
          return createScheduleHandler({
            automationSecret: secret,
            now: () => new Date(),
            store: createSupabaseZoomStore(supabaseAdmin),
            zoom: zoomClientFromEnv(),
          })(request);
        } catch (error) {
          console.error(
            "Zoom scheduling configuration error",
            error instanceof Error ? error.message : "unknown error",
          );
          return Response.json({ error: "Zoom scheduling is not configured" }, { status: 503 });
        }
      },
    },
  },
});
