import { createFileRoute } from "@tanstack/react-router";
import {
  Phone,
  LogIn,
  AlertTriangle,
  Calendar,
  Clock,
  Shield,
  Building2,
  ChevronDown,
  Check,
  BookOpen,
  HeartHandshake,
  Users,
  MessageCircle,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import logo from "@/assets/logo.png";
import counselorAsset from "@/assets/counselor.png.asset.json";
const counselor = counselorAsset.url;

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AyudaSobria — Apoyo para familias afectadas por la adicción" },
      {
        name: "description",
        content:
          "Reunión gratuita los lunes, sesiones privadas cuando no puedes esperar y evaluación de intervención. Orientación en español para familias.",
      },
      { property: "og:title", content: "AyudaSobria — Apoyo para familias" },
      {
        property: "og:description",
        content:
          "Deja de adivinar el próximo paso. Recibe el nivel adecuado de ayuda familiar frente a la adicción.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const PHONE_DISPLAY = "(458) 298-8011";
const PHONE_HREF = "tel:4582988011";
const EMAIL = "matt@soberhelpline.com";

function Nav() {
  const links = [
    { label: "Consulta de crisis", href: "#crisis" },
    { label: "Círculo Familiar", href: "#circulo" },
    { label: "Intervención", href: "#intervencion" },
    { label: "Opciones de tratamiento", href: "#tratamiento" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
        <a href="#top" className="flex items-center gap-2">
          <img src={logo} alt="AyudaSobria" width={40} height={40} className="h-10 w-10" />
          <span className="text-lg font-semibold tracking-tight">AyudaSobria</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            Aprender <ChevronDown className="h-4 w-4" />
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={PHONE_HREF}
            className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold sm:inline-flex"
          >
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
          <a
            href="#circulo"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Reunión gratis del lunes
          </a>
          <a
            href="/ingresar"
            className="hidden items-center gap-1 rounded-md border border-input px-3 py-2 text-sm font-medium lg:inline-flex"
          >
            <LogIn className="h-4 w-4" /> Ingresar
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-secondary/40 to-background"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Apoyo gratuito en vivo y guía de próximos
            pasos para familias
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Deja de adivinar qué hacer.
            <span className="mt-2 block bg-gradient-to-r from-chart-3 via-primary to-chart-5 bg-clip-text text-transparent">
              Encuentra el nivel adecuado de ayuda familiar frente a la adicción.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            AyudaSobria acompaña a las familias a pasar de la preocupación a la acción. Únete al
            Círculo Familiar los lunes, agenda una sesión privada si no puedes esperar, o evalúa si
            es el momento de una intervención.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="#circulo"
              className="flex items-start gap-3 rounded-lg border-2 border-primary/80 bg-primary p-4 text-left text-primary-foreground hover:bg-primary/90"
            >
              <Calendar className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold leading-snug">
                Únete al Círculo Familiar gratuito
              </span>
            </a>
            <a
              href="/coaching-familiar"
              className="flex items-start gap-3 rounded-lg border-2 border-chart-4/60 bg-chart-4/10 p-4 text-left text-foreground hover:bg-chart-4/20"
            >
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-chart-4" />
              <span className="text-sm font-semibold leading-snug">
                ¿No puedes esperar al lunes? Reserva una sesión ahora
              </span>
            </a>
            <a
              href="#intervencion"
              className="flex items-start gap-3 rounded-lg border-2 border-chart-4/40 bg-accent p-4 text-left text-foreground hover:bg-accent/70"
            >
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-chart-4" />
              <span className="text-sm font-semibold leading-snug">
                Evalúa la disposición para una intervención
              </span>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>Apoyo gratuito los lunes a las 7 PM (Pacífico)</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
            <span>Sesiones privadas desde US$150 (USD)</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
            <a href={PHONE_HREF} className="font-semibold text-primary">
              Llama {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <HeartHandshake className="h-3.5 w-3.5" /> Guía confiable, privada y centrada en la
            familia
          </span>
          <h2 className="mt-4 text-2xl font-bold">
            Trabaja con <span className="text-primary">Matt Brown</span>
          </h2>
          <div className="mt-4 flex gap-4">
            <img
              src={counselor}
              alt="Matt Brown"
              width={120}
              height={120}
              className="h-28 w-28 rounded-lg object-cover"
              loading="lazy"
            />
            <p className="text-sm text-muted-foreground">
              Matt cuenta con más de 22 años de experiencia acompañando a familias frente a la
              adicción. Ayuda a pensar con claridad en los momentos difíciles, a evaluar opciones de
              tratamiento con ética y a dejar de sentirse presionados por la industria.
            </p>
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              "Consultas privadas y coaching familiar",
              "Navegación ética del tratamiento",
              "Apoyo en español e inglés",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border-l-4 border-chart-4 bg-chart-4/10 p-4">
            <p className="text-sm font-semibold">
              Empieza gratis. Avanza más rápido cuando la situación lo requiera.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Si el apoyo del lunes es suficiente, comienza con el Círculo Familiar. Si tu familia
              necesita respuestas ya, reserva una sesión privada o evalúa la intervención.
            </p>
            <a
              href="#circulo"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Regístrate en el Círculo Familiar →
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PressureLevel() {
  const items = [
    {
      tag: "Empieza aquí cuando puede esperar",
      title: "Círculo Familiar gratuito",
      body: "Usa la reunión gratuita de los lunes cuando tu familia necesita educación, perspectiva y un espacio de menor presión para hacer preguntas.",
      cta: "Únete a la reunión gratis",
      href: "#circulo",
      color: "border-primary/50",
    },
    {
      tag: "Cuando el lunes queda muy lejos",
      title: "Coaching o consulta privada",
      body: "Reserva una sesión cuando necesites respuestas directas sobre límites, tratamiento, recaída, dinero, vivienda o qué decir a continuación.",
      cta: "Reservar ayuda privada",
      href: "#consulta",
      color: "border-chart-4/60",
    },
    {
      tag: "Cuando el riesgo va en aumento",
      title: "Camino a la intervención",
      body: "Avanza hacia una intervención cuando se rechaza el tratamiento, la familia está dividida, la recaída se repite o la seguridad se ve amenazada.",
      cta: "Habla con nuestro equipo",
      href: "#intervencion",
      color: "border-destructive/50",
    },
  ];
  return (
    <section id="crisis" className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Elige según el nivel de urgencia
      </p>
      <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
        ¿Apoyo gratuito, respuestas privadas o ayuda con una intervención?
      </h2>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        AyudaSobria mantiene la reunión gratuita como un espacio confiable y hace visible el
        siguiente paso, ya sea acompañamiento pagado o alto riesgo. Las familias pueden empezar con
        calma, avanzar más rápido o pasar directamente al apoyo de intervención cuando la situación
        lo requiere.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <a
            key={it.title}
            href={it.href}
            className={`group rounded-2xl border-2 ${it.color} bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {it.tag}
            </p>
            <h3 className="mt-3 text-xl font-semibold">{it.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{it.body}</p>
            <span className="mt-6 inline-block text-sm font-semibold text-primary group-hover:underline">
              {it.cta} →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    {
      tag: "Preparación para intervención",
      q: "¿Deberíamos organizar una intervención?",
      a: "Considera planificar una intervención cuando se rechaza el tratamiento, el riesgo aumenta, las conversaciones normales ya no funcionan y la familia necesita un plan unificado en lugar de otra confrontación emocional.",
    },
    {
      tag: "Coaching privado",
      q: "¿Qué hacemos si no podemos esperar al lunes?",
      a: "Si la situación no puede esperar al Círculo Familiar, reserva una sesión de coaching privada o llama para orientación. Usa el apoyo gratuito para estabilizarte, y la ayuda privada cuando el tiempo, la seguridad o una decisión concreta apremia.",
    },
    {
      tag: "Adicción en la pareja",
      q: "¿Cómo llevo a mi pareja a tratamiento?",
      a: "Generalmente no puedes forzar el tratamiento con una sola conversación. Enfócate en la seguridad, el dinero, los hijos, los límites, las opciones de tratamiento y si necesitan coaching privado o evaluación de intervención.",
    },
    {
      tag: "Seguridad",
      q: "¿Y si tengo miedo de una sobredosis?",
      a: "Trata el miedo a la sobredosis como una señal de seguridad. Usa servicios de emergencia ante peligro inmediato, ten naloxona disponible si hay opioides, y busca orientación profesional en vez de esperar.",
    },
    {
      tag: "Decisiones de tratamiento",
      q: "¿Es lo suficientemente grave como para tratamiento?",
      a: "Si el consumo causa riesgos de seguridad, daño en las relaciones, problemas laborales, problemas legales o de salud, secretismo, recaídas o promesas rotas repetidas, es lo suficientemente serio para buscar orientación.",
    },
    {
      tag: "Recaída",
      q: "¿Qué debe hacer la familia tras una recaída?",
      a: "Responde a la recaída con seguridad primero y claridad después. Evita el pánico, el castigo o fingir que no pasó nada. La familia necesita un plan de tratamiento, límites, responsabilidad y próximos pasos.",
    },
  ];
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Preguntas frecuentes de familias
        </p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          Convierte tu búsqueda en el próximo paso correcto.
        </h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Las familias suelen llegar con una pregunta urgente. Estas respuestas te guían hacia el
          Círculo Familiar, coaching privado o evaluación de intervención sin interrumpir el camino
          de apoyo gratuito.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {qs.map((it) => (
            <a
              href="/respuestas-familia"
              key={it.q}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/60"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{it.tag}</p>
              <h3 className="mt-2 font-semibold">{it.q}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{it.a}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">
                Leer respuesta →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Situations() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Lo que aprenderás a manejar
      </p>
      <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
        Las situaciones en las que te acompañamos
      </h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Ayuda clara para los momentos que dejan a las familias atrapadas, con miedo o agotadas.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Intentando manejarlo en solitario</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "Sin apoyo real cuando todo estalla de noche o el fin de semana",
              "Semanas de espera para hablar con alguien que quizá no entiende la adicción",
              "Dudar si estás exagerando o quedándote corto",
              "Buscar en internet a las 2 a.m. sin nadie con quien procesarlo",
              "Andar pisando huevos por miedo a empeorar las cosas",
              "Sentirte juzgado por quienes nunca han vivido esto",
              "Ayudar de maneras que sin querer mantienen el ciclo",
              "Agotarte cargando demasiado sola o solo",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-destructive/70" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
          <h3 className="font-semibold">Con apoyo constante</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "Reuniones gratuitas del Círculo Familiar con otras familias que entienden",
              "Coaching por hora cuando necesitas guía uno a uno",
              "Educación clara que explica lo que estás viendo",
              "Un foro privado de familias que realmente comprenden",
              "Herramientas prácticas para límites que puedas sostener",
              "Meditaciones guiadas para los momentos de mayor estrés",
              "Guías educativas para decisiones familiares",
              "Más claridad para responder en vez de reaccionar",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            No tienes que resolver esto sola. Consigue herramientas prácticas, apoyo constante y un
            lugar para pensar con claridad de nuevo.
          </p>
          <a
            href="/membresia"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Explorar la membresía
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Prueba gratis de 7 días, luego $14.99 USD/mes. Cancela cuando quieras.
          </p>
        </div>
      </div>
    </section>
  );
}

function Programs() {
  const items = [
    {
      icon: Users,
      tag: "Apoyo semanal gratuito",
      title: "«El Círculo Familiar» cada lunes a las 7 PM (PST)",
      body: "Apoyo grupal en vivo cada lunes para cualquier familiar. No requiere membresía.",
      cta: "Regístrate ahora",
      href: "/registro",
    },
    {
      icon: BookOpen,
      tag: "Apoyo continuo",
      title: "Membresía Familiar para acompañamiento entre crisis",
      body: "Accede al foro, biblioteca de educación, grabaciones y precios preferenciales de coaching.",
      cta: "Explorar la membresía",
      href: "/membresia",
    },
    {
      icon: MessageCircle,
      tag: "Ayuda privada",
      title: "Coaching familiar cuando necesitas orientación uno a uno",
      body: "El coaching privado está para cuando el grupo y la membresía no bastan. Sesiones de emergencia desde US$150 (USD).",
      cta: "Ver opciones de coaching",
      href: "/coaching-familiar",
    },
    {
      icon: Sparkles,
      tag: "Planificación de alto impacto",
      title: "Intensivo de Preparación Familiar para decisiones mayores",
      body: "Sesión estratégica de 90 minutos más 7 días de seguimiento para familias que necesitan claridad rápido.",
      cta: "Explorar el intensivo",
      href: "/coaching-familiar",
    },
  ];
  return (
    <section id="circulo" className="border-y border-border bg-secondary/30">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-2 lg:py-24">
        {items.map(({ icon: Icon, ...it }) => (
          <a
            href={it.href}
            key={it.title}
            className="rounded-2xl border border-border bg-card p-6 hover:border-primary/60"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {it.tag}
              </p>
            </div>
            <h3 className="mt-3 font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">{it.cta} →</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Providers() {
  const cards = [
    {
      title: "Tratamiento residencial",
      body: "Programas de atención internos",
      href: "/recursos/inpatient-treatment",
    },
    {
      title: "Tratamiento ambulatorio",
      body: "Opciones flexibles de tratamiento",
      href: "/recursos/outpatient-treatment",
    },
    {
      title: "Desintoxicación médica",
      body: "Apoyo seguro para la abstinencia",
      href: "/recursos/medical-detox",
    },
    { title: "Interventores", body: "Orientación profesional", href: "/recursos/interventionists" },
    {
      title: "Coaches de sobriedad",
      body: "Apoyo personal en la recuperación",
      href: "/recursos/sober-coaches-companions",
    },
    { title: "Casas sobrias", body: "Entornos estructurados", href: "/recursos/sober-living" },
    { title: "Terapeutas", body: "Salud mental", href: "/recursos/therapists" },
    { title: "Psiquiatras", body: "Experiencia médica", href: "/recursos/psychiatrists" },
  ];
  return (
    <section id="tratamiento" className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Guía de tipos de proveedores
      </p>
      <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
        Comprende las opciones de tratamiento
      </h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Información educativa y próximos pasos prácticos para familias que necesitan claridad.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.href}
            className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{c.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function Assessments() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 lg:pb-24">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h3 className="mt-3 text-xl font-semibold">Autoevaluación de codependencia</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Comprende cómo el amor, el miedo y las buenas intenciones pueden reforzar la adicción.
          </p>
          <a href="/evaluaciones" className="mt-4 inline-block text-sm font-semibold text-primary">
            Revisar patrones familiares →
          </a>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h3 className="mt-3 text-xl font-semibold">¿Mi ser querido tiene una adicción?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Herramienta de tamizaje basada en criterios clínicos DSM-5 para familias. 11 criterios
            clínicos y puntaje de severidad.
          </p>
          <a href="/evaluaciones" className="mt-4 inline-block text-sm font-semibold text-primary">
            Revisar señales →
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      id="intervencion"
      className="border-t border-border bg-primary text-primary-foreground"
    >
      <div className="mx-auto max-w-4xl px-4 py-16 text-center lg:py-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          No tienes que seguir adivinando.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
          Empieza con la reunión gratuita del lunes, pasa a una sesión privada cuando no puedas
          esperar, o evalúa la intervención cuando el rechazo, la recaída o el riesgo se
          intensifican.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#circulo"
            className="rounded-md bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
          >
            Únete al Círculo Familiar
          </a>
          <a
            href="/coaching-familiar"
            id="consulta"
            className="rounded-md border border-primary-foreground/40 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10"
          >
            Reserva una sesión
          </a>
          <a
            href={PHONE_HREF}
            className="rounded-md border border-primary-foreground/40 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10"
          >
            Llama {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="AyudaSobria" width={32} height={32} className="h-8 w-8" />
            <span className="font-semibold">AyudaSobria</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Apoyo en español para familias afectadas por la adicción. Guía ética, sin presión de la
            industria.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Contacto</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={PHONE_HREF} className="hover:text-foreground">
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="hover:text-foreground">
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Programas</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#circulo">Círculo Familiar</a>
            </li>
            <li>
              <a href="/coaching-familiar">Coaching privado</a>
            </li>
            <li>
              <a href="#intervencion">Intervención</a>
            </li>
            <li>
              <a href="#tratamiento">Directorio de tratamiento</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Recursos</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/recursos">Recursos</a>
            </li>
            <li>
              <a href="/evaluaciones">Evaluaciones</a>
            </li>
            <li>
              <a href="/membresia">Membresía familiar</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} AyudaSobria. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <PressureLevel />
      <FAQ />
      <Situations />
      <Programs />
      <Providers />
      <Assessments />
      <FinalCTA />
    </>
  );
}
