import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/circulo-familiar")({
  head: () => ({
    meta: [
      { title: "Círculo Familiar — Reunión semanal en español — AyudaSobria" },
      { name: "description", content: "Reunión gratuita por Zoom cada lunes a las 8:00 PM (hora del Pacífico) para familias hispanohablantes afectadas por la adicción de un ser querido." },
      { property: "og:title", content: "Círculo Familiar — AyudaSobria" },
      { property: "og:description", content: "Cada lunes 8:00 PM PT. Gratis. En español. Sin necesidad de registro previo." },
      { property: "og:url", content: "/circulo-familiar" },
    ],
    links: [{ rel: "canonical", href: "/circulo-familiar" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Reunión semanal · Gratis" title="Círculo Familiar" description="Cada lunes a las 8:00 PM (hora del Pacífico) por Zoom. En español. Para familias que aman a alguien con adicción." />
      <Prose>
        <h2>Qué es el Círculo Familiar</h2>
        <p>Es una reunión guiada donde otras familias comparten lo que están viviendo y reciben orientación práctica. No es un grupo de terapia y no reemplaza al tratamiento profesional. Es un espacio para dejar de sentirte solo y ordenar el próximo paso.</p>
        <h2>Cómo unirse</h2>
        <ul>
          <li>Día: cada lunes.</li>
          <li>Hora: 8:00 PM hora del Pacífico (EE. UU.).</li>
          <li>Formato: Zoom, cámara opcional.</li>
          <li>Costo: gratis.</li>
        </ul>
        <p>Escríbenos a <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> o llama al (458) 298-8011 para recibir el enlace de la próxima reunión.</p>
      </Prose>
      <CTAStrip />
    </>
  ),
});