import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/ingresar")({
  head: () => ({
    meta: [
      { title: "Ingresar — AyudaSobria" },
      {
        name: "description",
        content: "Ingresa al portal seguro de miembros de AyudaSobria y SoberHelpline.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/ingresar" }],
  }),
  component: IngresarPage,
});

function IngresarPage() {
  return (
    <>
      <PageHero
        eyebrow="Miembros"
        title="Ingresa a tu cuenta"
        description="Tu membresía de AyudaSobria usa el portal seguro de SoberHelpline para proteger tu cuenta, pagos y contenido privado."
      />
      <Prose>
        <p>
          <a href="https://soberhelpline.com/auth?redirect=/member-home">
            Ingresar al portal seguro →
          </a>
        </p>
        <p>
          ¿Todavía no eres miembro? <a href="/membresia">Conoce los planes y la prueba gratuita</a>.
        </p>
        <p>
          Si necesitas ayuda con tu acceso, escribe a{" "}
          <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> o llama al (458)
          298-8011.
        </p>
      </Prose>
    </>
  );
}
