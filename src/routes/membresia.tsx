import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHero, CTAStrip, Prose, SiteLayout } from "@/components/site/SiteLayout";

const PAYPAL_CLIENT_ID =
  "AZp-wM9j2rM3zpYD_TQW_yrwPn_boYZBDauMrvXDcSNedPKqJc4I225HElAVvhFnelll6yNzT8H2PEXy";
// Create a $14.99/month plan in PayPal (Pay → Subscriptions → Plans) and paste the ID here.
const PAYPAL_PLAN_ID = "REEMPLAZAR_CON_PLAN_ID";
const PRICE_DISPLAY = "$14.99 USD / mes";

export const Route = createFileRoute("/membresia")({
  head: () => ({
    meta: [
      { title: "Membresía $14.99/mes — AyudaSobria" },
      { name: "description", content: "Membresía mensual de $14.99 con acceso al Círculo Familiar, biblioteca en español, coaching grupal y descuentos." },
      { property: "og:title", content: "Membresía — AyudaSobria" },
      { property: "og:description", content: "Acompañamiento continuo para la familia en español." },
      { property: "og:url", content: "/membresia" },
    ],
    links: [{ rel: "canonical", href: "/membresia" }],
  }),
  component: MembresiaPage,
});

function MembresiaPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string }>({ kind: "idle" });
  const buttonsRef = useRef<HTMLDivElement | null>(null);
  const planConfigured = PAYPAL_PLAN_ID && !PAYPAL_PLAN_ID.startsWith("REEMPLAZAR");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { paypal?: unknown };
    if (w.paypal) { setSdkReady(true); return; }
    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-subs-sdk]");
    if (existing) { existing.addEventListener("load", () => setSdkReady(true)); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&components=buttons`;
    script.async = true;
    script.dataset.paypalSubsSdk = "true";
    script.onload = () => setSdkReady(true);
    script.onerror = () => setStatus({ kind: "error", message: "No se pudo cargar PayPal. Revisa tu conexión e inténtalo de nuevo." });
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkReady || !buttonsRef.current || !planConfigured) return;
    const w = window as unknown as {
      paypal?: { Buttons: (o: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close?: () => void } };
    };
    if (!w.paypal) return;
    buttonsRef.current.innerHTML = "";
    const instance = w.paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "subscribe" },
      createSubscription: (_d: unknown, actions: { subscription: { create: (o: unknown) => Promise<string> } }) =>
        actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
      onApprove: (data: { subscriptionID?: string }) => {
        setStatus({
          kind: "success",
          message: `¡Gracias! Tu membresía está activa (ID ${data.subscriptionID ?? "confirmado"}). Te enviaremos los accesos a tu correo en las próximas 24 horas.`,
        });
      },
      onError: () => setStatus({ kind: "error", message: "Ocurrió un error al procesar la suscripción. Escríbenos a hola@ayudasobria.com." }),
      onCancel: () => setStatus({ kind: "idle", message: "Suscripción cancelada. Puedes intentarlo cuando quieras." }),
    });
    instance.render(buttonsRef.current).catch(() =>
      setStatus({ kind: "error", message: "No se pudieron mostrar los botones de PayPal." }),
    );
    return () => { try { instance.close?.(); } catch { /* noop */ } };
  }, [sdkReady, planConfigured]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Suscripción mensual"
        title="Membresía AyudaSobria — $14.99/mes"
        description="Acompañamiento continuo para la familia, con acceso a reuniones, biblioteca y coaching grupal en español. Cancela cuando quieras."
      />
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <Prose>
            <h2>Qué incluye</h2>
            <ul>
              <li>Círculo Familiar semanal (lunes 8 PM PT).</li>
              <li>Biblioteca completa de recursos en español.</li>
              <li>Coaching grupal en vivo cada mes.</li>
              <li>Descuento en sesiones privadas y evaluaciones de intervención.</li>
            </ul>
            <p>¿Prefieres inscribirte con ayuda humana? Escribe a <a href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a>.</p>
          </Prose>
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-primary">Membresía mensual</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">{PRICE_DISPLAY}</div>
            <p className="mt-2 text-sm text-slate-600">Cobro recurrente cada mes. Cancela en cualquier momento desde tu cuenta de PayPal.</p>
            <div className="mt-5 min-h-[220px]">
              {!planConfigured && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Configura tu <strong>PayPal Plan ID</strong> de $14.99/mes en <code>src/routes/membresia.tsx</code> (constante <code>PAYPAL_PLAN_ID</code>) para activar el botón de suscripción.
                </div>
              )}
              {planConfigured && !sdkReady && (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Cargando opciones de pago…</div>
              )}
              <div ref={buttonsRef} />
            </div>
            {status.kind === "success" && status.message && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{status.message}</div>
            )}
            {status.kind === "error" && status.message && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{status.message}</div>
            )}
            {status.kind === "idle" && status.message && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{status.message}</div>
            )}
            <p className="mt-6 text-xs text-slate-500">Pago seguro procesado por PayPal. Para reembolsos o dudas escribe a <a className="text-sky-700 underline" href="mailto:hola@ayudasobria.com">hola@ayudasobria.com</a>.</p>
          </aside>
        </div>
      </section>
      <CTAStrip />
    </SiteLayout>
  );
}