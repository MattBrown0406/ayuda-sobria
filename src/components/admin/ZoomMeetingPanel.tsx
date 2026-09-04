import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  History,
  Mail,
  MessageSquare,
  Phone,
  Printer,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  submitted_question: string | null;
  request_follow_up: boolean | null;
  auto_register: boolean | null;
  consent_updates: boolean | null;
  occurrence_id: string | null;
  created_at: string;
  preferred_contact_date: string | null;
  preferred_contact_time: string | null;
  preferred_timezone: string | null;
  zoom_registration_status: string;
}

interface Occurrence {
  id: string;
  occurrence_date: string;
  starts_at: string;
  status: string;
  zoom_meeting_id: string | null;
  join_url: string | null;
  start_url: string | null;
  failure_reason: string | null;
  ended_at: string | null;
}

interface Attendance {
  id: string;
  occurrence_id: string;
  participant_name: string | null;
  participant_email: string | null;
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Los_Angeles",
});

function formatMeetingDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00-08:00`));
}

function formatDateTime(value: string | null) {
  return value ? timeFormatter.format(new Date(value)) : "—";
}

function splitByRegType(list: Registration[]) {
  const manual: Registration[] = [];
  const auto: Registration[] = [];
  list.forEach((r) => (r.auto_register ? auto.push(r) : manual.push(r)));
  return { manual, auto };
}

function RegistrantCard({
  registration,
  index,
  flagged,
}: {
  registration: Registration;
  index: number;
  flagged?: boolean;
}) {
  return (
    <div
      className={`space-y-1 rounded-lg border p-3 ${
        flagged ? "border-destructive bg-destructive/10" : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-foreground">{registration.full_name}</span>
          {registration.auto_register && (
            <Badge variant="outline" className="text-[10px]">
              Auto
            </Badge>
          )}
          {flagged && (
            <Badge variant="destructive" className="gap-1 text-[10px]">
              <ShieldAlert className="h-3 w-3" />
              ZOOM REGISTRATION FAILED
            </Badge>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <a
            href={`mailto:${registration.email}`}
            className="flex items-center gap-1 hover:text-primary"
          >
            <Mail className="h-3 w-3" />
            {registration.email}
          </a>
          {registration.phone && (
            <a
              href={`tel:${registration.phone}`}
              className="flex items-center gap-1 hover:text-primary"
            >
              <Phone className="h-3 w-3" />
              {registration.phone}
            </a>
          )}
        </div>
      </div>
      {registration.submitted_question && (
        <p className="line-clamp-2 pl-7 text-xs text-muted-foreground">
          {registration.submitted_question}
        </p>
      )}
      <div className="flex gap-3 pl-7">
        {registration.request_follow_up && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <UserCheck className="h-3 w-3" />
            Follow-up requested
          </span>
        )}
        {registration.consent_updates && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            Email opt-in
          </span>
        )}
      </div>
    </div>
  );
}

export function ZoomMeetingPanel({
  occurrences,
  registrations,
  attendance,
}: {
  occurrences: Occurrence[];
  registrations: Registration[];
  attendance: Attendance[];
}) {
  const { upcoming, upcomingIsPast } = useMemo(() => {
    const now = Date.now();
    const future = [...occurrences]
      .filter((o) => Date.parse(o.starts_at) >= now - 6 * 60 * 60 * 1000)
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
    const selected = future[0] ?? occurrences[0] ?? null;
    return { upcoming: selected, upcomingIsPast: !future[0] && Boolean(selected) };
  }, [occurrences]);

  const occurrenceById = useMemo(() => new Map(occurrences.map((o) => [o.id, o])), [occurrences]);

  const upcomingRegistrations = useMemo(
    () => (upcoming ? registrations.filter((r) => r.occurrence_id === upcoming.id) : []),
    [registrations, upcoming],
  );

  const questionsOnly = upcomingRegistrations.filter(
    (r) => r.submitted_question && r.submitted_question.trim() !== "",
  );
  const followUpsOnly = upcomingRegistrations.filter((r) => r.request_follow_up);

  const pastFollowUps = useMemo(() => {
    const grouped: Record<string, Registration[]> = {};
    registrations.forEach((r) => {
      if (!r.request_follow_up) return;
      if (upcoming && r.occurrence_id === upcoming.id) return;
      const occurrence = r.occurrence_id ? occurrenceById.get(r.occurrence_id) : null;
      const key = occurrence?.occurrence_date ?? "unassigned";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    return grouped;
  }, [registrations, occurrenceById, upcoming]);

  const allWeeks = useMemo(() => {
    const grouped: Record<string, Registration[]> = {};
    [...registrations]
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      .forEach((r) => {
        const occurrence = r.occurrence_id ? occurrenceById.get(r.occurrence_id) : null;
        const key = occurrence?.occurrence_date ?? "unassigned";
        if (!grouped[key]) grouped[key] = [];
        const duplicate = grouped[key].some(
          (existing) => existing.email.toLowerCase() === r.email.toLowerCase(),
        );
        if (!duplicate) grouped[key].push(r);
      });
    return Object.entries(grouped).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [registrations, occurrenceById]);

  function handlePrint() {
    if (!upcoming) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const heading = formatMeetingDate(upcoming.occurrence_date);
    const escape = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const items = questionsOnly
      .map(
        (r, i) => `
        <div class="item">
          <div class="row">
            <strong>${i + 1}. ${escape(r.full_name)}</strong>
            <span class="meta">${escape(r.email)}${r.phone ? ` · ${escape(r.phone)}` : ""}</span>
          </div>
          <p>${escape(r.submitted_question ?? "")}</p>
          ${r.request_follow_up ? '<p class="flag">⚑ Requested a private follow-up</p>' : ""}
        </div>`,
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>La Sobremesa — Questions — ${heading}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; color: #1f2937; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
        .count { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
        .item { margin-bottom: 20px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; page-break-inside: avoid; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .meta { font-size: 12px; color: #6b7280; }
        .flag { margin: 6px 0 0; font-size: 12px; color: #dc2626; }
        @media print { body { padding: 15px; } }
      </style></head><body>
      <h1>La Sobremesa — Questions</h1>
      <p class="subtitle">${heading} · 8:00 PM Pacific</p>
      <p class="count">${questionsOnly.length} question${questionsOnly.length !== 1 ? "s" : ""} submitted</p>
      ${questionsOnly.length > 0 ? items : "<p>No questions submitted for this meeting.</p>"}
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="space-y-8">
      {/* Meeting settings / current link */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Meeting Settings</h3>
        <p className="text-sm text-muted-foreground">
          The weekly La Sobremesa meeting is created automatically in Zoom every Monday at 8:00 PM
          Pacific. Registrants receive their own personal join link by email, so there is no shared
          link or passcode to maintain by hand.
        </p>

        {upcoming ? (
          <Card>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {upcomingIsPast ? "Most recent meeting (none scheduled)" : "Upcoming meeting"}
                </p>
                <p className="font-medium text-foreground">
                  {formatMeetingDate(upcoming.occurrence_date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(upcoming.starts_at)} · Pacific
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Zoom Meeting ID
                </p>
                <p className="font-mono text-sm text-foreground">
                  {upcoming.zoom_meeting_id ?? "Not created yet"}
                </p>
                <Badge
                  variant={upcoming.status === "failed" ? "destructive" : "default"}
                  className="mt-1 text-[10px]"
                >
                  {upcoming.status}
                </Badge>
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-md bg-muted/50 p-3 text-sm">
                <Video className="h-4 w-4 flex-shrink-0 text-primary" />
                {upcoming.join_url ? (
                  <a
                    href={upcoming.join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Attendee link <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">No attendee link yet</span>
                )}
                {upcoming.start_url && (
                  <a
                    href={upcoming.start_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Host link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {upcoming.failure_reason && (
                <p className="sm:col-span-2 text-sm text-destructive">
                  ⚠️ {upcoming.failure_reason}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-destructive">
            ⚠️ No meeting has been scheduled yet. Run the weekly scheduler to create the next Monday
            meeting.
          </p>
        )}
      </div>

      <Separator />

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <MessageSquare className="h-5 w-5" />
              Questions for{" "}
              {upcoming ? formatMeetingDate(upcoming.occurrence_date) : "the next meeting"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {questionsOnly.length} question{questionsOnly.length !== 1 ? "s" : ""} submitted
              {upcomingRegistrations.length > 0 &&
                ` (of ${upcomingRegistrations.length} registrants)`}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrint} disabled={questionsOnly.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print Questions
          </Button>
        </div>

        {questionsOnly.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
            No questions submitted for the upcoming Monday meeting.
          </div>
        ) : (
          (() => {
            const { manual, auto } = splitByRegType(questionsOnly);
            const renderQuestion = (r: Registration, i: number) => (
              <div key={r.id} className="space-y-2 rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground">{r.full_name}</span>
                    {r.auto_register && (
                      <Badge variant="outline" className="text-[10px]">
                        Auto
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {r.email}
                    </span>
                    {r.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {r.phone}
                      </span>
                    )}
                  </div>
                </div>
                <p className="pl-8 text-sm text-foreground">{r.submitted_question}</p>
                <div className="flex gap-3 pl-8">
                  {r.request_follow_up && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <UserCheck className="h-3 w-3" />
                      Requested a private follow-up
                    </span>
                  )}
                  {r.consent_updates && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      Opted into email list
                    </span>
                  )}
                </div>
              </div>
            );
            return (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    Manual registrations{" "}
                    <Badge variant="secondary" className="text-xs">
                      {manual.length}
                    </Badge>
                  </h4>
                  {manual.length === 0 ? (
                    <p className="pl-1 text-xs text-muted-foreground">
                      No manual-registrant questions.
                    </p>
                  ) : (
                    <div className="space-y-3">{manual.map(renderQuestion)}</div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    Auto-registered{" "}
                    <Badge variant="secondary" className="text-xs">
                      {auto.length}
                    </Badge>
                  </h4>
                  {auto.length === 0 ? (
                    <p className="pl-1 text-xs text-muted-foreground">
                      No auto-registrant questions.
                    </p>
                  ) : (
                    <div className="space-y-3">{auto.map(renderQuestion)}</div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      <Separator />

      {/* Follow-up contact requests */}
      <div className="space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserCheck className="h-5 w-5" />
            Follow-Up Contact Requests
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            People who asked for a private follow-up call, with the day, time, and time zone they
            prefer.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-foreground">
                This Week —{" "}
                {upcoming ? formatMeetingDate(upcoming.occurrence_date) : "no meeting scheduled"}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {followUpsOnly.length}
              </Badge>
            </div>
            {followUpsOnly.length === 0 ? (
              <div className="ml-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No follow-up requests for the upcoming meeting yet.
              </div>
            ) : (
              (() => {
                const { manual, auto } = splitByRegType(followUpsOnly);
                const renderRow = (r: Registration) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {r.full_name}
                        {r.auto_register && (
                          <Badge variant="outline" className="text-[10px]">
                            Auto
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Prefers {r.preferred_contact_date || "no date"} ·{" "}
                        {r.preferred_contact_time || "no time"} ·{" "}
                        {r.preferred_timezone || "no time zone"}
                      </span>
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <a
                        href={`mailto:${r.email}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-3 w-3" />
                        {r.email}
                      </a>
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </a>
                      )}
                    </div>
                  </div>
                );
                return (
                  <div className="space-y-4 pl-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Manual ({manual.length})
                      </p>
                      {manual.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None.</p>
                      ) : (
                        <div className="space-y-2">{manual.map(renderRow)}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Auto-registered ({auto.length})
                      </p>
                      {auto.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None.</p>
                      ) : (
                        <div className="space-y-2">{auto.map(renderRow)}</div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {Object.keys(pastFollowUps).length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Previous Weeks (
                    {Object.values(pastFollowUps).reduce((sum, list) => sum + list.length, 0)} total
                    requests)
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-2">
                {Object.entries(pastFollowUps).map(([date, list]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-muted-foreground">
                        {date === "unassigned" ? "Unassigned" : formatMeetingDate(date)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {list.length}
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {list.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="font-medium text-foreground">{r.full_name}</span>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <a
                              href={`mailto:${r.email}`}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Mail className="h-3 w-3" />
                              {r.email}
                            </a>
                            {r.phone && (
                              <a
                                href={`tel:${r.phone}`}
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Phone className="h-3 w-3" />
                                {r.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>

      <Separator />

      {/* Weekly registration archive */}
      <div className="space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <History className="h-5 w-5" />
            Weekly Registration Archive
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All registrations grouped by week. The upcoming meeting appears first. Duplicates are
            removed.
          </p>
        </div>

        {allWeeks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
            No meeting registrations yet.
          </div>
        ) : (
          <div className="space-y-3">
            {allWeeks.map(([date, list]) => {
              const isUpcoming = Boolean(upcoming && date === upcoming.occurrence_date);
              const { manual, auto } = splitByRegType(list);
              return (
                <Collapsible key={date} defaultOpen={isUpcoming}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto w-full justify-between rounded-lg border border-border px-4 py-3 text-foreground hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {date === "unassigned" ? "Unassigned" : formatMeetingDate(date)}
                        </span>
                        {isUpcoming && (
                          <Badge variant="default" className="text-xs">
                            Upcoming
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {list.length} registrant{list.length !== 1 ? "s" : ""}
                        </Badge>
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pl-4 pt-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Manual registrations ({manual.length})
                      </p>
                      {manual.length === 0 ? (
                        <p className="pl-1 text-xs text-muted-foreground">None.</p>
                      ) : (
                        <div className="space-y-2">
                          {manual.map((r, i) => (
                            <RegistrantCard
                              key={r.id}
                              registration={r}
                              index={i}
                              flagged={r.zoom_registration_status === "failed"}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Auto-registered ({auto.length})
                      </p>
                      {auto.length === 0 ? (
                        <p className="pl-1 text-xs text-muted-foreground">None.</p>
                      ) : (
                        <div className="space-y-2">
                          {auto.map((r, i) => (
                            <RegistrantCard
                              key={r.id}
                              registration={r}
                              index={i}
                              flagged={r.zoom_registration_status === "failed"}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      <AttendanceTracking
        occurrences={occurrences}
        registrations={registrations}
        attendance={attendance}
        initialOccurrenceId={upcoming?.id ?? null}
      />
    </div>
  );
}

function AttendanceTracking({
  occurrences,
  registrations,
  attendance,
  initialOccurrenceId,
}: {
  occurrences: Occurrence[];
  registrations: Registration[];
  attendance: Attendance[];
  initialOccurrenceId: string | null;
}) {
  const sorted = useMemo(
    () => [...occurrences].sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)),
    [occurrences],
  );
  const [selectedId, setSelectedId] = useState(initialOccurrenceId ?? sorted[0]?.id ?? "");

  const selected = sorted.find((o) => o.id === selectedId) ?? null;
  const registered = registrations.filter((r) => r.occurrence_id === selectedId);
  const rows = attendance.filter((a) => a.occurrence_id === selectedId);

  const registeredEmails = new Set(registered.map((r) => r.email.toLowerCase()));
  const attendedEmails = new Set(
    rows.map((a) => (a.participant_email ?? "").toLowerCase()).filter(Boolean),
  );
  const noShows = registered.filter((r) => !attendedEmails.has(r.email.toLowerCase()));
  const walkIns = rows.filter(
    (a) => !a.participant_email || !registeredEmails.has(a.participant_email.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-5 w-5" />
            Attendance Tracking
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Who registered, who actually joined, and who didn't show up.
          </p>
        </div>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {sorted.length === 0 && <option value="">No meetings yet</option>}
          {sorted.map((o) => (
            <option key={o.id} value={o.id}>
              {formatMeetingDate(o.occurrence_date)}
              {o.id === initialOccurrenceId ? " (Upcoming)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<UserCheck className="h-5 w-5 text-primary" />}
          value={registered.length}
          label="Registered"
        />
        <StatTile
          icon={<Users className="h-5 w-5 text-primary" />}
          value={rows.length}
          label="Attendees"
        />
        <StatTile
          icon={<UserX className="h-5 w-5 text-destructive" />}
          value={noShows.length}
          label="Registered, Didn't Join"
        />
        <StatTile
          icon={<Users className="h-5 w-5 text-primary" />}
          value={walkIns.length}
          label="Walk-ins"
        />
      </div>

      {rows.length > 0 ? (
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between rounded-lg border border-border px-4 py-3 text-foreground hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Zoom Participants</span>
                <Badge variant="secondary" className="text-xs">
                  {rows.length} attendee{rows.length !== 1 ? "s" : ""}
                </Badge>
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pl-4 pt-2">
            {rows.map((a) => {
              const isRegistered = Boolean(
                a.participant_email && registeredEmails.has(a.participant_email.toLowerCase()),
              );
              return (
                <div key={a.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {a.participant_name ?? "(sin nombre)"}
                      </span>
                      {a.participant_email && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {a.participant_email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isRegistered ? "default" : "outline"} className="text-xs">
                        {isRegistered ? "Registered" : "Walk-in"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((a.duration_seconds ?? 0) / 60)} min
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {formatDateTime(a.joined_at)}
                    {a.left_at ? ` · Left ${formatDateTime(a.left_at)}` : ""}
                  </p>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
          {selected
            ? "No attendance reported by Zoom for this meeting yet."
            : "Schedule a meeting to start tracking attendance."}
        </div>
      )}

      {noShows.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between rounded-lg border border-border px-4 py-3 text-foreground hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-destructive" />
                <span className="font-medium">Registered, Didn't Join</span>
                <Badge variant="secondary" className="text-xs">
                  {noShows.length}
                </Badge>
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pl-4 pt-2">
            {noShows.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-3"
              >
                <span className="text-sm font-medium text-foreground">{r.full_name}</span>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <a
                    href={`mailto:${r.email}`}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Mail className="h-3 w-3" />
                    {r.email}
                  </a>
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {r.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
