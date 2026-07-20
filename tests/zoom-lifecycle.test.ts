import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { nextMondayOccurrence } from "../src/lib/zoom/time.ts";
import { createScheduleHandler, scheduleNextMonday } from "../src/lib/zoom/schedule.server.ts";
import {
  createRegistrationHandler,
  registerForOccurrence,
} from "../src/lib/zoom/registration.server.ts";
import { createWebhookHandler } from "../src/lib/zoom/webhook.server.ts";
import {
  autoRegisterRecurring,
  createAutomationHandler,
  sendDueFollowups,
  sendDueReminders,
} from "../src/lib/zoom/automation.server.ts";
import { assertAdminRoleResult } from "../src/lib/zoom/admin-auth.ts";
import { membershipAllowsRecordingAccess } from "../src/lib/zoom/recording-access.ts";
import { endpointValidationToken, zoomWebhookSignature } from "../src/lib/zoom/security.ts";
import { AYUDA_ZOOM_SERIES_KEY, AYUDA_ZOOM_TOPIC } from "../src/lib/zoom/types.ts";
import { createZoomClient } from "../src/lib/zoom/client.server.ts";
import type {
  AutomationStore,
  Occurrence,
  RegistrationInput,
  RegistrationMailer,
  RegistrationRecord,
  ScheduleStore,
  WebhookStore,
  ZoomApi,
  ZoomRecordingCompleted,
} from "../src/lib/zoom/types.ts";

function occurrence(
  id: string,
  date: string,
  status: Occurrence["status"] = "scheduling",
): Occurrence {
  return {
    id,
    seriesKey: AYUDA_ZOOM_SERIES_KEY,
    occurrenceDate: date,
    startsAt: `${date}T00:00:00Z`,
    status,
    zoomMeetingId: status === "ready" ? `m-${id}` : null,
    joinUrl: status === "ready" ? `https://zoom.test/${id}` : null,
  };
}

class MemoryScheduleStore implements ScheduleStore {
  rows = new Map<string, Occurrence>();
  async claimOccurrence(seriesKey: string, date: string, startsAt: string) {
    assert.equal(seriesKey, AYUDA_ZOOM_SERIES_KEY);
    const existing = this.rows.get(date);
    if (existing) return { claimed: false, value: existing };
    const value = { ...occurrence(`o-${date}`, date), startsAt };
    this.rows.set(date, value);
    return { claimed: true, value };
  }
  async completeOccurrence(id: string, meeting: { id: string; joinUrl: string }) {
    const value = [...this.rows.values()].find((row) => row.id === id)!;
    Object.assign(value, { status: "ready", zoomMeetingId: meeting.id, joinUrl: meeting.joinUrl });
    return value;
  }
  async failOccurrence(id: string) {
    this.rows.get(id);
  }
}

class MemoryAutomationStore implements AutomationStore {
  ready = occurrence("occ-1", "2026-07-27", "ready");
  rows = new Map<string, RegistrationRecord>();
  claimedInput: RegistrationInput | null = null;
  recurring = [{ fullName: "Ana", email: "ana@example.com", consentUpdates: true }];
  reminders = [
    {
      registrationId: "r-reminder",
      fullName: "Ana",
      email: "ana@example.com",
      joinUrl: "https://zoom.test/personal",
      occurrence: this.ready,
    },
  ];
  completedReminders: string[] = [];
  failedReminders: string[] = [];
  followups = [
    {
      queueId: "q-1",
      registrationId: "r-1",
      fullName: "Ana",
      email: "ana@example.com",
      sequenceStep: 1,
    },
  ];
  completedFollowups: string[] = [];
  async getReadyOccurrence(id: string) {
    return id === this.ready.id ? this.ready : null;
  }
  async getUpcomingReadyOccurrence() {
    return this.ready;
  }
  async claimRegistration(input: RegistrationInput) {
    this.claimedInput = input;
    const key = `${input.occurrenceId}:${input.email.toLowerCase()}`;
    const existing = this.rows.get(key);
    if (existing) return { claimed: false, value: existing };
    const value: RegistrationRecord = {
      id: `r-${this.rows.size + 1}`,
      occurrenceId: input.occurrenceId,
      status: "registering",
      zoomRegistrantId: null,
      zoomJoinUrl: null,
      confirmationEmailStatus: "pending",
    };
    this.rows.set(key, value);
    return { claimed: true, value };
  }
  async completeRegistration(id: string, registrant: { id: string; joinUrl: string }) {
    const value = [...this.rows.values()].find((row) => row.id === id)!;
    Object.assign(value, {
      status: "registered",
      zoomRegistrantId: registrant.id,
      zoomJoinUrl: registrant.joinUrl,
    });
    return value;
  }
  async failRegistration(id: string) {
    const value = [...this.rows.values()].find((row) => row.id === id)!;
    value.status = "failed";
  }
  async completeConfirmationEmail() {}
  async failConfirmationEmail() {}
  async listRecurringRegistrants() {
    return this.recurring;
  }
  async claimDueReminders() {
    const result = this.reminders;
    this.reminders = [];
    return result;
  }
  async completeReminder(id: string) {
    this.completedReminders.push(id);
  }
  async failReminder(id: string) {
    this.failedReminders.push(id);
  }
  async claimDueFollowups() {
    const result = this.followups;
    this.followups = [];
    return result;
  }
  async completeFollowup(id: string) {
    this.completedFollowups.push(id);
  }
  async failFollowup() {}
}

function zoomMock(): ZoomApi & { meetings: string[]; registrations: string[] } {
  const result = {
    meetings: [] as string[],
    registrations: [] as string[],
    async findMeeting() {
      return null;
    },
    async createMeeting(input: { startTime: string; topic: string }) {
      assert.equal(input.topic, AYUDA_ZOOM_TOPIC);
      result.meetings.push(input.startTime);
      const count = result.meetings.length;
      return {
        id: `meeting-${count}`,
        joinUrl: `https://zoom.test/join-${count}`,
        startUrl: `https://zoom.test/start-${count}`,
      };
    },
    async findRegistrant() {
      return null;
    },
    async addRegistrant(meetingId: string, input: { email: string }) {
      result.registrations.push(`${meetingId}:${input.email}`);
      return {
        id: `registrant-${result.registrations.length}`,
        joinUrl: `https://zoom.test/registrant-${result.registrations.length}`,
      };
    },
    async removeRegistrant() {},
  };
  return result;
}

const baseRegistration: RegistrationInput = {
  occurrenceId: "occ-1",
  fullName: "Ana López",
  email: "ana@example.com",
  autoRegister: false,
  requestFollowUp: false,
  consentConfidentiality: true,
  consentUpdates: false,
};

test("8 PM Pacific recurrence recovers Monday-before-start and remains DST-aware", () => {
  assert.deepEqual(nextMondayOccurrence(new Date("2026-03-02T18:00:00Z")), {
    occurrenceDate: "2026-03-02",
    startsAt: "2026-03-03T04:00:00.000Z",
  });
  assert.deepEqual(nextMondayOccurrence(new Date("2026-10-26T18:00:00Z")), {
    occurrenceDate: "2026-10-26",
    startsAt: "2026-10-27T03:00:00.000Z",
  });
  assert.deepEqual(nextMondayOccurrence(new Date("2026-10-27T03:00:00Z")), {
    occurrenceDate: "2026-11-02",
    startsAt: "2026-11-03T04:00:00.000Z",
  });
});

test("distinct Mondays create unique meetings/links and a same-occurrence retry is idempotent", async () => {
  const store = new MemoryScheduleStore();
  const zoom = zoomMock();
  const first = await scheduleNextMonday({ now: new Date("2026-07-20T15:00:00Z"), store, zoom });
  const retry = await scheduleNextMonday({ now: new Date("2026-07-20T23:00:00Z"), store, zoom });
  const second = await scheduleNextMonday({ now: new Date("2026-07-27T15:00:00Z"), store, zoom });
  assert.equal(first.created, true);
  assert.equal(retry.created, false);
  assert.equal(second.created, true);
  assert.equal(zoom.meetings.length, 2);
  assert.notEqual(first.occurrence.zoomMeetingId, second.occurrence.zoomMeetingId);
  assert.notEqual(first.occurrence.joinUrl, second.occurrence.joinUrl);
});

test("Zoom recovery matches equivalent provider timestamps with or without milliseconds", async () => {
  const calls: string[] = [];
  const client = createZoomClient({
    accountId: "account",
    clientId: "client",
    clientSecret: "secret",
    hostUserId: "spanish-host@example.com",
    fetchImpl: async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("https://zoom.us/oauth/token")) {
        return Response.json({ access_token: "token", expires_in: 3600 });
      }
      return Response.json({
        meetings: [
          {
            id: 888,
            topic: AYUDA_ZOOM_TOPIC,
            start_time: "2026-07-28T03:00:00Z",
            join_url: "https://zoom.test/recovered",
          },
        ],
      });
    },
  });
  const found = await client.findMeeting({
    topic: AYUDA_ZOOM_TOPIC,
    startTime: "2026-07-28T03:00:00.000Z",
  });
  assert.equal(found?.id, "888");
  assert.equal(calls.filter((url) => url.includes("/meetings")).length, 1);
});

test("scheduler requires its separate automation secret", async () => {
  const store = new MemoryScheduleStore();
  const zoom = zoomMock();
  const handler = createScheduleHandler({
    automationSecret: "correct",
    now: () => new Date("2026-07-20T15:00:00Z"),
    store,
    zoom,
  });
  assert.equal(
    (await handler(new Request("https://example.test", { method: "POST" }))).status,
    401,
  );
  assert.equal(
    (
      await handler(
        new Request("https://example.test", {
          method: "POST",
          headers: { authorization: "Bearer wrong" },
        }),
      )
    ).status,
    401,
  );
  assert.equal(zoom.meetings.length, 0);
});

test("Spanish registration persists question before Zoom and retries without duplicate provider calls", async () => {
  const store = new MemoryAutomationStore();
  const zoom = zoomMock();
  const input = { ...baseRegistration, question: "¿Cómo pongo límites?" };
  const first = await registerForOccurrence({ registration: input, store, zoom });
  const retry = await registerForOccurrence({ registration: input, store, zoom });
  assert.equal(store.claimedInput?.question, "¿Cómo pongo límites?");
  assert.equal(first.registration.status, "registered");
  assert.equal(retry.created, false);
  assert.equal(zoom.registrations.length, 1);
});

test("registration aliases normalize data and confidentiality is mandatory", async () => {
  const store = new MemoryAutomationStore();
  const zoom = zoomMock();
  const handler = createRegistrationHandler({ store, zoom });
  const denied = await handler(
    new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ nombre: "Ana", email: "ana@example.com" }),
    }),
  );
  assert.equal(denied.status, 400);
  const accepted = await handler(
    new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({
        nombre: " Ana López ",
        email: "ANA@EXAMPLE.COM",
        pregunta: " Ayuda ",
        consentConfidentiality: true,
      }),
    }),
  );
  assert.equal(accepted.status, 200);
  const acceptedBody = (await accepted.json()) as { joinUrl?: string | null };
  assert.equal(acceptedBody.joinUrl, null);
  assert.equal(store.claimedInput?.email, "ana@example.com");
  assert.equal(store.claimedInput?.question, "Ayuda");
});

class MemoryWebhookStore implements WebhookStore {
  events = new Map<string, string>();
  processed = new Set<string>();
  leases = new Map<string, string>();
  recordings: ZoomRecordingCompleted[] = [];
  managed = new Set(["123", "456"]);
  claims = 0;
  async isManagedMeeting(id: string) {
    return this.managed.has(id);
  }
  async claimWebhookEvent(_series: string, id: string, type: string, _at: string, hash: string) {
    this.claims += 1;
    const prior = this.events.get(id);
    if (!prior) {
      const leaseId = `lease-${this.claims}`;
      this.events.set(id, `${type}:${hash}`);
      this.leases.set(id, leaseId);
      return { status: "claimed", leaseId } as const;
    }
    if (prior !== `${type}:${hash}`) return { status: "conflict" } as const;
    return this.processed.has(id) ? ({ status: "replay" } as const) : ({ status: "busy" } as const);
  }
  async completeWebhookEvent(_series: string, id: string, leaseId: string) {
    if (this.leases.get(id) !== leaseId) throw new Error("stale lease");
    this.processed.add(id);
    this.leases.delete(id);
  }
  async releaseWebhookEvent(_series: string, id: string, leaseId: string) {
    if (this.leases.get(id) !== leaseId) return;
    this.events.delete(id);
    this.processed.delete(id);
    this.leases.delete(id);
  }
  async markMeetingStarted() {}
  async markMeetingEnded() {}
  async recordParticipantJoined() {}
  async recordParticipantLeft() {}
  async ingestRecordingCompleted(recording: ZoomRecordingCompleted) {
    this.recordings.push(recording);
  }
}
function signedRequest(secret: string, timestamp: number, body: object) {
  const raw = JSON.stringify(body);
  return new Request("https://example.test", {
    method: "POST",
    body: raw,
    headers: {
      "content-type": "application/json",
      "x-zm-request-timestamp": String(timestamp),
      "x-zm-signature": zoomWebhookSignature(secret, String(timestamp), raw),
    },
  });
}
const recordingEvent = (eventId = "evt-1", meetingId = 123) => ({
  event: "recording.completed",
  event_id: eventId,
  payload: {
    object: {
      id: meetingId,
      uuid: `uuid-${eventId}`,
      topic: "La Sobremesa",
      start_time: "2027-01-05T04:00:00Z",
      share_url: "https://zoom.example/rec/share-private",
      recording_play_passcode: "CodigoPrivado123",
      recording_files: [
        { id: `file-${eventId}`, file_type: "MP4", download_url: "https://private.example/token" },
      ],
    },
  },
});

test("webhook rejects stale/altered signatures and validates Zoom challenge", async () => {
  const secret = "webhook-secret";
  const now = 1_800_000_000;
  const handler = createWebhookHandler({
    webhookSecret: secret,
    now: () => new Date(now * 1000),
    store: new MemoryWebhookStore(),
  });
  assert.equal((await handler(signedRequest(secret, now - 301, recordingEvent()))).status, 401);
  const request = signedRequest(secret, now, recordingEvent());
  const raw = await request.text();
  assert.equal(
    (
      await handler(
        new Request(request.url, { method: "POST", body: `${raw} `, headers: request.headers }),
      )
    ).status,
    401,
  );
  const validation = await handler(
    signedRequest(secret, now, {
      event: "endpoint.url_validation",
      payload: { plainToken: "plain" },
    }),
  );
  assert.deepEqual(await validation.json(), {
    plainToken: "plain",
    encryptedToken: endpointValidationToken(secret, "plain"),
  });
});

test("webhook allowlist isolates the Spanish meeting and detects replay conflicts", async () => {
  const secret = "webhook-secret";
  const now = 1_800_000_000;
  const store = new MemoryWebhookStore();
  const handler = createWebhookHandler({
    webhookSecret: secret,
    now: () => new Date(now * 1000),
    store,
  });
  const ignored = await handler(signedRequest(secret, now, recordingEvent("english", 700)));
  assert.deepEqual(await ignored.json(), { ok: true, ignored: true });
  assert.equal(store.claims, 0);
  assert.equal((await handler(signedRequest(secret, now, recordingEvent()))).status, 200);
  assert.deepEqual(await (await handler(signedRequest(secret, now, recordingEvent()))).json(), {
    ok: true,
    replay: true,
  });
  assert.equal(
    (await handler(signedRequest(secret, now, { ...recordingEvent(), event: "meeting.ended" })))
      .status,
    409,
  );
  assert.equal(store.recordings.length, 1);
  assert.equal(store.recordings[0]?.shareUrl, "https://zoom.example/rec/share-private");
  assert.equal(store.recordings[0]?.playPasscode, "CodigoPrivado123");
});

test("concurrent same-event delivery is retryable instead of falsely acknowledged", async () => {
  const secret = "webhook-secret";
  const now = 1_800_000_000;
  const store = new MemoryWebhookStore();
  let release!: () => void;
  let entered!: () => void;
  const processing = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  store.ingestRecordingCompleted = async (recording) => {
    entered();
    await processing;
    store.recordings.push(recording);
  };
  const handler = createWebhookHandler({
    webhookSecret: secret,
    now: () => new Date(now * 1000),
    store,
  });
  const event = recordingEvent("concurrent", 456);
  const first = handler(signedRequest(secret, now, event));
  await started;
  const overlapping = await handler(signedRequest(secret, now, event));
  assert.equal(overlapping.status, 503);
  release();
  assert.equal((await first).status, 200);
  assert.deepEqual(await (await handler(signedRequest(secret, now, event))).json(), {
    ok: true,
    replay: true,
  });
  assert.equal(store.recordings.length, 1);
});

test("failed webhook work releases the claim for provider retry", async () => {
  const secret = "webhook-secret";
  const now = 1_800_000_000;
  const store = new MemoryWebhookStore();
  let fail = true;
  store.ingestRecordingCompleted = async (recording) => {
    if (fail) {
      fail = false;
      throw new Error("temporary");
    }
    store.recordings.push(recording);
  };
  const handler = createWebhookHandler({
    webhookSecret: secret,
    now: () => new Date(now * 1000),
    store,
  });
  const event = recordingEvent("retry", 456);
  assert.equal((await handler(signedRequest(secret, now, event))).status, 500);
  assert.equal((await handler(signedRequest(secret, now, event))).status, 200);
  assert.equal(store.recordings.length, 1);
});

test("recurring registration, reminders, and consented follow-ups are leased and authorization-gated", async () => {
  const store = new MemoryAutomationStore();
  const zoom = zoomMock();
  let reminders = 0;
  let followups = 0;
  const mailer: RegistrationMailer = {
    async sendConfirmation() {},
    async sendReminder() {
      reminders += 1;
    },
    async sendFollowup() {
      followups += 1;
    },
  };
  const auto = await autoRegisterRecurring({ occurrenceId: "occ-1", store, zoom, mailer });
  assert.deepEqual(auto, { attempted: 1, registered: 1, alreadyRegistered: 0, failed: 0 });
  const reminder = await sendDueReminders({ now: new Date("2026-07-27T12:00:00Z"), store, mailer });
  assert.equal(reminder.sent, 1);
  assert.equal(reminders, 1);
  assert.deepEqual(store.completedReminders, ["r-reminder"]);
  const followup = await sendDueFollowups({ now: new Date("2026-07-28T12:00:00Z"), store, mailer });
  assert.equal(followup.sent, 1);
  assert.equal(followups, 1);
  assert.deepEqual(store.completedFollowups, ["q-1"]);
  const handler = createAutomationHandler({
    automationSecret: "secret",
    now: () => new Date(),
    store,
    zoom,
    mailer,
  });
  assert.equal(
    (await handler(new Request("https://example.test", { method: "POST", body: "{}" }))).status,
    401,
  );
});

test("admin role result is fail-closed and recording access only allows active/unexpired members", () => {
  assert.doesNotThrow(() => assertAdminRoleResult({ role: "admin" }, null));
  assert.throws(() => assertAdminRoleResult({ role: "user" }, null), /Forbidden/);
  assert.throws(
    () => assertAdminRoleResult(null, { message: "database unavailable" }),
    /database unavailable/,
  );
  const now = "2026-07-20T12:00:00.000Z";
  assert.equal(
    membershipAllowsRecordingAccess([{ status: "active", access_ends_at: null }], now),
    true,
  );
  assert.equal(
    membershipAllowsRecordingAccess(
      [{ status: "active", access_ends_at: "2026-07-19T00:00:00.000Z" }],
      now,
    ),
    false,
  );
  assert.equal(
    membershipAllowsRecordingAccess(
      [{ status: "cancelled", access_ends_at: "2026-07-21T00:00:00.000Z" }],
      now,
    ),
    true,
  );
  assert.equal(
    membershipAllowsRecordingAccess(
      [{ status: "cancelled", access_ends_at: "2026-07-19T00:00:00.000Z" }],
      now,
    ),
    false,
  );
});

test("migration defaults recordings private and architecture explicitly preserves dual meetings", () => {
  const migration = fs.readFileSync(
    new URL("../supabase/migrations/20260720053312_zoom_lifecycle_parity.sql", import.meta.url),
    "utf8",
  );
  const hardeningMigration = fs.readFileSync(
    new URL(
      "../supabase/migrations/20260720061324_harden_zoom_webhook_replay_and_reminders.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const workflow = fs.readFileSync(
    new URL("../.github/workflows/ayuda-zoom-automation.yml", import.meta.url),
    "utf8",
  );
  const report = fs.readFileSync(
    new URL("../docs/zoom-parity-implementation.md", import.meta.url),
    "utf8",
  );
  assert.match(migration, /published boolean NOT NULL DEFAULT false/);
  assert.match(migration, /ayuda_sobria_la_sobremesa_es_8pm/);
  assert.match(hardeningMigration, /provider_play_passcode text/);
  assert.match(hardeningMigration, /public_play_passcode text/);
  assert.match(
    hardeningMigration,
    /REVOKE ALL ON TABLE public\.user_roles FROM PUBLIC, anon, authenticated/,
  );
  assert.match(hardeningMigration, /lease_id uuid/);
  assert.match(
    hardeningMigration,
    /complete_zoom_webhook_event\(_series_key text, _event_id text, _lease_id uuid\)/,
  );
  assert.match(workflow, /cron: "23 \* \* \* \*"/);
  assert.match(workflow, /\/api\/zoom\/schedule/);
  assert.match(workflow, /auto-register/);
  assert.match(report, /7:00 PM/);
  assert.match(report, /8:00 PM/);
  assert.notEqual(AYUDA_ZOOM_SERIES_KEY, "soberhelpline_family_squares_en_7pm");
});
