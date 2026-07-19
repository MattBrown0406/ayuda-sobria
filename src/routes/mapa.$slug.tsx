import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { STEP_MAP } from "@/data/roadmap";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/mapa/$slug")({
  loader: ({ params }) => {
    const step = STEP_MAP[params.slug];
    if (!step) throw notFound();
    return { step };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.step.title} — Mapa familiar — AyudaSobria` },
        { name: "description", content: loaderData.step.blurb },
        { property: "og:title", content: `${loaderData.step.title} — AyudaSobria` },
        { property: "og:description", content: loaderData.step.blurb },
        { property: "og:url", content: `/mapa/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/mapa/${params.slug}` }],
    };
  },
  component: StepPage,
  notFoundComponent: () => <div className="p-10 text-center">Etapa no encontrada.</div>,
});

function StepPage() {
  const { step } = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Etapa" title={step.title} description={step.blurb} />
      <Prose>
        <h2>Cómo se ve esta etapa desde la familia</h2>
        <p>En la etapa de <em>{step.title.toLowerCase()}</em>, la familia suele oscilar entre la esperanza y el agotamiento. Es normal sentir que no sabes si estás ayudando o empeorando las cosas. Ordena lo que sabes antes de decidir el próximo paso.</p>
        <h2>Prioridades ahora</h2>
        <ul>
          <li>Seguridad primero: física, emocional, financiera.</li>
          <li>Comunicación clara dentro de la familia, aunque no todos estén de acuerdo.</li>
          <li>Decisiones tomadas con información, no con miedo o culpa.</li>
        </ul>
        <h2>Qué hacer esta semana</h2>
        <ol>
          <li>Únete al <Link to="/circulo-familiar">Círculo Familiar</Link> del lunes 8:00 PM (PT).</li>
          <li>Reserva <Link to="/coaching-familiar">coaching privado</Link> si no puedes esperar.</li>
          <li>Evalúa la <Link to="/intervencion">intervención</Link> si hay rechazo repetido al tratamiento.</li>
        </ol>
        <p>Volver al <Link to="/mapa">mapa completo</Link>.</p>
      </Prose>
      <CTAStrip />
    </>
  );
}