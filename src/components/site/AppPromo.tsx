import { MessageSquareHeart, Users, PlayCircle, Video, Languages } from "lucide-react";
import appLogo from "@/assets/sober-helpline-app.png.asset.json";

const APP_STORE_URL = "https://apps.apple.com/us/app/sober-helpline/id6780034996";

function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 384 512"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-36.8-2.8-77 21.5-91.7 21.5-15.6 0-51.2-20.5-79.2-20.5C61.4 141.2 8 184.5 8 271.6c0 25.8 4.7 52.4 14.1 79.9 12.6 36.1 47.2 122.9 91.7 121.5 23.3-.6 39.7-16.5 70-16.5 29.4 0 44.6 16.5 70.6 16.5 44.9-.6 76.2-79.5 88.5-115.7-60.1-28.3-59.7-83.9-59.4-88.6zM256.8 84.4c17.4-21.1 26.7-46.2 25.2-72.4-25.4 1.5-49.5 13.8-66.6 33.9-16.3 18.9-27.4 44.2-25.2 69.3 27.8 2.2 51.4-11.2 66.6-30.8z" />
    </svg>
  );
}

const features = [
  {
    icon: MessageSquareHeart,
    title: "Practica conversaciones difíciles con IA",
    body: "Simula la conversación real con tu ser querido. Ajusta su temperatura emocional, edad y género para prepararte para la conversación difícil que viene — no la fácil que te deja “ganar”.",
  },
  {
    icon: Users,
    title: "Conéctate a las reuniones gratuitas por Zoom",
    body: "Entra desde la app a las reuniones semanales y gratuitas de apoyo familiar.",
  },
  {
    icon: PlayCircle,
    title: "Mira las reuniones que te perdiste",
    body: "Acceso a las grabaciones de reuniones anteriores, cuando tú puedas verlas.",
  },
  {
    icon: Video,
    title: "Coaching por chat o video en vivo",
    body: "Sesiones con un intervencionista con experiencia, directo desde tu teléfono.",
  },
];

export function AppPromo() {
  return (
    <section aria-labelledby="app-promo-title" className="bg-app-promo text-app-promo-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid items-center gap-10 md:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center gap-4 text-center">
            <img
              src={appLogo.url}
              alt="Aplicación Sober Helpline: apoyo y educación para familias"
              width={200}
              height={200}
              loading="lazy"
              className="w-40 rounded-2xl md:w-52"
            />
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Descargar Sober Helpline en el App Store"
              className="inline-flex items-center gap-2.5 rounded-xl border border-app-promo-foreground/25 bg-black px-4 py-2.5 no-underline shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <AppleMark className="h-7 w-7 shrink-0 text-white" />
              <span className="flex flex-col items-start leading-none text-white">
                <span className="text-[10px] font-normal tracking-wide">Descargar en el</span>
                <span className="mt-0.5 text-lg font-medium tracking-tight">App Store</span>
              </span>
            </a>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-app-promo-foreground/70">
              Aplicación móvil
            </p>
            <h2 id="app-promo-title" className="mt-2 text-2xl font-bold sm:text-3xl">
              La app Sober Helpline — ahora también en español
            </h2>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-app-promo-foreground/10 px-3 py-1.5 text-sm font-medium">
              <Languages className="h-4 w-4" /> Incluye versión en español dentro de la app
            </p>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-app-promo-accent" />
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="mt-1 text-sm text-app-promo-foreground/80">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
