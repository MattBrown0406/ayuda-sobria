import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registro — Círculo Familiar (lunes 8 PM PT) — AyudaSobria" },
      { name: "description", content: "Reserva tu lugar en la reunión gratuita del Círculo Familiar cada lunes a las 8:00 PM hora del Pacífico. En español, por Zoom." },
      { property: "og:title", content: "Registro al Círculo Familiar — AyudaSobria" },
      { property: "og:description", content: "Reunión semanal en español para familias afectadas por la adicción. Cada lunes 8:00 PM PT por Zoom." },
      { property: "og:url", content: "/registro" },
    ],
    links: [{ rel: "canonical", href: "/registro" }],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    relacion: "",
    situacion: "",
    primera: "si",
    consentSms: false,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Placeholder: eventually POST to a server function that emails matt@soberhelpline.com
    // and adds the person to the Zoom recurring meeting invite list.
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <>
        <PageHero eyebrow="Registro recibido" title="¡Nos vemos el lunes!" description="Recibirás el enlace de Zoom por correo antes de la reunión." />
        <div className="mx-auto max-w-2xl px-4 py-12 space-y-4 text-muted-foreground">
          <p>Gracias, <strong className="text-foreground">{form.nombre || "familia"}</strong>. Registramos tu lugar para el <strong className="text-foreground">Círculo Familiar del lunes a las 8:00 PM (hora del Pacífico)</strong>.</p>
          <p>En las próximas horas te enviaremos a <strong className="text-foreground">{form.email}</strong> el enlace de Zoom, un recordatorio 24 horas antes y una breve guía para prepararte.</p>
          <p>Si necesitas hablar con alguien antes del lunes, escribe a <a className="text-primary hover:underline" href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a> o llama al <a className="text-primary hover:underline" href="tel:+14582988011">(458) 298-8011</a>.</p>
        </div>
        <CTAStrip />
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Reunión semanal · Gratis · En español"
        title="Regístrate al Círculo Familiar"
        description="Cada lunes a las 8:00 PM hora del Pacífico (EE. UU.), por Zoom. Para familias que aman a alguien con adicción."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <input required value={form.nombre} onChange={(e) => update("nombre", e.target.value)} className={inputCls} placeholder="Tu nombre" />
            </Field>
            <Field label="Correo electrónico" required>
              <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} placeholder="tucorreo@ejemplo.com" />
            </Field>
            <Field label="Teléfono (opcional)">
              <input type="tel" value={form.telefono} onChange={(e) => update("telefono", e.target.value)} className={inputCls} placeholder="+52 55 1234 5678" />
            </Field>
            <Field label="País o estado">
              <input value={form.pais} onChange={(e) => update("pais", e.target.value)} className={inputCls} placeholder="México, California, Argentina…" />
            </Field>
          </div>

          <Field label="¿Quién es tu ser querido con adicción?" required>
            <select required value={form.relacion} onChange={(e) => update("relacion", e.target.value)} className={inputCls}>
              <option value="">Selecciona una opción</option>
              <option>Mi hijo/a</option>
              <option>Mi pareja o esposo/a</option>
              <option>Mi padre o madre</option>
              <option>Mi hermano/a</option>
              <option>Otro familiar</option>
              <option>Un amigo cercano</option>
            </select>
          </Field>

          <Field label="Cuéntanos brevemente tu situación (opcional)">
            <textarea value={form.situacion} onChange={(e) => update("situacion", e.target.value)} className={`${inputCls} min-h-28`} placeholder="Solo lo que quieras compartir. Es confidencial." />
          </Field>

          <Field label="¿Es tu primera vez en el Círculo Familiar?">
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="radio" name="primera" checked={form.primera === "si"} onChange={() => update("primera", "si")} /> Sí</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="primera" checked={form.primera === "no"} onChange={() => update("primera", "no")} /> No, ya he asistido</label>
            </div>
          </Field>

          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-1" checked={form.consentSms} onChange={(e) => update("consentSms", e.target.checked)} />
            <span>Acepto recibir el enlace de Zoom y recordatorios por correo o SMS. Consulta los <a className="text-primary hover:underline" href="/terminos-sms">términos SMS</a> y la <a className="text-primary hover:underline" href="/privacidad">política de privacidad</a>.</span>
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Enviando…" : "Reservar mi lugar del lunes"}
          </button>
          <p className="text-xs text-muted-foreground">Gratis. Sin tarjeta. Puedes darte de baja en cualquier momento.</p>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <p className="text-sm font-semibold">Detalles de la reunión</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Día:</strong> cada lunes</li>
              <li><strong className="text-foreground">Hora:</strong> 8:00 PM PT (hora del Pacífico)</li>
              <li><strong className="text-foreground">Duración:</strong> 60–75 minutos</li>
              <li><strong className="text-foreground">Formato:</strong> Zoom, cámara opcional</li>
              <li><strong className="text-foreground">Idioma:</strong> español</li>
              <li><strong className="text-foreground">Costo:</strong> gratis</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">¿No puedes el lunes?</p>
            <p className="mt-2">Reserva una <a className="text-primary hover:underline" href="/coaching-familiar">sesión de coaching privado</a> o escríbenos a <a className="text-primary hover:underline" href="mailto:matt@soberhelpline.com">matt@soberhelpline.com</a>.</p>
          </div>
        </aside>
      </div>
      <CTAStrip />
    </>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
    </label>
  );
}