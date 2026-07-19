export interface AiTool { slug: string; title: string; blurb: string; }
export const AI_TOOLS: AiTool[] = [
  { slug: 'traductor-realidad', title: 'Traductor de realidad en la adicción', blurb: 'Descifra lo que realmente pasa detrás de las palabras y comportamientos de tu ser querido.' },
  { slug: 'coach-limites', title: 'Coach para construir límites', blurb: 'Diseña límites sostenibles según tu situación específica.' },
  { slug: 'coach-habilitacion', title: 'Coach de decisiones de habilitación', blurb: 'Distingue entre ayudar y habilitar, decisión por decisión.' },
  { slug: 'life-coach', title: 'Life coach para familias', blurb: 'Recupera claridad, energía y decisiones alineadas contigo.' },
  { slug: 'guia-recaida', title: 'Guía de respuesta a la recaída', blurb: 'Qué hacer, qué decir y qué evitar tras una recaída.' },
  { slug: 'navegador-tratamiento', title: 'Navegador de tratamiento', blurb: 'Traduce niveles de atención, modalidades y señales de alerta a decisiones concretas.' },
];
export const AI_TOOL_MAP: Record<string, AiTool> = Object.fromEntries(AI_TOOLS.map(a => [a.slug, a]));
