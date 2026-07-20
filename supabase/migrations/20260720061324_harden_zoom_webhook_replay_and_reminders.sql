-- Reconcile and harden the already-applied AyudaSobria Zoom schema without editing
-- migration 20260720053312. Supports both the deployed early shape and clean replay.

-- The Lovable admin-role migration exists on a divergent published branch and may already
-- be present remotely, but it is absent from main's migration chain. Reconcile only the
-- narrow role table needed by the existing admin route; role assignment remains manual.
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;
DO $$ BEGIN
  CREATE POLICY users_read_own_roles ON public.user_roles
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.meeting_registrations
  ADD COLUMN IF NOT EXISTS auto_register boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS request_follow_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_contact_date date,
  ADD COLUMN IF NOT EXISTS preferred_contact_time time,
  ADD COLUMN IF NOT EXISTS preferred_timezone text,
  ADD COLUMN IF NOT EXISTS confirmation_email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS confirmation_email_error text,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_error text;

ALTER TABLE public.zoom_occurrences
  ADD COLUMN IF NOT EXISTS series_key text,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;
UPDATE public.zoom_occurrences
SET series_key = 'ayuda_sobria_la_sobremesa_es_8pm'
WHERE series_key IS NULL;
ALTER TABLE public.zoom_occurrences
  ALTER COLUMN series_key SET DEFAULT 'ayuda_sobria_la_sobremesa_es_8pm',
  ALTER COLUMN series_key SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.zoom_occurrences ADD CONSTRAINT zoom_occurrences_ayuda_series_check
    CHECK (series_key = 'ayuda_sobria_la_sobremesa_es_8pm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.zoom_occurrences ADD CONSTRAINT zoom_occurrences_8pm_pacific_check
    CHECK (starts_at = ((occurrence_date::timestamp + time '20:00') AT TIME ZONE 'America/Los_Angeles'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS zoom_occurrences_series_date_uidx
  ON public.zoom_occurrences(series_key, occurrence_date);
CREATE UNIQUE INDEX IF NOT EXISTS zoom_occurrences_series_start_uidx
  ON public.zoom_occurrences(series_key, starts_at);

ALTER TABLE public.zoom_webhook_events ADD COLUMN IF NOT EXISTS series_key text;
UPDATE public.zoom_webhook_events
SET series_key = 'ayuda_sobria_la_sobremesa_es_8pm'
WHERE series_key IS NULL;
ALTER TABLE public.zoom_webhook_events
  ALTER COLUMN series_key SET DEFAULT 'ayuda_sobria_la_sobremesa_es_8pm',
  ALTER COLUMN series_key SET NOT NULL,
  ADD COLUMN IF NOT EXISTS payload_hash text,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_id uuid,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;
UPDATE public.zoom_webhook_events SET payload_hash = repeat('0', 64) WHERE payload_hash IS NULL;
UPDATE public.zoom_webhook_events
SET claimed_at = COALESCE(claimed_at, received_at),
    processed_at = COALESCE(processed_at, received_at);
ALTER TABLE public.zoom_webhook_events ALTER COLUMN payload_hash SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.zoom_webhook_events ADD CONSTRAINT zoom_webhook_events_payload_hash_check
    CHECK (payload_hash ~ '^[0-9a-f]{64}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.zoom_webhook_events DROP CONSTRAINT IF EXISTS zoom_webhook_events_pkey;
ALTER TABLE public.zoom_webhook_events ADD PRIMARY KEY (series_key, event_id);

CREATE TABLE IF NOT EXISTS public.zoom_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.zoom_occurrences(id) ON DELETE CASCADE,
  participant_key text NOT NULL,
  participant_name text NOT NULL,
  participant_email text,
  joined_at timestamptz NOT NULL,
  left_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occurrence_id, participant_key, joined_at)
);
ALTER TABLE public.zoom_recordings
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS provider_share_url text,
  ADD COLUMN IF NOT EXISTS provider_play_passcode text,
  ADD COLUMN IF NOT EXISTS public_play_passcode text;
DO $$ BEGIN
  ALTER TABLE public.zoom_recordings ADD CONSTRAINT zoom_recordings_provider_passcode_length_check
    CHECK (provider_play_passcode IS NULL OR length(provider_play_passcode) <= 128);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.zoom_recordings ADD CONSTRAINT zoom_recordings_public_passcode_length_check
    CHECK (public_play_passcode IS NULL OR length(public_play_passcode) <= 128);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS meeting_registrations_occurrence_email_uidx
  ON public.meeting_registrations (occurrence_id, lower(email)) WHERE occurrence_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS meeting_registrations_zoom_registrant_uidx
  ON public.meeting_registrations (zoom_registrant_id) WHERE zoom_registrant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS meeting_registrations_auto_register_idx
  ON public.meeting_registrations (lower(email), created_at DESC) WHERE auto_register = true;
CREATE INDEX IF NOT EXISTS zoom_attendance_occurrence_idx
  ON public.zoom_attendance (occurrence_id, joined_at);

ALTER TABLE public.zoom_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.meeting_registrations, public.zoom_occurrences,
  public.zoom_webhook_events, public.zoom_attendance, public.zoom_recordings,
  public.zoom_recording_files FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.meeting_registrations, public.zoom_occurrences,
  public.zoom_webhook_events, public.zoom_attendance, public.zoom_recordings,
  public.zoom_recording_files TO service_role;

DROP FUNCTION IF EXISTS public.claim_zoom_occurrence(date, timestamptz);
DROP FUNCTION IF EXISTS public.claim_zoom_occurrence(text, date, timestamptz);
CREATE FUNCTION public.claim_zoom_occurrence(_series_key text, _occurrence_date date, _starts_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row public.zoom_occurrences%ROWTYPE; v_claimed boolean := false;
BEGIN
  IF _series_key <> 'ayuda_sobria_la_sobremesa_es_8pm' OR extract(isodow FROM _occurrence_date) <> 1 THEN
    RAISE EXCEPTION 'unsupported meeting occurrence';
  END IF;
  INSERT INTO public.zoom_occurrences(series_key, occurrence_date, starts_at, status)
  VALUES (_series_key, _occurrence_date, _starts_at, 'scheduling')
  ON CONFLICT (series_key, occurrence_date) DO NOTHING RETURNING * INTO v_row;
  IF FOUND THEN v_claimed := true;
  ELSE
    SELECT * INTO v_row FROM public.zoom_occurrences
    WHERE series_key = _series_key AND occurrence_date = _occurrence_date FOR UPDATE;
    IF v_row.starts_at <> _starts_at THEN RAISE EXCEPTION 'occurrence timing mismatch'; END IF;
    IF v_row.status = 'failed' OR (v_row.status = 'scheduling' AND v_row.updated_at < now()-interval '15 minutes') THEN
      UPDATE public.zoom_occurrences SET status='scheduling', failure_reason=NULL, updated_at=now()
      WHERE id=v_row.id RETURNING * INTO v_row; v_claimed := true;
    END IF;
  END IF;
  RETURN jsonb_build_object('claimed', v_claimed, 'value', to_jsonb(v_row));
END; $$;

DROP FUNCTION IF EXISTS public.claim_zoom_registration(uuid,text,text,text,text,text,text,text,boolean,boolean);
DROP FUNCTION IF EXISTS public.claim_zoom_registration(uuid,text,text,text,text,text,text,text,boolean,boolean,date,time,text,boolean,boolean);
CREATE FUNCTION public.claim_zoom_registration(
  _occurrence_id uuid, _full_name text, _email text, _phone text, _location text,
  _relationship text, _situation text, _submitted_question text, _auto_register boolean,
  _request_follow_up boolean, _preferred_contact_date date, _preferred_contact_time time,
  _preferred_timezone text, _consent_confidentiality boolean, _consent_updates boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row public.meeting_registrations%ROWTYPE; v_claimed boolean := false;
BEGIN
  IF NOT _consent_confidentiality THEN RAISE EXCEPTION 'confidentiality consent required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.zoom_occurrences WHERE id=_occurrence_id
    AND series_key='ayuda_sobria_la_sobremesa_es_8pm' AND status IN ('ready','started')) THEN
    RAISE EXCEPTION 'occurrence unavailable';
  END IF;
  SELECT * INTO v_row FROM public.meeting_registrations
  WHERE occurrence_id=_occurrence_id AND lower(email)=lower(_email) FOR UPDATE;
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.meeting_registrations(occurrence_id,full_name,email,phone,location,
        relationship,situation,submitted_question,auto_register,request_follow_up,
        preferred_contact_date,preferred_contact_time,preferred_timezone,
        consent_confidentiality,consent_updates,zoom_registration_status)
      VALUES(_occurrence_id,_full_name,lower(_email),_phone,_location,_relationship,_situation,
        _submitted_question,_auto_register,_request_follow_up,_preferred_contact_date,
        _preferred_contact_time,_preferred_timezone,true,_consent_updates,'registering')
      RETURNING * INTO v_row; v_claimed := true;
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO v_row FROM public.meeting_registrations
      WHERE occurrence_id=_occurrence_id AND lower(email)=lower(_email) FOR UPDATE;
    END;
  END IF;
  IF NOT v_claimed AND v_row.zoom_registration_status='registered' THEN
    UPDATE public.meeting_registrations SET full_name=_full_name, phone=_phone, location=_location,
      relationship=_relationship, situation=_situation, submitted_question=_submitted_question,
      auto_register=_auto_register, request_follow_up=_request_follow_up,
      preferred_contact_date=_preferred_contact_date, preferred_contact_time=_preferred_contact_time,
      preferred_timezone=_preferred_timezone, consent_updates=_consent_updates, updated_at=now()
    WHERE id=v_row.id RETURNING * INTO v_row;
  ELSIF NOT v_claimed AND (
    v_row.zoom_registration_status='failed'
    OR (v_row.zoom_registration_status='registering' AND v_row.updated_at < now()-interval '15 minutes')
  ) THEN
    UPDATE public.meeting_registrations SET full_name=_full_name, phone=_phone, location=_location,
      relationship=_relationship, situation=_situation, submitted_question=_submitted_question,
      auto_register=_auto_register, request_follow_up=_request_follow_up,
      preferred_contact_date=_preferred_contact_date, preferred_contact_time=_preferred_contact_time,
      preferred_timezone=_preferred_timezone, consent_updates=_consent_updates,
      zoom_registration_status='registering', zoom_failure_reason=NULL, updated_at=now()
    WHERE id=v_row.id RETURNING * INTO v_row; v_claimed := true;
  END IF;
  RETURN jsonb_build_object('claimed',v_claimed,'value',to_jsonb(v_row));
END; $$;

DROP FUNCTION IF EXISTS public.claim_zoom_webhook_event(text,text,timestamptz);
DROP FUNCTION IF EXISTS public.claim_zoom_webhook_event(text,text,text,timestamptz);
DROP FUNCTION IF EXISTS public.claim_zoom_webhook_event(text,text,text,timestamptz,text);
CREATE FUNCTION public.claim_zoom_webhook_event(
  _series_key text, _event_id text, _event_type text, _occurred_at timestamptz, _payload_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_existing public.zoom_webhook_events%ROWTYPE; v_lease_id uuid := gen_random_uuid();
BEGIN
  IF _series_key <> 'ayuda_sobria_la_sobremesa_es_8pm' OR _payload_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid webhook claim';
  END IF;
  INSERT INTO public.zoom_webhook_events(
    series_key,event_id,event_type,occurred_at,payload_hash,claimed_at,lease_id
  ) VALUES(
    _series_key,_event_id,_event_type,_occurred_at,_payload_hash,now(),v_lease_id
  ) ON CONFLICT(series_key,event_id) DO NOTHING RETURNING * INTO v_existing;
  IF FOUND THEN RETURN jsonb_build_object('status','claimed','leaseId',v_lease_id); END IF;

  SELECT * INTO v_existing FROM public.zoom_webhook_events
  WHERE series_key=_series_key AND event_id=_event_id FOR UPDATE;
  IF v_existing.event_type<>_event_type OR v_existing.payload_hash<>_payload_hash THEN
    RETURN jsonb_build_object('status','conflict');
  END IF;
  IF v_existing.processed_at IS NOT NULL THEN RETURN jsonb_build_object('status','replay'); END IF;
  IF v_existing.claimed_at IS NULL OR v_existing.claimed_at < now()-interval '5 minutes' THEN
    UPDATE public.zoom_webhook_events SET claimed_at=now(), lease_id=v_lease_id
    WHERE series_key=_series_key AND event_id=_event_id;
    RETURN jsonb_build_object('status','claimed','leaseId',v_lease_id);
  END IF;
  RETURN jsonb_build_object('status','busy');
END; $$;

DROP FUNCTION IF EXISTS public.complete_zoom_webhook_event(text,text);
CREATE FUNCTION public.complete_zoom_webhook_event(_series_key text, _event_id text, _lease_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  WITH updated AS (
    UPDATE public.zoom_webhook_events
    SET processed_at=now(), claimed_at=NULL, lease_id=NULL
    WHERE series_key=_series_key AND event_id=_event_id AND lease_id=_lease_id AND processed_at IS NULL
    RETURNING 1
  ) SELECT EXISTS(SELECT 1 FROM updated);
$$;

DROP FUNCTION IF EXISTS public.release_zoom_webhook_event(text,text);
CREATE FUNCTION public.release_zoom_webhook_event(_series_key text, _event_id text, _lease_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  WITH updated AS (
    UPDATE public.zoom_webhook_events
    SET claimed_at=NULL, lease_id=NULL
    WHERE series_key=_series_key AND event_id=_event_id AND lease_id=_lease_id AND processed_at IS NULL
    RETURNING 1
  ) SELECT EXISTS(SELECT 1 FROM updated);
$$;

DROP FUNCTION IF EXISTS public.claim_zoom_reminders(timestamptz,timestamptz,integer);
CREATE FUNCTION public.claim_zoom_reminders(_now timestamptz,_horizon timestamptz,_limit integer DEFAULT 100)
RETURNS SETOF public.meeting_registrations LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  WITH due AS (
    SELECT r.id FROM public.meeting_registrations r JOIN public.zoom_occurrences o ON o.id=r.occurrence_id
    WHERE o.series_key='ayuda_sobria_la_sobremesa_es_8pm' AND o.status IN ('ready','started')
      AND o.starts_at>_now AND o.starts_at<=_horizon AND r.zoom_registration_status='registered'
      AND r.zoom_join_url IS NOT NULL AND r.reminder_sent_at IS NULL
      AND (r.reminder_claimed_at IS NULL OR r.reminder_claimed_at<_now-interval '15 minutes')
    ORDER BY o.starts_at,r.created_at FOR UPDATE OF r SKIP LOCKED
    LIMIT LEAST(GREATEST(_limit,1),500)
  )
  UPDATE public.meeting_registrations r SET reminder_claimed_at=_now,reminder_error=NULL,updated_at=now()
  FROM due WHERE r.id=due.id RETURNING r.*;
$$;

REVOKE ALL ON FUNCTION public.claim_zoom_occurrence(text,date,timestamptz) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_zoom_registration(uuid,text,text,text,text,text,text,text,boolean,boolean,date,time,text,boolean,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_zoom_webhook_event(text,text,text,timestamptz,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_zoom_webhook_event(text,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.release_zoom_webhook_event(text,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_zoom_reminders(timestamptz,timestamptz,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_occurrence(text,date,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_zoom_registration(uuid,text,text,text,text,text,text,text,boolean,boolean,date,time,text,boolean,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_zoom_webhook_event(text,text,text,timestamptz,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_zoom_webhook_event(text,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_zoom_webhook_event(text,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_zoom_reminders(timestamptz,timestamptz,integer) TO service_role;

CREATE TABLE IF NOT EXISTS public.zoom_followup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.meeting_registrations(id) ON DELETE CASCADE,
  sequence_step smallint NOT NULL CHECK (sequence_step BETWEEN 1 AND 3),
  scheduled_for timestamptz NOT NULL,
  claimed_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registration_id, sequence_step)
);
ALTER TABLE public.zoom_followup_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zoom_followup_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.zoom_followup_queue TO service_role;
CREATE INDEX IF NOT EXISTS zoom_followup_queue_due_idx
  ON public.zoom_followup_queue(scheduled_for) WHERE sent_at IS NULL;

CREATE OR REPLACE FUNCTION public.queue_zoom_registration_followups()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_starts_at timestamptz;
BEGIN
  IF NEW.zoom_registration_status <> 'registered' OR NOT NEW.consent_updates
     OR (TG_OP = 'UPDATE' AND OLD.zoom_registration_status = 'registered') THEN RETURN NEW; END IF;
  SELECT starts_at INTO v_starts_at FROM public.zoom_occurrences
  WHERE id=NEW.occurrence_id AND series_key='ayuda_sobria_la_sobremesa_es_8pm';
  IF v_starts_at IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.zoom_followup_queue(registration_id,sequence_step,scheduled_for)
  VALUES (NEW.id,1,v_starts_at+interval '1 day 75 minutes'),
         (NEW.id,2,v_starts_at+interval '3 days 75 minutes'),
         (NEW.id,3,v_starts_at+interval '7 days 75 minutes')
  ON CONFLICT(registration_id,sequence_step) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS queue_zoom_registration_followups_trigger ON public.meeting_registrations;
CREATE TRIGGER queue_zoom_registration_followups_trigger
AFTER INSERT OR UPDATE OF zoom_registration_status ON public.meeting_registrations
FOR EACH ROW EXECUTE FUNCTION public.queue_zoom_registration_followups();

DROP FUNCTION IF EXISTS public.claim_zoom_followups(timestamptz,integer);
CREATE FUNCTION public.claim_zoom_followups(_now timestamptz,_limit integer DEFAULT 25)
RETURNS SETOF public.zoom_followup_queue LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  WITH due AS (
    SELECT q.id FROM public.zoom_followup_queue q
    WHERE q.scheduled_for<=_now AND q.sent_at IS NULL
      AND (q.claimed_at IS NULL OR q.claimed_at<_now-interval '15 minutes')
    ORDER BY q.scheduled_for FOR UPDATE OF q SKIP LOCKED
    LIMIT LEAST(GREATEST(_limit,1),100)
  )
  UPDATE public.zoom_followup_queue q SET claimed_at=_now,error_message=NULL
  FROM due WHERE q.id=due.id RETURNING q.*;
$$;
REVOKE ALL ON FUNCTION public.claim_zoom_followups(timestamptz,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.queue_zoom_registration_followups() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_followups(timestamptz,integer) TO service_role;
