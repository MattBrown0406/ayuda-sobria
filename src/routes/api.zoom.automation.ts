import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/zoom/automation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ZOOM_AUTOMATION_SECRET;
        if (!secret)
          return Response.json({ error: "Zoom automation is not configured" }, { status: 503 });
        const [
          { createAutomationHandler },
          { zoomClientFromEnv },
          { registrationMailerFromEnv },
          { createSupabaseZoomStore },
          { supabaseAdmin },
        ] = await Promise.all([
          import("@/lib/zoom/automation.server"),
          import("@/lib/zoom/client.server"),
          import("@/lib/zoom/email.server"),
          import("@/lib/zoom/supabase-store.server"),
          import("@/integrations/supabase/client.server"),
        ]);
        try {
          return createAutomationHandler({
            automationSecret: secret,
            now: () => new Date(),
            store: createSupabaseZoomStore(supabaseAdmin),
            zoom: zoomClientFromEnv(),
            mailer: registrationMailerFromEnv(),
          })(request);
        } catch (error) {
          console.error(
            "Zoom automation configuration error",
            error instanceof Error ? error.message : "unknown error",
          );
          return Response.json({ error: "Zoom automation is not configured" }, { status: 503 });
        }
      },
    },
  },
});
