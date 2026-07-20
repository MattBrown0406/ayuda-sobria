BEGIN;

INSERT INTO public.zoom_occurrences (
  id, series_key, occurrence_date, starts_at, status, zoom_meeting_id, join_url
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  'ayuda_sobria_la_sobremesa_es_8pm',
  '2026-07-27',
  '2026-07-28T03:00:00Z',
  'ready',
  'ayuda-test-meeting',
  'https://zoom.test/ayuda'
);

DO $$ BEGIN
  BEGIN
    INSERT INTO public.zoom_occurrences (
      series_key, occurrence_date, starts_at, status, zoom_meeting_id, join_url
    ) VALUES (
      'ayuda_sobria_la_sobremesa_es_8pm', '2026-08-03', '2026-08-04T02:00:00Z',
      'ready', 'wrong-7pm-meeting', 'https://zoom.test/wrong'
    );
    RAISE EXCEPTION '7 PM regression was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO public.meeting_registrations (
  id, occurrence_id, full_name, email, consent_confidentiality, consent_updates,
  zoom_registration_status, zoom_registrant_id, zoom_join_url
) VALUES (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000101',
  'Ana Prueba', 'ana@example.test', true, true,
  'registered', 'registrant-test', 'https://zoom.test/personal'
);

DO $$ BEGIN
  IF (SELECT count(*) FROM public.zoom_followup_queue
      WHERE registration_id='00000000-0000-0000-0000-000000000201') <> 3 THEN
    RAISE EXCEPTION 'expected three consented follow-ups';
  END IF;
END $$;

DO $$ DECLARE first_count integer; second_count integer; BEGIN
  SELECT count(*) INTO first_count FROM public.claim_zoom_followups('2026-07-29T06:00:00Z', 25);
  SELECT count(*) INTO second_count FROM public.claim_zoom_followups('2026-07-29T06:00:00Z', 25);
  IF first_count <> 1 OR second_count <> 0 THEN
    RAISE EXCEPTION 'follow-up leasing failed: %, %', first_count, second_count;
  END IF;
END $$;

INSERT INTO public.zoom_recordings (
  occurrence_id, zoom_meeting_id, zoom_meeting_uuid, topic, started_at,
  provider_share_url, provider_play_passcode
) VALUES (
  '00000000-0000-0000-0000-000000000101', 'ayuda-test-meeting',
  'uuid-test-private', 'La Sobremesa', '2026-07-28T03:00:00Z',
  'https://zoom.test/private-provider-share', 'CodigoPrivado123'
);

DO $$ BEGIN
  IF (SELECT published FROM public.zoom_recordings WHERE zoom_meeting_uuid='uuid-test-private') THEN
    RAISE EXCEPTION 'recording was published by default';
  END IF;
  IF (SELECT public_url IS NOT NULL FROM public.zoom_recordings WHERE zoom_meeting_uuid='uuid-test-private') THEN
    RAISE EXCEPTION 'provider share URL crossed the explicit publication boundary';
  END IF;
  IF (SELECT public_play_passcode IS NOT NULL FROM public.zoom_recordings WHERE zoom_meeting_uuid='uuid-test-private') THEN
    RAISE EXCEPTION 'provider passcode crossed the explicit publication boundary';
  END IF;
  IF NOT (SELECT provider_play_passcode = 'CodigoPrivado123' FROM public.zoom_recordings WHERE zoom_meeting_uuid='uuid-test-private') THEN
    RAISE EXCEPTION 'provider passcode was not stored privately';
  END IF;
  IF has_function_privilege('anon', 'public.claim_zoom_webhook_event(text,text,text,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute webhook claim';
  END IF;
  IF has_function_privilege('authenticated', 'public.complete_zoom_webhook_event(text,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated can complete webhook events';
  END IF;
  IF has_table_privilege('anon', 'public.user_roles', 'SELECT') THEN
    RAISE EXCEPTION 'anon can read admin roles';
  END IF;
  IF has_table_privilege('authenticated', 'public.user_roles', 'TRUNCATE') THEN
    RAISE EXCEPTION 'authenticated can truncate admin roles';
  END IF;
  IF has_table_privilege('authenticated', 'public.zoom_recording_files', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated can read private recording files';
  END IF;
END $$;

DO $$ DECLARE
  first_claim jsonb;
  second_claim jsonb;
  busy_claim jsonb;
  replay_claim jsonb;
  first_lease uuid;
  second_lease uuid;
BEGIN
  first_claim := public.claim_zoom_webhook_event(
    'ayuda_sobria_la_sobremesa_es_8pm', 'event-test', 'recording.completed',
    now(), repeat('a', 64)
  );
  IF first_claim->>'status' <> 'claimed' OR first_claim->>'leaseId' IS NULL THEN
    RAISE EXCEPTION 'first webhook claim: %', first_claim;
  END IF;
  first_lease := (first_claim->>'leaseId')::uuid;
  busy_claim := public.claim_zoom_webhook_event(
    'ayuda_sobria_la_sobremesa_es_8pm', 'event-test', 'recording.completed',
    now(), repeat('a', 64)
  );
  IF busy_claim->>'status' <> 'busy' THEN RAISE EXCEPTION 'concurrent webhook claim: %', busy_claim; END IF;

  UPDATE public.zoom_webhook_events SET claimed_at=now()-interval '6 minutes'
  WHERE series_key='ayuda_sobria_la_sobremesa_es_8pm' AND event_id='event-test';
  second_claim := public.claim_zoom_webhook_event(
    'ayuda_sobria_la_sobremesa_es_8pm', 'event-test', 'recording.completed',
    now(), repeat('a', 64)
  );
  IF second_claim->>'status' <> 'claimed' THEN RAISE EXCEPTION 'expired lease reclaim: %', second_claim; END IF;
  second_lease := (second_claim->>'leaseId')::uuid;
  IF public.release_zoom_webhook_event('ayuda_sobria_la_sobremesa_es_8pm', 'event-test', first_lease) THEN
    RAISE EXCEPTION 'stale worker released the active lease';
  END IF;
  IF NOT public.complete_zoom_webhook_event('ayuda_sobria_la_sobremesa_es_8pm', 'event-test', second_lease) THEN
    RAISE EXCEPTION 'active lease could not complete';
  END IF;
  replay_claim := public.claim_zoom_webhook_event(
    'ayuda_sobria_la_sobremesa_es_8pm', 'event-test', 'recording.completed',
    now(), repeat('a', 64)
  );
  IF replay_claim->>'status' <> 'replay' THEN RAISE EXCEPTION 'completed webhook replay: %', replay_claim; END IF;
END $$;

ROLLBACK;
