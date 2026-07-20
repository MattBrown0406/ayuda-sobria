import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { activateMembershipSubscription } from "@/lib/paypal.functions";
import { PageHero } from "@/components/site/SiteLayout";

type Search = { subscription_id?: string; ba_token?: string; token?: string };

export const Route = createFileRoute("/membresia/exito")({
  head: () => ({
    meta: [
      { title: "Membresía activada — Ayuda Sobria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    subscription_id: typeof s.subscription_id === "string" ? s.subscription_id : undefined,
    ba_token: typeof s.ba_token === "string" ? s.ba_token : undefined,
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { subscription_id } = useSearch({ from: "/membresia/exito" });
  const activate = useServerFn(activateMembershipSubscription);
  const [status, setStatus] = useState<"loading" | "active" | "pending" | "error">("loading");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!subscription_id) {
      setStatus("error");
      setMsg("No se recibió el identificador de suscripción de PayPal.");
      return;
    }
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 5; i++) {
        try {
          const res = await activate({ data: { subscriptionId: subscription_id } });
          if (cancelled) return;
          if (res.success) {
            setStatus("active");
            return;
          }
        } catch (e) {
          if (i === 4) {
            setStatus("error");
            setMsg(e instanceof Error ? e.message : "Error al activar");
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setStatus("pending");
    })();
    return () => {
      cancelled = true;
    };
  }, [subscription_id, activate]);

  return (
    <>
      <PageHero
        eyebrow="Membresía"
        title={status === "active" ? "¡Bienvenido!" : "Procesando tu suscripción"}
      />
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        {status === "loading" && (
          <p className="text-muted-foreground">Confirmando tu pago con PayPal…</p>
        )}
        {status === "active" && (
          <>
            <p className="text-lg">Tu membresía está activa. Gracias por unirte a Ayuda Sobria.</p>
            <Link
              to="/membresia"
              className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Ir a mi membresía
            </Link>
          </>
        )}
        {status === "pending" && (
          <p>Tu suscripción se está procesando. Recibirás un correo de confirmación en breve.</p>
        )}
        {status === "error" && <p className="text-destructive">{msg}</p>}
      </div>
    </>
  );
}
