import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { STATES } from "@/data/locations";
import { COUNTRIES } from "@/data/locations";
import { TOPICS } from "@/data/topics";
import { ANSWERS } from "@/data/answers";
import { STEPS } from "@/data/roadmap";
import { AI_TOOLS } from "@/data/aiTools";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths: string[] = [
          "/",
          "/circulo-familiar",
          "/coaching-familiar",
          "/intervencion",
          "/membresia",
          "/testimonios",
          "/faq",
          "/proveedores",
          "/privacidad",
          "/terminos",
          "/terminos-sms",
          "/ingresar",
          "/apoyo-familiar",
          "/paises",
          "/recursos",
          "/respuestas-familia",
          "/mapa",
          "/herramientas-ia",
        ];
        for (const s of STATES) {
          paths.push(`/apoyo-familiar/${s.slug}`);
          for (const c of s.cities) paths.push(`/apoyo-familiar/${s.slug}/${c.slug}`);
        }
        for (const c of COUNTRIES) paths.push(`/paises/${c.slug}`);
        for (const t of TOPICS) paths.push(`/recursos/${t.slug}`);
        for (const a of ANSWERS) paths.push(`/respuestas-familia/${a.slug}`);
        for (const s of STEPS) paths.push(`/mapa/${s.slug}`);
        for (const t of AI_TOOLS) paths.push(`/herramientas-ia/${t.slug}`);

        const urls = paths.map((p) => `  <url><loc>${BASE_URL}${p}</loc></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});