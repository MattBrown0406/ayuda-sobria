-- see supabase/migrations/20261010030000_registration_privacy_and_rate_limits.sql
CREATE OR REPLACE FUNCTION public.claim_zoom_registration(
  _occurrence_id uuid, _full_name text, _email text, _phone text, _location text,
  _relationship text, _situation text, _submitted_question text,
  _auto_register boolean, _request_follow_up boolean,
  _preferred_contact_date date, _preferred_contact_time text, _preferred_timezone text,
  _consent_confidentiality boolean, _consent_updates boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row_data public.meeting_registrations;
  was_claimed boolean := false;
  is_new boolean := false;
  meeting_starts timestamptz;
BEGIN
  IF NOT _consent_confidentiality THEN
    RAISE EXCEPTION 'confidentiality consent required';
  END IF;

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
    is_new := true;
  ELSE
    SELECT * INTO row_data FROM public.meeting_registrations
    WHERE occurrence_id = _occurrence_id AND lower(email) = lower(trim(_email))
    ORDER BY created_at DESC LIMIT 1
    FOR UPDATE;

    IF row_data.zoom_registration_status = 'failed'
       OR (row_data.zoom_registration_status = 'registering'
           AND row_data.updated_at < now() - interval '15 minutes') THEN
      UPDATE public.meeting_registrations
        SET zoom_registration_status = 'registering', zoom_failure_reason = NULL, updated_at = now()
        WHERE id = row_data.id RETURNING * INTO row_data;
      was_claimed := true;
    END IF;
  END IF;

  IF is_new AND _request_follow_up THEN
    SELECT starts_at INTO meeting_starts FROM public.zoom_occurrences WHERE id = _occurrence_id;
    INSERT INTO public.zoom_followup_queue (registration_id, sequence_step, send_after)
    VALUES (
      row_data.id, 1,
      GREATEST(COALESCE(meeting_starts, now()) + interval '1 day', now())
    )
    ON CONFLICT (registration_id, sequence_step) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('claimed', was_claimed, 'value', to_jsonb(row_data));
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, text, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, text, text, boolean, boolean) TO service_role;

CREATE TABLE IF NOT EXISTS public.public_rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);
ALTER TABLE public.public_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.public_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window timestamptz := to_timestamp(
    floor(extract(epoch FROM now()) / greatest(p_window_seconds, 1)) * greatest(p_window_seconds, 1)
  );
  v_hits integer;
BEGIN
  INSERT INTO public.public_rate_limits (bucket_key, window_start, hits)
  VALUES (left(p_key, 200), v_window, 1)
  ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET hits = public.public_rate_limits.hits + 1
  RETURNING hits INTO v_hits;
  IF random() < 0.01 THEN
    DELETE FROM public.public_rate_limits WHERE window_start < now() - interval '1 day';
  END IF;
  RETURN v_hits <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;

ALTER TABLE public.zoom_automation_state
  ADD COLUMN IF NOT EXISTS last_report_occurrence_id text;

DROP FUNCTION IF EXISTS public.grant_admin_for_matt() CASCADE;

REVOKE ALL ON TABLE
  public.meeting_registrations, public.zoom_occurrences, public.zoom_webhook_events,
  public.zoom_attendance, public.zoom_recordings, public.zoom_recording_files,
  public.zoom_followup_queue
FROM anon, authenticated;
REVOKE ALL ON TABLE public.memberships, public.coaching_orders, public.profiles, public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.user_roles, public.memberships, public.coaching_orders
FROM authenticated;