import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/coaching-familiar")({
  head: () => ({
    meta: [
      { title: "Coaching familiar privado en español — AyudaSobria" },
      {
        name: "description",
        content:
          "Sesiones privadas uno a uno para familias que necesitan claridad rápida sobre la adicción de un ser querido.",
      },
      { property: "og:title", content: "Coaching familiar — AyudaSobria" },
      { property: "og:description", content: "Sesiones privadas en español, desde US$150 (USD)." },
      { property: "og:url", content: "https://ayudasobria.com/coaching-familiar" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/coaching-familiar" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="1 a 1 · Privado"
        title="Coaching familiar"
        description="Cuando no puedes esperar al lunes. Sesiones privadas con orientación concreta."
      />
      <Prose>
        <h2>Para quién</h2>
        <p>
          Para la familia — no para la persona con adicción. Padres, parejas, hijos adultos y
          hermanos que necesitan una respuesta clara sobre qué hacer ahora.
        </p>
        <h2>Cómo funciona</h2>
        <ul>
          <li>Sesión inicial de 60 minutos.</li>
          <li>
            Por Zoom, en español y tratado con privacidad, sujeto a límites legales y de seguridad.
          </li>
          <li>Desde US$150 (USD) la sesión.</li>
        </ul>
        <p>
          Reserva escribiendo a <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> o
          al (458) 298-8011.
        </p>
      </Prose>
      <CTAStrip />
    </>
  ),
});
