import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/ingresar")({
  head: () => ({
    meta: [
      { title: "Ingresar — AyudaSobria" },
      { name: "description", content: "Ingresa al portal de miembros de AyudaSobria." },
      { property: "og:title", content: "Ingresar — AyudaSobria" },
      { property: "og:url", content: "/ingresar" },
    ],
    links: [{ rel: "canonical", href: "/ingresar" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Miembros" title="Ingresar" description="El portal de miembros estará disponible pronto." />
      <Prose>
        <p>Mientras tanto, escríbenos a <a href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a> o llama al (458) 298-8011 para acceder al Círculo Familiar y a los recursos de membresía.</p>
      </Prose>
    </>
  ),
});