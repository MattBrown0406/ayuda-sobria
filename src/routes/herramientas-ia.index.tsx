import { createFileRoute, Link } from "@tanstack/react-router";
import { AI_TOOLS } from "@/data/aiTools";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/herramientas-ia/")({
  head: () => ({
    meta: [
      { title: "Guías educativas para familias — AyudaSobria" },
      {
        name: "description",
        content:
          "Guías educativas en español para pensar sobre límites, habilitación, recaída y tratamiento.",
      },
      { property: "og:title", content: "Guías educativas — AyudaSobria" },
      {
        property: "og:description",
        content: "Guías educativas en español para familias afectadas por la adicción.",
      },
      { property: "og:url", content: "https://ayudasobria.com/herramientas-ia" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/herramientas-ia" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="IA para familias"
        title="Guías educativas"
        description="Guías en español para ordenar decisiones antes de conversar con una persona o profesional."
      />
      <div className="mx-auto max-w-5xl px-4 py-12 grid gap-4 sm:grid-cols-2">
        {AI_TOOLS.map((t) => (
          <Link
            key={t.slug}
            to="/herramientas-ia/$slug"
            params={{ slug: t.slug }}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/60"
          >
            <p className="font-semibold">{t.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.blurb}</p>
          </Link>
        ))}
      </div>
      <CTAStrip />
    </>
  ),
});
