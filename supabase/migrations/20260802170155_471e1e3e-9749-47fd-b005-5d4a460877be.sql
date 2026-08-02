-- ============ occurrences ============
CREATE TABLE IF NOT EXISTS public.zoom_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_key text NOT NULL,
  occurrence_date date NOT NULL,
  starts_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduling'
    CHECK (status IN ('scheduling','ready','started','ended','failed')),
  zoom_meeting_id text,
  join_url text,
  start_url text,
  failure_reason text,
  ended_at timestamptz,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_key, occurrence_date)
);
CREATE INDEX IF NOT EXISTS zoom_occurrences_series_starts_idx
  ON public.zoom_occurrences (series_key, starts_at DESC);
CREATE INDEX IF NOT EXISTS zoom_occurrences_meeting_idx
  ON public.zoom_occurrences (series_key, zoom_meeting_id);
GRANT ALL ON public.zoom_occurrences TO service_role;
ALTER TABLE public.zoom_occurrences ENABLE ROW LEVEL SECURITY;

-- ============ registrations: extra columns ============
ALTER TABLE public.meeting_registrations
  ADD COLUMN IF NOT EXISTS occurrence_id uuid REFERENCES public.zoom_occurrences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_question text,
  ADD COLUMN IF NOT EXISTS auto_register boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS request_follow_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_contact_date date,
  ADD COLUMN IF NOT EXISTS preferred_contact_time text,
  ADD COLUMN IF NOT EXISTS preferred_timezone text,
  ADD COLUMN IF NOT EXISTS zoom_registration_status text NOT NULL DEFAULT 'registering'
    CHECK (zoom_registration_status IN ('registering','registered','failed')),
  ADD COLUMN IF NOT EXISTS zoom_registrant_id text,
  ADD COLUMN IF NOT EXISTS zoom_join_url text,
  ADD COLUMN IF NOT EXISTS zoom_failure_reason text,
  ADD COLUMN IF NOT EXISTS confirmation_email_status text NOT NULL DEFAULT 'pending'
    CHECK (confirmation_email_status IN ('pending','sent','failed')),
  ADD COLUMN IF NOT EXISTS confirmation_email_error text,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS meeting_registrations_occurrence_email_idx
  ON public.meeting_registrations (occurrence_id, lower(email))
  WHERE occurrence_id IS NOT NULL;

-- ============ attendance ============
CREATE TABLE IF NOT EXISTS public.zoom_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.zoom_occurrences(id) ON DELETE CASCADE,
  participant_key text NOT NULL,
  participant_name text,
  participant_email text,
  joined_at timestamptz NOT NULL,
  left_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occurrence_id, participant_key, joined_at)
);
GRANT ALL ON public.zoom_attendance TO service_role;
ALTER TABLE public.zoom_attendance ENABLE ROW LEVEL SECURITY;

-- ============ recordings ============
CREATE TABLE IF NOT EXISTS public.zoom_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.zoom_occurrences(id) ON DELETE CASCADE,
  zoom_meeting_id text NOT NULL,
  zoom_meeting_uuid text NOT NULL UNIQUE,
  topic text,
  started_at timestamptz,
  recording_start timestamptz,
  recording_end timestamptz,
  duration_minutes integer,
  provider_share_url text,
  provider_play_passcode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.zoom_recordings TO service_role;
ALTER TABLE public.zoom_recordings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.zoom_recording_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES public.zoom_recordings(id) ON DELETE CASCADE,
  zoom_file_id text NOT NULL UNIQUE,
  file_type text,
  file_extension text,
  file_size bigint,
  play_url text,
  download_url text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.zoom_recording_files TO service_role;
ALTER TABLE public.zoom_recording_files ENABLE ROW LEVEL SECURITY;

-- ============ follow-up queue ============
CREATE TABLE IF NOT EXISTS public.zoom_followup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.meeting_registrations(id) ON DELETE CASCADE,
  sequence_step integer NOT NULL DEFAULT 1,
  send_after timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registration_id, sequence_step)
);
GRANT ALL ON public.zoom_followup_queue TO service_role;
ALTER TABLE public.zoom_followup_queue ENABLE ROW LEVEL SECURITY;

-- ============ webhook event log ============
CREATE TABLE IF NOT EXISTS public.zoom_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_key text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz,
  payload_hash text NOT NULL,
  lease_id uuid,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_key, event_id)
);
GRANT ALL ON public.zoom_webhook_events TO service_role;
ALTER TABLE public.zoom_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============ claim occurrence ============
CREATE OR REPLACE FUNCTION public.claim_zoom_occurrence(
  _series_key text, _occurrence_date date, _starts_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data public.zoom_occurrences; was_claimed boolean := false;
BEGIN
  INSERT INTO public.zoom_occurrences (series_key, occurrence_date, starts_at, status)
  VALUES (_series_key, _occurrence_date, _starts_at, 'scheduling')
  ON CONFLICT (series_key, occurrence_date) DO NOTHING
  RETURNING * INTO row_data;

  IF row_data.id IS NOT NULL THEN
    RETURN jsonb_build_object('claimed', true, 'value', to_jsonb(row_data));
  END IF;

  SELECT * INTO row_data FROM public.zoom_occurrences
  WHERE series_key = _series_key AND occurrence_date = _occurrence_date FOR UPDATE;

  IF row_data.status = 'failed'
     OR (row_data.status = 'scheduling' AND row_data.claimed_at < now() - interval '10 minutes') THEN
    UPDATE public.zoom_occurrences
      SET status = 'scheduling', failure_reason = NULL, claimed_at = now(), updated_at = now()
      WHERE id = row_data.id RETURNING * INTO row_data;
    was_claimed := true;
  END IF;

  RETURN jsonb_build_object('claimed', was_claimed, 'value', to_jsonb(row_data));
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_occurrence(text, date, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_occurrence(text, date, timestamptz) TO service_role;

-- ============ claim registration ============
CREATE OR REPLACE FUNCTION public.claim_zoom_registration(
  _occurrence_id uuid, _full_name text, _email text, _phone text, _location text,
  _relationship text, _situation text, _submitted_question text,
  _auto_register boolean, _request_follow_up boolean,
  _preferred_contact_date date, _preferred_contact_time text, _preferred_timezone text,
  _consent_confidentiality boolean, _consent_updates boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data public.meeting_registrations; was_claimed boolean := false;
BEGIN
  INSERT INTO public.meeting_registrations (
    occurrence_id, full_name, email, phone, location, relationship, situation,
    submitted_question, auto_register, request_follow_up, preferred_contact_date,
    preferred_contact_time, preferred_timezone, consent_confidentiality, consent_updates,
    zoom_registration_status
  ) VALUES (
    _occurrence_id, _full_name, lower(trim(_email)), _phone, _location, _relationship, _situation,
    _submitted_question, _auto_register, _request_follow_up, _preferred_contact_date,
    _preferred_contact_time, _preferred_timezone, _consent_confidentiality, _consent_updates,
    'registering'
  )
  ON CONFLICT DO NOTHING
  RETURNING * INTO row_data;

  IF row_data.id IS NOT NULL THEN
    was_claimed := true;
  ELSE
    SELECT * INTO row_data FROM public.meeting_registrations
    WHERE occurrence_id = _occurrence_id AND lower(email) = lower(trim(_email))
    ORDER BY created_at DESC LIMIT 1;

    IF row_data.zoom_registration_status = 'failed' THEN
      UPDATE public.meeting_registrations
        SET zoom_registration_status = 'registering', zoom_failure_reason = NULL, updated_at = now()
        WHERE id = row_data.id RETURNING * INTO row_data;
      was_claimed := true;
    END IF;
  END IF;

  IF was_claimed AND _request_follow_up THEN
    INSERT INTO public.zoom_followup_queue (registration_id, sequence_step, send_after)
    VALUES (row_data.id, 1, COALESCE(_preferred_contact_date::timestamptz, now()))
    ON CONFLICT (registration_id, sequence_step) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('claimed', was_claimed, 'value', to_jsonb(row_data));
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, text, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, text, text, boolean, boolean) TO service_role;

-- ============ webhook claim / complete / release ============
CREATE OR REPLACE FUNCTION public.claim_zoom_webhook_event(
  _series_key text, _event_id text, _event_type text, _occurred_at timestamptz, _payload_hash text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data public.zoom_webhook_events; new_lease uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.zoom_webhook_events (
    series_key, event_id, event_type, occurred_at, payload_hash, lease_id, claimed_at
  ) VALUES (_series_key, _event_id, _event_type, _occurred_at, _payload_hash, new_lease, now())
  ON CONFLICT (series_key, event_id) DO NOTHING
  RETURNING * INTO row_data;

  IF row_data.id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'claimed', 'leaseId', new_lease::text);
  END IF;

  SELECT * INTO row_data FROM public.zoom_webhook_events
  WHERE series_key = _series_key AND event_id = _event_id FOR UPDATE;

  IF row_data.completed_at IS NOT NULL THEN
    IF row_data.payload_hash = _payload_hash THEN
      RETURN jsonb_build_object('status', 'replay');
    END IF;
    RETURN jsonb_build_object('status', 'conflict');
  END IF;

  IF row_data.claimed_at IS NOT NULL AND row_data.claimed_at > now() - interval '5 minutes' THEN
    RETURN jsonb_build_object('status', 'busy');
  END IF;

  UPDATE public.zoom_webhook_events
    SET lease_id = new_lease, claimed_at = now(), payload_hash = _payload_hash
    WHERE id = row_data.id;
  RETURN jsonb_build_object('status', 'claimed', 'leaseId', new_lease::text);
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_webhook_event(text, text, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_webhook_event(text, text, text, timestamptz, text) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_zoom_webhook_event(
  _series_key text, _event_id text, _lease_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE updated_id uuid;
BEGIN
  UPDATE public.zoom_webhook_events
    SET completed_at = now(), lease_id = NULL, claimed_at = NULL
    WHERE series_key = _series_key AND event_id = _event_id AND lease_id = _lease_id
    RETURNING id INTO updated_id;
  RETURN updated_id IS NOT NULL;
END; $$;
REVOKE ALL ON FUNCTION public.complete_zoom_webhook_event(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_zoom_webhook_event(text, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.release_zoom_webhook_event(
  _series_key text, _event_id text, _lease_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.zoom_webhook_events
    SET lease_id = NULL, claimed_at = NULL
    WHERE series_key = _series_key AND event_id = _event_id AND lease_id = _lease_id;
END; $$;
REVOKE ALL ON FUNCTION public.release_zoom_webhook_event(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_zoom_webhook_event(text, text, uuid) TO service_role;

-- ============ reminders ============
CREATE OR REPLACE FUNCTION public.claim_zoom_reminders(
  _now timestamptz, _horizon timestamptz, _limit integer
) RETURNS TABLE (
  id uuid, full_name text, email text, zoom_join_url text, occurrence_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT r.id FROM public.meeting_registrations r
    JOIN public.zoom_occurrences o ON o.id = r.occurrence_id
    WHERE r.zoom_registration_status = 'registered'
      AND r.zoom_join_url IS NOT NULL
      AND r.reminder_sent_at IS NULL
      AND (r.reminder_claimed_at IS NULL OR r.reminder_claimed_at < _now - interval '15 minutes')
      AND o.starts_at > _now AND o.starts_at <= _horizon
    ORDER BY o.starts_at ASC
    LIMIT GREATEST(_limit, 0)
    FOR UPDATE OF r SKIP LOCKED
  )
  UPDATE public.meeting_registrations r
    SET reminder_claimed_at = _now, updated_at = now()
    WHERE r.id IN (SELECT due.id FROM due)
    RETURNING r.id, r.full_name, r.email, r.zoom_join_url, r.occurrence_id;
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_reminders(timestamptz, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_reminders(timestamptz, timestamptz, integer) TO service_role;

-- ============ follow-ups ============
CREATE OR REPLACE FUNCTION public.claim_zoom_followups(
  _now timestamptz, _limit integer
) RETURNS TABLE (id uuid, registration_id uuid, sequence_step integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT q.id FROM public.zoom_followup_queue q
    WHERE q.sent_at IS NULL
      AND q.send_after <= _now
      AND (q.claimed_at IS NULL OR q.claimed_at < _now - interval '15 minutes')
    ORDER BY q.send_after ASC
    LIMIT GREATEST(_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.zoom_followup_queue q
    SET claimed_at = _now
    WHERE q.id IN (SELECT due.id FROM due)
    RETURNING q.id, q.registration_id, q.sequence_step;
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_followups(timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_followups(timestamptz, integer) TO service_role;

-- updated_at triggers
DROP TRIGGER IF EXISTS zoom_occurrences_updated_at ON public.zoom_occurrences;
CREATE TRIGGER zoom_occurrences_updated_at BEFORE UPDATE ON public.zoom_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS meeting_registrations_updated_at ON public.meeting_registrations;
CREATE TRIGGER meeting_registrations_updated_at BEFORE UPDATE ON public.meeting_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();