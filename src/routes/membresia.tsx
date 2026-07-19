import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

const MEMBERSHIP_URL = "https://soberhelpline.com/auth?redirect=/family-membership";

export const Route = createFileRoute("/membresia")({
  head: () => ({
    meta: [
      { title: "Membresía para familias — AyudaSobria" },
      {
        name: "description",
        content:
          "Prueba gratuita y membresía familiar con biblioteca educativa, comunidad, sesiones en vivo y herramientas.",
      },
      { property: "og:title", content: "Membresía — AyudaSobria" },
      { property: "og:description", content: "Acompañamiento continuo para la familia." },
    ],
    links: [{ rel: "canonical", href: "/membresia" }],
  }),
  component: MembresiaPage,
});

function MembresiaPage() {
  return (
    <>
      <PageHero
        eyebrow="7 días gratis"
        title="Membresía familiar"
        description="Acompañamiento entre crisis: educación, comunidad, sesiones en vivo y herramientas prácticas para la familia."
      />
      <Prose>
        <h2>Qué incluye</h2>
        <ul>
          <li>Biblioteca completa de educación familiar.</li>
          <li>Foro privado para miembros.</li>
          <li>Webinarios, grabaciones y sesiones de apoyo.</li>
          <li>Herramientas y evaluaciones premium.</li>
          <li>Cancelación en cualquier momento.</li>
        </ul>
        <h2>Planes</h2>
        <p>
          <strong>Prueba de 7 días:</strong> gratis, sin pago inicial.
        </p>
        <p>
          <strong>Mensual:</strong> $14.99 USD al mes. <strong>Anual:</strong> $149 USD al año.
        </p>
        <p>
          La cuenta, el pago y el contenido privado se administran en el portal seguro de
          SoberHelpline. Puedes usar el mismo acceso desde la aplicación y desde la web.
        </p>
        <p>
          <a href={MEMBERSHIP_URL}>Crear una cuenta o iniciar la prueba gratuita →</a>
        </p>
        <p>
          ¿Ya eres miembro?{" "}
          <a href="https://soberhelpline.com/auth?redirect=/member-home">
            Ingresa al portal de miembros →
          </a>
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
