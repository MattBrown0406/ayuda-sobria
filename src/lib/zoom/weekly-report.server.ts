import type { SupabaseClient } from "@supabase/supabase-js";
import { AYUDA_ZOOM_SERIES_KEY } from "./types.ts";

type Client = SupabaseClient<any, any, any>;

const PACIFIC = "America/Los_Angeles";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c] ?? c,
  );
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export interface WeeklyReport {
  occurrenceId: string;
  occurrenceDate: string;
  meetingLabel: string;
  totalRegistrants: number;
  registeredAttended: string[];
  registeredAbsent: string[];
  unregisteredAttendees: string[];
  staleAutoRegistrants: string[];
}

function personLabel(name: unknown, email: string) {
  const displayName = typeof name === "string" && name.trim() ? name.trim() : "(sin nombre)";
  return email ? `${displayName} <${email}>` : displayName;
}

/** Builds the report for the most recently completed La Sobremesa occurrence. */
export async function buildWeeklyReport(client: Client, now: Date): Promise<WeeklyReport | null> {
  const { data: occurrence, error: occurrenceError } = await client
    .from("zoom_occurrences")
    .select("id, occurrence_date, starts_at")
    .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
    .lte("starts_at", now.toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (occurrenceError) throw new Error(occurrenceError.message);
  if (!occurrence) return null;

  const [registrationsResult, attendanceResult] = await Promise.all([
    client
      .from("meeting_registrations")
      .select("full_name, email, auto_register")
      .eq("occurrence_id", occurrence.id),
    client
      .from("zoom_attendance")
      .select("participant_name, participant_email")
      .eq("occurrence_id", occurrence.id),
  ]);
  if (registrationsResult.error) throw new Error(registrationsResult.error.message);
  if (attendanceResult.error) throw new Error(attendanceResult.error.message);

  const registrations = registrationsResult.data ?? [];
  const attendance = attendanceResult.data ?? [];

  const attendedEmails = new Set(
    attendance.map((row: any) => normalizeEmail(row.participant_email)).filter(Boolean),
  );

  const registeredEmails = new Set<string>();
  const registeredAttended: string[] = [];
  const registeredAbsent: string[] = [];
  for (const row of registrations as any[]) {
    const email = normalizeEmail(row.email);
    if (email) registeredEmails.add(email);
    const label = personLabel(row.full_name, email);
    if (email && attendedEmails.has(email)) registeredAttended.push(label);
    else registeredAbsent.push(label);
  }

  const seenUnregistered = new Set<string>();
  const unregisteredAttendees: string[] = [];
  for (const row of attendance as any[]) {
    const email = normalizeEmail(row.participant_email);
    if (email && registeredEmails.has(email)) continue;
    const key = email || String(row.participant_name ?? "").trim().toLowerCase();
    if (!key || seenUnregistered.has(key)) continue;
    seenUnregistered.add(key);
    unregisteredAttendees.push(personLabel(row.participant_name, email));
  }

  // Auto-registrants with no attendance in the last 4 weeks (28 days).
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
  const [autoResult, recentAttendanceResult] = await Promise.all([
    client
      .from("meeting_registrations")
      .select("full_name, email, created_at")
      .eq("auto_register", true)
      .order("created_at", { ascending: false })
      .limit(5000),
    client.from("zoom_attendance").select("participant_email, joined_at").gte("joined_at", cutoff),
  ]);
  if (autoResult.error) throw new Error(autoResult.error.message);
  if (recentAttendanceResult.error) throw new Error(recentAttendanceResult.error.message);

  const recentAttendees = new Set(
    (recentAttendanceResult.data ?? [])
      .map((row: any) => normalizeEmail(row.participant_email))
      .filter(Boolean),
  );
  const seenAuto = new Set<string>();
  const staleAutoRegistrants: string[] = [];
  for (const row of (autoResult.data ?? []) as any[]) {
    const email = normalizeEmail(row.email);
    if (!email || seenAuto.has(email)) continue;
    seenAuto.add(email);
    if (recentAttendees.has(email)) continue;
    staleAutoRegistrants.push(personLabel(row.full_name, email));
  }

  const meetingLabel = new Intl.DateTimeFormat("es-US", {
    timeZone: PACIFIC,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(occurrence.starts_at));

  return {
    occurrenceId: String(occurrence.id),
    occurrenceDate: String(occurrence.occurrence_date),
    meetingLabel,
    totalRegistrants: registrations.length,
    registeredAttended,
    registeredAbsent,
    unregisteredAttendees,
    staleAutoRegistrants,
  };
}

function listHtml(items: string[]) {
  if (!items.length) return `<p style="color:#6b7280;margin:4px 0 16px">None</p>`;
  return `<ul style="margin:4px 0 16px;padding-left:20px">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

export function renderWeeklyReportHtml(report: WeeklyReport) {
  return `<div style="max-width:640px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;line-height:1.5">
    <h1 style="color:#166534;font-size:20px">La Sobremesa — weekly report</h1>
    <p style="color:#6b7280">Meeting of ${escapeHtml(report.meetingLabel)} (8:00 PM Pacific)</p>
    <p style="font-size:18px"><strong>Total registrants: ${report.totalRegistrants}</strong></p>
    <h2 style="font-size:15px;margin-bottom:0">Registered and attended (${report.registeredAttended.length})</h2>
    ${listHtml(report.registeredAttended)}
    <h2 style="font-size:15px;margin-bottom:0">Registered but did not attend (${report.registeredAbsent.length})</h2>
    ${listHtml(report.registeredAbsent)}
    <h2 style="font-size:15px;margin-bottom:0">Attended without registering (${report.unregisteredAttendees.length})</h2>
    ${listHtml(report.unregisteredAttendees)}
    <h2 style="font-size:15px;margin-bottom:0">Auto-registrants with no attendance in over 4 weeks (${report.staleAutoRegistrants.length})</h2>
    ${listHtml(report.staleAutoRegistrants)}
    <p style="font-size:12px;color:#6b7280">Sent automatically every Tuesday at 10:00 AM Pacific.</p>
  </div>`;
}

export async function sendWeeklyReportEmail(report: WeeklyReport) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  if (!resendApiKey || !lovableApiKey) throw new Error("Email provider is not configured");
  const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
      "Idempotency-Key": `zoom-weekly-report-${report.occurrenceId}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.REGISTRATION_FROM_EMAIL ?? "AyudaSobria <registro@ayudasobria.com>",
      to: [process.env.REGISTRATION_TO_EMAIL ?? "matt@soberhelpline.com"],
      subject: `La Sobremesa weekly report — ${report.occurrenceDate}`,
      html: renderWeeklyReportHtml(report),
    }),
  });
  if (!response.ok) throw new Error(`Email provider failed (${response.status})`);
}

/** True when the given instant is 10 AM Pacific on a Tuesday. */
export function isTuesdayReportHour(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return weekday === "Tue" && hour === 10;
}
