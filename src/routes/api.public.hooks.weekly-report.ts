import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/weekly-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Only the private automation secret authorizes this hook. The Supabase
        // anon/publishable key ships in the public browser bundle and must never
        // gate an endpoint that emails registrant data.
        const secret = process.env.ZOOM_AUTOMATION_SECRET;
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        const { safeEqualUtf8 } = await import("@/lib/zoom/security");
        if (!secret || !safeEqualUtf8(providedKey, secret)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [{ supabaseAdmin }, reportModule] = await Promise.all([
          import("@/integrations/supabase/client.server"),
          import("@/lib/zoom/weekly-report.server"),
        ]);
        const { buildWeeklyReport, sendWeeklyReportEmail, isTuesdayReportHour } = reportModule;

        const now = new Date();
        let force = false;
        try {
          const body = (await request.json()) as { force?: boolean } | null;
          force = body?.force === true;
        } catch {
          force = false;
        }
        if (!force && !isTuesdayReportHour(now)) {
          return Response.json({ skipped: "outside report window" });
        }

        try {
          const report = await buildWeeklyReport(supabaseAdmin, now);
          if (!report) return Response.json({ skipped: "no completed meeting yet" });
          await sendWeeklyReportEmail(report);
          return Response.json({
            sent: true,
            occurrenceDate: report.occurrenceDate,
          });
        } catch (error) {
          console.error(
            "Weekly report failed",
            error instanceof Error ? error.message : "unknown error",
          );
          return Response.json({ error: "Weekly report failed" }, { status: 500 });
        }
      },
    },
  },
});
