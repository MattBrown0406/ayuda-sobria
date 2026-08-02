import { MessageSquareHeart, Users, PlayCircle, Video, Languages, Apple } from "lucide-react";
import appLogo from "@/assets/sober-helpline-app.png.asset.json";

const APP_STORE_URL = "https://apps.apple.com/us/app/sober-helpline/id6780034996";

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
    <section
      aria-labelledby="app-promo-title"
      className="bg-app-promo text-app-promo-foreground"
    >
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
              className="inline-flex items-center gap-2 rounded-full bg-app-promo-foreground px-5 py-3 text-sm font-semibold text-app-promo no-underline transition-opacity hover:opacity-90"
            >
              <Apple className="h-4 w-4" /> Descargar en el App Store
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
