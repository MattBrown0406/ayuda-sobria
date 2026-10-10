import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { WeeklyTickSummary } from "./automation.server.ts";

// The database cron's secret and the last tick's outcome (one row, service role only).
type Client = SupabaseClient<Database>;

export async function readCronSecret(client: Client): Promise<string> {
  const { data, error } = await client
    .from("zoom_automation_state")
    .select("cron_secret")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.cron_secret ?? "";
}

export async function recordTick(client: Client, summary: WeeklyTickSummary): Promise<void> {
  const { error } = await client
    .from("zoom_automation_state")
    .update({
      last_tick_at: summary.ranAt,
      last_tick_ok: summary.ok,
      last_tick_summary: summary as unknown as Json,
      last_error: summary.ok ? null : summary.errors.join("\n").slice(0, 2000),
      ...(summary.ok ? { last_success_at: summary.ranAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

/** The meeting the Tuesday report was last sent for (so 4 ticks send it once). */
export async function readLastReportOccurrence(client: Client): Promise<string | null> {
  const { data, error } = await client
    .from("zoom_automation_state")
    .select("last_report_occurrence_id")
    .eq("id", 1)
    .maybeSingle();
  // Before the column exists (migration not applied yet) fall back to "not sent":
  // the email provider's idempotency key still dedupes the report per meeting.
  if (error) {
    console.error("Report state unavailable", error.message);
    return null;
  }
  return data?.last_report_occurrence_id ?? null;
}

export async function recordReportSent(client: Client, occurrenceId: string): Promise<void> {
  const { error } = await client
    .from("zoom_automation_state")
    .update({ last_report_occurrence_id: occurrenceId, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}
