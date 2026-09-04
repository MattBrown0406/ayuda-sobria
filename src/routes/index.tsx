import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Check,
  BookOpen,
  Users,
  MessageCircle,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { AppPromo } from "@/components/site/AppPromo";
import { LighthouseHero } from "@/components/site/LighthouseHero";

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
          "No tienes que resolver esto a ciegas. Encuentra el nivel adecuado de apoyo familiar frente a la adicción.",
      },
      { property: "og:url", content: "https://ayudasobria.com/" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/" }],
  }),
});

const PHONE_DISPLAY = "(458) 298-8011";
const PHONE_HREF = "tel:+14582988011";

function PressureLevel() {
  const items = [
    {
      tag: "Empieza aquí cuando puede esperar",
      title: "La Sobremesa gratuita",
      body: "Usa la reunión gratuita de los lunes cuando tu familia necesita educación, perspectiva y un espacio de menor presión para hacer preguntas.",
      cta: "Únete a la reunión gratis",
      href: "/registro",
      color: "border-primary/50",
    },
    {
      tag: "Si necesitas ayuda antes del lunes",
      title: "Coaching o consulta privada",
      body: "Reserva una sesión cuando necesites respuestas directas sobre límites, tratamiento, recaída, dinero, vivienda o qué decir a continuación.",
      cta: "Reservar ayuda privada",
      href: "/coaching-familiar",
      color: "border-chart-4/60",
    },
    {
      tag: "Cuando no hay peligro inmediato",
      title: "Evaluar si una intervención es el paso adecuado",
      body: "Evalúa una intervención cuando se rechaza el tratamiento, la familia está dividida o la recaída se repite. No es un servicio de emergencia.",
      cta: "Habla con nuestro equipo",
      href: "/intervencion",
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
      <div className="mt-6 max-w-3xl rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <p className="font-semibold">Primero descarta una emergencia.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si hay una sobredosis, peligro inmediato o una amenaza activa, llama al 911 o al servicio
          local de emergencias. En Estados Unidos, llama o envía un mensaje al 988 ante una crisis
          suicida o de salud mental. El coaching y la intervención no sustituyen la respuesta de
          emergencia.
        </p>
      </div>
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
      slug: "should-we-stage-an-intervention",
      q: "¿Deberíamos organizar una intervención?",
      a: "Considera planificar una intervención cuando se rechaza el tratamiento, el riesgo aumenta, las conversaciones normales ya no funcionan y la familia necesita un plan unificado en lugar de otra confrontación emocional.",
    },
    {
      tag: "Coaching privado",
      slug: "what-if-we-cannot-wait-until-monday",
      q: "¿Qué hacemos si no podemos esperar al lunes?",
      a: "Si la situación no puede esperar a La Sobremesa, reserva una sesión de coaching privada o llama para orientación. Usa el apoyo gratuito para estabilizarte, y la ayuda privada cuando el tiempo, la seguridad o una decisión concreta apremia.",
    },
    {
      tag: "Adicción en la pareja",
      slug: "how-do-i-get-my-spouse-into-treatment",
      q: "¿Cómo llevo a mi pareja a tratamiento?",
      a: "Generalmente no puedes forzar el tratamiento con una sola conversación. Enfócate en la seguridad, el dinero, los hijos, los límites, las opciones de tratamiento y si necesitan coaching privado o evaluación de intervención.",
    },
    {
      tag: "Seguridad",
      slug: "what-if-im-afraid-they-will-overdose",
      q: "¿Y si tengo miedo de una sobredosis?",
      a: "Trata el miedo a la sobredosis como una señal de seguridad. Usa servicios de emergencia ante peligro inmediato, ten naloxona disponible si hay opioides, y busca orientación profesional en vez de esperar.",
    },
    {
      tag: "Decisiones de tratamiento",
      slug: "is-this-bad-enough-for-treatment",
      q: "¿Es lo suficientemente grave como para tratamiento?",
      a: "Si el consumo causa riesgos de seguridad, daño en las relaciones, problemas laborales, problemas legales o de salud, secretismo, recaídas o promesas rotas repetidas, es lo suficientemente serio para buscar orientación.",
    },
    {
      tag: "Recaída",
      slug: "what-should-family-do-after-relapse",
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
          Las familias suelen llegar con una pregunta urgente. Estas respuestas te guían hacia La
          Sobremesa, coaching privado o evaluación de intervención sin interrumpir el camino de
          apoyo gratuito.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {qs.map((it) => (
            <a
              href={`/respuestas-familia/${it.slug}`}
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
          <h3 className="font-semibold">Con apoyo real y opciones claras</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "Reuniones gratuitas de La Sobremesa con otras familias que entienden",
              "Coaching por hora cuando necesitas guía uno a uno",
              "Educación clara que explica lo que estás viendo",
              "Respuestas en español para las preguntas que más se repiten",
              "Herramientas prácticas para límites que puedas sostener",
              "Artículos extensos para comprender tratamiento, límites y recaídas",
              "Guías educativas para decisiones familiares",
              "Más claridad para responder en vez de reaccionar",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            No tienes que resolver esto sola o solo. Empieza con el apoyo gratuito y usa coaching
            privado cuando necesites un plan concreto.
          </p>
          <a
            href="/coaching-familiar"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Ver opciones de coaching
          </a>
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
      title: "«La Sobremesa» cada lunes a las 8 PM (hora del Pacífico)",
      body: "Apoyo grupal en vivo cada lunes para cualquier familiar. No requiere membresía.",
      cta: "Regístrate ahora",
      href: "/registro",
    },
    {
      icon: BookOpen,
      tag: "Apoyo continuo",
      title: "Membresía de ahorro para coaching familiar",
      body: "Los miembros activos pagan US$125 por sesión privada en lugar de US$150 y pueden administrar o cancelar su plan en línea.",
      cta: "Explorar la membresía",
      href: "/membresia",
    },
    {
      icon: MessageCircle,
      tag: "Ayuda privada",
      title: "Coaching familiar cuando necesitas orientación uno a uno",
      body: "El coaching privado está para cuando el grupo y la membresía no bastan. US$150 por sesión (US$125 para miembros).",
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
        Estas tarjetas explican tipos de atención y próximos pasos prácticos; no son recomendaciones
        de proveedores. Confirma directamente que cada programa ofrezca atención clínica y familiar
        adecuada en español.
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
            Lista educativa y no diagnóstica para ordenar las señales que observa la familia y
            decidir cuándo solicitar una evaluación profesional.
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
            href="/registro"
            className="rounded-md bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-background/90"
          >
            Únete a La Sobremesa
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

function Index() {
  return (
    <>
      <LighthouseHero />
      <AppPromo />
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
