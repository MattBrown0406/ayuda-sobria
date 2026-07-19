import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

const FAQS = [
  {
    q: "¿La reunión del Círculo Familiar realmente es gratis?",
    a: "Sí. La reunión semanal del lunes 7:00 PM PT no tiene costo. Solo necesitas el enlace de Zoom.",
  },
  {
    q: "¿Necesito que mi ser querido acepte ayuda primero?",
    a: "No. AyudaSobria trabaja con la familia. Puedes empezar aunque tu ser querido todavía no quiera tratamiento.",
  },
  {
    q: "¿Ofrecen servicios en persona?",
    a: "El Círculo Familiar y el coaching son en línea, para que familias de cualquier país o ciudad puedan participar.",
  },
  {
    q: "¿Es confidencial?",
    a: "Sí. Lo que compartes en el Círculo y en las sesiones privadas queda ahí.",
  },
  { q: "¿Cuánto cuesta el coaching privado?", a: "Desde US$150 (USD) la sesión de 60 minutos." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Preguntas frecuentes — AyudaSobria" },
      {
        name: "description",
        content:
          "Respuestas rápidas sobre el Círculo Familiar, coaching, intervención y membresía en AyudaSobria.",
      },
      { property: "og:title", content: "Preguntas frecuentes — AyudaSobria" },
      {
        property: "og:description",
        content: "Lo básico que las familias preguntan antes de empezar.",
      },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="Preguntas"
        title="Preguntas frecuentes"
        description="Lo que las familias preguntan antes de empezar."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-4">
        {FAQS.map((f) => (
          <details key={f.q} className="rounded-xl border border-border bg-card p-5">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-3 text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
      <CTAStrip />
    </>
  ),
});
