import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createMembershipSubscription,
  cancelMembershipSubscription,
  getMyMembership,
} from "@/lib/paypal.functions";
import { PageHero, CTAStrip, Prose } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/membresia")({
  head: () => ({
    meta: [
      { title: "Membresía para familias — AyudaSobria" },
      {
        name: "description",
        content:
          "Membresía familiar por US$14.99 al mes: biblioteca educativa, comunidad, sesiones en vivo y herramientas.",
      },
      { property: "og:title", content: "Membresía — AyudaSobria" },
      { property: "og:description", content: "Acompañamiento continuo para la familia." },
    ],
    links: [{ rel: "canonical", href: "/membresia" }],
  }),
  component: MembresiaPage,
});

type Membership = Awaited<ReturnType<typeof getMyMembership>>;

function MembresiaPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [session, setSession] = useState<{ userId: string } | null | undefined>(undefined);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFn = useServerFn(createMembershipSubscription);
  const cancelFn = useServerFn(cancelMembershipSubscription);
  const getFn = useServerFn(getMyMembership);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setSession(null);
        return;
      }
      setSession({ userId: data.user.id });
      try {
        const m = await getFn();
        setMembership(m);
      } catch { /* ignore */ }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { userId: s.user.id } : null);
      router.invalidate();
    });
    return () => sub.subscription.unsubscribe();
  }, [getFn, router]);

  async function handleSubscribe() {
    setError(null);
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/membresia/exito`;
      const cancelUrl = `${window.location.origin}/membresia/cancelado`;
      const { approvalUrl } = await createFn({ data: { returnUrl, cancelUrl } });
      if (!approvalUrl) throw new Error("No se obtuvo el enlace de PayPal");
      window.location.href = approvalUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar la suscripción");
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!membership?.paypal_subscription_id) return;
    if (!confirm("¿Cancelar tu membresía? Mantendrás acceso hasta la próxima fecha de cobro.")) return;
    setLoading(true);
    try {
      await cancelFn({ data: { subscriptionId: membership.paypal_subscription_id } });
      const m = await getFn();
      setMembership(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cancelar");
    } finally {
      setLoading(false);
    }
  }

  const isActive = membership?.status === "active";

  return (
    <>
      <PageHero
        eyebrow="US$14.99 al mes"
        title="Membresía familiar"
        description="Acompañamiento entre crisis: educación, comunidad, sesiones en vivo y herramientas prácticas para la familia."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Prose>
            <h2>Qué incluye</h2>
            <ul>
              <li>Biblioteca completa de educación familiar en español.</li>
              <li>Foro privado para miembros.</li>
              <li>Webinarios, grabaciones y sesiones de apoyo en vivo.</li>
              <li>Herramientas y evaluaciones premium.</li>
              <li>Cancelación en cualquier momento.</li>
            </ul>
            <h2>Precio</h2>
            <p>
              <strong>US$14.99 al mes.</strong> Todos los precios están en dólares
              estadounidenses (USD). Tu banco o PayPal se encargará de la conversión si pagas
              desde otro país.
            </p>
          </Prose>
        </div>
        <aside className="rounded-lg border border-border bg-card p-6 shadow-sm h-fit">
          <p className="text-sm text-muted-foreground">Membresía mensual</p>
          <p className="mt-1 text-3xl font-bold">US$14.99<span className="text-base font-normal text-muted-foreground">/mes</span></p>

          {session === undefined && (
            <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
          )}

          {session === null && (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Necesitas una cuenta para suscribirte. Es gratis y toma menos de un minuto.
              </p>
              <Link
                to="/auth"
                search={{ redirect: "/membresia" }}
                className="mt-4 block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Ingresar o registrarse
              </Link>
            </>
          )}

          {session && isActive && (
            <>
              <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                ✓ Tu membresía está activa.
              </p>
              {membership?.next_billing_date && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Próximo cobro: {new Date(membership.next_billing_date).toLocaleDateString("es-ES")}
                </p>
              )}
              <button
                onClick={handleCancel}
                disabled={loading}
                className="mt-4 w-full rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {loading ? "Procesando…" : "Cancelar membresía"}
              </button>
            </>
          )}

          {session && !isActive && (
            <>
              {membership?.status === "cancelled" && membership.access_ends_at && (
                <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Membresía cancelada. Acceso hasta {new Date(membership.access_ends_at).toLocaleDateString("es-ES")}.
                </p>
              )}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Redirigiendo a PayPal…" : "Suscribirme con PayPal"}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                Pago seguro con PayPal. Se cobra US$14.99 al mes automáticamente. Cancela en cualquier momento.
              </p>
            </>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </aside>
      </div>
      <CTAStrip />
    </>
  );
}
