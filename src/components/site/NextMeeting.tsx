import { useEffect, useId, useRef, useState } from "react";
import {
  meetingCalendar,
  meetingLabel,
  resolveMeetingTimezone,
  validTimezone,
} from "@/lib/zoom/time";
import { getPublicNextMeeting } from "@/lib/zoom.functions";

export const JOIN_GUIDANCE =
  "Con conexión lenta, entra con la cámara apagada y usa solo audio. Cierra otras aplicaciones. Si Zoom ofrece acceso telefónico en tu invitación, puedes usarlo; pueden aplicarse cargos. Si se corta la conexión, vuelve a abrir tu enlace personal. Para ayuda: (458) 298-8011.";

export function NextMeeting({
  timezone,
  onTimezone,
  startsAt: confirmedStart,
}: {
  timezone?: string;
  onTimezone?: (zone: string) => void;
  startsAt?: string;
}) {
  const initialTimezoneChange = useRef(onTimezone);
  const confirmedTimezone = useRef(confirmedStart ? timezone : undefined);
  const timezoneControlId = useId();
  const [editingTimezone, setEditingTimezone] = useState(false);
  const [timezoneSource, setTimezoneSource] = useState<"saved" | "browser" | "fallback">();
  const [zone, setZone] = useState("America/Los_Angeles");
  const [startsAt, setStartsAt] = useState<string>();
  const [status, setStatus] = useState("Consultando la próxima reunión…");
  const [zones, setZones] = useState([
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Bogota",
    "America/Argentina/Buenos_Aires",
    "Europe/Madrid",
  ]);
  useEffect(() => {
    let detected: string | undefined;
    let saved: string | null = null;
    try {
      detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      /* safe fallback */
    }
    try {
      saved = localStorage.getItem("sobremesa-timezone");
    } catch {
      /* storage optional */
    }
    const preference = resolveMeetingTimezone(confirmedTimezone.current ?? saved, detected);
    const selected = preference.zone;
    setZone(selected);
    setTimezoneSource(preference.source);
    initialTimezoneChange.current?.(selected);
    setZones(
      [
        ...new Set([
          selected,
          ...(typeof Intl.supportedValuesOf === "function"
            ? Intl.supportedValuesOf("timeZone")
            : ["America/Los_Angeles", "America/Mexico_City", "America/Bogota", "Europe/Madrid"]),
        ]),
      ].sort(),
    );
    let active = true;
    const refresh = () =>
      getPublicNextMeeting()
        .then((result) => {
          if (!active) return;
          setStartsAt(result?.startsAt);
          setStatus(
            result ? "" : "La próxima reunión aún no está disponible. Vuelve pronto o contáctanos.",
          );
        })
        .catch(() => {
          if (active) {
            setStartsAt(undefined);
            setStatus("No pudimos consultar la reunión. Inténtalo de nuevo o contáctanos.");
          }
        });
    void refresh();
    const interval = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
  const chosen = timezone && validTimezone(timezone) ? timezone : zone;
  const start = confirmedStart || startsAt;
  return (
    <section
      className="mx-auto max-w-3xl rounded-xl border border-border p-5 space-y-3"
      aria-label="Próxima reunión"
    >
      <h2 className="text-lg font-semibold">Próxima La Sobremesa</h2>
      <p aria-live="polite">
        {!timezoneSource
          ? "Detectando tu zona horaria…"
          : start
            ? meetingLabel(start, chosen)
            : status}
      </p>
      <div className="text-sm text-muted-foreground">
        {timezoneSource && (
          <p>
            {timezoneSource === "browser"
              ? "Zona detectada automáticamente"
              : timezoneSource === "saved"
                ? "Tu zona seleccionada"
                : "No pudimos detectar tu zona; mostramos la hora del Pacífico"}
            : {chosen.replaceAll("_", " ")}
          </p>
        )}
        <button
          type="button"
          className="text-primary underline"
          aria-expanded={editingTimezone}
          aria-controls={timezoneControlId}
          onClick={() => setEditingTimezone((value) => !value)}
        >
          {editingTimezone ? "Cerrar opciones de zona horaria" : "Cambiar zona horaria"}
        </button>
      </div>
      <div id={timezoneControlId} hidden={!editingTimezone}>
        <label className="block">
          Zona horaria para la reunión, correos y contacto
          <select
            className="block w-full rounded border p-2 bg-background"
            value={chosen}
            onChange={(e) => {
              const next = e.target.value;
              if (!validTimezone(next)) return;
              setZone(next);
              setTimezoneSource("saved");
              onTimezone?.(next);
              try {
                localStorage.setItem("sobremesa-timezone", next);
              } catch {
                /* storage optional */
              }
            }}
          >
            {[...new Set([chosen, ...zones])].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-muted-foreground">
        Horario de origen: lunes, 8:00 PM en Los Ángeles, con sus cambios de horario de verano. En
        tu país puede ser martes.
      </p>
      {start && (
        <a
          className="text-primary underline"
          download="la-sobremesa.ics"
          href={`data:text/calendar;charset=utf-8,${encodeURIComponent(meetingCalendar(start))}`}
        >
          Añadir esta reunión al calendario
        </a>
      )}
      <p className="text-sm text-muted-foreground">
        El calendario no confirma tu registro. El enlace personal llega por correo al registrarte.
      </p>
      <p className="text-sm">{JOIN_GUIDANCE}</p>
    </section>
  );
}
