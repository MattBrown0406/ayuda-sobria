import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terminos-sms")({
  head: () => ({
    meta: [
      { title: "Términos SMS — AyudaSobria" },
      {
        name: "description",
        content: "Condiciones para comunicación por mensajes de texto con AyudaSobria.",
      },
      { property: "og:title", content: "Términos SMS — AyudaSobria" },
      { property: "og:url", content: "https://ayudasobria.com/terminos-sms" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/terminos-sms" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Legal" title="Términos SMS" />
      <Prose>
        <p>
          Al enviar tu número de teléfono a AyudaSobria autorizas recibir mensajes de texto
          relacionados con La Sobremesa, coaching e intervención. La frecuencia varía y puede
          incluir mensajes recurrentes automatizados. Pueden aplicar tarifas de mensajes y datos de
          tu operador. El consentimiento no es condición de compra.
        </p>
        <p>
          Para dejar de recibir mensajes responde <strong>STOP</strong> o <strong>BAJA</strong>.
          Para ayuda responde <strong>HELP</strong> o <strong>AYUDA</strong>, llama al (458)
          298-8011 o escribe a <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a>.
        </p>
      </Prose>
    </>
  ),
});
