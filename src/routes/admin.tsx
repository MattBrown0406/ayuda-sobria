import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCheckAccess,
  adminDeleteRegistration,
  adminGetOverview,
  adminUpdateZoomRecording,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Ayuda Sobria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof adminGetOverview>>;
type Recording = Overview["recordings"][number];

type PageStatus = "loading" | "unauth" | "forbidden" | "error" | "ready";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Los_Angeles",
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "America/Los_Angeles",
});

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function formatLocalDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00-08:00`)) : "—";
}

function occurrenceLabel(status: string) {
  return (
    {
      scheduling: "Scheduling",
      ready: "Ready",
      started: "In progress",
      ended: "Ended",
      failed: "Failed",
    }[status] ?? status
  );
}

function registrationLabel(status: string) {
  return (
    { registering: "Registering", registered: "Registered", failed: "Failed" }[status] ?? status
  );
}

function emailLabel(status: string) {
  return { pending: "Pending", sent: "Sent", failed: "Failed" }[status] ?? status;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["ready", "registered", "sent", "active", "ended"].includes(status)) return "default";
  if (status === "failed") return "destructive";
  if (["pending", "scheduling", "registering"].includes(status)) return "secondary";
  return "outline";
}

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(adminCheckAccess);
  const load = useServerFn(adminGetOverview);
  const del = useServerFn(adminDeleteRegistration);
  const updateRecording = useServerFn(adminUpdateZoomRecording);

  const [status, setStatus] = useState<PageStatus>("loading");
  const [data, setData] = useState<Overview | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh(options?: { preserveStatus?: boolean }) {
    if (options?.preserveStatus) setRefreshing(true);
    else setStatus("loading");
    setPageError(null);

    try {
      const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionResult.session) {
        setStatus("unauth");
        return;
      }

      const access = await check();
      if (!access.isAdmin) {
        setStatus("forbidden");
        return;
      }

      setData(await load());
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setPageError(error instanceof Error ? error.message : "Could not load the dashboard.");
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
    // Access check and overview load once when the portal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Revoke Zoom access and delete this registration? This cannot be undone.",
      )
    )
      return;
    try {
      await del({ data: { id } });
      toast.success("Registration deleted");
      await refresh({ preserveStatus: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the registration");
    }
  }

  async function handleRecordingUpdate(
    recording: Recording,
    draft: { title: string; description: string; publicUrl: string; publicPasscode: string },
    published: boolean,
  ) {
    await updateRecording({
      data: {
        id: recording.id,
        published,
        title: draft.title,
        description: draft.description,
        publicUrl: draft.publicUrl,
        publicPasscode: draft.publicPasscode,
      },
    });
    toast.success(published ? "Recording saved and published" : "Recording saved (unpublished)");
    await refresh({ preserveStatus: true });
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground"
          role="status"
        >
          Loading admin portal…
        </div>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Admin Portal</h1>
          <p className="text-muted-foreground">
            Sign in with an authorized account to continue.
          </p>
          <Button onClick={() => navigate({ to: "/auth", search: { redirect: "/admin" } })}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">No access</h1>
          <p className="text-muted-foreground">Your account does not have admin permissions.</p>
          <Link to="/" className="text-primary underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">We could not load the portal</h1>
          <p className="text-muted-foreground">
            {pageError ?? "An unexpected error occurred. Please try again."}
          </p>
          <Button onClick={() => void refresh()}>Try again</Button>
          <p className="text-sm text-muted-foreground">
            If the problem persists, call{" "}
            <a className="font-medium text-primary underline" href="tel:+14582988011">
              458-298-8011
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const attendanceByOccurrence = new Map<string, Set<string>>();
  data.attendance.forEach((entry: any) => {
    const participants = attendanceByOccurrence.get(entry.occurrence_id) ?? new Set<string>();
    participants.add(entry.participant_key);
    attendanceByOccurrence.set(entry.occurrence_id, participants);
  });
  const occurrenceById = new Map<string, any>(
    data.occurrences.map((occurrence: any) => [occurrence.id, occurrence]),
  );
  const publishedCount = data.recordings.filter((recording: any) => recording.published).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-semibold">Admin Portal</h1>
            <p className="text-muted-foreground">
              Ayuda Sobria — internal dashboard for memberships and La Sobremesa
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void refresh({ preserveStatus: true })}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh data"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Registrations" value={data.stats.registrations} />
          <StatCard title="Active members" value={data.stats.activeMembers} />
          <StatCard title="Coaching payments" value={data.stats.coachingOrders} />
          <StatCard title="Published recordings" value={publishedCount} />
        </div>

        <Tabs defaultValue="occurrences">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max flex-wrap justify-start">
              <TabsTrigger value="occurrences">Meetings</TabsTrigger>
              <TabsTrigger value="registrations">Registrants & questions</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
              <TabsTrigger value="memberships">Memberships</TabsTrigger>
              <TabsTrigger value="coaching">Coaching</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="occurrences" className="space-y-3">
            <SectionIntro
              title="La Sobremesa meetings"
              description="Schedule, Zoom status, links, and attendance for each Monday at 8:00 PM Pacific."
            />
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Scheduled date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Zoom ID</th>
                      <th className="p-3">Registered</th>
                      <th className="p-3">Attendees</th>
                      <th className="p-3">Links</th>
                      <th className="p-3">Operations detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.occurrences.length === 0 && (
                      <EmptyTable colSpan={7}>No meetings scheduled yet.</EmptyTable>
                    )}
                    {data.occurrences.map((occurrence: any) => {
                      const registrationCount = data.registrations.filter(
                        (registration: any) => registration.occurrence_id === occurrence.id,
                      ).length;
                      return (
                        <tr key={occurrence.id} className="border-t align-top">
                          <td className="p-3">
                            <div className="font-medium">
                              {formatLocalDate(occurrence.occurrence_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(occurrence.starts_at)} · Pacific
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={statusVariant(occurrence.status)}>
                              {occurrenceLabel(occurrence.status)}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {occurrence.zoom_meeting_id ?? "—"}
                          </td>
                          <td className="p-3">{registrationCount}</td>
                          <td className="p-3">
                            {attendanceByOccurrence.get(occurrence.id)?.size ?? 0}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col items-start gap-1">
                              {occurrence.join_url ? (
                                <a
                                  href={occurrence.join_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Attendee <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No link</span>
                              )}
                              {occurrence.start_url && (
                                <a
                                  href={occurrence.start_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Host <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="max-w-xs p-3 text-xs">
                            {occurrence.failure_reason ? (
                              <span className="text-destructive">{occurrence.failure_reason}</span>
                            ) : occurrence.ended_at ? (
                              `Ended ${formatDateTime(occurrence.ended_at)}`
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations" className="space-y-3">
            <SectionIntro
              title="Registrants, questions & deliveries"
              description="Review each person's question and confirm the real status of their registration and email."
            />
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Person</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Meeting</th>
                      <th className="p-3">Question</th>
                      <th className="p-3">Zoom registration</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Preferences</th>
                      <th className="p-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations.length === 0 && (
                      <EmptyTable colSpan={9}>No registrations yet.</EmptyTable>
                    )}
                    {data.registrations.map((registration: any) => {
                      const occurrence = registration.occurrence_id
                        ? occurrenceById.get(registration.occurrence_id)
                        : null;
                      return (
                        <tr key={registration.id} className="border-t align-top">
                          <td className="whitespace-nowrap p-3">
                            {formatDateTime(registration.created_at)}
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{registration.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {registration.relationship ?? "Relationship not provided"}
                            </div>
                          </td>
                          <td className="p-3">
                            <a
                              className="block text-primary hover:underline"
                              href={`mailto:${registration.email}`}
                            >
                              {registration.email}
                            </a>
                            {registration.phone && (
                              <a
                                className="block text-primary hover:underline"
                                href={`tel:${registration.phone}`}
                              >
                                {registration.phone}
                              </a>
                            )}
                          </td>
                          <td className="p-3">
                            {occurrence
                              ? formatLocalDate(occurrence.occurrence_date)
                              : "Unassigned"}
                          </td>
                          <td className="max-w-sm whitespace-pre-wrap p-3">
                            {registration.submitted_question || "No question"}
                          </td>
                          <td className="p-3">
                            <Badge variant={statusVariant(registration.zoom_registration_status)}>
                              {registrationLabel(registration.zoom_registration_status)}
                            </Badge>
                            {registration.zoom_failure_reason && (
                              <p className="mt-1 max-w-xs text-xs text-destructive">
                                {registration.zoom_failure_reason}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={statusVariant(registration.confirmation_email_status)}>
                              {emailLabel(registration.confirmation_email_status)}
                            </Badge>
                            {registration.confirmation_email_error && (
                              <p className="mt-1 max-w-xs text-xs text-destructive">
                                {registration.confirmation_email_error}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-xs">
                            <div>
                              {registration.auto_register
                                ? "Weekly registration"
                                : "This meeting only"}
                            </div>
                            {registration.request_follow_up && (
                              <div className="mt-1">
                                <div>Requested follow-up</div>
                                <div className="text-muted-foreground">
                                  Preference: {registration.preferred_contact_date || "no date"}{" "}
                                  · {registration.preferred_contact_time || "no time"} ·{" "}
                                  {registration.preferred_timezone || "no timezone"}
                                </div>
                              </div>
                            )}
                            {registration.reminder_sent_at && (
                              <div className="text-muted-foreground">
                                Reminder: {formatDateTime(registration.reminder_sent_at)}
                              </div>
                            )}
                            {registration.reminder_error && (
                              <div className="text-destructive">{registration.reminder_error}</div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDelete(registration.id)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-3">
            <SectionIntro
              title="Attendance reported by Zoom"
              description="Joins, leaves, and duration reported by Zoom events."
            />
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Meeting</th>
                      <th className="p-3">Participant</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3">Left</th>
                      <th className="p-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance.length === 0 && (
                      <EmptyTable colSpan={6}>Zoom has not reported attendance yet.</EmptyTable>
                    )}
                    {data.attendance.map((entry: any) => {
                      const occurrence = occurrenceById.get(entry.occurrence_id);
                      return (
                        <tr key={entry.id} className="border-t">
                          <td className="p-3">
                            {occurrence
                              ? formatLocalDate(occurrence.occurrence_date)
                              : "Meeting unavailable"}
                          </td>
                          <td className="p-3 font-medium">{entry.participant_name}</td>
                          <td className="p-3">{entry.participant_email ?? "—"}</td>
                          <td className="p-3">{formatDateTime(entry.joined_at)}</td>
                          <td className="p-3">{formatDateTime(entry.left_at)}</td>
                          <td className="p-3">{formatDuration(entry.duration_seconds)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recordings" className="space-y-3">
            <SectionIntro
              title="Recording archive"
              description="Add a title, description, and a public HTTPS URL. Nothing appears to members until you publish it."
            />
            {data.recordings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No Zoom recordings received yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data.recordings.map((recording: any) => (
                  <RecordingEditor
                    key={`${recording.id}-${recording.updated_at}`}
                    recording={recording}
                    onSave={handleRecordingUpdate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="memberships">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Next charge</th>
                      <th className="p-3">PayPal ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.memberships.length === 0 && (
                      <EmptyTable colSpan={7}>No memberships yet.</EmptyTable>
                    )}
                    {data.memberships.map((membership: any) => (
                      <tr key={membership.id} className="border-t">
                        <td className="p-3">{formatDateTime(membership.created_at)}</td>
                        <td className="p-3">
                          {membership.profile
                            ? `${membership.profile.first_name ?? ""} ${membership.profile.last_name ?? ""}`.trim() ||
                              membership.user_id.slice(0, 8)
                            : membership.user_id.slice(0, 8)}
                        </td>
                        <td className="p-3">{membership.plan_type ?? "monthly"}</td>
                        <td className="p-3">
                          <Badge variant={statusVariant(membership.status)}>
                            {membership.status}
                          </Badge>
                        </td>
                        <td className="p-3">US${membership.amount}</td>
                        <td className="p-3">
                          {membership.next_billing_date
                            ? formatDate(membership.next_billing_date)
                            : "—"}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {membership.paypal_subscription_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coaching">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[750px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Session</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coaching.length === 0 && (
                      <EmptyTable colSpan={6}>No payments yet.</EmptyTable>
                    )}
                    {data.coaching.map((order: any) => (
                      <tr key={order.id} className="border-t">
                        <td className="p-3">{formatDateTime(order.created_at)}</td>
                        <td className="p-3">{order.customer_name ?? "—"}</td>
                        <td className="p-3">{order.customer_email ?? "—"}</td>
                        <td className="p-3">{order.session_type}</td>
                        <td className="p-3">US${order.amount}</td>
                        <td className="p-3">{order.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  );
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="pt-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyTable({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

function RecordingEditor({
  recording,
  onSave,
}: {
  recording: Recording;
  onSave: (
    recording: Recording,
    draft: { title: string; description: string; publicUrl: string; publicPasscode: string },
    published: boolean,
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(recording.title ?? recording.topic ?? "La Sobremesa");
  const [description, setDescription] = useState(recording.description ?? "");
  const [publicUrl, setPublicUrl] = useState(recording.public_url ?? "");
  const [publicPasscode, setPublicPasscode] = useState(recording.public_play_passcode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(published: boolean) {
    setError(null);
    const normalizedUrl = publicUrl.trim();
    if (normalizedUrl) {
      try {
        const parsed = new URL(normalizedUrl);
        if (parsed.protocol !== "https:") throw new Error();
      } catch {
        setError("The public URL must be a valid HTTPS link.");
        return;
      }
    }
    if (published && !normalizedUrl) {
      setError("Add a public HTTPS URL before publishing.");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        recording,
        { title, description, publicUrl: normalizedUrl, publicPasscode },
        published,
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Could not save the recording.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="text-lg">
              {recording.title || recording.topic || "La Sobremesa recording"}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(recording.started_at)}
              {recording.duration_minutes != null ? ` · ${recording.duration_minutes} min` : ""}
            </p>
          </div>
          <Badge variant={recording.published ? "default" : "secondary"}>
            {recording.published ? "Published" : "Unpublished"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`recording-title-${recording.id}`}>Title for members</Label>
            <Input
              id={`recording-title-${recording.id}`}
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="La Sobremesa — topic of the week"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`recording-url-${recording.id}`}>Public HTTPS URL</Label>
            <Input
              id={`recording-url-${recording.id}`}
              type="url"
              inputMode="url"
              value={publicUrl}
              onChange={(event) => setPublicUrl(event.target.value)}
              placeholder="https://…"
              aria-describedby={`recording-url-help-${recording.id}`}
            />
            <p id={`recording-url-help-${recording.id}`} className="text-xs text-muted-foreground">
              Use only a safe link ready to share with members. The Zoom-provided link stays private until you review it and copy it here.
            </p>
            {recording.provider_share_url && !publicUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPublicUrl(recording.provider_share_url ?? "")}
              >
                Use link received from Zoom
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`recording-passcode-${recording.id}`}>Passcode for members</Label>
            <Input
              id={`recording-passcode-${recording.id}`}
              value={publicPasscode}
              maxLength={128}
              onChange={(event) => setPublicPasscode(event.target.value)}
              placeholder="Optional"
            />
            <p className="text-xs text-muted-foreground">
              If Zoom requires a passcode, publish it alongside the link so members can open the recording.
            </p>
            {recording.provider_play_passcode && !publicPasscode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPublicPasscode(recording.provider_play_passcode ?? "")}
              >
                Use passcode received from Zoom
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`recording-description-${recording.id}`}>Description</Label>
          <Textarea
            id={`recording-description-${recording.id}`}
            value={description}
            maxLength={4000}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Summarize the topics covered in this meeting."
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save(recording.published)} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {recording.published ? (
            <Button variant="outline" onClick={() => void save(false)} disabled={saving}>
              Unpublish for members
            </Button>
          ) : (
            <Button variant="outline" onClick={() => void save(true)} disabled={saving}>
              Publish for members
            </Button>
          )}
          {recording.public_url && (
            <Button variant="ghost" asChild>
              <a href={recording.public_url} target="_blank" rel="noreferrer">
                Open link <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} s`;
  return remainingSeconds === 0 ? `${minutes} min` : `${minutes} min ${remainingSeconds} s`;
}
