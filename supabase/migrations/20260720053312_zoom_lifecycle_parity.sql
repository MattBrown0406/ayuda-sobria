-- AyudaSobria Zoom lifecycle parity.
-- This creates an additional, isolated Spanish series at Monday 8:00 PM Pacific.
-- It does not touch SoberHelpline's English Monday 7:00 PM series or settings.

CREATE TABLE IF NOT EXISTS public.meeting_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text,
  relationship text,
  situation text,
  consent_confidentiality boolean NOT NULL DEFAULT false,
  consent_updates boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zoom_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_key text NOT NULL DEFAULT 'ayuda_sobria_la_sobremesa_es_8pm'
    CHECK (series_key = 'ayuda_sobria_la_sobremesa_es_8pm'),
  occurrence_date date NOT NULL,
  starts_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles'
    CHECK (timezone = 'America/Los_Angeles'),
  status text NOT NULL DEFAULT 'scheduling'
    CHECK (status IN ('scheduling', 'ready', 'started', 'ended', 'failed')),
  zoom_meeting_id text UNIQUE,
  join_url text,
  start_url text,
  failure_reason text,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_key, occurrence_date),
  UNIQUE (series_key, starts_at),
  CHECK (extract(isodow FROM occurrence_date) = 1),
  CHECK (
    (status IN ('ready', 'started', 'ended') AND zoom_meeting_id IS NOT NULL AND join_url IS NOT NULL)
    OR status IN ('scheduling', 'failed')
  )
);

ALTER TABLE public.meeting_registrations
  ADD COLUMN IF NOT EXISTS occurrence_id uuid REFERENCES public.zoom_occurrences(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS submitted_question text,
  ADD COLUMN IF NOT EXISTS auto_register boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS request_follow_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_contact_date date,
  ADD COLUMN IF NOT EXISTS preferred_contact_time time,
  ADD COLUMN IF NOT EXISTS preferred_timezone text,
  ADD COLUMN IF NOT EXISTS zoom_registration_status text NOT NULL DEFAULT 'registered'
    CHECK (zoom_registration_status IN ('registering', 'registered', 'failed')),
  ADD COLUMN IF NOT EXISTS zoom_registrant_id text,
  ADD COLUMN IF NOT EXISTS zoom_join_url text,
  ADD COLUMN IF NOT EXISTS zoom_failure_reason text,
  ADD COLUMN IF NOT EXISTS confirmation_email_status text NOT NULL DEFAULT 'pending'
    CHECK (confirmation_email_status IN ('pending', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS confirmation_email_error text,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS meeting_registrations_occurrence_email_uidx
  ON public.meeting_registrations (occurrence_id, lower(email))
  WHERE occurrence_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS meeting_registrations_zoom_registrant_uidx
  ON public.meeting_registrations (zoom_registrant_id)
  WHERE zoom_registrant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS meeting_registrations_occurrence_idx
  ON public.meeting_registrations (occurrence_id);
CREATE INDEX IF NOT EXISTS meeting_registrations_auto_register_idx
  ON public.meeting_registrations (lower(email), created_at DESC)
  WHERE auto_register = true;
CREATE INDEX IF NOT EXISTS meeting_registrations_follow_up_idx
  ON public.meeting_registrations (occurrence_id, request_follow_up)
  WHERE request_follow_up = true;

CREATE TABLE IF NOT EXISTS public.zoom_webhook_events (
  series_key text NOT NULL CHECK (series_key = 'ayuda_sobria_la_sobremesa_es_8pm'),
  event_id text NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (series_key, event_id)
);

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
CREATE INDEX IF NOT EXISTS zoom_attendance_occurrence_idx ON public.zoom_attendance (occurrence_id, joined_at);

CREATE TABLE IF NOT EXISTS public.zoom_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.zoom_occurrences(id) ON DELETE RESTRICT,
  zoom_meeting_id text NOT NULL,
  zoom_meeting_uuid text NOT NULL UNIQUE,
  topic text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL,
  recording_start timestamptz,
  recording_end timestamptz,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  title text,
  description text,
  public_url text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (published = false AND published_at IS NULL)
    OR (published = true AND published_at IS NOT NULL AND public_url IS NOT NULL AND length(public_url) > 0)
  )
);
CREATE INDEX IF NOT EXISTS zoom_recordings_occurrence_idx ON public.zoom_recordings (occurrence_id);
CREATE INDEX IF NOT EXISTS zoom_recordings_published_idx ON public.zoom_recordings (published, started_at DESC);

-- Provider file URLs may carry access tokens. They are never exposed to browser roles.
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
CREATE INDEX IF NOT EXISTS zoom_recording_files_recording_idx ON public.zoom_recording_files (recording_id);

ALTER TABLE public.meeting_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_recording_files ENABLE ROW LEVEL SECURITY;

-- All Zoom data, including published recordings, is served through authenticated server code.
-- SoberHelpline's proven audience is active members; anon/authenticated Data API access stays revoked.
REVOKE ALL ON TABLE public.meeting_registrations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.zoom_occurrences FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.zoom_webhook_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.zoom_attendance FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.zoom_recordings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.zoom_recording_files FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.meeting_registrations TO service_role;
GRANT ALL ON TABLE public.zoom_occurrences TO service_role;
GRANT ALL ON TABLE public.zoom_webhook_events TO service_role;
GRANT ALL ON TABLE public.zoom_attendance TO service_role;
GRANT ALL ON TABLE public.zoom_recordings TO service_role;
GRANT ALL ON TABLE public.zoom_recording_files TO service_role;

CREATE OR REPLACE FUNCTION public.claim_zoom_occurrence(
  _series_key text,
  _occurrence_date date,
  _starts_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_row public.zoom_occurrences%ROWTYPE;
  v_claimed boolean := false;
BEGIN
  IF _series_key <> 'ayuda_sobria_la_sobremesa_es_8pm' THEN
    RAISE EXCEPTION 'unsupported meeting series';
  END IF;
  IF extract(isodow FROM _occurrence_date) <> 1 THEN
    RAISE EXCEPTION 'occurrence must be Monday';
  END IF;

  INSERT INTO public.zoom_occurrences (series_key, occurrence_date, starts_at, status)
  VALUES (_series_key, _occurrence_date, _starts_at, 'scheduling')
  ON CONFLICT (series_key, occurrence_date) DO NOTHING
  RETURNING * INTO v_row;

  IF FOUND THEN
    v_claimed := true;
  ELSE
    SELECT * INTO v_row
    FROM public.zoom_occurrences
    WHERE series_key = _series_key AND occurrence_date = _occurrence_date
    FOR UPDATE;

    IF v_row.starts_at <> _starts_at THEN
      RAISE EXCEPTION 'occurrence timing mismatch';
    END IF;
    IF v_row.status = 'failed' THEN
      UPDATE public.zoom_occurrences
      SET status = 'scheduling', failure_reason = NULL, updated_at = now()
      WHERE id = v_row.id
      RETURNING * INTO v_row;
      v_claimed := true;
    END IF;
  END IF;

  RETURN jsonb_build_object('claimed', v_claimed, 'value', to_jsonb(v_row));
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_zoom_registration(
  _occurrence_id uuid,
  _full_name text,
  _email text,
  _phone text,
  _location text,
  _relationship text,
  _situation text,
  _submitted_question text,
  _auto_register boolean,
  _request_follow_up boolean,
  _preferred_contact_date date,
  _preferred_contact_time time,
  _preferred_timezone text,
  _consent_confidentiality boolean,
  _consent_updates boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_row public.meeting_registrations%ROWTYPE;
  v_claimed boolean := false;
BEGIN
  IF NOT _consent_confidentiality THEN
    RAISE EXCEPTION 'confidentiality consent required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.zoom_occurrences
    WHERE id = _occurrence_id
      AND series_key = 'ayuda_sobria_la_sobremesa_es_8pm'
      AND status IN ('ready', 'started')
  ) THEN
    RAISE EXCEPTION 'occurrence unavailable';
  END IF;

  SELECT * INTO v_row
  FROM public.meeting_registrations
  WHERE occurrence_id = _occurrence_id AND lower(email) = lower(_email)
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.meeting_registrations (
        occurrence_id, full_name, email, phone, location, relationship, situation,
        submitted_question, auto_register, request_follow_up, preferred_contact_date,
        preferred_contact_time, preferred_timezone, consent_confidentiality,
        consent_updates, zoom_registration_status
      ) VALUES (
        _occurrence_id, _full_name, lower(_email), _phone, _location, _relationship, _situation,
        _submitted_question, _auto_register, _request_follow_up, _preferred_contact_date,
        _preferred_contact_time, _preferred_timezone, true, _consent_updates, 'registering'
      ) RETURNING * INTO v_row;
      v_claimed := true;
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO v_row
      FROM public.meeting_registrations
      WHERE occurrence_id = _occurrence_id AND lower(email) = lower(_email)
      FOR UPDATE;
    END;
  END IF;

  IF NOT v_claimed AND v_row.zoom_registration_status = 'failed' THEN
    UPDATE public.meeting_registrations
    SET full_name = _full_name,
        phone = _phone,
        location = _location,
        relationship = _relationship,
        situation = _situation,
        submitted_question = _submitted_question,
        auto_register = _auto_register OR v_row.auto_register,
        request_follow_up = _request_follow_up,
        preferred_contact_date = _preferred_contact_date,
        preferred_contact_time = _preferred_contact_time,
        preferred_timezone = _preferred_timezone,
        consent_updates = _consent_updates,
        zoom_registration_status = 'registering',
        zoom_failure_reason = NULL,
        updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;
    v_claimed := true;
  END IF;

  RETURN jsonb_build_object('claimed', v_claimed, 'value', to_jsonb(v_row));
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_zoom_webhook_event(
  _series_key text,
  _event_id text,
  _event_type text,
  _occurred_at timestamptz
) RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH inserted AS (
    INSERT INTO public.zoom_webhook_events (series_key, event_id, event_type, occurred_at)
    SELECT _series_key, _event_id, _event_type, _occurred_at
    WHERE _series_key = 'ayuda_sobria_la_sobremesa_es_8pm'
    ON CONFLICT (series_key, event_id) DO NOTHING
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM inserted);
$$;

REVOKE ALL ON FUNCTION public.claim_zoom_occurrence(text, date, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, time, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_zoom_webhook_event(text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_occurrence(text, date, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, time, text, boolean, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_zoom_webhook_event(text, text, text, timestamptz) TO service_role;
