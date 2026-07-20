import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteLayout } from "@/components/site/SiteLayout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página no cargó
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AyudaSobria — Apoyo para familias afectadas por la adicción" },
      {
        name: "description",
        content:
          "Reunión gratuita los lunes, sesiones privadas cuando no puedes esperar y evaluación de intervención. Orientación en español para familias.",
      },
      { name: "author", content: "AyudaSobria" },
      {
        property: "og:title",
        content: "AyudaSobria — Apoyo para familias afectadas por la adicción",
      },
      {
        property: "og:description",
        content:
          "Reunión gratuita los lunes, sesiones privadas cuando no puedes esperar y evaluación de intervención. Orientación en español para familias.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ayudasobria.com/" },
      { property: "og:site_name", content: "AyudaSobria" },
      { property: "og:locale", content: "es_US" },
      {
        property: "og:image",
        content: "https://ayudasobria.com/og-ayudasobria.png",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "AyudaSobria: apoyo para familias afectadas por la adicción",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "AyudaSobria — Apoyo para familias afectadas por la adicción",
      },
      {
        name: "twitter:description",
        content:
          "Reunión gratuita los lunes, sesiones privadas cuando no puedes esperar y evaluación de intervención. Orientación en español para familias.",
      },
      {
        name: "twitter:image",
        content: "https://ayudasobria.com/og-ayudasobria.png",
      },
      {
        name: "twitter:image:alt",
        content: "AyudaSobria: apoyo para familias afectadas por la adicción",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        children:
          "(()=>{let loaded=false;const load=()=>{if(loaded)return;loaded=true;window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','G-2LM6ETY3C9');const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-2LM6ETY3C9';document.head.appendChild(s)};['pointerdown','keydown','scroll'].forEach((event)=>window.addEventListener(event,load,{once:true,passive:true}))})();",
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://ayudasobria.com/#organization",
              name: "AyudaSobria",
              url: "https://ayudasobria.com/",
              logo: "https://ayudasobria.com/logo.png",
              image: "https://ayudasobria.com/og-ayudasobria.png",
              email: "matt@soberhelpline.com",
              telephone: "+1-458-298-8011",
              description:
                "Orientación en español para familias afectadas por la adicción de un ser querido.",
              founder: {
                "@type": "Person",
                name: "Matt Brown",
              },
            },
            {
              "@type": "WebSite",
              "@id": "https://ayudasobria.com/#website",
              url: "https://ayudasobria.com/",
              name: "AyudaSobria",
              inLanguage: "es",
              publisher: { "@id": "https://ayudasobria.com/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </QueryClientProvider>
  );
}
