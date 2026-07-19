import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad — AyudaSobria" },
      {
        name: "description",
        content: "Cómo AyudaSobria recopila, usa y protege la información de las familias.",
      },
      { property: "og:title", content: "Privacidad — AyudaSobria" },
      { property: "og:url", content: "/privacidad" },
    ],
    links: [{ rel: "canonical", href: "/privacidad" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Legal" title="Política de privacidad" />
      <Prose>
        <p>
          AyudaSobria respeta tu privacidad. Solo recopilamos la información necesaria para
          responder a tus consultas y coordinar el acceso al Círculo Familiar, al coaching y a la
          intervención.
        </p>
        <h2>Qué recopilamos</h2>
        <ul>
          <li>Nombre, correo, teléfono, país o estado y relación familiar cuando te registras.</li>
          <li>Preferencias de contacto y evidencia de consentimiento.</li>
          <li>La información que decides compartir sobre tu situación familiar.</li>
        </ul>
        <h2>Cómo la usamos</h2>
        <p>
          Solo la usamos para responderte, agendar sesiones y enviarte información que solicitaste.
          No vendemos ni compartimos tus datos con terceros con fines comerciales.
        </p>
        <h2>Proveedores, conservación y seguridad</h2>
        <p>
          Podemos usar proveedores de correo, videollamadas, alojamiento, pagos y soporte para
          prestar el servicio. Solo reciben la información necesaria para su función y pueden
          procesarla en Estados Unidos. Conservamos los registros durante el tiempo necesario para
          coordinar el servicio, cumplir obligaciones legales y resolver disputas.
        </p>
        <h2>Tus opciones</h2>
        <p>
          Puedes solicitar acceso, corrección o eliminación, y retirar tu consentimiento para
          comunicaciones futuras.
        </p>
        <h2>Contacto</h2>
        <p>
          Escribe a <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> para acceder,
          corregir o eliminar tu información.
        </p>
      </Prose>
    </>
  ),
});
