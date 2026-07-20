import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/testimonios")({
  head: () => ({
    meta: [
      { title: "Experiencias de familias — AyudaSobria" },
      {
        name: "description",
        content:
          "Información sobre las experiencias de familias que reciben apoyo frente a la adicción.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/testimonios" }],
  }),
  component: TestimoniosPage,
});

function TestimoniosPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacidad primero"
        title="Experiencias de familias"
        description="No publicamos citas ni resultados atribuidos sin consentimiento verificable."
      />
      <Prose>
        <p>
          Las familias suelen llegar sintiéndose aisladas, confundidas o agotadas. El objetivo del
          Círculo Familiar y del coaching es ayudarlas a pensar con más claridad, aprender límites
          sostenibles y tomar decisiones con menos miedo.
        </p>
        <p>
          Los resultados varían y ningún servicio puede garantizar que otra persona acepte
          tratamiento. Publicaremos testimonios en español únicamente cuando exista permiso
          documentado y una traducción aprobada.
        </p>
      </Prose>
      <CTAStrip />
    </>
  );
}
