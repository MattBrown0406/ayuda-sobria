import { useEffect, useRef, useState } from "react";
import { meetingCalendar, meetingLabel, validTimezone } from "@/lib/zoom/time";
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
    let selected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      selected = localStorage.getItem("sobremesa-timezone") || selected;
    } catch {
      /* storage optional */
    }
    if (validTimezone(selected)) {
      setZone(selected);
      initialTimezoneChange.current?.(selected);
    }
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
  const chosen = timezone || zone;
  const start = confirmedStart || startsAt;
  return (
    <section
      className="mx-auto max-w-3xl rounded-xl border border-border p-5 space-y-3"
      aria-label="Próxima reunión"
    >
      <h2 className="text-lg font-semibold">Próxima La Sobremesa</h2>
      <label className="block">
        Tu zona horaria (reunión, correos y contacto)
        <select
          className="block w-full rounded border p-2 bg-background"
          value={chosen}
          onChange={(e) => {
            setZone(e.target.value);
            onTimezone?.(e.target.value);
            try {
              localStorage.setItem("sobremesa-timezone", e.target.value);
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
      <p aria-live="polite">{start ? meetingLabel(start, chosen) : status}</p>
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
