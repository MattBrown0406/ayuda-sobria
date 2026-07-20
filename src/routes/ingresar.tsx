import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/ingresar")({
  head: () => ({
    meta: [
      { title: "Ingresar — AyudaSobria" },
      {
        name: "description",
        content: "Ingresa a tu cuenta de AyudaSobria para administrar tu membresía.",
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
        description="Usa tu cuenta de AyudaSobria para revisar y administrar tu membresía."
      />
      <Prose>
        <p>
          <Link to="/auth">Ingresar a AyudaSobria →</Link>
        </p>
        <p>
          ¿Todavía no eres miembro? <Link to="/membresia">Conoce los planes disponibles</Link>.
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
