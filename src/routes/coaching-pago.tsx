import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

const PAYPAL_CLIENT_ID =
  "AZp-wM9j2rM3zpYD_TQW_yrwPn_boYZBDauMrvXDcSNedPKqJc4I225HElAVvhFnelll6yNzT8H2PEXy";

type Tier = {
  id: string;
  name: string;
  price: string; // USD
  description: string;
  duration: string;
};

// Adjust these tiers/prices to match your SoberHelpline coaching offerings.
const TIERS: Tier[] = [
  {
    id: "consulta",
    name: "Consulta inicial",
    price: "150.00",
    duration: "60 minutos",
    description:
      "Primera sesión de evaluación familiar. Definimos el panorama y los próximos pasos.",
  },
  {
    id: "seguimiento",
    name: "Sesión de seguimiento",
    price: "120.00",
    duration: "45 minutos",
    description:
      "Coaching continuo para familias que ya iniciaron el proceso con Matt.",
  },
  {
    id: "paquete",
    name: "Paquete de 4 sesiones",
    price: "440.00",
    duration: "4 × 45 minutos",
    description:
      "Acompañamiento intensivo durante un mes. Ideal para momentos de crisis.",
  },
];

export const Route = createFileRoute("/coaching-pago")({
  head: () => ({
    meta: [
      { title: "Reservar sesión de coaching | AyudaSobria" },
      {
        name: "description",
        content:
          "Agenda y paga tu sesión de coaching familiar en español con Matt Brown. Pagos seguros vía PayPal o tarjeta.",
      },
      { property: "og:title", content: "Reservar sesión de coaching | AyudaSobria" },
      {
        property: "og:description",
        content:
          "Agenda y paga tu sesión de coaching familiar en español con Matt Brown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachingPagoPage,
});

function CoachingPagoPage() {
  const [tier, setTier] = useState<Tier>(TIERS[0]);
  const [status, setStatus] = useState<
    { kind: "idle" | "success" | "error"; message?: string }
  >({ kind: "idle" });
  const [sdkReady, setSdkReady] = useState(false);
  const buttonsRef = useRef<HTMLDivElement | null>(null);

  // Load the PayPal SDK once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { paypal?: unknown };
    if (w.paypal) {
      setSdkReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-paypal-sdk]",
    );
    if (existing) {
      existing.addEventListener("load", () => setSdkReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&enable-funding=venmo&components=buttons`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => setSdkReady(true);
    script.onerror = () =>
      setStatus({
        kind: "error",
        message:
          "No se pudo cargar PayPal. Revisa tu conexión e inténtalo de nuevo.",
      });
    document.body.appendChild(script);
  }, []);

  // Render (and re-render) the PayPal buttons whenever the tier changes.
  useEffect(() => {
    if (!sdkReady || !buttonsRef.current) return;
    const w = window as unknown as {
      paypal?: {
        Buttons: (opts: Record<string, unknown>) => {
          render: (el: HTMLElement) => Promise<void>;
          close?: () => void;
        };
      };
    };
    if (!w.paypal) return;
    buttonsRef.current.innerHTML = "";

    const instance = w.paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "pay" },
      createOrder: (
        _data: unknown,
        actions: {
          order: {
            create: (o: unknown) => Promise<string>;
          };
        },
      ) =>
        actions.order.create({
          intent: "CAPTURE",
          purchase_units: [
            {
              description: `AyudaSobria · ${tier.name}`,
              amount: { currency_code: "USD", value: tier.price },
            },
          ],
        }),
      onApprove: async (
        _data: unknown,
        actions: {
          order: {
            capture: () => Promise<{
              payer?: { name?: { given_name?: string } };
              id?: string;
            }>;
          };
        },
      ) => {
        try {
          const details = await actions.order.capture();
          const name = details?.payer?.name?.given_name ?? "";
          setStatus({
            kind: "success",
            message: `¡Gracias${name ? `, ${name}` : ""}! Recibimos tu pago por ${tier.name}. Te escribiremos a tu correo en las próximas 24 horas para coordinar el horario.`,
          });
        } catch (err) {
          setStatus({
            kind: "error",
            message:
              "El pago se aprobó pero hubo un problema al confirmarlo. Escríbenos a hola@ayudasobria.com.",
          });
        }
      },
      onError: () =>
        setStatus({
          kind: "error",
          message:
            "Ocurrió un error al procesar el pago. Puedes intentarlo de nuevo o escribirnos a hola@ayudasobria.com.",
        }),
      onCancel: () =>
        setStatus({
          kind: "idle",
          message: "Pago cancelado. Puedes elegir otro paquete cuando quieras.",
        }),
    });

    instance.render(buttonsRef.current).catch(() => {
      setStatus({
        kind: "error",
        message: "No se pudieron mostrar los botones de PayPal.",
      });
    });

    return () => {
      try {
        instance.close?.();
      } catch {
        /* noop */
      }
    };
  }, [sdkReady, tier]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Coaching familiar"
        title="Reserva tu sesión con Matt Brown"
        subtitle="Sesiones privadas en español para familias que enfrentan la adicción de un ser querido. Elige el paquete que mejor se ajuste a tu situación y paga de forma segura con PayPal, tarjeta o Venmo."
      />

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Elige tu paquete
            </h2>
            <div className="mt-4 space-y-3">
              {TIERS.map((t) => {
                const selected = t.id === tier.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTier(t);
                      setStatus({ kind: "idle" });
                    }}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-sky-600 bg-sky-50 ring-2 ring-sky-200"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {t.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {t.duration}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        ${t.price}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          USD
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              2. Paga de forma segura
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Estás pagando{" "}
              <span className="font-semibold text-slate-900">{tier.name}</span>{" "}
              por{" "}
              <span className="font-semibold text-slate-900">
                ${tier.price} USD
              </span>
              .
            </p>

            <div className="mt-5 min-h-[220px]">
              {!sdkReady && (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Cargando opciones de pago…
                </div>
              )}
              <div ref={buttonsRef} />
            </div>

            {status.kind === "success" && status.message && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {status.message}
              </div>
            )}
            {status.kind === "error" && status.message && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {status.message}
              </div>
            )}
            {status.kind === "idle" && status.message && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {status.message}
              </div>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Los pagos se procesan de forma segura por PayPal. No almacenamos
              información de tarjetas en nuestros servidores. Para reembolsos o
              dudas escribe a{" "}
              <a
                className="text-sky-700 underline"
                href="mailto:hola@ayudasobria.com"
              >
                hola@ayudasobria.com
              </a>
              .
            </p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
