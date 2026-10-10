import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

const FAQS = [
  {
    q: "¿La reunión de La Sobremesa realmente es gratis?",
    a: "Sí. La reunión semanal del lunes 8:00 PM PT no tiene costo. Solo necesitas el enlace de Zoom.",
  },
  {
    q: "¿Necesito que mi ser querido acepte ayuda primero?",
    a: "No. AyudaSobria trabaja con la familia. Puedes empezar aunque tu ser querido todavía no quiera tratamiento.",
  },
  {
    q: "¿Ofrecen servicios en persona?",
    a: "La Sobremesa y el coaching son en línea, para que familias de cualquier país o ciudad puedan participar.",
  },
  {
    q: "¿Es confidencial?",
    a: "Tratamos lo compartido con privacidad. En una reunión grupal no podemos garantizar la conducta de cada participante, y pueden existir excepciones legales o de seguridad. La Sobremesa se graba en Zoom. Las grabaciones quedan privadas; Matt revisa cada una y solo comparte con los miembros, en Grabaciones, las que decide publicar. Si prefieres no aparecer, entra con la cámara apagada y el nombre que quieras.",
  },
  {
    q: "¿Cuánto cuesta el coaching privado?",
    a: "US$150 (USD) la sesión de 60 minutos; US$125 para miembros.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Preguntas frecuentes — AyudaSobria" },
      {
        name: "description",
        content:
          "Respuestas rápidas sobre La Sobremesa, coaching, intervención y membresía en AyudaSobria.",
      },
      { property: "og:title", content: "Preguntas frecuentes — AyudaSobria" },
      {
        property: "og:description",
        content: "Lo básico que las familias preguntan antes de empezar.",
      },
      { property: "og:url", content: "https://ayudasobria.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/faq" }],
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
