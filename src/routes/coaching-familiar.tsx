import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/coaching-familiar")({
  head: () => ({
    meta: [
      { title: "Coaching familiar privado en español — AyudaSobria" },
      {
        name: "description",
        content:
          "Sesiones privadas uno a uno para familias que necesitan claridad rápida sobre la adicción de un ser querido.",
      },
      { property: "og:title", content: "Coaching familiar — AyudaSobria" },
      {
        property: "og:description",
        content: "Sesiones privadas en español. US$150 por sesión (US$125 para miembros).",
      },
      { property: "og:url", content: "https://ayudasobria.com/coaching-familiar" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/coaching-familiar" }],
  }),
  component: () => (
    <>
      <PageHero
        eyebrow="1 a 1 · Privado"
        title="Coaching familiar"
        description="Cuando no puedes esperar al lunes. Sesiones privadas con orientación concreta."
      />
      <Prose>
        <h2>Con quién trabajarás</h2>
        <p>
          Las sesiones son con <strong>Matt Brown</strong>, intervencionista profesional con más de
          22 años acompañando a familias frente a la adicción de un ser querido — desde la primera
          conversación difícil hasta la intervención formal y el ingreso a tratamiento.
        </p>
        <h2>Para quién</h2>
        <p>
          Para la familia — no para la persona con adicción. Padres, parejas, hijos adultos y
          hermanos que necesitan una respuesta clara sobre qué hacer ahora.
        </p>
        <h2>Qué puede ayudarte a resolver</h2>
        <ul>
          <li>Límites sobre dinero, vivienda, transporte y comunicación.</li>
          <li>Cómo responder a una recaída o al rechazo del tratamiento.</li>
          <li>Qué decir en una conversación difícil sin entrar en otra pelea.</li>
          <li>Cómo alinear a la familia y decidir el próximo paso para esta semana.</li>
          <li>
            Si la situación todavía corresponde a coaching o necesita evaluar una intervención.
          </li>
        </ul>
        <h2>Cómo funciona</h2>
        <ul>
          <li>Sesión inicial de 60 minutos.</li>
          <li>
            Por Zoom, en español y tratado con privacidad, sujeto a límites legales y de seguridad.
          </li>
          <li>US$150 (USD) por sesión · US$125 para miembros activos.</li>
        </ul>
        <p>
          El coaching es orientación educativa y práctica para la familia. No es psicoterapia,
          tratamiento médico ni un servicio de emergencia.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/coaching-pago"
            className="rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground no-underline hover:bg-primary/90"
          >
            Reservar y pagar una sesión
          </Link>
          <a
            href="tel:4582988011"
            className="rounded-md border border-input px-5 py-3 font-semibold no-underline hover:bg-accent"
          >
            Llamar antes de reservar
          </a>
        </div>
        <p>
          También puedes escribir a{" "}
          <a href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a>. Si aún no necesitas
          una sesión privada, empieza por{" "}
          <Link to="/registro">La Sobremesa gratuita de los lunes</Link>.
        </p>
      </Prose>
      <CTAStrip />
    </>
  ),
});
