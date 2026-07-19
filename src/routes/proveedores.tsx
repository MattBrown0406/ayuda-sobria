import { createFileRoute } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/proveedores")({
  head: () => ({
    meta: [
      { title: "Para proveedores de tratamiento — AyudaSobria" },
      { name: "description", content: "Colabora con AyudaSobria para atender a familias hispanohablantes afectadas por la adicción." },
      { property: "og:title", content: "Para proveedores — AyudaSobria" },
      { property: "og:description", content: "Referencias, colaboración clínica y directorio en español." },
      { property: "og:url", content: "/proveedores" },
    ],
    links: [{ rel: "canonical", href: "/proveedores" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Colaboración" title="Para proveedores de tratamiento" description="Trabajamos con centros y clínicos que atienden a familias hispanohablantes." />
      <Prose>
        <h2>Cómo colaboramos</h2>
        <ul>
          <li>Referencias de familias listas para tratamiento.</li>
          <li>Directorio en español para pacientes y familias.</li>
          <li>Apoyo clínico a distancia para la familia mientras el paciente está en tratamiento.</li>
        </ul>
        <p>Escríbenos a <a href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a>.</p>
      </Prose>
      <CTAStrip />
    </>
  ),
});