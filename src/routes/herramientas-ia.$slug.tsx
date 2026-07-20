import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AI_TOOL_MAP } from "@/data/aiTools";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/herramientas-ia/$slug")({
  loader: ({ params }) => {
    const tool = AI_TOOL_MAP[params.slug];
    if (!tool) throw notFound();
    return { tool };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.tool.title} — AyudaSobria` },
        { name: "description", content: loaderData.tool.blurb },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: `${loaderData.tool.title} — AyudaSobria` },
        { property: "og:description", content: loaderData.tool.blurb },
        { property: "og:url", content: `https://ayudasobria.com/herramientas-ia/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://ayudasobria.com/herramientas-ia/${params.slug}` }],
    };
  },
  component: ToolPage,
  notFoundComponent: () => <div className="p-10 text-center">Herramienta no encontrada.</div>,
});

function ToolPage() {
  const { tool } = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Guía educativa" title={tool.title} description={tool.blurb} />
      <Prose>
        <h2>Para qué sirve</h2>
        <p>
          Esta guía está pensada para familias hispanohablantes que necesitan ordenar una decisión
          concreta cuando La Sobremesa todavía no empieza y no hay una sesión de coaching a
          la mano.
        </p>
        <h2>Cómo usarla</h2>
        <ol>
          <li>Describe brevemente tu situación: quién consume, hace cuánto, con quién vives.</li>
          <li>Pide una recomendación concreta, no una lista general.</li>
          <li>Lleva las conclusiones al Círculo o a coaching para validar.</li>
        </ol>
        <p>
          La guía no sustituye orientación profesional. Es un espacio para pensar en voz alta y
          llegar mejor preparado al siguiente paso.
        </p>
        <p>
          Ver todas las <Link to="/herramientas-ia">guías educativas</Link>.
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
