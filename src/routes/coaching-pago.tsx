import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createCoachingOrder, getCoachingPricing } from "@/lib/paypal.functions";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/coaching-pago")({
  head: () => ({
    meta: [
      { title: "Reservar coaching familiar — AyudaSobria" },
      {
        name: "description",
        content: "Paga una sesión privada de coaching familiar en español con Matt Brown. US$150 público, US$125 miembros.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "/coaching-familiar" }],
  }),
  component: CoachingReservationPage,
});

type SessionType = "initial" | "followup";
type Pricing = { isMember: boolean; sessions: Record<SessionType, { label: string; price: string }> };

function CoachingReservationPage() {
  const getPricing = useServerFn(getCoachingPricing);
  const createOrder = useServerFn(createCoachingOrder);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("initial");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    getPricing().then((p) => setPricing(p as Pricing)).catch(() => setPricing(null));
  }, [getPricing]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { approvalUrl } = await createOrder({
        data: {
          sessionType,
          returnUrl: `${window.location.origin}/coaching-pago/exito`,
          cancelUrl: `${window.location.origin}/coaching-pago`,
          customerEmail: email,
          customerName: name,
        },
      });
      if (!approvalUrl) throw new Error("No se obtuvo el enlace de PayPal");
      window.location.href = approvalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
      setLoading(false);
    }
  }

  const isMember = pricing?.isMember ?? false;
  const currentPrice = pricing?.sessions[sessionType].price ?? "150.00";

  return (
    <>
      <PageHero
        eyebrow="Coaching familiar 1 a 1"
        title="Reserva una sesión privada"
        description="60 minutos con Matt Brown. US$150 público general · US$125 para miembros activos."
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2">
        <div className="space-y-4 text-sm text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">Qué esperar</h2>
          <p>Sesión privada por videollamada segura. Traduce tu situación en pasos concretos: límites, comunicación, intervención y siguientes acciones.</p>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-foreground">Precios (USD)</p>
            <ul className="mt-2 space-y-1">
              <li>Público general: US$150 por sesión</li>
              <li>Miembros activos: US$125 por sesión</li>
            </ul>
            {!signedIn && (
              <p className="mt-3 text-xs">
                ¿Ya eres miembro?{" "}
                <Link to="/auth" search={{ redirect: "/coaching-pago" }} className="font-medium text-primary hover:underline">
                  Ingresa
                </Link>{" "}
                para ver tu precio de miembro.
              </p>
            )}
            {signedIn && !isMember && (
              <p className="mt-3 text-xs">
                <Link to="/membresia" className="font-medium text-primary hover:underline">
                  Hazte miembro
                </Link>{" "}
                y paga US$125 por sesión.
              </p>
            )}
            {isMember && <p className="mt-3 text-xs text-emerald-700">✓ Precio de miembro aplicado.</p>}
          </div>
          <p>
            ¿Prefieres coordinar antes de pagar? Llama al{" "}
            <a href="tel:4582988011" className="font-medium text-primary">(458) 298-8011</a> o escribe a{" "}
            <a href="mailto:matt@soberhelpline.com" className="font-medium text-primary">matt@soberhelpline.com</a>.
          </p>
        </div>

        <form onSubmit={handlePay} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium">Tipo de sesión</label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {(["initial", "followup"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSessionType(k)}
                  className={`rounded-md border p-3 text-left text-sm ${sessionType === k ? "border-primary bg-primary/5" : "border-input"}`}
                >
                  <div className="font-semibold">
                    {k === "initial" ? "Consulta inicial" : "Sesión de seguimiento"}
                  </div>
                  <div className="text-xs text-muted-foreground">60 minutos</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Tu nombre</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Correo electrónico</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>

          <div className="flex items-baseline justify-between rounded-md bg-secondary px-3 py-2">
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-bold">US${currentPrice}</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button disabled={loading || !pricing} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Redirigiendo a PayPal…" : "Pagar con PayPal"}
          </button>
          <p className="text-xs text-muted-foreground">
            Pago único seguro con PayPal. Todos los precios en USD.
          </p>
        </form>
      </div>
      <CTAStrip />
    </>
  );
}
