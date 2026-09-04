-- Reconcile the live schema (shaped by 20260802170155) with the application code.
--
-- 1. Member-facing recording publication. The admin publish flow
--    (src/lib/admin.functions.ts) and the members' library (src/lib/zoom.functions.ts)
--    read title/description/public_url/public_play_passcode/published/published_at, but
--    the deployed zoom_recordings table was created without them, so both requests fail
--    with "column does not exist". Recordings stay private by default.
ALTER TABLE public.zoom_recordings
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS public_url text,
  ADD COLUMN IF NOT EXISTS public_play_passcode text,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.zoom_recordings ADD CONSTRAINT zoom_recordings_publication_check
    CHECK (
      (published = false AND published_at IS NULL)
      OR (published = true AND published_at IS NOT NULL AND public_url IS NOT NULL AND length(public_url) > 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.zoom_recordings ADD CONSTRAINT zoom_recordings_public_passcode_length_check
    CHECK (public_play_passcode IS NULL OR length(public_play_passcode) <= 128);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS zoom_recordings_published_idx
  ON public.zoom_recordings (published, started_at DESC);

-- 2. Registration claim: a row left in 'registering' (process crashed between the claim
--    and the Zoom call, or the failure update itself failed) blocked that email for the
--    whole occurrence with a permanent 409. Reclaim it after 15 minutes, matching the
--    lease timeout used by reminders and follow-ups. Same signature as the deployed
--    function, so there is no overload ambiguity for PostgREST.
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

  IF was_claimed AND _request_follow_up THEN
    INSERT INTO public.zoom_followup_queue (registration_id, sequence_step, send_after)
    VALUES (row_data.id, 1, COALESCE(_preferred_contact_date::timestamptz, now()))
    ON CONFLICT (registration_id, sequence_step) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('claimed', was_claimed, 'value', to_jsonb(row_data));
END; $$;
REVOKE ALL ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, text, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zoom_registration(uuid, text, text, text, text, text, text, text, boolean, boolean, date, text, text, boolean, boolean) TO service_role;
