import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { captureCoachingOrder } from "@/lib/paypal.functions";
import { PageHero } from "@/components/site/SiteLayout";

type Search = { token?: string; PayerID?: string };

export const Route = createFileRoute("/coaching-pago/exito")({
  head: () => ({ meta: [{ title: "Pago recibido — Ayuda Sobria" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
    PayerID: typeof s.PayerID === "string" ? s.PayerID : undefined,
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { token } = useSearch({ from: "/coaching-pago/exito" });
  const capture = useServerFn(captureCoachingOrder);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); setMsg("Falta el identificador de la orden."); return; }
    capture({ data: { orderId: token } })
      .then((r) => { r.success ? setStatus("ok") : (setStatus("error"), setMsg("El pago aún no se ha completado.")); })
      .catch((e) => { setStatus("error"); setMsg(e instanceof Error ? e.message : "Error al confirmar el pago"); });
  }, [token, capture]);

  return (
    <>
      <PageHero eyebrow="Coaching" title={status === "ok" ? "¡Pago recibido!" : "Procesando pago"} />
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        {status === "loading" && <p className="text-muted-foreground">Confirmando tu pago con PayPal…</p>}
        {status === "ok" && (
          <>
            <p className="text-lg">Gracias. Matt te contactará por correo para coordinar el horario de tu sesión.</p>
            <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Volver al inicio</Link>
          </>
        )}
        {status === "error" && <p className="text-destructive">{msg}</p>}
      </div>
    </>
  );
}