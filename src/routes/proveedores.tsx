import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/proveedores")({
  head: () => ({
    meta: [
      { title: "Cómo buscar tratamiento en español — AyudaSobria" },
      {
        name: "description",
        content:
          "Preguntas que una familia puede usar para confirmar que un programa de tratamiento ofrece atención adecuada en español.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Cómo buscar tratamiento en español — AyudaSobria" },
      {
        property: "og:description",
        content: "Cómo verificar idioma, servicios familiares y atención clínica antes de elegir.",
      },
      { property: "og:url", content: "https://ayudasobria.com/proveedores" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/proveedores" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="Orientación para familias"
        title="Cómo buscar tratamiento en español"
        description="Antes de elegir un programa, confirma que la atención clínica y los servicios para la familia estén realmente disponibles en español."
      />
      <Prose>
        <h2>Qué confirmar directamente</h2>
        <ul>
          <li>
            Que la evaluación, el consentimiento y el plan de tratamiento estén disponibles en
            español.
          </li>
          <li>
            Que haya personal clínico que pueda comunicarse directamente en español, no solo un
            intérprete ocasional.
          </li>
          <li>Que la educación y las sesiones familiares también estén disponibles en español.</li>
          <li>
            Que el programa explique por escrito el costo, la cobertura, las credenciales y el plan
            de alta.
          </li>
        </ul>
        <p>
          AyudaSobria no opera un directorio de proveedores en español ni cobra comisiones por
          referencias. Podemos ayudarte a preparar preguntas, pero la familia debe verificar el
          idioma y los servicios directamente con cada programa. Para orientación familiar, escribe
          a <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a>.
        </p>
      </Prose>
      <CTAStrip />
    </>
  ),
});
