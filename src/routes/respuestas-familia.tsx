import { createFileRoute, Link } from "@tanstack/react-router";
import { ANSWERS } from "@/data/answers";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/respuestas-familia")({
  head: () => ({
    meta: [
      { title: "Respuestas para familias — AyudaSobria" },
      {
        name: "description",
        content:
          "Respuestas directas en español a las preguntas más frecuentes de las familias que enfrentan la adicción de un ser querido.",
      },
      { property: "og:title", content: "Respuestas para familias — AyudaSobria" },
      {
        property: "og:description",
        content: "Preguntas urgentes con respuestas claras y prácticas.",
      },
      { property: "og:url", content: "/respuestas-familia" },
    ],
    links: [{ rel: "canonical", href: "/respuestas-familia" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="Preguntas frecuentes"
        title="Respuestas para familias"
        description="Las preguntas que más nos hacen las familias, respondidas sin rodeos."
      />
      <div className="mx-auto max-w-4xl px-4 py-12 grid gap-3">
        {ANSWERS.map((a) => (
          <Link
            key={a.slug}
            to="/respuestas-familia/$slug"
            params={{ slug: a.slug }}
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/60"
          >
            <p className="font-semibold">{a.question}</p>
          </Link>
        ))}
      </div>
      <CTAStrip />
    </>
  ),
});
