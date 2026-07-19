import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/intervencion")({
  head: () => ({
    meta: [
      { title: "Intervención familiar en español — AyudaSobria" },
      { name: "description", content: "Evaluación y planificación de intervención para familias cuyo ser querido rechaza el tratamiento." },
      { property: "og:title", content: "Intervención — AyudaSobria" },
      { property: "og:description", content: "Cuando hay rechazo repetido al tratamiento o riesgo de seguridad." },
      { property: "og:url", content: "/intervencion" },
    ],
    links: [{ rel: "canonical", href: "/intervencion" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Cuando hay rechazo o riesgo" title="Intervención familiar" description="Un proceso guiado para familias cuando conversar ya no alcanza." />
      <Prose>
        <h2>Cuándo considerarla</h2>
        <ul>
          <li>El ser querido ha rechazado tratamiento varias veces.</li>
          <li>Hay recaída repetida sin plan claro.</li>
          <li>Existe riesgo real de seguridad, salud o consecuencias legales.</li>
          <li>La familia está dividida sobre qué hacer.</li>
        </ul>
        <h2>Cómo trabajamos</h2>
        <ol>
          <li>Evaluación inicial con la familia.</li>
          <li>Diseño del plan y elección del modelo de intervención.</li>
          <li>Preparación de participantes y opciones de tratamiento.</li>
          <li>Día de la intervención y seguimiento.</li>
        </ol>
        <p>Escríbenos a <a href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a> o llama al (458) 298-8011.</p>
      </Prose>
      <CTAStrip />
    </>
  ),
});