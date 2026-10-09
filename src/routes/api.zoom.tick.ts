import { createFileRoute } from "@tanstack/react-router";

// Called every 15 minutes by the database cron job `la-sobremesa-weekly-tick`
// (supabase/migrations/20261009220000_la_sobremesa_weekly_cron.sql). Accepts the
// cron's secret from public.zoom_automation_state or ZOOM_AUTOMATION_SECRET.
export const Route = createFileRoute("/api/zoom/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [
          { safeEqualUtf8 },
          { runWeeklyTick },
          { zoomClientFromEnv, unavailableZoomApi },
          { registrationMailerFromEnv },
          { createSupabaseZoomStore },
          { readCronSecret, recordTick },
          { buildWeeklyReport, sendWeeklyReportEmail },
          { supabaseAdmin },
        ] = await Promise.all([
          import("@/lib/zoom/security"),
          import("@/lib/zoom/automation.server"),
          import("@/lib/zoom/client.server"),
          import("@/lib/zoom/email.server"),
          import("@/lib/zoom/supabase-store.server"),
          import("@/lib/zoom/tick-state.server"),
          import("@/lib/zoom/weekly-report.server"),
          import("@/integrations/supabase/client.server"),
        ]);

        const header = request.headers.get("authorization") ?? "";
        const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
        const envSecret = process.env.ZOOM_AUTOMATION_SECRET ?? "";
        let authorized = Boolean(provided) && safeEqualUtf8(provided, envSecret);
        if (!authorized && provided) {
          try {
            const cronSecret = await readCronSecret(supabaseAdmin);
            authorized = Boolean(cronSecret) && safeEqualUtf8(provided, cronSecret);
          } catch (error) {
            console.error(
              "Zoom tick could not read its cron secret",
              error instanceof Error ? error.message : "unknown error",
            );
          }
        }
        if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let zoom;
        try {
          zoom = zoomClientFromEnv();
        } catch (error) {
          zoom = unavailableZoomApi(
            error instanceof Error ? error.message : "Zoom is not configured",
          );
        }
        const summary = await runWeeklyTick({
          now: new Date(),
          store: createSupabaseZoomStore(supabaseAdmin),
          zoom,
          mailer: registrationMailerFromEnv(),
          weeklyReport: async (now) => {
            const report = await buildWeeklyReport(supabaseAdmin, now);
            if (!report) return { skipped: "no meeting in the last week" };
            await sendWeeklyReportEmail(report);
            return { sent: true, occurrenceDate: report.occurrenceDate };
          },
        });
        if (!summary.ok) console.error("La Sobremesa tick had errors", summary.errors.join(" | "));
        try {
          await recordTick(supabaseAdmin, summary);
        } catch (error) {
          console.error(
            "Zoom tick could not record its result",
            error instanceof Error ? error.message : "unknown error",
          );
        }
        return Response.json(summary);
      },
    },
  },
});
