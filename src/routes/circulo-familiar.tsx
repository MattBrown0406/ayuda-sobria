import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/circulo-familiar")({
  head: () => ({
    meta: [
      { title: "La Sobremesa — Reunión semanal en español — AyudaSobria" },
      {
        name: "description",
        content:
          "Reunión gratuita por Zoom cada lunes a las 8:00 PM (hora del Pacífico) para familias hispanohablantes afectadas por la adicción de un ser querido.",
      },
      { property: "og:title", content: "La Sobremesa — AyudaSobria" },
      {
        property: "og:description",
        content: "Cada lunes 8:00 PM PT. Gratis. En español. Registro en línea disponible.",
      },
      { property: "og:url", content: "https://ayudasobria.com/circulo-familiar" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/circulo-familiar" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="Reunión semanal · Gratis"
        title="La Sobremesa"
        description="Cada lunes a las 8:00 PM (hora del Pacífico) por Zoom. En español. Para familias que aman a alguien con adicción."
      />
      <Prose>
        <h2>Qué es La Sobremesa</h2>
        <p>
          La sobremesa es esa tradición nuestra de quedarse en la mesa conversando cuando la comida
          ya terminó — ahí es donde la familia dice las cosas de verdad. La adicción suele ser lo
          primero que nos roba esas conversaciones. Aquí las recuperamos, cada lunes.{" "}
          <strong>Siempre hay un lugar en la mesa.</strong>
        </p>
        <p>
          Es una reunión guiada donde otras familias comparten lo que están viviendo y reciben
          orientación práctica. No es un grupo de terapia y no reemplaza al tratamiento profesional.
          Es un espacio para dejar de sentirte solo y ordenar el próximo paso.
        </p>
        <h2>Cómo unirse</h2>
        <ul>
          <li>Día: cada lunes.</li>
          <li>Hora: 8:00 PM hora del Pacífico (EE. UU.).</li>
          <li>Formato: Zoom, cámara opcional.</li>
          <li>Costo: gratis.</li>
        </ul>
        <p>
          <a href="/registro">Regístrate en línea</a> para recibir el enlace de la próxima reunión.
          También puedes escribir a{" "}
          <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> o llamar al (458)
          298-8011.
        </p>
      </Prose>
      <CTAStrip />
    </>
  ),
});
