import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/SiteLayout";

type Search = { correo?: string; t?: string };

export const Route = createFileRoute("/semanal")({
  head: () => ({
    meta: [
      { title: "Confirmar registro semanal — AyudaSobria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    correo: typeof s.correo === "string" ? s.correo : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
  }),
  component: OptInPage,
});

function OptInPage() {
  const { correo, t } = Route.useSearch();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // A button, not an automatic request: email scanners open links before people do.
  async function confirm() {
    setStatus("working");
    try {
      const response = await fetch("/api/zoom/semanal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, t }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos activar el registro semanal.");
      setStatus("done");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No pudimos activar el registro semanal.",
      );
      setStatus("error");
    }
  }

  return (
    <>
      <PageHero eyebrow="La Sobremesa" title="Confirmar tu registro semanal" />
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        {!correo || !t ? (
          <p className="text-muted-foreground">
            Este enlace está incompleto. Escríbenos a matt@soberhelpline.com y lo resolvemos.
          </p>
        ) : status === "done" ? (
          <>
            <p className="text-lg">
              Listo. Cada semana registraremos a {correo} para La Sobremesa y te enviaremos tu
              enlace personal por correo.
            </p>
            <p className="mt-3 text-muted-foreground">
              Puedes cancelarlo cuando quieras con el enlace que viene en cada correo.
            </p>
            <Link
              to="/registro"
              className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Ir al registro
            </Link>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              Te registraremos (<strong>{correo}</strong>) automáticamente para La Sobremesa y te
              enviaremos tu enlace personal cada semana.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={status === "working"}
              className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {status === "working" ? "Procesando…" : "Sí, regístrame cada semana"}
            </button>
            {status === "error" && <p className="mt-4 text-sm text-destructive">{message}</p>}
          </>
        )}
      </div>
    </>
  );
}
