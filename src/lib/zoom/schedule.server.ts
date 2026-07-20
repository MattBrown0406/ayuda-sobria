import { nextMondayOccurrence, ZOOM_TIMEZONE } from "./time.ts";
import {
  AYUDA_ZOOM_SERIES_KEY,
  AYUDA_ZOOM_TOPIC,
  type ScheduleStore,
  type ZoomApi,
} from "./types.ts";
import { verifyAutomationAuthorization } from "./security.ts";

export async function scheduleNextMonday(input: {
  now: Date;
  store: ScheduleStore;
  zoom: ZoomApi;
}) {
  const timing = nextMondayOccurrence(input.now);
  const claim = await input.store.claimOccurrence(
    AYUDA_ZOOM_SERIES_KEY,
    timing.occurrenceDate,
    timing.startsAt,
  );
  if (!claim.claimed) {
    if (["ready", "started", "ended"].includes(claim.value.status)) {
      return { occurrence: claim.value, created: false, recovered: false };
    }
    throw new Error("OCCURRENCE_BUSY");
  }
  try {
    // Zoom has no create-meeting idempotency key. Recover an exact topic/time match
    // before creating so a database failure after provider success cannot duplicate it.
    const existing = await input.zoom.findMeeting({
      startTime: timing.startsAt,
      topic: AYUDA_ZOOM_TOPIC,
    });
    const meeting =
      existing ??
      (await input.zoom.createMeeting({
        startTime: timing.startsAt,
        timezone: ZOOM_TIMEZONE,
        topic: AYUDA_ZOOM_TOPIC,
      }));
    const occurrence = await input.store.completeOccurrence(claim.value.id, meeting);
    return { occurrence, created: !existing, recovered: Boolean(existing) };
  } catch (error) {
    await input.store.failOccurrence(
      claim.value.id,
      error instanceof Error ? error.message.slice(0, 500) : "Zoom scheduling failed",
    );
    throw error;
  }
}

export function createScheduleHandler(deps: {
  automationSecret: string;
  now: () => Date;
  store: ScheduleStore;
  zoom: ZoomApi;
}) {
  return async (request: Request): Promise<Response> => {
    if (
      !verifyAutomationAuthorization(request.headers.get("authorization"), deps.automationSecret)
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const result = await scheduleNextMonday({
        now: deps.now(),
        store: deps.store,
        zoom: deps.zoom,
      });
      return Response.json({
        ok: true,
        seriesKey: AYUDA_ZOOM_SERIES_KEY,
        created: result.created,
        recovered: result.recovered,
        occurrence: {
          id: result.occurrence.id,
          occurrenceDate: result.occurrence.occurrenceDate,
          startsAt: result.occurrence.startsAt,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "OCCURRENCE_BUSY") {
        return Response.json({ error: "Scheduling already in progress" }, { status: 409 });
      }
      return Response.json({ error: "Unable to schedule meeting" }, { status: 502 });
    }
  };
}
