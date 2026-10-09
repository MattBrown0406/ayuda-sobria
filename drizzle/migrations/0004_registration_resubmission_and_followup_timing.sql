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
  follow_up_added boolean := false;
  reclaim boolean := false;
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
    follow_up_added := _request_follow_up;
  ELSE
    SELECT * INTO row_data FROM public.meeting_registrations
    WHERE occurrence_id = _occurrence_id AND lower(email) = lower(trim(_email))
    ORDER BY created_at DESC LIMIT 1
    FOR UPDATE;

    follow_up_added := _request_follow_up AND NOT COALESCE(row_data.request_follow_up, false);
    reclaim := row_data.zoom_registration_status = 'failed'
       OR (row_data.zoom_registration_status = 'registering'
           AND row_data.updated_at < now() - interval '15 minutes');

    UPDATE public.meeting_registrations SET
      phone = COALESCE(NULLIF(btrim(_phone), ''), phone),
      location = COALESCE(NULLIF(btrim(_location), ''), location),
      relationship = COALESCE(NULLIF(btrim(_relationship), ''), relationship),
      situation = COALESCE(NULLIF(btrim(_situation), ''), situation),
      submitted_question = COALESCE(NULLIF(btrim(_submitted_question), ''), submitted_question),
      request_follow_up = request_follow_up OR _request_follow_up,
      preferred_contact_date = CASE WHEN _request_follow_up
        THEN COALESCE(_preferred_contact_date, preferred_contact_date) ELSE preferred_contact_date END,
      preferred_contact_time = CASE WHEN _request_follow_up
        THEN COALESCE(NULLIF(btrim(_preferred_contact_time), ''), preferred_contact_time) ELSE preferred_contact_time END,
      preferred_timezone = COALESCE(NULLIF(btrim(_preferred_timezone), ''), preferred_timezone),
      auto_register = auto_register OR _auto_register,
      consent_updates = _consent_updates,
      updated_at = now()
    WHERE id = row_data.id
    RETURNING * INTO row_data;

    IF reclaim THEN
      UPDATE public.meeting_registrations
        SET zoom_registration_status = 'registering', zoom_failure_reason = NULL, updated_at = now()
        WHERE id = row_data.id RETURNING * INTO row_data;
      was_claimed := true;
    END IF;
  END IF;

  IF follow_up_added THEN
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

UPDATE public.zoom_followup_queue q
SET send_after = o.starts_at + interval '1 day'
FROM public.meeting_registrations r
JOIN public.zoom_occurrences o ON o.id = r.occurrence_id
WHERE q.registration_id = r.id
  AND q.sent_at IS NULL
  AND q.send_after < o.starts_at + interval '1 day';

DROP POLICY IF EXISTS anyone_can_register ON public.meeting_registrations;
REVOKE INSERT ON TABLE public.meeting_registrations FROM anon, authenticated;