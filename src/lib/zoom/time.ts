export const ZOOM_TIMEZONE = "America/Los_Angeles";
export const ZOOM_HOUR = 20;

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
}

function localDateParts(at: Date, timeZone = ZOOM_TIMEZONE): LocalDateParts {
  const values: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(at)) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: values.weekday,
  };
}

function offsetMilliseconds(at: Date, timeZone: string): number {
  const values: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return representedAsUtc - at.getTime();
}

export function zonedDateTimeToUtc(date: string, hour = ZOOM_HOUR, timeZone = ZOOM_TIMEZONE): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("Invalid ISO date");
  const intendedUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hour);
  let guess = new Date(intendedUtc);
  for (let index = 0; index < 3; index += 1) {
    guess = new Date(intendedUtc - offsetMilliseconds(guess, timeZone));
  }
  return guess;
}

/**
 * Targets the imminent Monday until the 8 PM Pacific start time, then rolls to next week.
 * This lets an hourly scheduler recover from a missed weekend/Monday-morning run without
 * ever changing the separate SoberHelpline 7 PM series.
 */
export function nextMondayOccurrence(now: Date): { occurrenceDate: string; startsAt: string } {
  if (Number.isNaN(now.getTime())) throw new Error("Invalid current time");
  const local = localDateParts(now);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(local.weekday);
  if (weekday < 0) throw new Error("Unsupported weekday");
  const localDate = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const today = localDate.toISOString().slice(0, 10);
  const todayStartsAt = zonedDateTimeToUtc(today);
  const daysAhead = weekday === 1 && now < todayStartsAt ? 0 : (8 - weekday) % 7 || 7;
  const date = new Date(Date.UTC(local.year, local.month - 1, local.day + daysAhead));
  const occurrenceDate = date.toISOString().slice(0, 10);
  return { occurrenceDate, startsAt: zonedDateTimeToUtc(occurrenceDate).toISOString() };
}

/** Monday 10:00 PM Pacific: tonight's meeting is over, so next Monday's link is created. */
export const ZOOM_CREATE_HOUR = 22;

/** ISO weekday (1 = Monday … 7 = Sunday), hour and minute in Pacific time. */
export function pacificClock(now: Date): { isoWeekday: number; hour: number; minute: number } {
  const values: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: ZOOM_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  const isoWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(values.weekday) + 1;
  if (isoWeekday < 1) throw new Error("Unsupported weekday");
  return { isoWeekday, hour: Number(values.hour), minute: Number(values.minute) };
}

export interface WeeklyAutomationPlan {
  /** Create (or confirm) the meeting nextMondayOccurrence() points at. */
  schedule: boolean;
  /** Register everyone who opted into weekly registration and email their link. */
  autoRegister: boolean;
  /** Same-day reminders for tonight's registrants. */
  reminders: boolean;
  /** Tuesday-morning attendance report for the previous night. */
  weeklyReport: boolean;
  /** Nightly mirror of Sober Helpline app memberships (3 AM, first tick of the hour). */
  appMembers: boolean;
}

/**
 * What the every-15-minutes tick should do at this instant (Pacific time):
 * - Monday 8:00–9:59 PM: nothing. Tonight's meeting is running and its link must stay current.
 * - Monday from 10:00 PM: create next Monday's meeting with a new link. Every other tick
 *   confirms it exists, so a missed or failed run is recovered on the next tick.
 * - Thursday from 3:00 PM until Monday's start: weekly auto-registration, once an hour
 *   (it is idempotent per person; hourly retries catch failures without hammering Zoom).
 * - Monday 4:00–7:59 PM: reminders (each registration is reminded once).
 * - Tuesday 10 AM hour: the weekly report (the email provider dedupes per meeting).
 * - Daily at 3 AM: mirror Sober Helpline app memberships (member benefits on this site).
 */
export function weeklyAutomationPlan(now: Date): WeeklyAutomationPlan {
  const { isoWeekday, hour, minute } = pacificClock(now);
  const monday = isoWeekday === 1;
  const meetingInProgress = monday && hour >= ZOOM_HOUR && hour < ZOOM_CREATE_HOUR;
  const registrationWindow =
    (isoWeekday === 4 && hour >= 15) ||
    isoWeekday === 5 ||
    isoWeekday === 6 ||
    isoWeekday === 7 ||
    (monday && hour < ZOOM_HOUR);
  return {
    schedule: !meetingInProgress,
    autoRegister: registrationWindow && minute < 15,
    reminders: monday && hour >= 16 && hour < ZOOM_HOUR,
    weeklyReport: isoWeekday === 2 && hour === 10,
    appMembers: hour === 3 && minute < 15,
  };
}

export function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

/** Saved explicit choice wins; invalid/missing values fall back without asking for location. */
export function resolveMeetingTimezone(
  saved: unknown,
  detected: unknown,
): {
  zone: string;
  source: "saved" | "browser" | "fallback";
} {
  if (typeof saved === "string" && saved && validTimezone(saved))
    return { zone: saved, source: "saved" };
  if (typeof detected === "string" && detected && validTimezone(detected))
    return { zone: detected, source: "browser" };
  return { zone: ZOOM_TIMEZONE, source: "fallback" };
}

export function meetingLabel(startsAt: string, timeZone = ZOOM_TIMEZONE): string {
  const zone = validTimezone(timeZone) ? timeZone : ZOOM_TIMEZONE;
  return (
    new Intl.DateTimeFormat("es", {
      timeZone: zone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(startsAt)) + ` (${zone})`
  );
}

/** One occurrence, UTC timestamps: calendar applications display their own local date. */
export function meetingCalendar(startsAt: string): string {
  const start = new Date(startsAt);
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AyudaSobria//La Sobremesa//ES",
    "BEGIN:VEVENT",
    `UID:sobremesa-${stamp(start)}@ayudasobria.com`,
    `DTSTAMP:${stamp(start)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(new Date(start.getTime() + 75 * 60000))}`,
    "SUMMARY:La Sobremesa",
    "DESCRIPTION:Regístrate para recibir tu enlace personal. Cámara opcional.",
    "URL:https://ayudasobria.com/registro",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
