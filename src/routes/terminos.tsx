import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos de servicio — AyudaSobria" },
      { name: "description", content: "Condiciones de uso del sitio y servicios de AyudaSobria." },
      { property: "og:title", content: "Términos — AyudaSobria" },
      { property: "og:url", content: "/terminos" },
    ],
    links: [{ rel: "canonical", href: "/terminos" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Legal" title="Términos de servicio" />
      <Prose>
        <p>AyudaSobria ofrece educación y acompañamiento a familias afectadas por la adicción de un ser querido. Nuestros servicios no reemplazan la atención médica, psicológica o legal profesional.</p>
        <h2>Uso del sitio</h2>
        <p>Al usar este sitio aceptas no publicar información falsa, no suplantar a otras personas y no usar el contenido con fines comerciales sin autorización.</p>
        <h2>Limitación de responsabilidad</h2>
        <p>La información aquí publicada es educativa. En caso de emergencia comunícate con los servicios locales de tu país.</p>
        <h2>Contacto</h2>
        <p><a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a></p>
      </Prose>
    </>
  ),
});