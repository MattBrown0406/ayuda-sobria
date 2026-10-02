# La Sobremesa: local time and activation

Implemented in an isolated checkout based on main c636759. No production changes, invitations, or meeting creation were performed.

## Operational finding (October 2, 2026)

Read-only GitHub inspection returned no repository Actions secrets. The most recent automation run (2026-10-02 02:08 UTC) logged missing `AYUDA_ZOOM_BASE_URL` and `ZOOM_AUTOMATION_SECRET`, skipped scheduling, but concluded success. The workflow now fails on missing configuration and reports item-level email errors as failures. Local `.env` has neither Zoom credentials nor a Supabase service-role key, so the live meeting inventory and deployed database could not be inspected. Do not assume there are no existing meetings.

## SoberHelpline blueprint inspected

Read-only source: `/Users/mattbrown/Documents/Sober Helpline/soberhelpline-site`, commit `834721d7` (September 5, 2026):

- `supabase/functions/auto-create-monday-zoom/index.ts`: server-to-server Zoom OAuth, distinct type-2 meeting each week in America/Los_Angeles, persist meeting details.
- `supabase/functions/public-register-monday-zoom/index.ts`: save registration, invoke confirmation delivery.
- `supabase/functions/send-zoom-registration-email/index.ts`: attendee join information/calendar attachment and separate admin notification.

Ayuda's existing Zoom/store/Resend adapters and Actions scheduler implement this same business flow; they remain in use. Its Spanish series stays separate from the English 7PM series. Calendar attachment was added to attendee confirmations. We did not copy SoberHelpline's provider, credentials, shared meeting URLs, or mutate its source. Its live scheduler configuration was not accessible from this checkout.

## Behavior

- Meeting begins Mondays at 8PM America/Los_Angeles (DST observed).
- Next week's meeting is provisioned Mondays at 10:30PM Pacific. Both UTC offsets are covered, with hourly idempotent recovery/bootstrap. Automatic creation is held between Monday 8PM and 10:29PM Pacific. GitHub schedules may run late; minute-exact execution is not guaranteed.
- Thursday automatic registration and Monday reminders remain. HTTP requests retry; failed items produce a failed workflow after independent actions finish. Check database `failure_reason`, `confirmation_email_error`, and `reminder_error`, plus Actions logs. A manual workflow dispatch can retry a specific action.
- Database uniqueness/claims and exact Zoom topic/start-time discovery prevent ordinary duplicate creation. Missing Zoom list permission or incomplete pagination now fails closed instead of creating blindly. A meeting with a different title must be reconciled manually before bootstrap.
- Public next-meeting data contains only the ready occurrence start time. UI uses the visitor's persisted/browser timezone, allows global IANA selection, shows actual local date (including Tuesday), and exports a single UTC calendar occurrence. No personalized join links enter the public response/calendar.
- The chosen timezone uses the existing `preferred_timezone` column for confirmations, reminders, recurring registration, and optional contact scheduling; no new migration is needed.
- Admin-only fallback returns pending/unconfirmed, not personal-email success. Failed confirmation shows retry/contact guidance. Repeated submissions recover the existing Zoom registration. Provider acceptance is not proof of inbox delivery.
- Admin notifications retain the existing independent best-effort behavior: attendee success is not reversed if admin mail fails; admin failures are logged. Durable independent admin-mail retry remains an existing limitation.

## Activation checklist — requires approval

1. Review and approve publishing/deploying these local changes. Nothing has been pushed.
2. Verify all existing Zoom migrations are applied and the deployed runtime has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_HOST_USER_ID`, `ZOOM_AUTOMATION_SECRET`, `RESEND_API_KEY`, `LOVABLE_API_KEY`, and verified sender/admin-address configuration. Reuse existing authorized credentials; obtain approval for new credentials/access.
3. Before creation, inspect upcoming Zoom meetings for the host and `zoom_occurrences` for this Spanish series. Reconcile manually created equivalent meetings with differing titles instead of creating duplicates. Required provider permissions include listing and creating meetings and listing/creating registrants.
4. Configure repository Actions secrets `AYUDA_ZOOM_BASE_URL=https://ayudasobria.com` and the matching `ZOOM_AUTOMATION_SECRET`; enable this workflow as the sole scheduler for the Spanish series. No separate Codex automation is needed.
5. Dispatch `schedule` once to bootstrap the imminent Monday before enabling registrations. Confirm its date/time and database `ready` status; repeat and verify `created:false`. Hourly recovery also bootstraps, but explicit verification avoids waiting for it.
6. With approval, use a controlled test mailbox to verify attendee email, calendar attachment, separate admin notice, repeat submission, and reminder. Do not test against real registrants.

## Verification

`npm test` covers route audit and lifecycle/unit tests, including DST changes, Tuesday local dates, calendar UTC times, registration retries after email failure, provider/DB recovery without a duplicate meeting, and fail-closed duplicate discovery. `npm run typecheck` and `npm run build` validate integration. Provider/database live integration, actual inbox delivery, deployed browser behavior, and SQL smoke execution require approved production/test configuration.

## Report-date activation check (October 2 follow-up)

Actionable source finding: `buildWeeklyReport` chooses the newest eligible past occurrence without a lower date bound. A local mocked-database execution with only the August 3 occurrence selected August 3 on August 4, August 11, and September 1. Adding the August 10 past occurrence plus an August 17 future occurrence correctly selected August 10 on August 11. Therefore new future provisioning does not confuse report selection, but missing subsequent occurrences can cause repeated reports of an old meeting. This reproduces a possible mechanism; it does not establish the live database state or zero attendance. The query also accepts `ready` and `started`, so its wording “completed” is broader than its actual predicate.

Before activation signoff, verify that the Tuesday report returns the immediately preceding Monday's occurrence date and that the public next-meeting display returns the following Monday. Do not treat a report with an older date as that week's attendance. Inspect the existing scheduler for `/api/public/hooks/weekly-report` before modifying it: the repository's Actions workflow does not call that hook, so its current external trigger remains unverified. Confirm its private-secret authentication, Tuesday 10AM America/Los_Angeles timing, and advancing occurrence date using an approved controlled test. No report was sent by this local check.
