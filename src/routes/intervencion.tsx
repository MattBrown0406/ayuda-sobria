import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/intervencion")({
  head: () => ({
    meta: [
      { title: "Intervención familiar en español — AyudaSobria" },
      {
        name: "description",
        content:
          "Evaluación y planificación de intervención para familias cuyo ser querido rechaza el tratamiento.",
      },
      { property: "og:title", content: "Intervención — AyudaSobria" },
      {
        property: "og:description",
        content: "Cuando hay rechazo repetido al tratamiento o riesgo de seguridad.",
      },
      { property: "og:url", content: "https://ayudasobria.com/intervencion" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/intervencion" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="Cuando hay rechazo o riesgo"
        title="Intervención familiar"
        description="Un proceso guiado para familias cuando conversar ya no alcanza."
      />
      <Prose>
        <h2>Cuándo considerarla</h2>
        <ul>
          <li>El ser querido ha rechazado tratamiento varias veces.</li>
          <li>Hay recaída repetida sin plan claro.</li>
          <li>Existe riesgo real de seguridad, salud o consecuencias legales.</li>
          <li>La familia está dividida sobre qué hacer.</li>
        </ul>
        <h2>Tu seguridad primero</h2>
        <p>
          Si tu pareja o tu ser querido te amenaza, te golpea o te controla, tu seguridad va
          primero. No organices una intervención ni pongas un límite sin un plan de seguridad. En
          EE. UU.: Línea Nacional contra la Violencia Doméstica,{" "}
          <a href="tel:+18007997233">1-800-799-7233</a> (atienden en español y no preguntan tu
          estatus migratorio).
        </p>
        <p>
          Cuidado con los «anexos» o centros que se llevan a la persona a la fuerza. El encierro,
          los golpes o el aislamiento no son tratamiento. Una intervención profesional se hace con
          respeto y con la decisión de la persona; nunca es un «levantón».
        </p>
        <h2>Cómo trabajamos</h2>
        <ol>
          <li>Evaluación inicial con la familia.</li>
          <li>Diseño del plan y elección del modelo de intervención.</li>
          <li>Preparación de participantes y opciones de tratamiento.</li>
          <li>Día de la intervención y seguimiento.</li>
        </ol>
        <h2>Elige el nivel adecuado</h2>
        <ul>
          <li>
            Usa <a href="/circulo-familiar">La Sobremesa</a> si la situación puede esperar y
            necesitas educación y apoyo gratuito.
          </li>
          <li>
            Usa <a href="/coaching-familiar">coaching privado</a> cuando la familia necesita ordenar
            una decisión específica o alinearse antes de avanzar.
          </li>
          <li>
            Habla sobre una intervención formal cuando el tratamiento se rechaza, el riesgo aumenta
            y las conversaciones improvisadas ya no cambian el patrón.
          </li>
        </ul>
        <p>
          Una intervención no sustituye la respuesta de emergencia. Ante una sobredosis, peligro
          inmediato o amenaza activa, llama al 911 o al servicio local de emergencias.
        </p>
        <p>
          Escríbenos a <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> o llama al
          (458) 298-8011.
        </p>
      </Prose>
      <CTAStrip />
    </>
  ),
});
