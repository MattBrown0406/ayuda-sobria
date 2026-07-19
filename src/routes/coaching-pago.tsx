import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/coaching-pago")({
  head: () => ({
    meta: [
      { title: "Reservar coaching familiar — AyudaSobria" },
      {
        name: "description",
        content: "Solicita una sesión privada de coaching familiar en español con Matt Brown.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "/coaching-familiar" }],
  }),
  component: CoachingReservationPage,
});

function CoachingReservationPage() {
  return (
    <>
      <PageHero
        eyebrow="Coaching familiar"
        title="Reserva una sesión privada"
        description="Las sesiones privadas cuestan $150 USD por 60 minutos. Confirma disponibilidad con nuestro equipo antes de pagar."
      />
      <Prose>
        <h2>Cómo reservar</h2>
        <p>
          Llama al <a href="tel:4582988011">(458) 298-8011</a> para atención en español o escribe a{" "}
          <a href="mailto:matt@soberhelpline.com?subject=Solicitud%20de%20coaching%20familiar">
            matt@soberhelpline.com
          </a>
          .
        </p>
        <p>
          Te confirmaremos el horario y enviaremos un enlace de pago seguro. Esta página no acepta
          pagos directamente porque no queremos cobrarte antes de confirmar que la sesión puede
          realizarse.
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
