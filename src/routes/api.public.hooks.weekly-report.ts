import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/weekly-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const anonKey = process.env.SUPABASE_ANON_KEY;
        const providedKey = request.headers.get("apikey");
        if (!anonKey || !providedKey || providedKey !== anonKey) {
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
          const report = await buildWeeklyReport(supabaseAdmin as any, now);
          if (!report) return Response.json({ skipped: "no completed meeting yet" });
          await sendWeeklyReportEmail(report);
          return Response.json({
            sent: true,
            occurrenceDate: report.occurrenceDate,
            totalRegistrants: report.totalRegistrants,
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
