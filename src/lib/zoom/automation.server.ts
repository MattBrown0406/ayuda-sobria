import { verifyAutomationAuthorization } from "./security.ts";
import type { AutomationStore, RegistrationMailer, ZoomApi } from "./types.ts";
import { registerForOccurrence } from "./registration.server.ts";

export async function autoRegisterRecurring(input: {
  occurrenceId: string;
  store: AutomationStore;
  zoom: ZoomApi;
  mailer?: RegistrationMailer;
}) {
  const recurring = await input.store.listRecurringRegistrants(input.occurrenceId);
  const results = { attempted: recurring.length, registered: 0, alreadyRegistered: 0, failed: 0 };
  for (const person of recurring) {
    try {
      const result = await registerForOccurrence({
        registration: {
          occurrenceId: input.occurrenceId,
          fullName: person.fullName,
          email: person.email,
          phone: person.phone,
          location: person.location,
          relationship: person.relationship,
          autoRegister: true,
          requestFollowUp: false,
          consentConfidentiality: true,
          consentUpdates: person.consentUpdates,
        },
        store: input.store,
        zoom: input.zoom,
        mailer: input.mailer,
      });
      if (result.created || result.recovered) results.registered += 1;
      else results.alreadyRegistered += 1;
    } catch {
      results.failed += 1;
    }
  }
  return results;
}

export async function sendDueReminders(input: {
  now: Date;
  horizonHours?: number;
  store: AutomationStore;
  mailer: RegistrationMailer;
}) {
  const horizon = new Date(input.now.getTime() + (input.horizonHours ?? 24) * 60 * 60 * 1000);
  const claimed = await input.store.claimDueReminders(
    input.now.toISOString(),
    horizon.toISOString(),
    100,
  );
  const results = { claimed: claimed.length, sent: 0, failed: 0 };
  for (const reminder of claimed) {
    try {
      await input.mailer.sendReminder(reminder);
      await input.store.completeReminder(reminder.registrationId);
      results.sent += 1;
    } catch (error) {
      await input.store.failReminder(
        reminder.registrationId,
        error instanceof Error ? error.message.slice(0, 500) : "Reminder delivery failed",
      );
      results.failed += 1;
    }
  }
  return results;
}

export async function sendDueFollowups(input: {
  now: Date;
  store: AutomationStore;
  mailer: RegistrationMailer;
}) {
  const claimed = await input.store.claimDueFollowups(input.now.toISOString(), 25);
  const results = { claimed: claimed.length, sent: 0, failed: 0 };
  for (const followup of claimed) {
    try {
      await input.mailer.sendFollowup(followup);
      await input.store.completeFollowup(followup.queueId);
      results.sent += 1;
    } catch (error) {
      await input.store.failFollowup(
        followup.queueId,
        error instanceof Error ? error.message.slice(0, 500) : "Follow-up delivery failed",
      );
      results.failed += 1;
    }
  }
  return results;
}

export function createAutomationHandler(deps: {
  automationSecret: string;
  now: () => Date;
  store: AutomationStore;
  zoom: ZoomApi;
  mailer?: RegistrationMailer;
}) {
  return async (request: Request): Promise<Response> => {
    if (
      !verifyAutomationAuthorization(request.headers.get("authorization"), deps.automationSecret)
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    let body: { action?: string; occurrenceId?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    if (body.action === "auto-register" && body.occurrenceId) {
      const results = await autoRegisterRecurring({
        occurrenceId: body.occurrenceId,
        store: deps.store,
        zoom: deps.zoom,
        mailer: deps.mailer,
      });
      return Response.json(
        { ok: results.failed === 0, results },
        { status: results.failed === 0 ? 200 : 503 },
      );
    }
    if (body.action === "reminders") {
      if (!deps.mailer) return Response.json({ error: "Email is not configured" }, { status: 503 });
      const results = await sendDueReminders({
        now: deps.now(),
        store: deps.store,
        mailer: deps.mailer,
      });
      return Response.json(
        { ok: results.failed === 0, results },
        { status: results.failed === 0 ? 200 : 503 },
      );
    }
    if (body.action === "followups") {
      if (!deps.mailer) return Response.json({ error: "Email is not configured" }, { status: 503 });
      const results = await sendDueFollowups({
        now: deps.now(),
        store: deps.store,
        mailer: deps.mailer,
      });
      return Response.json(
        { ok: results.failed === 0, results },
        { status: results.failed === 0 ? 200 : 503 },
      );
    }
    return Response.json({ error: "Unsupported action" }, { status: 400 });
  };
}
