import { createFileRoute, Link } from "@tanstack/react-router";
import { STEPS } from "@/data/roadmap";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de recuperación familiar — AyudaSobria" },
      { name: "description", content: "Ocho etapas del recorrido de la familia: desde la sospecha hasta la recuperación a largo plazo." },
      { property: "og:title", content: "Mapa de recuperación familiar — AyudaSobria" },
      { property: "og:description", content: "Ubica en qué etapa está tu familia y qué hacer ahora." },
      { property: "og:url", content: "/mapa" },
    ],
    links: [{ rel: "canonical", href: "/mapa" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Recorrido" title="Mapa de recuperación familiar" description="Ubica en qué etapa está tu familia y qué hacer ahora." />
      <div className="mx-auto max-w-4xl px-4 py-12 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Link key={s.slug} to="/mapa/$slug" params={{ slug: s.slug }} className="rounded-xl border border-border bg-card p-5 hover:border-primary/60">
            <p className="font-semibold">{s.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
          </Link>
        ))}
      </div>
      <CTAStrip />
    </>
  ),
});