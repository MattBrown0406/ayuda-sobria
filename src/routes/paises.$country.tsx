import { createFileRoute, notFound } from "@tanstack/react-router";
import { COUNTRY_MAP } from "@/data/locations";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

const HOTLINES: Record<string, { name: string; number: string }[]> = {
  mexico: [
    { name: "SAPTEL (24/7)", number: "55 5259-8121" },
    { name: "Línea de la Vida", number: "800 911-2000" },
  ],
  argentina: [{ name: "SEDRONAR", number: "141" }],
  chile: [{ name: "SENDA Fonodrogas", number: "1412" }],
  colombia: [{ name: "Línea 106", number: "106" }],
  peru: [{ name: "Línea 113 (opción 5)", number: "113" }],
  "costa-rica": [{ name: "IAFA", number: "800-423-2323" }],
  "republica-dominicana": [{ name: "Línea Vida", number: "*462" }],
  "puerto-rico": [{ name: "ASSMCA Línea PAS", number: "1-800-981-0023" }],
};

export const Route = createFileRoute("/paises/$country")({
  loader: ({ params }) => {
    const country = COUNTRY_MAP[params.country];
    if (!country) throw notFound();
    return { country };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    const t = `Apoyo familiar para la adicción en ${loaderData.country.name} — AyudaSobria`;
    const d = `Familias en ${loaderData.country.name} enfrentando la adicción de un ser querido: reunión semanal, coaching privado y evaluación de intervención, todo en español.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:url", content: `/paises/${params.country}` },
      ],
      links: [{ rel: "canonical", href: `/paises/${params.country}` }],
    };
  },
  component: CountryPage,
  notFoundComponent: () => <div className="p-10 text-center">País no encontrado.</div>,
});

function CountryPage() {
  const { country } = Route.useLoaderData();
  const lines = HOTLINES[country.slug];
  const regionLabel =
    country.region === "Sur"
      ? "Sudamérica"
      : country.region === "Caribe"
        ? "Caribe"
        : "Centroamérica";
  return (
    <>
      <PageHero
        eyebrow={regionLabel}
        title={`Familias en ${country.name}`}
        description={`AyudaSobria acompaña a familias hispanohablantes en ${country.name} que enfrentan la adicción de un ser querido. Todo el proceso se hace en línea y en español.`}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Empieza esta semana</h2>
          <ol className="mt-4 space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">Círculo Familiar (gratis):</strong> reunión por
              Zoom cada lunes a las 7:00 PM (hora del Pacífico de EE. UU.). Consulta la conversión
              de horario en {country.name} antes de conectarte.
            </li>
            <li>
              <strong className="text-foreground">Coaching familiar privado:</strong> sesiones uno a
              uno cuando la familia necesita respuestas rápidas.
            </li>
            <li>
              <strong className="text-foreground">Evaluación de intervención:</strong> para casos
              donde hay rechazo al tratamiento, recaída repetida o riesgo de seguridad.
            </li>
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Cultura, familia y adicción en {country.name}</h2>
          <p className="mt-3 text-muted-foreground">
            En muchas familias latinas la adicción se vive en silencio, por vergüenza, por proteger
            la reputación o porque nadie sabe qué decir. En {country.name} eso se combina con
            recursos limitados en español pensados para la familia (no solo para la persona que
            consume). AyudaSobria existe para llenar ese vacío: la familia también necesita
            orientación, aunque el ser querido todavía no acepte ayuda.
          </p>
        </section>
        {lines && (
          <section className="rounded-xl border border-border bg-secondary/40 p-6">
            <h2 className="text-lg font-semibold">Líneas de crisis en {country.name}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lines.map((h) => (
                <li key={h.number}>
                  <strong>{h.name}:</strong> <span className="font-mono">{h.number}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Ante una emergencia inmediata, comunícate con el servicio local de emergencias de tu
              país.
            </p>
          </section>
        )}
        <section>
          <h2 className="text-xl font-semibold">Qué NO necesitas para empezar</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>· No necesitas convencer a tu ser querido de nada primero.</li>
            <li>· No necesitas un diagnóstico formal.</li>
            <li>· No necesitas viajar ni pagar para asistir al Círculo Familiar.</li>
          </ul>
        </section>
      </div>
      <CTAStrip />
    </>
  );
}
