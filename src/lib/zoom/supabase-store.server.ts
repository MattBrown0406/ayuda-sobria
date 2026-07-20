import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";
import {
  AYUDA_ZOOM_SERIES_KEY,
  type AutomationStore,
  type Occurrence,
  type RegistrationInput,
  type RegistrationRecord,
  type ScheduleStore,
  type RegistrationStore,
  type WebhookStore,
  type ZoomMeeting,
  type ZoomRegistrant,
  type ZoomRecordingCompleted,
} from "./types.ts";

// The zoom_* tables are managed outside the generated Database type, so this
// store uses an untyped SupabaseClient. It is imported only by server routes.
type Client = SupabaseClient<any, any, any>;

function occurrence(row: Record<string, unknown>): Occurrence {
  return {
    id: String(row.id),
    seriesKey: String(row.series_key),
    occurrenceDate: String(row.occurrence_date),
    startsAt: String(row.starts_at),
    status: row.status as Occurrence["status"],
    zoomMeetingId: row.zoom_meeting_id ? String(row.zoom_meeting_id) : null,
    joinUrl: row.join_url ? String(row.join_url) : null,
  };
}

function registration(row: Record<string, unknown>): RegistrationRecord {
  return {
    id: String(row.id),
    occurrenceId: String(row.occurrence_id),
    status: row.zoom_registration_status as RegistrationRecord["status"],
    zoomRegistrantId: row.zoom_registrant_id ? String(row.zoom_registrant_id) : null,
    zoomJoinUrl: row.zoom_join_url ? String(row.zoom_join_url) : null,
    confirmationEmailStatus:
      row.confirmation_email_status as RegistrationRecord["confirmationEmailStatus"],
  };
}

function unwrapRpc(data: Json | null): { claimed: boolean; value: Record<string, unknown> } {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid database claim response");
  const value = data.value;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid database claim value");
  return { claimed: data.claimed === true, value: value as Record<string, unknown> };
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createSupabaseZoomStore(
  client: Client,
): ScheduleStore & AutomationStore & WebhookStore {
  return {
    async claimOccurrence(seriesKey, occurrenceDate, startsAt) {
      const { data, error } = await client.rpc("claim_zoom_occurrence", {
        _series_key: seriesKey,
        _occurrence_date: occurrenceDate,
        _starts_at: startsAt,
      });
      assertNoError(error);
      const result = unwrapRpc(data);
      return { claimed: result.claimed, value: occurrence(result.value) };
    },

    async completeOccurrence(id: string, meeting: ZoomMeeting) {
      const { data, error } = await client
        .from("zoom_occurrences")
        .update({
          status: "ready",
          zoom_meeting_id: meeting.id,
          join_url: meeting.joinUrl,
          start_url: meeting.startUrl ?? null,
          failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("status", "scheduling")
        .select()
        .single();
      assertNoError(error);
      return occurrence(data as unknown as Record<string, unknown>);
    },

    async failOccurrence(id, reason) {
      const { error } = await client
        .from("zoom_occurrences")
        .update({
          status: "failed",
          failure_reason: reason,
          start_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("status", "scheduling");
      assertNoError(error);
    },

    async getReadyOccurrence(id) {
      const { data, error } = await client
        .from("zoom_occurrences")
        .select("*")
        .eq("id", id)
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .in("status", ["ready", "started"])
        .maybeSingle();
      assertNoError(error);
      return data ? occurrence(data as unknown as Record<string, unknown>) : null;
    },

    async getUpcomingReadyOccurrence(now) {
      const grace = new Date(new Date(now).getTime() - 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await client
        .from("zoom_occurrences")
        .select("*")
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .in("status", ["ready", "started"])
        .gte("starts_at", grace)
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      assertNoError(error);
      return data ? occurrence(data as unknown as Record<string, unknown>) : null;
    },

    async claimRegistration(input: RegistrationInput) {
      const { data, error } = await client.rpc("claim_zoom_registration", {
        _occurrence_id: input.occurrenceId,
        _full_name: input.fullName,
        _email: input.email,
        _phone: input.phone ?? null,
        _location: input.location ?? null,
        _relationship: input.relationship ?? null,
        _situation: input.situation ?? null,
        _submitted_question: input.question ?? null,
        _auto_register: input.autoRegister,
        _request_follow_up: input.requestFollowUp,
        _preferred_contact_date: input.preferredContactDate ?? null,
        _preferred_contact_time: input.preferredContactTime ?? null,
        _preferred_timezone: input.preferredTimezone ?? null,
        _consent_confidentiality: input.consentConfidentiality,
        _consent_updates: input.consentUpdates,
      });
      assertNoError(error);
      const result = unwrapRpc(data);
      return { claimed: result.claimed, value: registration(result.value) };
    },

    async completeRegistration(id: string, registrant: ZoomRegistrant) {
      const { data, error } = await client
        .from("meeting_registrations")
        .update({
          zoom_registration_status: "registered",
          zoom_registrant_id: registrant.id,
          zoom_join_url: registrant.joinUrl,
          zoom_failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("zoom_registration_status", "registering")
        .select()
        .single();
      assertNoError(error);
      return registration(data as unknown as Record<string, unknown>);
    },

    async failRegistration(id, reason) {
      const { error } = await client
        .from("meeting_registrations")
        .update({
          zoom_registration_status: "failed",
          zoom_failure_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("zoom_registration_status", "registering");
      assertNoError(error);
    },

    async completeConfirmationEmail(id) {
      const { error } = await client
        .from("meeting_registrations")
        .update({
          confirmation_email_status: "sent",
          confirmation_email_error: null,
          confirmation_email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      assertNoError(error);
    },

    async failConfirmationEmail(id, reason) {
      const { error } = await client
        .from("meeting_registrations")
        .update({
          confirmation_email_status: "failed",
          confirmation_email_error: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      assertNoError(error);
    },

    async isManagedMeeting(meetingId) {
      const { data, error } = await client
        .from("zoom_occurrences")
        .select("id")
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("zoom_meeting_id", meetingId)
        .maybeSingle();
      assertNoError(error);
      return Boolean(data);
    },

    async claimWebhookEvent(seriesKey, eventId, eventType, occurredAt, payloadHash) {
      const { data, error } = await client.rpc("claim_zoom_webhook_event", {
        _series_key: seriesKey,
        _event_id: eventId,
        _event_type: eventType,
        _occurred_at: occurredAt,
        _payload_hash: payloadHash,
      });
      assertNoError(error);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid webhook claim response");
      }
      const status = "status" in data && typeof data.status === "string" ? data.status : "";
      if (status === "claimed") {
        const leaseId = "leaseId" in data && typeof data.leaseId === "string" ? data.leaseId : "";
        if (!leaseId) throw new Error("Webhook claim omitted lease token");
        return { status, leaseId } as const;
      }
      if (status === "replay" || status === "conflict" || status === "busy") {
        return { status } as const;
      }
      throw new Error("Invalid webhook claim response");
    },

    async completeWebhookEvent(seriesKey, eventId, leaseId) {
      const { data, error } = await client.rpc("complete_zoom_webhook_event", {
        _series_key: seriesKey,
        _event_id: eventId,
        _lease_id: leaseId,
      });
      assertNoError(error);
      if (!data) throw new Error("Webhook lease was lost before completion");
    },

    async releaseWebhookEvent(seriesKey, eventId, leaseId) {
      const { error } = await client.rpc("release_zoom_webhook_event", {
        _series_key: seriesKey,
        _event_id: eventId,
        _lease_id: leaseId,
      });
      assertNoError(error);
    },

    async markMeetingStarted(meetingId) {
      const { error } = await client
        .from("zoom_occurrences")
        .update({
          status: "started",
          updated_at: new Date().toISOString(),
        })
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("zoom_meeting_id", meetingId)
        .eq("status", "ready");
      assertNoError(error);
    },

    async markMeetingEnded(meetingId, endedAt) {
      const { error } = await client
        .from("zoom_occurrences")
        .update({
          status: "ended",
          ended_at: endedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("zoom_meeting_id", meetingId)
        .in("status", ["ready", "started"]);
      assertNoError(error);
    },

    async recordParticipantJoined(event) {
      const { data: occurrenceRow, error: occurrenceError } = await client
        .from("zoom_occurrences")
        .select("id")
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("zoom_meeting_id", event.meetingId)
        .single();
      assertNoError(occurrenceError);
      if (!occurrenceRow) throw new Error("Managed occurrence not found");
      const { error } = await client.from("zoom_attendance").upsert(
        {
          occurrence_id: occurrenceRow.id,
          participant_key: event.participantKey,
          participant_name: event.participantName,
          participant_email: event.participantEmail,
          joined_at: event.joinedAt,
          left_at: null,
          duration_seconds: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "occurrence_id,participant_key,joined_at" },
      );
      assertNoError(error);
    },

    async recordParticipantLeft(event) {
      const { data: occurrenceRow, error: occurrenceError } = await client
        .from("zoom_occurrences")
        .select("id")
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("zoom_meeting_id", event.meetingId)
        .single();
      assertNoError(occurrenceError);
      if (!occurrenceRow) throw new Error("Managed occurrence not found");
      const { error } = await client.from("zoom_attendance").upsert(
        {
          occurrence_id: occurrenceRow.id,
          participant_key: event.participantKey,
          participant_name: event.participantName,
          participant_email: event.participantEmail,
          joined_at: event.joinedAt,
          left_at: event.leftAt,
          duration_seconds: event.durationSeconds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "occurrence_id,participant_key,joined_at" },
      );
      assertNoError(error);
    },

    async ingestRecordingCompleted(recording: ZoomRecordingCompleted) {
      const { data: occurrenceRow, error: occurrenceError } = await client
        .from("zoom_occurrences")
        .select("id")
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .eq("zoom_meeting_id", recording.meetingId)
        .single();
      assertNoError(occurrenceError);
      if (!occurrenceRow) throw new Error("Managed occurrence not found");
      const { data, error } = await client
        .from("zoom_recordings")
        .upsert(
          {
            occurrence_id: occurrenceRow.id,
            zoom_meeting_id: recording.meetingId,
            zoom_meeting_uuid: recording.meetingUuid,
            topic: recording.topic,
            started_at: recording.startedAt,
            recording_start: recording.recordingStart,
            recording_end: recording.recordingEnd,
            duration_minutes: recording.durationMinutes,
            provider_share_url: recording.shareUrl,
            provider_play_passcode: recording.playPasscode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "zoom_meeting_uuid" },
        )
        .select("id")
        .single();
      assertNoError(error);
      if (!data) throw new Error("Recording upsert returned no row");
      if (recording.files.length) {
        const { error: filesError } = await client.from("zoom_recording_files").upsert(
          recording.files.map((file) => ({
            recording_id: data.id,
            zoom_file_id: file.id,
            file_type: file.fileType,
            file_extension: file.fileExtension,
            file_size: file.fileSize,
            play_url: file.playUrl,
            download_url: file.downloadUrl,
            status: file.status,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "zoom_file_id" },
        );
        assertNoError(filesError);
      }
    },

    async listRecurringRegistrants(occurrenceId: string) {
      const { data, error } = await client
        .from("meeting_registrations")
        .select(
          "full_name,email,phone,location,relationship,consent_updates,auto_register,occurrence_id,created_at",
        )
        .neq("occurrence_id", occurrenceId)
        .order("created_at", { ascending: false })
        .limit(5000);
      assertNoError(error);
      const seen = new Set<string>();
      return (data ?? []).flatMap((row: any) => {
        const email = row.email.trim().toLowerCase();
        if (!email || seen.has(email)) return [];
        seen.add(email);
        if (!row.auto_register) return [];
        return [
          {
            fullName: row.full_name,
            email,
            phone: row.phone ?? undefined,
            location: row.location ?? undefined,
            relationship: row.relationship ?? undefined,
            consentUpdates: row.consent_updates,
          },
        ];
      });
    },

    async claimDueReminders(now: string, horizon: string, limit: number) {
      const { data, error } = await client.rpc("claim_zoom_reminders", {
        _now: now,
        _horizon: horizon,
        _limit: limit,
      });
      assertNoError(error);
      const rows = data ?? [];
      const ids = [
        ...new Set(rows.flatMap((row: any) => (row.occurrence_id ? [row.occurrence_id] : []))),
      ];
      if (!ids.length) return [];
      const { data: occurrences, error: occurrenceError } = await client
        .from("zoom_occurrences")
        .select("*")
        .eq("series_key", AYUDA_ZOOM_SERIES_KEY)
        .in("id", ids);
      assertNoError(occurrenceError);
      const byId = new Map(
        (occurrences ?? []).map((row: any) => [
          row.id,
          occurrence(row as unknown as Record<string, unknown>),
        ]),
      );
      return rows.flatMap((row: any) => {
        const item = row.occurrence_id ? byId.get(row.occurrence_id) : undefined;
        return item && row.zoom_join_url
          ? [
              {
                registrationId: row.id,
                fullName: row.full_name,
                email: row.email,
                joinUrl: row.zoom_join_url,
                occurrence: item,
              },
            ]
          : [];
      });
    },

    async completeReminder(registrationId: string) {
      const { error } = await client
        .from("meeting_registrations")
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_claimed_at: null,
          reminder_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", registrationId)
        .is("reminder_sent_at", null);
      assertNoError(error);
    },

    async failReminder(registrationId: string, reason: string) {
      const { error } = await client
        .from("meeting_registrations")
        .update({
          reminder_claimed_at: null,
          reminder_error: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", registrationId)
        .is("reminder_sent_at", null);
      assertNoError(error);
    },

    async claimDueFollowups(now: string, limit: number) {
      const { data, error } = await client.rpc("claim_zoom_followups", {
        _now: now,
        _limit: limit,
      });
      assertNoError(error);
      const rows = data ?? [];
      const registrationIds = [...new Set(rows.map((row: any) => row.registration_id))];
      if (!registrationIds.length) return [];
      const { data: registrations, error: registrationError } = await client
        .from("meeting_registrations")
        .select("id,full_name,email")
        .in("id", registrationIds);
      assertNoError(registrationError);
      const byId = new Map((registrations ?? []).map((row: any) => [row.id, row]));
      return rows.flatMap((row: any) => {
        const registrant = byId.get(row.registration_id);
        return registrant
          ? [
              {
                queueId: row.id,
                registrationId: row.registration_id,
                fullName: registrant.full_name,
                email: registrant.email,
                sequenceStep: row.sequence_step,
              },
            ]
          : [];
      });
    },

    async completeFollowup(queueId: string) {
      const { error } = await client
        .from("zoom_followup_queue")
        .update({
          sent_at: new Date().toISOString(),
          claimed_at: null,
          error_message: null,
        })
        .eq("id", queueId)
        .is("sent_at", null);
      assertNoError(error);
    },

    async failFollowup(queueId: string, reason: string) {
      const { error } = await client
        .from("zoom_followup_queue")
        .update({
          claimed_at: null,
          error_message: reason,
        })
        .eq("id", queueId)
        .is("sent_at", null);
      assertNoError(error);
    },
  };
}
