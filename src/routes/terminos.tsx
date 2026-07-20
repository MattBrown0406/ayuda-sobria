import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos de servicio — AyudaSobria" },
      { name: "description", content: "Condiciones de uso del sitio y servicios de AyudaSobria." },
      { property: "og:title", content: "Términos — AyudaSobria" },
      { property: "og:url", content: "https://ayudasobria.com/terminos" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/terminos" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Legal" title="Términos de servicio" />
      <Prose>
        <p>
          AyudaSobria ofrece educación y acompañamiento a familias afectadas por la adicción de un
          ser querido. Nuestros servicios no reemplazan la atención médica, psicológica o legal
          profesional.
        </p>
        <h2>Uso del sitio</h2>
        <p>
          Al usar este sitio aceptas no publicar información falsa, no suplantar a otras personas y
          no usar el contenido con fines comerciales sin autorización.
        </p>
        <h2>Limitación de responsabilidad</h2>
        <p>
          La información aquí publicada es educativa. En caso de emergencia comunícate con los
          servicios locales de tu país.
        </p>
        <h2>Cuentas, membresía y pagos</h2>
        <p>
          Las cuentas, membresías y pagos pueden administrarse mediante el portal seguro de
          SoberHelpline. Los precios, periodo de prueba, renovación, cancelación y cualquier
          política de reembolso se muestran antes de confirmar una compra. No compartas tus
          credenciales.
        </p>
        <h2>Comunidad y contenido</h2>
        <p>
          No publiques información privada de otras personas, amenazas, acoso, contenido ilegal ni
          consejos que se presenten como atención médica profesional.
        </p>
        <p>Vigente desde el 19 de julio de 2026.</p>
        <h2>Contacto</h2>
        <p>
          <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a>
        </p>
      </Prose>
    </>
  ),
});
