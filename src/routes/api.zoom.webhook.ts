import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/zoom/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
        if (!secret)
          return Response.json({ error: "Zoom webhook is not configured" }, { status: 503 });
        const [{ createWebhookHandler }, { createSupabaseZoomStore }, { supabaseAdmin }] =
          await Promise.all([
            import("@/lib/zoom/webhook.server"),
            import("@/lib/zoom/supabase-store.server"),
            import("@/integrations/supabase/client.server"),
          ]);
        return createWebhookHandler({
          webhookSecret: secret,
          now: () => new Date(),
          store: createSupabaseZoomStore(supabaseAdmin),
        })(request);
      },
    },
  },
});
