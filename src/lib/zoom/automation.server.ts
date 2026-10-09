import { verifyAutomationAuthorization } from "./security.ts";
import type { AutomationStore, RegistrationMailer, ScheduleStore, ZoomApi } from "./types.ts";
import { registerForOccurrence } from "./registration.server.ts";
import { scheduleNextMonday } from "./schedule.server.ts";
import { weeklyAutomationPlan, type WeeklyAutomationPlan } from "./time.ts";

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
          preferredTimezone: person.preferredTimezone,
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
        // Weekly re-registrations send the attendee their new personal link but do
        // not notify the admin: only brand-new sign-ups from the form do that.
        source: "automatic",
      });
      if (!result.emailSent) {
        results.failed += 1;
        continue;
      }
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
    // Per-item failures are recorded in the store and retried on the next run.
    // They must return 200: the hourly workflow runs auto-register, reminders
    // and followups sequentially with `set -e`, so a 503 here would starve the
    // later actions for everyone because of one permanently-failing item.
    if (body.action === "auto-register") {
      // Without this the request fell through to "Unsupported action", which
      // hides a scheduler that failed to resolve the occurrence id.
      if (!body.occurrenceId) {
        return Response.json({ error: "occurrenceId is required" }, { status: 400 });
      }
      const results = await autoRegisterRecurring({
        occurrenceId: body.occurrenceId,
        store: deps.store,
        zoom: deps.zoom,
        mailer: deps.mailer,
      });
      return Response.json({ ok: results.failed === 0, results });
    }
    if (body.action === "reminders") {
      if (!deps.mailer) return Response.json({ error: "Email is not configured" }, { status: 503 });
      const results = await sendDueReminders({
        now: deps.now(),
        store: deps.store,
        mailer: deps.mailer,
      });
      return Response.json({ ok: results.failed === 0, results });
    }
    if (body.action === "followups") {
      if (!deps.mailer) return Response.json({ error: "Email is not configured" }, { status: 503 });
      const results = await sendDueFollowups({
        now: deps.now(),
        store: deps.store,
        mailer: deps.mailer,
      });
      return Response.json({ ok: results.failed === 0, results });
    }
    return Response.json({ error: "Unsupported action" }, { status: 400 });
  };
}

export interface WeeklyTickSummary {
  ranAt: string;
  ok: boolean;
  plan: WeeklyAutomationPlan;
  meeting?: { occurrenceDate: string; startsAt: string; created: boolean; recovered: boolean };
  autoRegister?: Awaited<ReturnType<typeof autoRegisterRecurring>>;
  reminders?: Awaited<ReturnType<typeof sendDueReminders>>;
  followups?: Awaited<ReturnType<typeof sendDueFollowups>>;
  weeklyReport?: unknown;
  appMembers?: unknown;
  errors: string[];
}

function errorText(step: string, error: unknown) {
  return `${step}: ${error instanceof Error ? error.message.slice(0, 300) : String(error)}`;
}

/**
 * One pass of the weekly La Sobremesa lifecycle. The database cron calls this every
 * 15 minutes; weeklyAutomationPlan decides what is due at this Pacific time. Each
 * step is idempotent and isolated, so one failing step never starves the others and
 * the next tick retries whatever failed.
 */
export async function runWeeklyTick(input: {
  now: Date;
  store: ScheduleStore & AutomationStore;
  zoom: ZoomApi;
  mailer?: RegistrationMailer;
  weeklyReport?: (now: Date) => Promise<unknown>;
  appMemberSync?: (now: Date) => Promise<unknown>;
}): Promise<WeeklyTickSummary> {
  const plan = weeklyAutomationPlan(input.now);
  const summary: WeeklyTickSummary = {
    ranAt: input.now.toISOString(),
    ok: true,
    plan,
    errors: [],
  };
  let occurrenceId: string | null = null;
  if (plan.schedule) {
    try {
      const result = await scheduleNextMonday({
        now: input.now,
        store: input.store,
        zoom: input.zoom,
      });
      occurrenceId = result.occurrence.id;
      summary.meeting = {
        occurrenceDate: result.occurrence.occurrenceDate,
        startsAt: result.occurrence.startsAt,
        created: result.created,
        recovered: result.recovered,
      };
    } catch (error) {
      summary.errors.push(errorText("schedule", error));
    }
  }
  if (plan.autoRegister && occurrenceId) {
    try {
      summary.autoRegister = await autoRegisterRecurring({
        occurrenceId,
        store: input.store,
        zoom: input.zoom,
        mailer: input.mailer,
      });
      if (summary.autoRegister.failed) {
        summary.errors.push(`auto-register: ${summary.autoRegister.failed} failed`);
      }
    } catch (error) {
      summary.errors.push(errorText("auto-register", error));
    }
  }
  if (input.mailer) {
    if (plan.reminders) {
      try {
        summary.reminders = await sendDueReminders({
          now: input.now,
          store: input.store,
          mailer: input.mailer,
        });
        if (summary.reminders.failed) {
          summary.errors.push(`reminders: ${summary.reminders.failed} failed`);
        }
      } catch (error) {
        summary.errors.push(errorText("reminders", error));
      }
    }
    try {
      summary.followups = await sendDueFollowups({
        now: input.now,
        store: input.store,
        mailer: input.mailer,
      });
      if (summary.followups.failed) {
        summary.errors.push(`followups: ${summary.followups.failed} failed`);
      }
    } catch (error) {
      summary.errors.push(errorText("followups", error));
    }
  } else if (plan.reminders || plan.autoRegister) {
    summary.errors.push("email: RESEND_API_KEY / LOVABLE_API_KEY are not configured");
  }
  if (plan.weeklyReport && input.weeklyReport) {
    try {
      summary.weeklyReport = await input.weeklyReport(input.now);
    } catch (error) {
      summary.errors.push(errorText("weekly-report", error));
    }
  }
  if (plan.appMembers && input.appMemberSync) {
    try {
      summary.appMembers = await input.appMemberSync(input.now);
    } catch (error) {
      summary.errors.push(errorText("app-members", error));
    }
  }
  summary.ok = summary.errors.length === 0;
  return summary;
}
