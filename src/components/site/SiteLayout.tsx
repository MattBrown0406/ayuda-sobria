import { Link, useRouterState } from "@tanstack/react-router";
import { Phone, LogIn, Menu } from "lucide-react";
import { type ReactNode, useState } from "react";
import logo from "@/assets/logo.webp";
import { AppPromo } from "@/components/site/AppPromo";

export const PHONE_DISPLAY = "(458) 298-8011";
export const PHONE_HREF = "tel:+14582988011";
export const EMAIL = "matt@soberhelpline.com";
export const WHATSAPP_HREF =
  "https://wa.me/15038362136?text=" +
  encodeURIComponent("Hola, necesito apoyo para mi familia. ¿Me pueden ayudar?");

export function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.24 8.24 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.25-.02-.39.11-.51.11-.11.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.75 2.79 4.25 3.81.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.5-.61 1.71-1.21.21-.6.21-1.11.15-1.21-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/circulo-familiar", label: "La Sobremesa" },
    { to: "/grabaciones", label: "Grabaciones" },
    { to: "/coaching-familiar", label: "Coaching" },
    { to: "/intervencion", label: "Intervención" },
    { to: "/blog", label: "Blog" },
    { to: "/recursos", label: "Recursos" },
    { to: "/membresia", label: "Membresía" },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AyudaSobria" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">Ayuda Sobria</span>
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={PHONE_HREF}
            aria-label={`Llamar a AyudaSobria al ${PHONE_DISPLAY}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary p-2 text-xs font-semibold sm:px-3 sm:py-1.5"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escríbenos por WhatsApp"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary p-2 text-xs font-semibold sm:px-3 sm:py-1.5"
          >
            <WhatsAppMark className="h-3.5 w-3.5 text-chart-2" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <Link
            to="/registro"
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Reunión gratis
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-md border border-input p-2 lg:hidden"
            aria-label="Menú"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link
            to="/auth"
            className="hidden items-center gap-1 rounded-md border border-input px-3 py-2 text-sm font-medium xl:inline-flex"
          >
            <LogIn className="h-4 w-4" /> Ingresar
          </Link>
        </div>
      </div>
      {open && (
        <div id="mobile-navigation" className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <WhatsAppMark className="h-4 w-4 text-chart-2" /> WhatsApp (internacional)
            </a>
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Ingresar
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="AyudaSobria" width={32} height={32} className="h-8 w-8" />
            <span className="text-base font-semibold">Ayuda Sobria</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Apoyo en español para familias que enfrentan la adicción de un ser querido.
          </p>
          <p className="mt-3 text-sm">
            <a href={PHONE_HREF} className="font-semibold text-primary">
              {PHONE_DISPLAY}
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p className="mt-3 text-sm">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-primary"
            >
              <WhatsAppMark className="h-4 w-4" /> WhatsApp internacional
            </a>
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Programa</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/circulo-familiar" className="hover:text-foreground">
                La Sobremesa (lunes 8 PM PT)
              </Link>
            </li>
            <li>
              <Link to="/coaching-familiar" className="hover:text-foreground">
                Coaching familiar
              </Link>
            </li>
            <li>
              <Link to="/intervencion" className="hover:text-foreground">
                Intervención
              </Link>
            </li>
            <li>
              <Link to="/membresia" className="hover:text-foreground">
                Membresía
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Ubicaciones</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/apoyo-familiar" className="hover:text-foreground">
                Estados de EE. UU.
              </Link>
            </li>
            <li>
              <Link to="/paises" className="hover:text-foreground">
                Países de Latinoamérica
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-sm font-semibold">Aprender</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/respuestas-familia" className="hover:text-foreground">
                Respuestas para familias
              </Link>
            </li>
            <li>
              <Link to="/mapa" className="hover:text-foreground">
                Mapa de recuperación
              </Link>
            </li>
            <li>
              <Link to="/herramientas-ia" className="hover:text-foreground">
                Guías educativas
              </Link>
            </li>
            <li>
              <Link to="/recursos" className="hover:text-foreground">
                Todos los recursos
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Empresa</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/sobre-nosotros" className="hover:text-foreground">
                Sobre AyudaSobria
              </Link>
            </li>
            <li>
              <Link to="/testimonios" className="hover:text-foreground">
                Testimonios
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-foreground">
                Preguntas frecuentes
              </Link>
            </li>

            <li>
              <Link to="/privacidad" className="hover:text-foreground">
                Privacidad
              </Link>
            </li>
            <li>
              <Link to="/terminos" className="hover:text-foreground">
                Términos
              </Link>
            </li>
            <li>
              <Link to="/terminos-sms" className="hover:text-foreground">
                Términos SMS
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <p className="mx-auto max-w-7xl px-4 text-xs text-muted-foreground">
          <Link
            to="/admin"
            aria-label="Admin login"
            className="text-muted-foreground no-underline hover:text-muted-foreground focus:outline-none"
          >
            © {new Date().getFullYear()} AyudaSobria.
          </Link>{" "}
          Contenido educativo. No sustituye atención médica de emergencia. Si tu familia enfrenta
          una crisis inmediata, llama al 911 o al servicio local de emergencias.
        </p>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showAppPromo = pathname !== "/";
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>
      {showAppPromo && <AppPromo />}
      <Footer />
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-chart-2 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <WhatsAppMark className="h-5 w-5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
      <div className="mx-auto max-w-4xl px-4 py-14 lg:py-20">
        {eyebrow && (
          <p className="text-sm font-medium uppercase tracking-wide text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
        {children}
      </div>
    </section>
  );
}

export function CTAStrip() {
  return (
    <section className="border-y border-border bg-primary/5">
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <p className="rounded-lg border border-destructive/30 bg-background p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">¿Hay peligro inmediato o sobredosis?</strong> Llama al
          911 o al servicio local de emergencias. En Estados Unidos, llama o envía texto al 988
          (oprime 2 para español) para una crisis suicida o de salud mental. Estos servicios no
          sustituyen atención de emergencia.
        </p>
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 pt-4 md:grid-cols-3">
        <Link
          to="/circulo-familiar"
          className="rounded-xl border-2 border-primary bg-primary p-5 text-primary-foreground hover:bg-primary/90"
        >
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Empieza aquí</p>
          <p className="mt-1 text-lg font-semibold">La Sobremesa gratis — lunes 8 PM PT</p>
        </Link>
        <Link
          to="/coaching-familiar"
          className="rounded-xl border-2 border-chart-4/60 bg-card p-5 hover:border-chart-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cuando no puedes esperar
          </p>
          <p className="mt-1 text-lg font-semibold">Coaching privado desde US$150 (USD)</p>
        </Link>
        <Link
          to="/intervencion"
          className="rounded-xl border-2 border-destructive/50 bg-card p-5 hover:border-destructive"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cuando no es una emergencia
          </p>
          <p className="mt-1 text-lg font-semibold">Evaluación de intervención</p>
        </Link>
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-base leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1 [&_a]:text-primary [&_a]:underline">
      {children}
    </div>
  );
}
