export const AYUDA_ZOOM_SERIES_KEY = "ayuda_sobria_la_sobremesa_es_8pm";
export const AYUDA_ZOOM_TOPIC = "La Sobremesa — AyudaSobria — Español 8 PM Pacific";

export type ZoomOccurrenceStatus = "scheduling" | "ready" | "started" | "ended" | "failed";
export type ZoomRegistrationStatus = "registering" | "registered" | "failed";
export type DeliveryStatus = "pending" | "sent" | "failed";

export interface Occurrence {
  id: string;
  seriesKey: string;
  occurrenceDate: string;
  startsAt: string;
  status: ZoomOccurrenceStatus;
  zoomMeetingId: string | null;
  joinUrl: string | null;
}

export interface Claimed<T> {
  claimed: boolean;
  value: T;
}

export interface ScheduleStore {
  claimOccurrence(
    seriesKey: string,
    occurrenceDate: string,
    startsAt: string,
  ): Promise<Claimed<Occurrence>>;
  completeOccurrence(id: string, meeting: ZoomMeeting): Promise<Occurrence>;
  failOccurrence(id: string, reason: string): Promise<void>;
}

export interface ZoomMeeting {
  id: string;
  joinUrl: string;
  startUrl?: string;
  startTime?: string;
  topic?: string;
}

export interface ZoomRegistrant {
  id: string;
  joinUrl: string;
  email?: string;
}

export interface ZoomApi {
  findMeeting(input: { startTime: string; topic: string }): Promise<ZoomMeeting | null>;
  createMeeting(input: {
    startTime: string;
    timezone: string;
    topic: string;
  }): Promise<ZoomMeeting>;
  findRegistrant(meetingId: string, email: string): Promise<ZoomRegistrant | null>;
  addRegistrant(
    meetingId: string,
    input: { email: string; firstName: string; lastName?: string },
  ): Promise<ZoomRegistrant>;
  removeRegistrant(meetingId: string, registrantId: string): Promise<void>;
}

export interface RegistrationInput {
  occurrenceId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  relationship?: string;
  situation?: string;
  question?: string;
  autoRegister: boolean;
  requestFollowUp: boolean;
  preferredContactDate?: string;
  preferredContactTime?: string;
  preferredTimezone?: string;
  consentConfidentiality: boolean;
  consentUpdates: boolean;
}

export interface RegistrationRecord {
  id: string;
  occurrenceId: string;
  status: ZoomRegistrationStatus;
  zoomRegistrantId: string | null;
  zoomJoinUrl: string | null;
  confirmationEmailStatus: DeliveryStatus;
}

export interface RegistrationStore {
  getReadyOccurrence(id: string): Promise<Occurrence | null>;
  getUpcomingReadyOccurrence(now: string): Promise<Occurrence | null>;
  claimRegistration(input: RegistrationInput): Promise<Claimed<RegistrationRecord>>;
  completeRegistration(id: string, registrant: ZoomRegistrant): Promise<RegistrationRecord>;
  failRegistration(id: string, reason: string): Promise<void>;
  completeConfirmationEmail(id: string): Promise<void>;
  failConfirmationEmail(id: string, reason: string): Promise<void>;
}

export interface RegistrationMailer {
  sendConfirmation(input: {
    registrationId: string;
    fullName: string;
    email: string;
    occurrence: Occurrence;
    joinUrl: string;
  }): Promise<void>;
  sendReminder(input: ReminderDelivery): Promise<void>;
  sendFollowup(input: FollowupDelivery): Promise<void>;
}

export interface ZoomParticipantEvent {
  meetingId: string;
  participantKey: string;
  participantName: string;
  participantEmail: string | null;
  joinedAt: string;
  leftAt: string | null;
  durationSeconds: number;
}

export interface WebhookStore {
  isManagedMeeting(meetingId: string): Promise<boolean>;
  claimWebhookEvent(
    seriesKey: string,
    eventId: string,
    eventType: string,
    occurredAt: string,
    payloadHash: string,
  ): Promise<
    | { status: "claimed"; leaseId: string }
    | { status: "replay" | "conflict" | "busy"; leaseId?: never }
  >;
  completeWebhookEvent(seriesKey: string, eventId: string, leaseId: string): Promise<void>;
  releaseWebhookEvent(seriesKey: string, eventId: string, leaseId: string): Promise<void>;
  markMeetingStarted(meetingId: string): Promise<void>;
  markMeetingEnded(meetingId: string, endedAt: string): Promise<void>;
  recordParticipantJoined(event: ZoomParticipantEvent): Promise<void>;
  recordParticipantLeft(event: ZoomParticipantEvent): Promise<void>;
  ingestRecordingCompleted(payload: ZoomRecordingCompleted): Promise<void>;
}

export interface RecurringRegistrant {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  relationship?: string;
  consentUpdates: boolean;
}

export interface ReminderDelivery {
  registrationId: string;
  fullName: string;
  email: string;
  joinUrl: string;
  occurrence: Occurrence;
}

export interface FollowupDelivery {
  queueId: string;
  registrationId: string;
  fullName: string;
  email: string;
  sequenceStep: number;
}

export interface AutomationStore extends RegistrationStore {
  listRecurringRegistrants(occurrenceId: string): Promise<RecurringRegistrant[]>;
  claimDueReminders(now: string, horizon: string, limit: number): Promise<ReminderDelivery[]>;
  completeReminder(registrationId: string): Promise<void>;
  failReminder(registrationId: string, reason: string): Promise<void>;
  claimDueFollowups(now: string, limit: number): Promise<FollowupDelivery[]>;
  completeFollowup(queueId: string): Promise<void>;
  failFollowup(queueId: string, reason: string): Promise<void>;
}

export interface ZoomRecordingCompleted {
  meetingId: string;
  meetingUuid: string;
  topic: string;
  startedAt: string;
  recordingStart: string | null;
  recordingEnd: string | null;
  durationMinutes: number | null;
  shareUrl: string | null;
  playPasscode: string | null;
  files: Array<{
    id: string;
    fileType: string | null;
    fileExtension: string | null;
    fileSize: number | null;
    playUrl: string | null;
    downloadUrl: string | null;
    status: string | null;
  }>;
}
