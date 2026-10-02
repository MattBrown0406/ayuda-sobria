import test from "node:test";
import assert from "node:assert/strict";
import {
  meetingCalendar,
  meetingLabel,
  nextMondayOccurrence,
  resolveMeetingTimezone,
} from "../src/lib/zoom/time.ts";
import { parseRegistrationInput } from "../src/lib/zoom/registration.server.ts";
import { renderConfirmationEmail, renderReminderEmail } from "../src/lib/zoom/email.server.ts";
import { createZoomClient } from "../src/lib/zoom/client.server.ts";

test("Monday 8PM follows Pacific DST and produces actual Tuesday dates abroad", () => {
  for (const [now, start] of [
    ["2026-03-02T12:00:00Z", "2026-03-03T04:00:00.000Z"],
    ["2026-03-09T12:00:00Z", "2026-03-10T03:00:00.000Z"],
    ["2026-10-26T12:00:00Z", "2026-10-27T03:00:00.000Z"],
    ["2026-11-02T12:00:00Z", "2026-11-03T04:00:00.000Z"],
    ["2026-10-06T05:30:00Z", "2026-10-13T03:00:00.000Z"],
    ["2026-11-03T06:30:00Z", "2026-11-10T04:00:00.000Z"],
  ])
    assert.equal(nextMondayOccurrence(new Date(now)).startsAt, start);
  assert.match(meetingLabel("2026-10-06T03:00:00Z", "Europe/Madrid"), /martes, 6 de octubre/);
  assert.match(meetingLabel("2026-10-06T03:00:00Z", "America/Mexico_City"), /lunes, 5 de octubre/);
});

test("calendar exports a stable single occurrence with UTC end and no personal links", () => {
  const ics = meetingCalendar("2026-11-03T04:00:00Z");
  assert.match(ics, /DTSTART:20261103T040000Z\r\nDTEND:20261103T051500Z/);
  assert.equal(ics, meetingCalendar("2026-11-03T04:00:00Z"));
  assert.doesNotMatch(ics, /RRULE|zoom\.us/);
});

test("timezone survives without callback request and confirmation matches reminder", () => {
  const registration = parseRegistrationInput({
    fullName: "Ana",
    email: "ana@example.com",
    consentConfidentiality: true,
    preferredTimezone: "Europe/Madrid",
  });
  assert.equal(registration.preferredTimezone, "Europe/Madrid");
  assert.throws(() => parseRegistrationInput({ ...registration, preferredTimezone: "invalid" }));
  const startsAt = "2026-10-06T03:00:00Z";
  const occurrence = {
    id: "o",
    seriesKey: "s",
    occurrenceDate: "2026-10-05",
    startsAt,
    status: "ready" as const,
    zoomMeetingId: "m",
    joinUrl: null,
  };
  const confirmation = renderConfirmationEmail({
    registrationId: "r",
    registration,
    occurrence,
    joinUrl: "https://zoom.test/private",
    source: "manual",
  });
  const reminder = renderReminderEmail({
    fullName: "Ana",
    startsAt,
    preferredTimezone: "Europe/Madrid",
    joinUrl: "https://zoom.test/private",
  });
  for (const email of [confirmation, reminder]) {
    assert.match(email.html, /martes, 6 de octubre/);
    assert.match(email.html, /Europe\/Madrid/);
    assert.doesNotMatch(email.html, /esta noche|de hoy/);
  }
});

test("provider duplicate discovery must succeed before meeting creation", async () => {
  const client = createZoomClient({
    accountId: "a",
    clientId: "c",
    clientSecret: "s",
    hostUserId: "h",
    fetchImpl: async (url) => {
      if (String(url).includes("oauth")) return Response.json({ access_token: "token" });
      return new Response("list_meetings 4711", { status: 403 });
    },
  });
  await assert.rejects(
    client.findMeeting({ startTime: "2026-10-06T03:00:00Z", topic: "La Sobremesa" }),
    /403/,
  );
});

test("automatic timezone prefers an explicit choice and safely handles missing or invalid detection", () => {
  assert.deepEqual(resolveMeetingTimezone(null, "Europe/Madrid"), {
    zone: "Europe/Madrid",
    source: "browser",
  });
  assert.deepEqual(resolveMeetingTimezone("America/Bogota", "Europe/Madrid"), {
    zone: "America/Bogota",
    source: "saved",
  });
  assert.deepEqual(resolveMeetingTimezone("invalid", "Europe/Madrid"), {
    zone: "Europe/Madrid",
    source: "browser",
  });
  for (const detected of [undefined, null, "", "invalid"])
    assert.deepEqual(resolveMeetingTimezone("invalid", detected), {
      zone: "America/Los_Angeles",
      source: "fallback",
    });
});

test("detected timezone reaches registration and preserves the instant across DST", () => {
  const selected = resolveMeetingTimezone(null, "Europe/Madrid").zone;
  const registration = parseRegistrationInput({
    fullName: "Ana",
    email: "ana@example.com",
    consentConfidentiality: true,
    preferredTimezone: selected,
  });
  assert.equal(registration.preferredTimezone, selected);
  const march = nextMondayOccurrence(new Date("2026-03-09T12:00:00Z")).startsAt;
  assert.match(meetingLabel(march, selected), /martes, 10 de marzo.*4:00/);
  assert.match(meetingCalendar(march), /DTSTART:20260310T030000Z/);
});
