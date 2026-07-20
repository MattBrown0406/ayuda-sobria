import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, ExternalLink, LockKeyhole, Video } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getMemberZoomRecordings } from "@/lib/zoom.functions";

export const Route = createFileRoute("/grabaciones")({
  head: () => ({
    meta: [
      { title: "Grabaciones para miembros — Ayuda Sobria" },
      {
        name: "description",
        content:
          "Reuniones anteriores de La Sobremesa disponibles para miembros activos de Ayuda Sobria.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GrabacionesPage,
});

type Recording = Awaited<ReturnType<typeof getMemberZoomRecordings>>[number];
type PageState =
  | { name: "loading" }
  | { name: "unauthenticated" }
  | { name: "no-membership" }
  | { name: "error"; message: string }
  | { name: "ready"; recordings: Recording[] };

const dateFormatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "long",
  timeZone: "America/Los_Angeles",
});

function GrabacionesPage() {
  const getRecordings = useServerFn(getMemberZoomRecordings);
  const [state, setState] = useState<PageState>({ name: "loading" });

  async function loadRecordings() {
    setState({ name: "loading" });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setState({
          name: "error",
          message: "No pudimos comprobar tu sesión. Intenta nuevamente.",
        });
        return;
      }
      if (!data.session) {
        setState({ name: "unauthenticated" });
        return;
      }

      const recordings = await getRecordings();
      setState({ name: "ready", recordings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/membership required/i.test(message)) {
        setState({ name: "no-membership" });
      } else if (/unauthorized|not authenticated|auth session missing/i.test(message)) {
        setState({ name: "unauthenticated" });
      } else {
        console.error(error);
        setState({
          name: "error",
          message: "No pudimos cargar las grabaciones en este momento.",
        });
      }
    }
  }

  useEffect(() => {
    void loadRecordings();
    // La sesión y la biblioteca se comprueban al abrir esta página privada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <LockKeyhole className="h-4 w-4" /> Biblioteca para miembros
          </div>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Reuniones grabadas de La Sobremesa
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Vuelve a escuchar las conversaciones y herramientas compartidas en reuniones anteriores.
            El catálogo y los enlaces aprobados se muestran solamente después de validar una
            membresía vigente; no compartas enlaces de terceros fuera del programa.
          </p>
        </div>
      </section>

      <main className="mx-auto min-h-[360px] max-w-6xl px-4 py-10 sm:py-12">
        {state.name === "loading" && <LoadingState />}
        {state.name === "unauthenticated" && <UnauthenticatedState />}
        {state.name === "no-membership" && <NoMembershipState />}
        {state.name === "error" && (
          <MessageCard
            icon={<Video className="h-7 w-7" />}
            title="No pudimos abrir la biblioteca"
            description={state.message}
          >
            <Button onClick={() => void loadRecordings()}>Intentar de nuevo</Button>
            <SupportLine />
          </MessageCard>
        )}
        {state.name === "ready" && state.recordings.length === 0 && <EmptyState />}
        {state.name === "ready" && state.recordings.length > 0 && (
          <RecordingLibrary recordings={state.recordings} />
        )}
      </main>
    </SiteLayout>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Comprobando tu membresía y cargando las grabaciones…</span>
      <div className="h-5 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-lg border border-border bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}

function UnauthenticatedState() {
  return (
    <MessageCard
      icon={<LockKeyhole className="h-7 w-7" />}
      title="Inicia sesión para continuar"
      description="Necesitamos comprobar tu cuenta antes de mostrar contenido exclusivo para miembros."
    >
      <Button asChild>
        <Link to="/auth" search={{ redirect: "/grabaciones" }}>
          Iniciar sesión
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        ¿Todavía no tienes una cuenta? Puedes crearla desde la misma pantalla de acceso.
      </p>
    </MessageCard>
  );
}

function NoMembershipState() {
  return (
    <MessageCard
      icon={<LockKeyhole className="h-7 w-7" />}
      title="Se necesita una membresía vigente"
      description="Tu sesión está activa, pero no encontramos una membresía con acceso vigente para esta biblioteca."
    >
      <Button asChild>
        <Link to="/membresia">Ver opciones de membresía</Link>
      </Button>
      <SupportLine prefix="Si crees que esto es un error" />
    </MessageCard>
  );
}

function EmptyState() {
  return (
    <MessageCard
      icon={<Video className="h-7 w-7" />}
      title="Todavía no hay grabaciones publicadas"
      description="Tu acceso está confirmado. Cuando el equipo revise y publique una reunión, aparecerá aquí."
    >
      <Link to="/circulo-familiar" className="text-sm font-medium text-primary hover:underline">
        Conocer más sobre La Sobremesa
      </Link>
    </MessageCard>
  );
}

function RecordingLibrary({ recordings }: { recordings: Recording[] }) {
  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Reuniones disponibles</h2>
          <p className="text-sm text-muted-foreground">
            {recordings.length === 1
              ? "Hay 1 grabación publicada."
              : `Hay ${recordings.length} grabaciones publicadas.`}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Fechas mostradas en hora del Pacífico</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {recordings.map((recording) => (
          <RecordingCard key={recording.id} recording={recording} />
        ))}
      </div>
    </div>
  );
}

function RecordingCard({ recording }: { recording: Recording }) {
  const title = recording.title?.trim() || "La Sobremesa";
  const description = recording.description?.trim();
  const publicUrl = getHttpsUrl(recording.public_url);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="h-1.5 bg-primary" />
      <CardHeader className="pb-3">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {dateFormatter.format(new Date(recording.started_at))}
          </span>
          {recording.duration_minutes != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatMinutes(recording.duration_minutes)}
            </span>
          )}
        </div>
        <CardTitle className="text-xl leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="mb-6 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {description || "Reunión anterior de La Sobremesa disponible para miembros."}
        </p>
        {publicUrl ? (
          <div className="space-y-3">
            {recording.public_play_passcode && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                Código de acceso: <strong>{recording.public_play_passcode}</strong>
              </p>
            )}
            <Button asChild className="w-full sm:w-fit">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                Ver grabación <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            El enlace de esta grabación no está disponible en este momento.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessageCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardContent className="flex flex-col items-center gap-4 p-8 sm:p-10">
        <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function SupportLine({ prefix = "¿Necesitas ayuda?" }: { prefix?: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {prefix}, llama al{" "}
      <a className="font-medium text-primary hover:underline" href="tel:+14582988011">
        458-298-8011
      </a>
      .
    </p>
  );
}

function formatMinutes(minutes: number) {
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

function getHttpsUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
