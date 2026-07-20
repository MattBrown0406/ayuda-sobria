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
      { property: "og:url", content: "https://ayudasobria.com/privacidad" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/privacidad" }],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Legal" title="Política de privacidad" />
      <Prose>
        <p>
          AyudaSobria respeta tu privacidad. Solo recopilamos la información necesaria para
          responder a tus consultas y coordinar el acceso a La Sobremesa, al coaching y a la
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
        <h2>Analítica y datos técnicos</h2>
        <p>
          Usamos Google Analytics para comprender de forma agregada cómo se utiliza el sitio. Este
          servicio puede procesar la dirección IP, datos del dispositivo, páginas visitadas y
          cookies o identificadores similares. Puedes limitar las cookies desde la configuración de
          tu navegador.
        </p>
        <h2>Información sensible y menores</h2>
        <p>
          No incluyas diagnósticos, números de expediente, información financiera ni otros detalles
          sensibles que no sean necesarios para responderte. El sitio no está dirigido a menores de
          13 años y no buscamos recopilar intencionalmente sus datos personales.
        </p>
        <h2>Mensajes SMS</h2>
        <p>
          Si aceptas recibir SMS, usamos tu número solo para enviarte el enlace de Zoom,
          recordatorios y avisos del servicio. Nunca compartimos tu número con terceros con fines
          de mercadeo y puedes darte de baja respondiendo <strong>STOP</strong> (ver{" "}
          <a href="/terminos-sms">términos SMS</a>).
        </p>
        <h2>Limitaciones de seguridad</h2>
        <p>
          Aplicamos medidas razonables para proteger la información, pero ningún sistema de internet
          o correo electrónico puede garantizar seguridad absoluta.
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
