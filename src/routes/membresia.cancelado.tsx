import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/membresia/cancelado")({
  head: () => ({ meta: [{ title: "Suscripción cancelada — Ayuda Sobria" }] }),
  component: () => (
    <>
      <PageHero eyebrow="Membresía" title="Suscripción no completada" />
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-muted-foreground">
          Cancelaste el proceso en PayPal. No se realizó ningún cobro.
        </p>
        <Link to="/membresia" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Volver a membresía
        </Link>
      </div>
    </>
  ),
});