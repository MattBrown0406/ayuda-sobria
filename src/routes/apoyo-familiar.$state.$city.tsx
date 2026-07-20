import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { STATE_MAP } from "@/data/locations";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/apoyo-familiar/$state/$city")({
  loader: ({ params }) => {
    const state = STATE_MAP[params.state];
    if (!state) throw notFound();
    const city = state.cities.find((c) => c.slug === params.city);
    if (!city) throw notFound();
    return { state, city };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.city.name}, ${loaderData.state.name}: apoyo familiar para la adicción`;
    const d = `Familias en ${loaderData.city.name}, ${loaderData.state.name} encuentran apoyo en español, coaching y reuniones semanales del Círculo Familiar.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        {
          property: "og:url",
          content: `https://ayudasobria.com/apoyo-familiar/${params.state}/${params.city}`,
        },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://ayudasobria.com/apoyo-familiar/${params.state}/${params.city}`,
        },
      ],
    };
  },
  component: CityPage,
  notFoundComponent: () => <div className="p-10 text-center">Ciudad no encontrada.</div>,
});

function CityPage() {
  const { state, city } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow={`${state.name} · Ciudad`}
        title={`Apoyo familiar en ${city.name}`}
        description={`Recursos, coaching y reuniones del Círculo Familiar para familias hispanohablantes en ${city.name}, ${state.name}.`}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-semibold">Cómo empezar esta semana</h2>
        <ol className="mt-4 space-y-3 text-muted-foreground">
          <li>
            <strong className="text-foreground">1. Únete al Círculo Familiar.</strong> Reunión
            gratuita cada lunes 7:00 PM (hora del Pacífico) por Zoom. Puedes conectarte desde{" "}
            {city.name} sin desplazarte.
          </li>
          <li>
            <strong className="text-foreground">2. Reserva una sesión privada.</strong> Si no puedes
            esperar al lunes, agenda coaching familiar uno a uno desde US$150 (USD).
          </li>
          <li>
            <strong className="text-foreground">3. Evalúa la intervención.</strong> Si hay rechazo
            al tratamiento, recaída repetida o riesgo de seguridad, evalúa el nivel de intervención.
          </li>
        </ol>
        <p className="mt-8 text-muted-foreground">
          Muchas familias latinas en {city.name} llegan a AyudaSobria cuando los recursos en inglés
          no responden a sus necesidades. Puedes recibir orientación — reunión, coaching y
          evaluación — en español, con privacidad y sin juicio.
        </p>
        <div className="mt-8">
          <Link
            to="/apoyo-familiar/$state"
            params={{ state: state.slug }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Ver todas las ciudades de {state.name}
          </Link>
        </div>
      </div>
      <CTAStrip />
    </>
  );
}
