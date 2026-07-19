import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terminos-sms")({
  head: () => ({
    meta: [
      { title: "Términos SMS — AyudaSobria" },
      { name: "description", content: "Condiciones para comunicación por mensajes de texto con AyudaSobria." },
      { property: "og:title", content: "Términos SMS — AyudaSobria" },
      { property: "og:url", content: "/terminos-sms" },
    ],
    links: [{ rel: "canonical", href: "/terminos-sms" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Legal" title="Términos SMS" />
      <Prose>
        <p>Al enviar tu número de teléfono a AyudaSobria autorizas recibir mensajes de texto relacionados con el Círculo Familiar, coaching e intervención. La frecuencia varía. Pueden aplicar tarifas de tu operador.</p>
        <p>Para dejar de recibir mensajes responde <strong>BAJA</strong>. Para ayuda responde <strong>AYUDA</strong> o escribe a <a href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a>.</p>
      </Prose>
    </>
  ),
});