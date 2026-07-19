import { createFileRoute, Link } from "@tanstack/react-router";
import { TOPICS } from "@/data/topics";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos para familias — AyudaSobria" },
      { name: "description", content: "Biblioteca en español sobre adicción, recaída, límites, tratamiento y recuperación familiar." },
      { property: "og:title", content: "Recursos para familias — AyudaSobria" },
      { property: "og:description", content: "Más de 170 guías en español para familias afectadas por la adicción." },
      { property: "og:url", content: "/recursos" },
    ],
    links: [{ rel: "canonical", href: "/recursos" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Biblioteca" title="Recursos para familias" description="Guías en español sobre adicción, límites, tratamiento, recaída, salud mental y recuperación familiar." />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <Link key={t.slug} to="/recursos/$slug" params={{ slug: t.slug }} className="rounded-lg border border-border bg-card p-4 hover:border-primary/60">
              <p className="text-sm font-semibold">{t.title}</p>
            </Link>
          ))}
        </div>
      </div>
      <CTAStrip />
    </>
  ),
});