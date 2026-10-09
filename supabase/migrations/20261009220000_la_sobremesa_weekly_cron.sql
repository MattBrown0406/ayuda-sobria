-- =====================================================================
-- La Sobremesa: run the weekly Zoom lifecycle from this database.
--
-- Until now the only scheduler was a GitHub Actions workflow that never had
-- its secrets configured, so no Monday meeting was ever created. This job
-- calls the site's /api/zoom/tick every 15 minutes. The server decides what is
-- due in Pacific time (src/lib/zoom/time.ts weeklyAutomationPlan):
--   Monday 10:00 PM      create next Monday's 8 PM meeting (new link) in Zoom
--   every other tick     confirm it exists (recovers a missed/failed run)
--   Thursday 3 PM on     weekly auto-registration + personal-link emails
--   Monday 4-8 PM        same-day reminders
--   Tuesday 10 AM        weekly attendance report
--
-- The job authenticates with a random secret generated here and kept in a
-- service-role-only table; the server reads the same row to verify it, so no
-- secret has to be copied anywhere by hand. Idempotent; safe to re-run.
-- =====================================================================

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

-- 64 hex characters from two random UUIDs (gen_random_uuid is built in).
INSERT INTO public.zoom_automation_state (id, cron_secret)
VALUES (1, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
ON CONFLICT (id) DO NOTHING;

-- Replace this job if it exists, and retire any older job that called the
-- weekly-report hook directly (the tick sends that report now).
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
