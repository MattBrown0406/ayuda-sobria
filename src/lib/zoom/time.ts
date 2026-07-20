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
