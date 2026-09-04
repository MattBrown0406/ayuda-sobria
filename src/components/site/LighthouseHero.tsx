import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.webp";
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

/**
 * Illustrated dusk scene: a lighthouse on rocks, a rotating beam, layered waves, a boat
 * heading toward the light, gulls and early stars. Everything is inline SVG so it needs
 * no image assets and every part can be animated from CSS (see lighthouse-hero.css).
 */
const COMPACT_QUERY = "(max-width: 1000px)";

/** True below the breakpoint where the copy stacks above the scene. SSR renders wide. */
function useCompactScene() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
}

function LighthouseScene() {
  const compact = useCompactScene();
  return (
    <svg
      className="as-scene"
      // Narrow screens crop to the lighthouse and the water so the tower stays in view.
      viewBox={compact ? "440 110 660 610" : "0 0 1200 720"}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="as-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081a33" />
          <stop offset="0.42" stopColor="#12345c" />
          <stop offset="0.68" stopColor="#5a4a6a" />
          <stop offset="0.82" stopColor="#d3803f" />
          <stop offset="1" stopColor="#f3c27a" />
        </linearGradient>
        <linearGradient id="as-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a5a48" />
          <stop offset="0.18" stopColor="#1f4a66" />
          <stop offset="1" stopColor="#061c30" />
        </linearGradient>
        <linearGradient id="as-wave-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f6f8e" />
          <stop offset="1" stopColor="#0d3350" />
        </linearGradient>
        <linearGradient id="as-wave-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c5273" />
          <stop offset="1" stopColor="#082540" />
        </linearGradient>
        <linearGradient id="as-wave-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#123f5c" />
          <stop offset="1" stopColor="#041a2c" />
        </linearGradient>
        <linearGradient id="as-rock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4653" />
          <stop offset="1" stopColor="#0f1a25" />
        </linearGradient>
        <linearGradient id="as-tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d2c3" />
          <stop offset="0.45" stopColor="#f7f1e4" />
          <stop offset="1" stopColor="#b9b1a2" />
        </linearGradient>
        <linearGradient id="as-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#12294a" />
          <stop offset="0.45" stopColor="#1f3f6b" />
          <stop offset="1" stopColor="#0d1f3a" />
        </linearGradient>
        <radialGradient id="as-sunglow" cx="0.5" cy="1" r="0.75">
          <stop offset="0" stopColor="#ffd28a" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#f2934c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f2934c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="as-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff9e3" />
          <stop offset="0.35" stopColor="#ffd97a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb63b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="as-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3cf" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#ffd98a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="as-glint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd88f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd88f" stopOpacity="0" />
        </linearGradient>
        <clipPath id="as-water-clip">
          <rect x="0" y="470" width="1200" height="250" />
        </clipPath>
      </defs>

      {/* Sky and dusk glow */}
      <rect width="1200" height="720" fill="url(#as-sky)" />
      <ellipse className="as-sunglow" cx="330" cy="480" rx="520" ry="230" fill="url(#as-sunglow)" />

      {/* Early stars */}
      <g className="as-stars" fill="#fff6dd">
        <circle cx="110" cy="70" r="1.6" />
        <circle cx="240" cy="140" r="1.2" />
        <circle cx="410" cy="60" r="1.8" />
        <circle cx="560" cy="120" r="1.1" />
        <circle cx="690" cy="40" r="1.5" />
        <circle cx="960" cy="90" r="1.3" />
        <circle cx="1090" cy="160" r="1.7" />
        <circle cx="1150" cy="50" r="1.1" />
        <circle cx="820" cy="210" r="1" />
        <circle cx="180" cy="250" r="1" />
      </g>

      {/* Crescent moon */}
      <g className="as-moon" transform="translate(1040 120)">
        <circle r="30" fill="#f4ecd8" />
        <circle cx="12" cy="-6" r="27" fill="#12345c" />
      </g>

      {/* Gulls */}
      <g
        className="as-gull as-gull-1"
        fill="none"
        stroke="#f8efe0"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M0 6 Q 8 -4 16 6 Q 24 -4 32 6" />
      </g>
      <g
        className="as-gull as-gull-2"
        fill="none"
        stroke="#f8efe0"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M0 5 Q 6 -3 12 5 Q 18 -3 24 5" />
      </g>

      {/* Sea */}
      <rect x="0" y="470" width="1200" height="250" fill="url(#as-sea)" />
      <rect className="as-glint" x="770" y="470" width="120" height="250" fill="url(#as-glint)" />

      {/* Back waves */}
      <g clipPath="url(#as-water-clip)">
        <path
          className="as-wave as-wave-far"
          fill="url(#as-wave-a)"
          d="M0 520 C 100 500, 200 540, 300 520 S 500 500, 600 520 S 800 540, 900 520 S 1100 500, 1200 520 S 1400 540, 1500 520 S 1700 500, 1800 520 S 2000 540, 2100 520 S 2300 500, 2400 520 V 720 H 0 Z"
        />
      </g>

      {/* Boat heading toward the light */}
      <g className="as-boat">
        <g className="as-boat-rock">
          <path d="M0 26 L 70 26 L 60 40 L 12 40 Z" fill="#1b2431" />
          <rect x="30" y="-6" width="3" height="32" fill="#1b2431" />
          <path d="M33 -4 L 62 22 L 33 22 Z" fill="#f2e6cf" />
          <path d="M30 0 L 8 22 L 30 22 Z" fill="#e6d7bb" />
          <circle cx="31" cy="-8" r="2.4" fill="#ffd97a" className="as-boat-light" />
        </g>
      </g>

      {/* Mid waves */}
      <g clipPath="url(#as-water-clip)">
        <path
          className="as-wave as-wave-mid"
          fill="url(#as-wave-b)"
          d="M0 575 C 120 555, 240 595, 360 575 S 600 555, 720 575 S 960 595, 1080 575 S 1320 555, 1440 575 S 1680 595, 1800 575 S 2040 555, 2160 575 S 2400 595, 2520 575 V 720 H 0 Z"
        />
      </g>

      {/* Rocks and lighthouse */}
      <g className="as-lighthouse">
        <path
          d="M655 640 C 690 590, 760 575, 830 590 C 880 600, 960 585, 1010 620 C 1040 640, 1040 665, 1010 680 L 655 680 Z"
          fill="url(#as-rock)"
        />
        <path
          d="M700 655 C 730 620, 800 615, 850 630 C 900 645, 950 630, 985 660 L 985 680 L 700 680 Z"
          fill="#0b1520"
          opacity="0.75"
        />
        {/* base */}
        <rect x="796" y="560" width="78" height="40" rx="4" fill="#b8ad9c" />
        <rect x="788" y="596" width="94" height="14" rx="3" fill="#8d8474" />
        {/* tower */}
        <path d="M812 560 L 858 560 L 848 262 L 822 262 Z" fill="url(#as-tower)" />
        <path d="M818 300 L 852 300 L 850 330 L 820 330 Z" fill="url(#as-band)" />
        <path d="M816 370 L 854 370 L 856 400 L 814 400 Z" fill="url(#as-band)" />
        <path d="M814 440 L 856 440 L 858 470 L 812 470 Z" fill="url(#as-band)" />
        {/* windows */}
        <rect x="830" y="340" width="10" height="16" rx="2" fill="#ffd47a" className="as-window" />
        <rect
          x="830"
          y="412"
          width="10"
          height="16"
          rx="2"
          fill="#ffd47a"
          className="as-window as-window-2"
        />
        <rect x="828" y="520" width="14" height="30" rx="7" fill="#12294a" />
        {/* gallery */}
        <rect x="806" y="256" width="58" height="10" rx="2" fill="#22334d" />
        <g stroke="#e9e2d2" strokeWidth="2.4">
          <line x1="806" y1="236" x2="806" y2="258" />
          <line x1="818" y1="236" x2="818" y2="258" />
          <line x1="830" y1="236" x2="830" y2="258" />
          <line x1="842" y1="236" x2="842" y2="258" />
          <line x1="854" y1="236" x2="854" y2="258" />
          <line x1="864" y1="236" x2="864" y2="258" />
          <line x1="804" y1="238" x2="866" y2="238" />
        </g>
        {/* lantern room */}
        <rect x="815" y="196" width="40" height="46" rx="3" fill="#ffe7a8" opacity="0.92" />
        <g stroke="#22334d" strokeWidth="3">
          <line x1="826" y1="196" x2="826" y2="242" />
          <line x1="844" y1="196" x2="844" y2="242" />
        </g>
        <rect x="811" y="240" width="48" height="6" rx="2" fill="#22334d" />
        <path d="M809 198 L 861 198 L 835 168 Z" fill="#22334d" />
        <circle cx="835" cy="166" r="4" fill="#22334d" />
        {/* lamp core */}
        <circle className="as-lamp-glow" cx="835" cy="219" r="42" fill="url(#as-lamp)" />
        <circle className="as-lamp-core" cx="835" cy="219" r="9" fill="#fff9e3" />
      </g>

      {/* Rotating beam — pivots on the lamp */}
      <g className="as-beam-group">
        <path className="as-beam" d="M835 219 L 1500 130 L 1500 308 Z" fill="url(#as-beam)" />
      </g>

      {/* Front wave */}
      <g clipPath="url(#as-water-clip)">
        <path
          className="as-wave as-wave-near"
          fill="url(#as-wave-c)"
          d="M0 640 C 140 615, 280 665, 420 640 S 700 615, 840 640 S 1120 665, 1260 640 S 1540 615, 1680 640 S 1960 665, 2100 640 S 2380 615, 2520 640 V 720 H 0 Z"
        />
      </g>
    </svg>
  );
}

export function LighthouseHero() {
  return (
    <section className="as-hero" aria-labelledby="as-hero-title">
      <LighthouseScene />
      <div className="as-shade" aria-hidden="true" />

      <div className="as-inner">
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
