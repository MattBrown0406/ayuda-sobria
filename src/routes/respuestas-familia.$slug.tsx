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
    const d = loaderData.answer.shortAnswer;
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
      <PageHero eyebrow={answer.category} title={answer.question} />
      <Prose>
        <h2>Respuesta corta</h2>
        <p>{answer.shortAnswer}</p>
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
            Únete al <Link to="/circulo-familiar">La Sobremesa</Link> del lunes a las 8:00 PM (PT).
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
          {answer.bestNextStep === "family_squares" && (
            <Link to="/circulo-familiar">Empieza con La Sobremesa gratuita.</Link>
          )}
          {answer.bestNextStep === "private_coaching" && (
            <Link to="/coaching-familiar">Solicita orientación familiar privada.</Link>
          )}
          {answer.bestNextStep === "intervention_readiness" && (
            <Link to="/intervencion">
              Revisa si la situación requiere planificar una intervención.
            </Link>
          )}
        </p>
        <p>
          Ver todas las <Link to="/respuestas-familia">preguntas frecuentes de familias</Link>.
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
