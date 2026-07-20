import { createFileRoute, Link } from "@tanstack/react-router";
import { COUNTRIES } from "@/data/locations";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/paises/")({
  head: () => ({
    meta: [
      { title: "Apoyo familiar por país — AyudaSobria" },
      {
        name: "description",
        content:
          "Familias de toda América Latina y el Caribe reciben apoyo en español para enfrentar la adicción de un ser querido.",
      },
      { property: "og:title", content: "Apoyo familiar por país — AyudaSobria" },
      {
        property: "og:description",
        content: "Directorio por país: México, Centroamérica, el Caribe y Sudamérica.",
      },
      { property: "og:url", content: "https://ayudasobria.com/paises" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/paises" }],
  }),
  component: CountriesIndex,
});

function CountriesIndex() {
  const regions = ["Central", "Caribe", "Sur"] as const;
  const label: Record<string, string> = {
    Central: "Centroamérica y México",
    Caribe: "Caribe hispanohablante",
    Sur: "Sudamérica",
  };
  return (
    <>
      <PageHero
        eyebrow="Ubicaciones"
        title="Apoyo familiar por país"
        description="La reunión de La Sobremesa es en línea y accesible desde cualquier país. Coaching, intervención y recursos disponibles a distancia."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        {regions.map((r) => (
          <div key={r}>
            <h2 className="text-xl font-semibold">{label[r]}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COUNTRIES.filter((c) => c.region === r).map((c) => (
                <Link
                  key={c.slug}
                  to="/paises/$country"
                  params={{ country: c.slug }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary/60"
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Apoyo familiar en español</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <CTAStrip />
    </>
  );
}
