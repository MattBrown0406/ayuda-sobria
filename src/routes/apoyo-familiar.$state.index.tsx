import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { STATE_MAP, type State } from "@/data/locations";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/apoyo-familiar/$state/")({
  loader: ({ params }) => {
    const state = STATE_MAP[params.state];
    if (!state) throw notFound();
    return { state };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    const t = `Apoyo familiar para la adicción en ${loaderData.state.name}`;
    const d = `Familias en ${loaderData.state.name} encuentran apoyo en español, coaching y reuniones semanales del Círculo Familiar.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:url", content: `https://ayudasobria.com/apoyo-familiar/${params.state}` },
      ],
      links: [{ rel: "canonical", href: `https://ayudasobria.com/apoyo-familiar/${params.state}` }],
    };
  },
  component: StatePage,
  notFoundComponent: () => <div className="p-10 text-center">Estado no encontrado.</div>,
});

function StatePage() {
  const { state } = Route.useLoaderData() as { state: State };
  return (
    <>
      <PageHero
        eyebrow="Apoyo por estado"
        title={`Familias en ${state.name}`}
        description={`Recursos, coaching y reuniones semanales para familias hispanohablantes en ${state.name} afectadas por la adicción de un ser querido.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-semibold">Ciudades de {state.name}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.cities.map((c) => (
            <Link
              key={c.slug}
              to="/apoyo-familiar/$state/$city"
              params={{ state: state.slug, city: c.slug }}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/60"
            >
              <p className="font-medium">
                {c.name}, {state.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Apoyo familiar en español</p>
            </Link>
          ))}
        </div>
        <div className="prose prose-sm mt-10 max-w-none text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">
            Cómo trabajamos con familias en {state.name}
          </h3>
          <p className="mt-2">
            Aunque estés en {state.name}, la reunión del <strong>Círculo Familiar</strong> se
            realiza en línea cada lunes a las 7:00 PM (hora del Pacífico). No importa si vives en
            una ciudad grande o en una zona rural: tu familia puede empezar esta semana sin viajar.
          </p>
          <p className="mt-2">
            El coaching privado, la evaluación de intervención y el directorio de tratamiento
            también están disponibles a distancia. Muchas familias en {state.name} nos llaman cuando
            el sistema local en inglés no las alcanza.
          </p>
        </div>
      </div>
      <CTAStrip />
    </>
  );
}
