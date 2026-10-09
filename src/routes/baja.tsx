import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/SiteLayout";

type Search = { correo?: string; t?: string };

export const Route = createFileRoute("/baja")({
  head: () => ({
    meta: [
      { title: "Cancelar registro automático — AyudaSobria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    correo: typeof s.correo === "string" ? s.correo : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
  }),
  component: OptOutPage,
});

function OptOutPage() {
  const { correo, t } = Route.useSearch();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // A button, not an automatic request: email scanners open links before people do.
  async function confirm() {
    setStatus("working");
    try {
      const response = await fetch("/api/zoom/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, t }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos completar la baja.");
      setStatus("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos completar la baja.");
      setStatus("error");
    }
  }

  return (
    <>
      <PageHero eyebrow="La Sobremesa" title="Cancelar el registro automático" />
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        {!correo || !t ? (
          <p className="text-muted-foreground">
            Este enlace está incompleto. Escríbenos a matt@soberhelpline.com y lo resolvemos.
          </p>
        ) : status === "done" ? (
          <>
            <p className="text-lg">
              Listo. Ya no registraremos a {correo} automáticamente ni te enviaremos el enlace cada
              semana.
            </p>
            <p className="mt-3 text-muted-foreground">
              Siempre puedes volver: regístrate cuando quieras para cualquier lunes.
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
              Dejaremos de registrar a <strong>{correo}</strong> automáticamente para La Sobremesa y
              de enviarle el enlace cada semana.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={status === "working"}
              className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {status === "working" ? "Procesando…" : "Confirmar la baja"}
            </button>
            {status === "error" && <p className="mt-4 text-sm text-destructive">{message}</p>}
          </>
        )}
      </div>
    </>
  );
}
