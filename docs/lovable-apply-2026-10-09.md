# Lovable apply — 2026-10-09 (La Sobremesa weekly meeting + audit fixes)

## Why no meeting was being created

The only scheduler was the GitHub Actions workflow. Its repository secrets
(`AYUDA_ZOOM_BASE_URL`, `ZOOM_AUTOMATION_SECRET`) were never set, so every run failed,
and no Monday meeting was ever created. The registration page showed "La próxima reunión
aún no está disponible". GitHub's cron was also unreliable: hourly runs arrived hours late.

## What runs now

A database cron job in this project's Supabase, `la-sobremesa-weekly-tick`, calls
`https://ayudasobria.com/api/zoom/tick` every 15 minutes. The server decides what is due,
in Pacific time (DST handled):

| When (Pacific) | What happens |
| --- | --- |
| Monday 10:00 PM | Next Monday's 8:00 PM meeting is created in the soberhelpline.com Zoom account, with a new link and registration turned on. |
| Monday 8:00–9:59 PM | Nothing happens; tonight's meeting is in progress. |
| Every other tick | The tick confirms the upcoming meeting exists, which recovers a missed or failed run. |
| Thursday 3:00 PM until Monday's meeting | Weekly auto-registration runs, emailing each subscriber their personal link. It repeats once an hour to retry failures. |
| Monday 4:00–8:00 PM | Same-day reminders go out. |
| Tuesday 10:00 AM | The weekly attendance report goes to Matt. |

The cron job authenticates with a random secret that the migration generates and stores in
`public.zoom_automation_state`, which only the service role can read. You don't need to
copy any secret anywhere.

## Steps

### 1. Paste this prompt into Lovable

> Apply the two new migration files exactly as written, in order, without changing them:
> `supabase/migrations/20261009220000_la_sobremesa_weekly_cron.sql` and
> `supabase/migrations/20261009221000_registration_resubmission_and_followup_timing.sql`.
> Then confirm with a read-only query that the cron job `la-sobremesa-weekly-tick` exists
> (`select jobname, schedule from cron.job`) and that `public.zoom_automation_state` has
> one row. Do not print the `cron_secret` value.

### 2. Check the secrets in Lovable

Go to Project settings → Secrets.

- **Required.** Set `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET`. They come from the
  **soberhelpline.com** Zoom account's Server-to-Server OAuth app (Zoom App Marketplace →
  Develop → Build App → the S2S app → App Credentials). This is the same app that
  soberhelpline.com uses for its Monday meeting.
  - The app needs these scopes: create/list meetings, plus list/create/delete meeting registrants.
- **Optional.** Leave `ZOOM_HOST_USER_ID` empty to host as the app's owner (`me`). To host
  under a different soberhelpline.com user, set it to that user's email.
- **Already set.** `ZOOM_AUTOMATION_SECRET` is set on the live site. It now also signs the
  "cancelar registro automático" links in emails.
- **Must be set for emails to go out.** `RESEND_API_KEY` and `LOVABLE_API_KEY`.

### 3. Allow the password-reset link

In Lovable Cloud → Authentication → URL configuration, make sure
`https://ayudasobria.com/auth?reset=password` (or `https://ayudasobria.com/**`) is an allowed redirect URL,
so the new "¿Olvidaste tu contraseña?" email link returns to the site.

### 4. Publish the site in Lovable

### 5. Create the first meeting

Open https://ayudasobria.com/admin → La Sobremesa tab, and press **"Create next Monday's
meeting now"**.

- **If it works:** the message reads "Created the meeting for 2026-10-12" (or the next
  Monday's date).
- **If it fails:** the message shows the reason, for example "Zoom is not configured" or a
  Zoom scope error. Fix that and press the button again.

Within 15 minutes the same panel should show "Scheduler healthy — last run …".

### 6. Check the public page

On https://ayudasobria.com/registro, "Próxima La Sobremesa" should now show the date.

## Other fixes in this push

- **Memberships.** A paid membership that was stuck on "pending" (the PayPal return page
  never loaded) is now confirmed with PayPal and activated. A second subscription is
  refused while one is active. Memberships cancelled or suspended in PayPal stop granting
  access.
- **Registration.**
  - A family that was already registered and sends the form again (with a question or a
    "contact me" request) now has those answers saved, and Matt gets an email about it.
  - Ticking weekly registration on a resubmission turns it on; turning it off takes the
    signed link in the emails, so nobody can unsubscribe someone else.
  - Old email-only sign-ups (from before Zoom registration) are not auto-registered.
  - Every weekly email has a one-click "cancelar registro automático" link.
  - The "after La Sobremesa" follow-up is now sent the day after the meeting, not before it.
  - Browsers can no longer insert registrations directly.
- **Registration page.** If Zoom can't take a registration (for example, the meeting isn't
  created yet), the request is emailed to Matt and the family sees "Recibimos tu registro"
  instead of an error.
- **Zoom webhook.** "Participant left" events now record leave times instead of failing and
  being retried.
- **Weekly report.** Failed registrations are no longer listed as no-shows, the "inactive
  auto-registrants" list works, and only last week's meeting is reported.
- **Pages and copy.**
  - Lookup words in URLs such as `/blog/constructor` now return 404.
  - The admin "No access" screen now appears for signed-in non-admins.
  - The membership page lists the recordings benefit.
  - The homepage no longer advertises an "Intensivo" that can't be bought.
  - The terms page describes PayPal payments on this site.
- **Coaching payments.**
  - The payment confirmation now accepts only real order IDs for orders this site created.
    Before, it could be abused to send requests to other PayPal endpoints, such as refunds,
    using the merchant account.
  - PayPal return links are fixed to this site.
  - After a payment, Matt and the family each get an email.
  - A declined card now shows how to try again.
- **Accounts.** There is now a "¿Olvidaste tu contraseña?" password reset, and "Cerrar
  sesión" on the membership page.
- **Colombia page.** It now lists the national mental-health line, 192 (option 4); 106 is
  Bogotá only.

## Please confirm

Zoom host: decided. Matt hosts both Monday meetings (one Zoom host), and ends the 7:00 PM meeting in time for the 8:00 PM one.


- **Membership price.** It is still US$14.99/month and US$149/year here, while
  soberhelpline.com charges US$9.99.
