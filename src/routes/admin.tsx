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
      { title: "Portal de administración — Ayuda Sobria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof adminGetOverview>>;
type Recording = Overview["recordings"][number];

type PageStatus = "loading" | "unauth" | "forbidden" | "error" | "ready";

const dateTimeFormatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Los_Angeles",
});
const dateFormatter = new Intl.DateTimeFormat("es-US", {
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
      scheduling: "Programando",
      ready: "Lista",
      started: "En curso",
      ended: "Finalizada",
      failed: "Falló",
    }[status] ?? status
  );
}

function registrationLabel(status: string) {
  return (
    { registering: "Registrando", registered: "Registrado", failed: "Falló" }[status] ?? status
  );
}

function emailLabel(status: string) {
  return { pending: "Pendiente", sent: "Enviado", failed: "Falló" }[status] ?? status;
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
      setPageError(error instanceof Error ? error.message : "No se pudo cargar el panel.");
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
    // La comprobación de acceso y el resumen se cargan una sola vez al abrir el portal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "¿Revocar el acceso de Zoom y eliminar esta inscripción? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      await del({ data: { id } });
      toast.success("Inscripción eliminada");
      await refresh({ preserveStatus: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la inscripción");
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
    toast.success(published ? "Grabación guardada y publicada" : "Grabación guardada sin publicar");
    await refresh({ preserveStatus: true });
  }

  if (status === "loading") {
    return (
      <SiteLayout>
        <div
          className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground"
          role="status"
        >
          Cargando el portal de administración…
        </div>
      </SiteLayout>
    );
  }

  if (status === "unauth") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Portal de administración</h1>
          <p className="text-muted-foreground">
            Inicia sesión con una cuenta autorizada para continuar.
          </p>
          <Button onClick={() => navigate({ to: "/auth", search: { redirect: "/admin" } })}>
            Iniciar sesión
          </Button>
        </div>
      </SiteLayout>
    );
  }

  if (status === "forbidden") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Sin acceso</h1>
          <p className="text-muted-foreground">Tu cuenta no tiene permisos de administrador.</p>
          <Link to="/" className="text-primary underline">
            Volver al inicio
          </Link>
        </div>
      </SiteLayout>
    );
  }

  if (status === "error" || !data) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">No pudimos cargar el portal</h1>
          <p className="text-muted-foreground">
            {pageError ?? "Ocurrió un error inesperado. Intenta nuevamente."}
          </p>
          <Button onClick={() => void refresh()}>Intentar de nuevo</Button>
          <p className="text-sm text-muted-foreground">
            Si el problema continúa, llama al{" "}
            <a className="font-medium text-primary underline" href="tel:+14582988011">
              458-298-8011
            </a>
            .
          </p>
        </div>
      </SiteLayout>
    );
  }

  const attendanceByOccurrence = new Map<string, Set<string>>();
  data.attendance.forEach((entry: any) => {
    const participants = attendanceByOccurrence.get(entry.occurrence_id) ?? new Set<string>();
    participants.add(entry.participant_key);
    attendanceByOccurrence.set(entry.occurrence_id, participants);
  });
  const occurrenceById = new Map(data.occurrences.map((occurrence: any) => [occurrence.id, occurrence]));
  const publishedCount = data.recordings.filter((recording: any) => recording.published).length;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-semibold">Portal de administración</h1>
            <p className="text-muted-foreground">
              Ayuda Sobria — panel interno de membresías y La Sobremesa
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void refresh({ preserveStatus: true })}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando…" : "Actualizar datos"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Inscripciones" value={data.stats.registrations} />
          <StatCard title="Miembros activos" value={data.stats.activeMembers} />
          <StatCard title="Pagos de coaching" value={data.stats.coachingOrders} />
          <StatCard title="Grabaciones publicadas" value={publishedCount} />
        </div>

        <Tabs defaultValue="occurrences">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max flex-wrap justify-start">
              <TabsTrigger value="occurrences">Reuniones</TabsTrigger>
              <TabsTrigger value="registrations">Inscritos y preguntas</TabsTrigger>
              <TabsTrigger value="attendance">Asistencia</TabsTrigger>
              <TabsTrigger value="recordings">Grabaciones</TabsTrigger>
              <TabsTrigger value="memberships">Membresías</TabsTrigger>
              <TabsTrigger value="coaching">Coaching</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="occurrences" className="space-y-3">
            <SectionIntro
              title="Reuniones de La Sobremesa"
              description="Programación, estado de Zoom, enlaces y asistencia de cada lunes a las 8:00 p. m. (hora del Pacífico)."
            />
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Fecha programada</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Zoom ID</th>
                      <th className="p-3">Inscritos</th>
                      <th className="p-3">Asistentes</th>
                      <th className="p-3">Enlaces</th>
                      <th className="p-3">Detalle operativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.occurrences.length === 0 && (
                      <EmptyTable colSpan={7}>Aún no hay reuniones programadas.</EmptyTable>
                    )}
                    {data.occurrences.map((occurrence: any) => {
                      const registrationCount = data.registrations.filter(
                        (registration) => registration.occurrence_id === occurrence.id,
                      ).length;
                      return (
                        <tr key={occurrence.id} className="border-t align-top">
                          <td className="p-3">
                            <div className="font-medium">
                              {formatLocalDate(occurrence.occurrence_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateTime(occurrence.starts_at)} · Pacífico
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
                                  Participante <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">Sin enlace</span>
                              )}
                              {occurrence.start_url && (
                                <a
                                  href={occurrence.start_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Anfitrión <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="max-w-xs p-3 text-xs">
                            {occurrence.failure_reason ? (
                              <span className="text-destructive">{occurrence.failure_reason}</span>
                            ) : occurrence.ended_at ? (
                              `Finalizó ${formatDateTime(occurrence.ended_at)}`
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
              title="Inscritos, preguntas y entregas"
              description="Revisa lo que preguntó cada persona y confirma el estado real de su registro y correo."
            />
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Persona</th>
                      <th className="p-3">Contacto</th>
                      <th className="p-3">Reunión</th>
                      <th className="p-3">Pregunta</th>
                      <th className="p-3">Registro Zoom</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Preferencias</th>
                      <th className="p-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations.length === 0 && (
                      <EmptyTable colSpan={9}>Sin inscripciones aún.</EmptyTable>
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
                              {registration.relationship ?? "Relación no indicada"}
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
                              : "Sin asignar"}
                          </td>
                          <td className="max-w-sm whitespace-pre-wrap p-3">
                            {registration.submitted_question || "Sin pregunta"}
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
                                ? "Registro semanal"
                                : "Solo esta reunión"}
                            </div>
                            {registration.request_follow_up && (
                              <div className="mt-1">
                                <div>Solicitó seguimiento</div>
                                <div className="text-muted-foreground">
                                  Preferencia: {registration.preferred_contact_date || "sin fecha"}{" "}
                                  · {registration.preferred_contact_time || "sin hora"} ·{" "}
                                  {registration.preferred_timezone || "sin zona horaria"}
                                </div>
                              </div>
                            )}
                            {registration.reminder_sent_at && (
                              <div className="text-muted-foreground">
                                Recordatorio: {formatDateTime(registration.reminder_sent_at)}
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
              title="Asistencia registrada por Zoom"
              description="Entradas, salidas y duración reportadas por los eventos de Zoom."
            />
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Reunión</th>
                      <th className="p-3">Participante</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Entrada</th>
                      <th className="p-3">Salida</th>
                      <th className="p-3">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance.length === 0 && (
                      <EmptyTable colSpan={6}>Zoom todavía no ha reportado asistencia.</EmptyTable>
                    )}
                    {data.attendance.map((entry: any) => {
                      const occurrence = occurrenceById.get(entry.occurrence_id);
                      return (
                        <tr key={entry.id} className="border-t">
                          <td className="p-3">
                            {occurrence
                              ? formatLocalDate(occurrence.occurrence_date)
                              : "Reunión no disponible"}
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
              title="Archivo de grabaciones"
              description="Añade el título, la descripción y una URL pública HTTPS. Nada aparece para miembros hasta que lo publiques."
            />
            {data.recordings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aún no se han recibido grabaciones de Zoom.
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
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Próximo cobro</th>
                      <th className="p-3">PayPal ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.memberships.length === 0 && (
                      <EmptyTable colSpan={7}>Sin membresías aún.</EmptyTable>
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
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Sesión</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coaching.length === 0 && (
                      <EmptyTable colSpan={6}>Sin pagos aún.</EmptyTable>
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
        setError("La URL pública debe ser un enlace HTTPS válido.");
        return;
      }
    }
    if (published && !normalizedUrl) {
      setError("Añade una URL pública HTTPS antes de publicar.");
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
        saveError instanceof Error ? saveError.message : "No se pudo guardar la grabación.";
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
              {recording.title || recording.topic || "Grabación de La Sobremesa"}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(recording.started_at)}
              {recording.duration_minutes != null ? ` · ${recording.duration_minutes} min` : ""}
            </p>
          </div>
          <Badge variant={recording.published ? "default" : "secondary"}>
            {recording.published ? "Publicada" : "Sin publicar"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`recording-title-${recording.id}`}>Título para miembros</Label>
            <Input
              id={`recording-title-${recording.id}`}
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="La Sobremesa — tema de la semana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`recording-url-${recording.id}`}>URL pública HTTPS</Label>
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
              Usa únicamente un enlace seguro preparado para compartir con miembros. El enlace
              recibido de Zoom permanece privado hasta que lo revises y lo copies aquí.
            </p>
            {recording.provider_share_url && !publicUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPublicUrl(recording.provider_share_url ?? "")}
              >
                Usar enlace recibido de Zoom
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`recording-passcode-${recording.id}`}>Código para miembros</Label>
            <Input
              id={`recording-passcode-${recording.id}`}
              value={publicPasscode}
              maxLength={128}
              onChange={(event) => setPublicPasscode(event.target.value)}
              placeholder="Opcional"
            />
            <p className="text-xs text-muted-foreground">
              Si Zoom exige un código, publícalo junto al enlace para que los miembros puedan abrir
              la grabación.
            </p>
            {recording.provider_play_passcode && !publicPasscode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPublicPasscode(recording.provider_play_passcode ?? "")}
              >
                Usar código recibido de Zoom
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`recording-description-${recording.id}`}>Descripción</Label>
          <Textarea
            id={`recording-description-${recording.id}`}
            value={description}
            maxLength={4000}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Resume los temas tratados en esta reunión."
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save(recording.published)} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
          {recording.published ? (
            <Button variant="outline" onClick={() => void save(false)} disabled={saving}>
              Retirar de miembros
            </Button>
          ) : (
            <Button variant="outline" onClick={() => void save(true)} disabled={saving}>
              Publicar para miembros
            </Button>
          )}
          {recording.public_url && (
            <Button variant="ghost" asChild>
              <a href={recording.public_url} target="_blank" rel="noreferrer">
                Abrir enlace <ExternalLink className="ml-2 h-4 w-4" />
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
