import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Prose, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sobre-nosotros")({
  head: () => ({
    meta: [
      { title: "Sobre AyudaSobria y Matt Brown" },
      {
        name: "description",
        content:
          "Conoce la misión de AyudaSobria, la experiencia de Matt Brown y cómo preparamos contenido educativo para familias afectadas por la adicción.",
      },
      { property: "og:title", content: "Sobre AyudaSobria y Matt Brown" },
      {
        property: "og:description",
        content: "Orientación clara, ética y compasiva para familias hispanohablantes.",
      },
      { property: "og:url", content: "https://ayudasobria.com/sobre-nosotros" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/sobre-nosotros" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Quiénes somos"
        title="Orientación para familias, sin juicio ni presión"
        description="AyudaSobria existe para que las familias hispanohablantes puedan entender la adicción, ordenar sus opciones y decidir el próximo paso con más claridad."
      />
      <Prose>
        <h2>Matt Brown</h2>
        <p>
          Matt Brown lleva más de 22 años acompañando a familias afectadas por la adicción. Su
          trabajo se centra en la educación familiar, el coaching, la navegación ética del
          tratamiento y la evaluación de intervenciones. AyudaSobria ofrece orientación en español e
          inglés y trabaja con familias, no como sustituto de atención médica o de emergencia.
        </p>

        <h2>Nuestra misión</h2>
        <p>
          La adicción cambia la comunicación, la confianza, las finanzas y la seguridad de toda la
          familia. Nuestro objetivo es traducir temas complejos a pasos concretos y compasivos, sin
          vergüenza, falsas promesas ni presión para contratar un servicio.
        </p>

        <h2>Cómo preparamos el contenido</h2>
        <ul>
          <li>Escribimos para la familia y distinguimos educación de diagnóstico o tratamiento.</li>
          <li>
            Evitamos prometer resultados y señalamos cuándo una situación requiere atención médica,
            legal o de emergencia.
          </li>
          <li>
            Revisamos la claridad, el lenguaje en español y la coherencia de horarios, precios y
            vías de contacto antes de publicar cambios.
          </li>
          <li>
            Corregimos información cuando recibimos evidencia de que está desactualizada o es
            imprecisa.
          </li>
        </ul>

        <h2>Alcance y seguridad</h2>
        <p>
          El contenido de AyudaSobria es educativo. No proporciona diagnóstico médico, psicoterapia,
          asesoría legal ni servicios de emergencia. Ante peligro inmediato en Estados Unidos, llama
          al 911. Para crisis de salud mental o suicidio en Estados Unidos, llama o envía un mensaje
          al 988. Fuera de Estados Unidos, utiliza el servicio de emergencias de tu país.
        </p>

        <h2>Contacto y correcciones</h2>
        <p>
          Para hacer una pregunta, solicitar una corrección o conocer nuestros servicios, llama al{" "}
          <a href="tel:4582988011">(458) 298-8011</a> o escribe a{" "}
          <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a>. También puedes revisar
          nuestra <Link to="/privacidad">política de privacidad</Link> y nuestros{" "}
          <Link to="/terminos">términos de servicio</Link>.
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
