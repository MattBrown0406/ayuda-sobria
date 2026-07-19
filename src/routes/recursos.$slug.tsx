import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TOPIC_MAP } from "@/data/topics";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/recursos/$slug")({
  loader: ({ params }) => {
    const topic = TOPIC_MAP[params.slug];
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.topic.title} — AyudaSobria` },
        { name: "description", content: loaderData.topic.description },
        { property: "og:title", content: `${loaderData.topic.title} — AyudaSobria` },
        { property: "og:description", content: loaderData.topic.description },
        { property: "og:url", content: `/recursos/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/recursos/${params.slug}` }],
    };
  },
  component: TopicPage,
  notFoundComponent: () => <div className="p-10 text-center">Recurso no encontrado.</div>,
});

function TopicPage() {
  const { topic } = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Guía en español" title={topic.title} description={topic.description} />
      <Prose>
        <h2>Por qué esto importa para tu familia</h2>
        <p>La adicción no afecta solo a la persona que consume. Cambia la manera en que la familia duerme, decide, gasta, se comunica y confía. Entender <em>{topic.title.toLowerCase()}</em> te ayuda a dejar de reaccionar y empezar a responder.</p>
        <h2>Qué observar</h2>
        <ul>
          <li>Patrones que se repiten cada semana o cada crisis.</li>
          <li>Emociones que la familia calla para no empeorar la situación.</li>
          <li>Decisiones que se toman con miedo, no con claridad.</li>
          <li>Momentos en los que la ayuda sin querer sostiene el problema.</li>
        </ul>
        <h2>Qué puedes hacer esta semana</h2>
        <ol className="mt-4 list-decimal pl-6 space-y-2">
          <li>Únete al Círculo Familiar del lunes a las 8:00 PM (PT) para escuchar a otras familias y ordenar tus ideas.</li>
          <li>Escribe la decisión concreta que tienes pendiente y llévala al grupo o a una sesión privada.</li>
          <li>Comparte esta guía con la persona de la familia que necesita entender lo mismo que tú.</li>
        </ol>
        <h2>Cuándo pasar a coaching privado</h2>
        <p>Si la situación no puede esperar al lunes — hay riesgo de seguridad, una decisión de tratamiento urgente, o la familia está dividida — reserva una <Link to="/coaching-familiar">sesión de coaching privado</Link>. Cuando el rechazo al tratamiento y la recaída son parte del patrón, evalúa la <Link to="/intervencion">intervención</Link>.</p>
      </Prose>
      <CTAStrip />
    </>
  );
}