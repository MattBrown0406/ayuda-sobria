import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Prose, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/evaluaciones")({
  head: () => ({
    meta: [
      { title: "Evaluaciones familiares — AyudaSobria" },
      {
        name: "description",
        content:
          "Herramientas educativas en español para reconocer patrones de adicción, riesgo y codependencia, y decidir el próximo paso familiar.",
      },
    ],
    links: [{ rel: "canonical", href: "/evaluaciones" }],
  }),
  component: EvaluacionesPage,
});

function EvaluacionesPage() {
  return (
    <>
      <PageHero
        eyebrow="Herramientas educativas"
        title="Evaluaciones familiares"
        description="Estas guías no diagnostican. Te ayudan a ordenar lo que observas y decidir cuándo buscar apoyo profesional."
      />
      <Prose>
        <h2>Señales de impacto por consumo</h2>
        <p>
          Revisa si existen pérdida de control, intentos fallidos de reducir el consumo, tolerancia,
          abstinencia, problemas de salud, trabajo o relaciones, conductas de riesgo, secretos o
          recaídas repetidas. Una sola señal grave puede justificar pedir orientación.
        </p>
        <h2>Patrones de la familia</h2>
        <p>
          Observa si el miedo está llevando a cubrir consecuencias, prestar dinero, mentir por la
          persona, abandonar tus propias necesidades o cambiar límites repetidamente. Reconocer
          estos patrones no significa culpar a la familia.
        </p>
        <h2>Próximo paso</h2>
        <ul>
          <li>Ante peligro inmediato, llama al 911 o al servicio local de emergencias.</li>
          <li>
            Para ordenar la situación, consulta las{" "}
            <Link to="/respuestas-familia">respuestas para familias</Link>.
          </li>
          <li>
            Si no puede esperar, reserva <Link to="/coaching-familiar">coaching familiar</Link>.
          </li>
          <li>
            Si hay rechazo, recaídas repetidas o riesgo creciente, solicita una{" "}
            <Link to="/intervencion">evaluación de intervención</Link>.
          </li>
        </ul>
      </Prose>
      <CTAStrip />
    </>
  );
}
