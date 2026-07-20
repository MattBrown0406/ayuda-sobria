import { endpointValidationToken, sha256, verifyZoomWebhookSignature } from "./security.ts";
import {
  AYUDA_ZOOM_SERIES_KEY,
  type WebhookStore,
  type ZoomParticipantEvent,
  type ZoomRecordingCompleted,
} from "./types.ts";

function text(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}
function nullableText(value: unknown): string | null {
  const result = text(value);
  return result || null;
}
function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function payloadObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") throw new Error("INVALID_PAYLOAD");
  const object = (payload as Record<string, unknown>).object;
  if (!object || typeof object !== "object") throw new Error("INVALID_PAYLOAD");
  return object as Record<string, unknown>;
}

export function meetingIdFromPayload(payload: unknown): string {
  return text(payloadObject(payload).id);
}

export function parseRecordingCompleted(value: unknown): ZoomRecordingCompleted {
  const meeting = payloadObject(value);
  const meetingId = text(meeting.id);
  const meetingUuid = text(meeting.uuid);
  const startedAt = text(meeting.start_time);
  if (!meetingId || !meetingUuid || !startedAt || Number.isNaN(Date.parse(startedAt))) {
    throw new Error("INVALID_RECORDING");
  }
  const rawFiles = Array.isArray(meeting.recording_files) ? meeting.recording_files : [];
  return {
    meetingId,
    meetingUuid,
    topic: text(meeting.topic).slice(0, 500),
    startedAt,
    recordingStart: nullableText(meeting.recording_start),
    recordingEnd: nullableText(meeting.recording_end),
    durationMinutes: nullableNumber(meeting.duration),
    shareUrl: nullableText(meeting.share_url),
    playPasscode: nullableText(meeting.recording_play_passcode)?.slice(0, 128) ?? null,
    files: rawFiles.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const file = item as Record<string, unknown>;
      const id = text(file.id);
      if (!id) return [];
      return [
        {
          id,
          fileType: nullableText(file.file_type),
          fileExtension: nullableText(file.file_extension),
          fileSize: nullableNumber(file.file_size),
          playUrl: nullableText(file.play_url),
          downloadUrl: nullableText(file.download_url),
          status: nullableText(file.status),
        },
      ];
    }),
  };
}

export function parseParticipantEvent(value: unknown, leaving: boolean): ZoomParticipantEvent {
  const meeting = payloadObject(value);
  const participantValue = meeting.participant;
  if (!participantValue || typeof participantValue !== "object")
    throw new Error("INVALID_PARTICIPANT");
  const participant = participantValue as Record<string, unknown>;
  const meetingId = text(meeting.id);
  const participantName = text(participant.user_name).slice(0, 255);
  const participantKey = (
    text(participant.id) ||
    text(participant.user_id) ||
    text(participant.email) ||
    participantName
  ).slice(0, 255);
  const joinedAt = text(participant.join_time);
  if (
    !meetingId ||
    !participantName ||
    !participantKey ||
    !joinedAt ||
    Number.isNaN(Date.parse(joinedAt))
  ) {
    throw new Error("INVALID_PARTICIPANT");
  }
  return {
    meetingId,
    participantKey,
    participantName,
    participantEmail: nullableText(participant.email),
    joinedAt,
    leftAt: leaving ? nullableText(participant.leave_time) : null,
    durationSeconds:
      leaving && typeof participant.duration === "number"
        ? Math.max(0, Math.round(participant.duration))
        : 0,
  };
}

export function createWebhookHandler(deps: {
  webhookSecret: string;
  store: WebhookStore;
  now: () => Date;
}) {
  return async (request: Request): Promise<Response> => {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 1_048_576) {
      return Response.json({ error: "Payload too large" }, { status: 413 });
    }
    const timestamp = request.headers.get("x-zm-request-timestamp");
    if (
      !verifyZoomWebhookSignature({
        secret: deps.webhookSecret,
        timestamp,
        signature: request.headers.get("x-zm-signature"),
        rawBody,
        nowMs: deps.now().getTime(),
      })
    )
      return Response.json({ error: "Invalid signature" }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    const eventType = text(body.event);
    const payload = body.payload;
    if (eventType === "endpoint.url_validation") {
      const validationPayload =
        payload && typeof payload === "object" ? (payload as Record<string, unknown>) : undefined;
      const plainToken = text(validationPayload?.plainToken);
      if (!plainToken)
        return Response.json({ error: "Invalid validation payload" }, { status: 400 });
      return Response.json({
        plainToken,
        encryptedToken: endpointValidationToken(deps.webhookSecret, plainToken),
      });
    }

    let meetingId: string;
    try {
      meetingId = meetingIdFromPayload(payload);
    } catch {
      return Response.json({ error: "Missing meeting identity" }, { status: 400 });
    }
    if (!meetingId) return Response.json({ error: "Missing meeting identity" }, { status: 400 });

    // A Zoom account subscription can deliver both Monday meetings. Ignore every
    // meeting not created for AyudaSobria before persisting event or participant data.
    if (!(await deps.store.isManagedMeeting(meetingId))) {
      return Response.json({ ok: true, ignored: true });
    }

    const eventId = text(body.event_id) || request.headers.get("x-zm-trackingid") || "";
    if (!eventId || !eventType || !timestamp) {
      return Response.json({ error: "Missing event identity" }, { status: 400 });
    }
    const claimed = await deps.store.claimWebhookEvent(
      AYUDA_ZOOM_SERIES_KEY,
      eventId.slice(0, 255),
      eventType.slice(0, 255),
      new Date(Number(timestamp) * 1000).toISOString(),
      sha256(rawBody),
    );
    if (claimed.status === "replay") return Response.json({ ok: true, replay: true });
    if (claimed.status === "conflict")
      return Response.json({ error: "Event identity conflict" }, { status: 409 });
    if (claimed.status === "busy") {
      return Response.json({ error: "Event processing in progress" }, { status: 503 });
    }
    if (claimed.status !== "claimed" || !claimed.leaseId) {
      return Response.json({ error: "Invalid event lease" }, { status: 500 });
    }
    const leaseId = String(claimed.leaseId);

    try {
      if (eventType === "meeting.started") await deps.store.markMeetingStarted(meetingId);
      if (eventType === "meeting.ended") {
        const object = payloadObject(payload);
        await deps.store.markMeetingEnded(
          meetingId,
          text(object.end_time) || deps.now().toISOString(),
        );
      }
      if (eventType === "meeting.participant_joined") {
        await deps.store.recordParticipantJoined(parseParticipantEvent(payload, false));
      }
      if (eventType === "meeting.participant_left") {
        await deps.store.recordParticipantLeft(parseParticipantEvent(payload, true));
      }
      if (eventType === "recording.completed") {
        await deps.store.ingestRecordingCompleted(parseRecordingCompleted(payload));
      }
      await deps.store.completeWebhookEvent(AYUDA_ZOOM_SERIES_KEY, eventId.slice(0, 255), leaseId);
    } catch {
      await deps.store.releaseWebhookEvent(AYUDA_ZOOM_SERIES_KEY, eventId.slice(0, 255), leaseId);
      return Response.json({ error: "Webhook processing failed" }, { status: 500 });
    }
    return Response.json({ ok: true });
  };
}
