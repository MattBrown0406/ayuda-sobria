import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ANSWER_MAP } from "@/data/answers";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/respuestas-familia/$slug")({
  loader: ({ params }) => {
    const answer = ANSWER_MAP[params.slug];
    if (!answer) throw notFound();
    return { answer };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "No encontrado" }, { name: "robots", content: "noindex" }] };
    const d = `Respuesta clara en español para familias: ${loaderData.answer.question}`;
    return {
      meta: [
        { title: `${loaderData.answer.question} — AyudaSobria` },
        { name: "description", content: d },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: `${loaderData.answer.question} — AyudaSobria` },
        { property: "og:description", content: d },
        {
          property: "og:url",
          content: `https://ayudasobria.com/respuestas-familia/${params.slug}`,
        },
      ],
      links: [
        { rel: "canonical", href: `https://ayudasobria.com/respuestas-familia/${params.slug}` },
      ],
    };
  },
  component: AnswerPage,
  notFoundComponent: () => <div className="p-10 text-center">Respuesta no encontrada.</div>,
});

function AnswerPage() {
  const { answer } = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Pregunta frecuente" title={answer.question} />
      <Prose>
        <h2>Respuesta corta</h2>
        <p>
          Cada familia es distinta, pero el patrón se repite: la pregunta suele llegar cuando la
          situación ya lleva tiempo desgastando a todos. La respuesta empieza por bajar el ritmo,
          ordenar lo que sabes y decidir cuál es el próximo paso <em>de la familia</em>, no del ser
          querido.
        </p>
        <h2>Cómo pensarlo con calma</h2>
        <ul>
          <li>Identifica cuánto de la decisión es miedo y cuánto es información.</li>
          <li>
            Distingue lo urgente (seguridad, dinero, hijos) de lo importante (patrones de largo
            plazo).
          </li>
          <li>Pregúntate si necesitas educación, coaching o intervención — son cosas distintas.</li>
          <li>Anota la próxima acción concreta: una llamada, una conversación, un límite.</li>
        </ul>
        <h2>Qué hacer esta semana</h2>
        <ol className="mt-4 list-decimal pl-6 space-y-2">
          <li>
            Únete al <Link to="/circulo-familiar">Círculo Familiar</Link> del lunes a las 7:00 PM
            (PT).
          </li>
          <li>
            Si la situación no puede esperar, reserva{" "}
            <Link to="/coaching-familiar">coaching privado</Link>.
          </li>
          <li>
            Si hay rechazo repetido al tratamiento o riesgo alto, evalúa la{" "}
            <Link to="/intervencion">intervención</Link>.
          </li>
        </ol>
        <p>
          Ver todas las <Link to="/respuestas-familia">preguntas frecuentes de familias</Link>.
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
