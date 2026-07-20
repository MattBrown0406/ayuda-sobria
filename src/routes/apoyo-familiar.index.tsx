import { createFileRoute, Link } from "@tanstack/react-router";
import { STATES } from "@/data/locations";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/apoyo-familiar/")({
  head: () => ({
    meta: [
      { title: "Apoyo familiar por estado — AyudaSobria" },
      {
        name: "description",
        content:
          "Guías para estados seleccionados y apoyo en línea en español disponible para familias de todo Estados Unidos.",
      },
      { property: "og:title", content: "Apoyo familiar por estado — AyudaSobria" },
      {
        property: "og:description",
        content: "Directorio de recursos por estado para familias hispanohablantes.",
      },
      { property: "og:url", content: "https://ayudasobria.com/apoyo-familiar" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/apoyo-familiar" }],
  }),
  component: StatesIndex,
});

function StatesIndex() {
  return (
    <>
      <PageHero
        eyebrow="Ubicaciones"
        title="Apoyo familiar por estado"
        description="Consulta guías para estados seleccionados. La reunión de La Sobremesa es en línea y accesible desde cualquier estado de Estados Unidos."
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATES.map((s) => (
            <Link
              key={s.slug}
              to="/apoyo-familiar/$state"
              params={{ state: s.slug }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/60 hover:shadow-sm"
            >
              <h2 className="font-semibold">{s.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {s.cities.length} ciudades listadas
              </p>
            </Link>
          ))}
        </div>
      </div>
      <CTAStrip />
    </>
  );
}
