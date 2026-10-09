-- lovable-cron-fallback-reviewed: weekly Zoom lifecycle needs time-based actions (Mon 10 PM create, Mon 4-8 PM reminders, Thu auto-register, Tue report) in Pacific time with DST; 15-min ticks keep delivery delay under 15 minutes.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.zoom_automation_state (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cron_secret text NOT NULL,
  last_tick_at timestamptz,
  last_tick_ok boolean,
  last_tick_summary jsonb,
  last_error text,
  last_success_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.zoom_automation_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zoom_automation_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.zoom_automation_state TO service_role;

INSERT INTO public.zoom_automation_state (id, cron_secret)
VALUES (1, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobid FROM cron.job
    WHERE jobname = 'la-sobremesa-weekly-tick'
       OR command ILIKE '%/api/public/hooks/weekly-report%'
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'la-sobremesa-weekly-tick',
  '*/15 * * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://ayudasobria.com/api/zoom/tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT cron_secret FROM public.zoom_automation_state WHERE id = 1)
    ),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 120000
  ) AS request_id;
  $cmd$
);