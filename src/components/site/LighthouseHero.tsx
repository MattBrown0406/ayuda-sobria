import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowRight, CalendarDays, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.webp";
import lighthousePhoto from "@/assets/lighthouse-dusk.jpg";
import cloudOverlay from "@/assets/lighthouse-clouds.webp";
import waveOverlay from "@/assets/lighthouse-waves.webp";
import {
  PHONE_DISPLAY,
  PHONE_HREF,
  WHATSAPP_HREF,
  WhatsAppMark,
} from "@/components/site/SiteLayout";

const paths = [
  {
    eyebrow: "Empieza gratis",
    title: "La Sobremesa",
    description: "Una reunión en vivo para familias, cada lunes a las 8 PM (hora del Pacífico).",
    cta: "Reservar mi lugar",
    to: "/registro",
    icon: CalendarDays,
  },
  {
    eyebrow: "Necesitas respuestas ya",
    title: "Coaching privado",
    description: "Orientación uno a uno cuando esperar al lunes no es una opción.",
    cta: "Reservar una sesión",
    to: "/coaching-familiar",
    icon: MessageCircle,
  },
  {
    eyebrow: "El riesgo va en aumento",
    title: "Intervención",
    description: "Sabe cuándo la situación necesita una respuesta profesional y coordinada.",
    cta: "Evaluar la intervención",
    to: "/intervencion",
    icon: ShieldCheck,
  },
] as const;

// Where the lantern sits inside lighthouse-dusk.jpg, as a fraction of the natural size.
// The photo is mirrored from the Sober Helpline original, so the tower stands on the left.
const LAMP_IMAGE_FRACTION = { x: 0.2197, y: 0.224 };

/**
 * Keeps the CSS-drawn lamp glow and rotating beam pinned to the lantern in the
 * photograph regardless of viewport size (object-fit: cover math).
 */
function useLampAlignment(
  photoRef: React.RefObject<HTMLImageElement | null>,
  stageRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const align = () => {
      const img = photoRef.current;
      const stage = stageRef.current;
      if (!img || !stage || !img.naturalWidth || !img.naturalHeight) return;
      const imgBox = img.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      if (!imgBox.width || !imgBox.height) return;

      const scale = Math.max(imgBox.width / img.naturalWidth, imgBox.height / img.naturalHeight);
      const drawnWidth = img.naturalWidth * scale;
      const drawnHeight = img.naturalHeight * scale;
      const [posX = "50%", posY = "50%"] = window
        .getComputedStyle(img)
        .objectPosition.split(" ")
        .map((part) => part.trim());
      const resolve = (value: string, container: number, drawn: number) => {
        if (value.endsWith("%")) return ((container - drawn) * parseFloat(value)) / 100;
        if (value.endsWith("px")) return parseFloat(value);
        return (container - drawn) / 2;
      };
      const offsetX = resolve(posX, imgBox.width, drawnWidth);
      const offsetY = resolve(posY, imgBox.height, drawnHeight);
      const lampX = imgBox.left + offsetX + drawnWidth * LAMP_IMAGE_FRACTION.x - stageBox.left;
      const lampY = imgBox.top + offsetY + drawnHeight * LAMP_IMAGE_FRACTION.y - stageBox.top;
      stage.style.setProperty("--as-lamp-x", `${lampX}px`);
      stage.style.setProperty("--as-lamp-y", `${lampY}px`);
    };

    align();
    const img = photoRef.current;
    img?.addEventListener("load", align);
    window.addEventListener("resize", align);
    const observer = new ResizeObserver(align);
    if (img) observer.observe(img);
    return () => {
      img?.removeEventListener("load", align);
      window.removeEventListener("resize", align);
      observer.disconnect();
    };
  }, [photoRef, stageRef]);
}

export function LighthouseHero() {
  const photoRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useLampAlignment(photoRef, stageRef);

  return (
    <section className="as-hero" aria-labelledby="as-hero-title">
      <div
        className="as-stage"
        ref={stageRef}
        role="img"
        aria-label="Un faro en la costa al atardecer, con su luz girando sobre el mar"
      >
        <img
          ref={photoRef}
          className="as-photo"
          src={lighthousePhoto}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
        <img className="as-clouds as-clouds-back" src={cloudOverlay} alt="" aria-hidden="true" />
        <img className="as-clouds as-clouds-front" src={cloudOverlay} alt="" aria-hidden="true" />
        <img className="as-waves as-waves-back" src={waveOverlay} alt="" aria-hidden="true" />
        <img className="as-waves as-waves-front" src={waveOverlay} alt="" aria-hidden="true" />
        <div className="as-dusk" aria-hidden="true" />
        <div className="as-shade" aria-hidden="true" />
        <div className="as-light" aria-hidden="true">
          <div className="as-beam" />
          <div className="as-haze" />
          <div className="as-lamp">
            <span className="as-lamp-core" />
            <span className="as-lamp-flare" />
          </div>
        </div>
      </div>

      <div className="as-inner">
        <aside className="as-live" aria-label="Próxima reunión">
          <span className="as-live-dot" aria-hidden="true" />
          <span className="as-live-text">
            <small>Tu primer puerto seguro</small>
            <strong>La Sobremesa · gratis</strong>
            <em>Cada lunes · 8:00 PM hora del Pacífico</em>
          </span>
          <Link to="/registro" className="as-live-link" aria-label="Registrarme en La Sobremesa">
            <ArrowRight aria-hidden="true" />
          </Link>
        </aside>

        <div className="as-copy">
          <p className="as-eyebrow">
            <img src={logo} alt="" aria-hidden="true" width={28} height={28} />
            <span>Cuando la adicción nubla el camino</span>
          </p>

          <h1 id="as-hero-title">
            Hay una luz que guía a tu familia
            <span>a través de la tormenta de la adicción.</span>
          </h1>

          <p className="as-lead">
            Cuando la adicción deja a tu familia sin rumbo, AyudaSobria te ayuda a ver el siguiente
            paso: apoyo gratuito en vivo, orientación privada cuando no puede esperar y un camino
            claro cuando el riesgo aumenta. Todo en español.
          </p>

          <div className="as-actions">
            <Link to="/registro" className="as-button as-button-primary">
              <CalendarDays aria-hidden="true" />
              Únete a La Sobremesa gratis
            </Link>
            <a href={PHONE_HREF} className="as-button as-button-secondary">
              <Phone aria-hidden="true" />
              Llamar {PHONE_DISPLAY}
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="as-button as-button-whatsapp"
            >
              <WhatsAppMark className="h-5 w-5" />
              WhatsApp
            </a>
          </div>

          <ul className="as-trust" aria-label="Cómo trabajamos">
            <li>Sin vergüenza</li>
            <li>Sin presión para contratar</li>
            <li>Primero la familia</li>
          </ul>
        </div>
      </div>

      <div className="as-paths" aria-label="Elige tu punto de partida">
        <div className="as-paths-heading">
          <span>Elige tu punto de partida</span>
          <small>Cada camino empieza con la misma promesa: ayuda honesta, sin presión.</small>
        </div>
        <div className="as-path-grid">
          {paths.map((path, index) => (
            <Link
              key={path.title}
              to={path.to}
              className="as-path"
              style={{ "--as-i": index } as React.CSSProperties}
            >
              <span className="as-path-beacon" aria-hidden="true">
                <path.icon />
              </span>
              <span className="as-path-copy">
                <small>{path.eyebrow}</small>
                <strong>{path.title}</strong>
                <em>{path.description}</em>
              </span>
              <span className="as-path-cta">
                {path.cta}
                <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
