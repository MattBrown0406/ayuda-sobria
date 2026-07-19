import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/membresia")({
  head: () => ({
    meta: [
      { title: "Membresía para familias — AyudaSobria" },
      { name: "description", content: "Membresía mensual con acceso al Círculo Familiar, biblioteca en español, coaching grupal y descuentos." },
      { property: "og:title", content: "Membresía — AyudaSobria" },
      { property: "og:description", content: "Acompañamiento continuo para la familia en español." },
      { property: "og:url", content: "/membresia" },
    ],
    links: [{ rel: "canonical", href: "/membresia" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Suscripción mensual" title="Membresía AyudaSobria" description="Acompañamiento continuo para la familia, con acceso a reuniones, biblioteca y coaching grupal en español." />
      <Prose>
        <h2>Qué incluye</h2>
        <ul>
          <li>Círculo Familiar semanal (lunes 8 PM PT).</li>
          <li>Biblioteca completa de recursos en español.</li>
          <li>Coaching grupal en vivo cada mes.</li>
          <li>Descuento en sesiones privadas y evaluaciones de intervención.</li>
        </ul>
        <p>Para inscribirte escribe a <a href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a>.</p>
      </Prose>
      <CTAStrip />
    </>
  ),
});