import { Link } from "@tanstack/react-router";
import { Phone, LogIn, Menu } from "lucide-react";
import { type ReactNode, useState } from "react";
import logo from "@/assets/logo.png";

export const PHONE_DISPLAY = "(458) 298-8011";
export const PHONE_HREF = "tel:4582988011";
export const EMAIL = "matt@soberhelpline.com";

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/apoyo-familiar", label: "Estados" },
    { to: "/paises", label: "Países" },
    { to: "/respuestas-familia", label: "Respuestas" },
    { to: "/mapa", label: "Mapa" },
    { to: "/herramientas-ia", label: "Herramientas IA" },
    { to: "/membresia", label: "Membresía" },
    { to: "/recursos", label: "Recursos" },
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
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={PHONE_HREF} className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold sm:inline-flex">
            <Phone className="h-3.5 w-3.5" /> {PHONE_DISPLAY}
          </a>
          <Link to="/registro" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Reservar lugar
          </Link>
          <button onClick={() => setOpen((o) => !o)} className="rounded-md border border-input p-2 lg:hidden" aria-label="Menú">
            <Menu className="h-4 w-4" />
          </button>
          <Link to="/ingresar" className="hidden items-center gap-1 rounded-md border border-input px-3 py-2 text-sm font-medium xl:inline-flex">
            <LogIn className="h-4 w-4" /> Ingresar
          </Link>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                {l.label}
              </Link>
            ))}
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
            <a href={PHONE_HREF} className="font-semibold text-primary">{PHONE_DISPLAY}</a>
          </p>
          <p className="text-sm text-muted-foreground">{EMAIL}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Programa</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/circulo-familiar" className="hover:text-foreground">Círculo Familiar (lunes 8 PM PT)</Link></li>
            <li><Link to="/coaching-familiar" className="hover:text-foreground">Coaching familiar</Link></li>
            <li><Link to="/intervencion" className="hover:text-foreground">Intervención</Link></li>
            <li><Link to="/membresia" className="hover:text-foreground">Membresía</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Ubicaciones</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/apoyo-familiar" className="hover:text-foreground">Estados de EE. UU.</Link></li>
            <li><Link to="/paises" className="hover:text-foreground">Países de Latinoamérica</Link></li>
          </ul>
          <p className="mt-6 text-sm font-semibold">Aprender</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/respuestas-familia" className="hover:text-foreground">Respuestas para familias</Link></li>
            <li><Link to="/mapa" className="hover:text-foreground">Mapa de recuperación</Link></li>
            <li><Link to="/herramientas-ia" className="hover:text-foreground">Herramientas con IA</Link></li>
            <li><Link to="/recursos" className="hover:text-foreground">Todos los recursos</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Empresa</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/testimonios" className="hover:text-foreground">Testimonios</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">Preguntas frecuentes</Link></li>
            <li><Link to="/proveedores" className="hover:text-foreground">Para proveedores</Link></li>
            <li><Link to="/privacidad" className="hover:text-foreground">Privacidad</Link></li>
            <li><Link to="/terminos" className="hover:text-foreground">Términos</Link></li>
            <li><Link to="/terminos-sms" className="hover:text-foreground">Términos SMS</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <p className="mx-auto max-w-7xl px-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} AyudaSobria. Contenido educativo. No sustituye atención médica de emergencia. Si tu familia enfrenta una crisis inmediata, llama al 911 o al servicio local de emergencias.
        </p>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
      <div className="mx-auto max-w-4xl px-4 py-14 lg:py-20">
        {eyebrow && <p className="text-sm font-medium uppercase tracking-wide text-primary">{eyebrow}</p>}
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
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-3">
        <Link to="/circulo-familiar" className="rounded-xl border-2 border-primary bg-primary p-5 text-primary-foreground hover:bg-primary/90">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Empieza aquí</p>
          <p className="mt-1 text-lg font-semibold">Círculo Familiar gratis — lunes 8 PM PT</p>
        </Link>
        <Link to="/coaching-familiar" className="rounded-xl border-2 border-chart-4/60 bg-card p-5 hover:border-chart-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cuando no puedes esperar</p>
          <p className="mt-1 text-lg font-semibold">Coaching privado desde US$150 (USD)</p>
        </Link>
        <Link to="/intervencion" className="rounded-xl border-2 border-destructive/50 bg-card p-5 hover:border-destructive">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alto riesgo</p>
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