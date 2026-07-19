import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/testimonios")({
  head: () => ({
    meta: [
      { title: "Testimonios de familias — AyudaSobria" },
      { name: "description", content: "Historias reales de familias hispanohablantes que encontraron apoyo en AyudaSobria." },
      { property: "og:title", content: "Testimonios — AyudaSobria" },
      { property: "og:description", content: "Voces de familias que llegaron sin saber qué hacer." },
      { property: "og:url", content: "/testimonios" },
    ],
    links: [{ rel: "canonical", href: "/testimonios" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Voces" title="Testimonios de familias" description="Historias compartidas con permiso. Nombres cambiados por privacidad." />
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        {[
          { name: "María, madre — California", text: "Llegué al Círculo Familiar sin saber qué hacer. Por primera vez alguien me habló en español sin juzgarme. Aprendí a poner límites sin dejar de amar a mi hijo." },
          { name: "Jorge, esposo — Texas", text: "Pensé que era el único que estaba viviendo esto. Escuchar a otras familias me devolvió la calma para tomar decisiones." },
          { name: "Ana, hermana — Florida", text: "El coaching privado nos ayudó a hablar con mi hermano sin explotar. Aceptó tratamiento a las tres semanas." },
        ].map((t) => (
          <blockquote key={t.name} className="rounded-xl border border-border bg-card p-6">
            <p className="italic text-muted-foreground">“{t.text}”</p>
            <footer className="mt-3 text-sm font-semibold">— {t.name}</footer>
          </blockquote>
        ))}
      </div>
      <CTAStrip />
    </>
  ),
});