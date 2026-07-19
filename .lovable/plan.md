
## Scope

SoberHelpline has 415 URLs; excluding ~140 blog pages leaves ~275 pages to recreate in Spanish. Plus you're asking for new country pages for every Spanish-speaking country in Central and South America (20 countries).

## What I'll build

**1. Location pages (translated + expanded)**
- 11 US state hubs: e.g. `/apoyo-familiar-arizona`, `/apoyo-familiar-california`, etc.
- ~55 US city pages under each state: `/arizona/phoenix`, `/california/los-angeles`, etc. — same URL structure, Spanish content.
- **20 new Latin American country pages:**
  - Central America: México, Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica, Panamá, Belice (Spanish-speakers), Cuba, República Dominicana, Puerto Rico.
  - South America: Argentina, Bolivia, Chile, Colombia, Ecuador, Paraguay, Perú, Uruguay, Venezuela.
  - URL pattern: `/paises/mexico`, `/paises/argentina`, etc.
  - Each with country-specific hero, cultural framing (familia, machismo/estigma, recursos locales), local crisis hotline numbers where publicly known, and the same core CTAs (reunión de lunes, coaching privado, intervención).

**2. Content pages (~200)**
- ~30 Q&A pages under `/respuestas-familia/*` (family-addiction-answers)
- 8 roadmap pages under `/mapa/*` (crisis, sospecha, evaluación, pre-intervención, tratamiento, recaída, recuperación temprana, recuperación a largo plazo)
- 7 AI-tool landing pages under `/ai/*` (translator, boundary coach, enabling coach, life coach, relapse guide, treatment navigator) — landing pages only, not the AI backends
- ~120 topical/education pages (addiction-and-mental-health, attachment styles, triggers, aftercare, etc.), fully rewritten in Spanish
- Membership, terms, privacy, about, contact utility pages

**3. Navigation & SEO**
- Header nav with dropdowns: Ubicaciones (Estados/Ciudades/Países), Recursos, Herramientas IA, Membresía
- Footer with country/state directory
- Each route gets a distinct `head()` — Spanish title, description, og:title, og:description, canonical, og:url
- `/sitemap.xml` route generating all URLs
- Structured data (Organization at root, LocalBusiness on location pages, FAQPage on Q&A pages)

## Execution approach (this is big — batching matters)

I'll generate pages programmatically from data files rather than hand-writing 275 route files:
- `src/data/locations.ts` — states, cities, countries with metadata
- `src/data/answers.ts`, `src/data/roadmap.ts`, `src/data/topics.ts` — page content
- Shared route templates: `LocationPage`, `AnswerPage`, `TopicPage` render from data
- Dynamic routes like `/estados/$state/$city.tsx`, `/paises/$country.tsx`, `/respuestas-familia/$slug.tsx` that look up data by slug and 404 otherwise
- This keeps the codebase manageable and lets me add pages by editing data, not creating hundreds of files

## What I will NOT recreate (unless you say otherwise)

- **Blog posts** (~140) — you said skip these
- **AI chat backends** — the AI tool pages will be landing pages that describe the tool and link to a "coming soon" or contact CTA. Wiring real AI (translator, coaches) is a separate build and needs Lovable Cloud + AI Gateway. I can add it after, per tool.
- **Zoom-automated meeting scheduler** — already discussed; still waiting on your Zoom credentials.
- **Member login / billing portal** — real auth + payments is a separate project; I'll build the marketing/landing pages for membership only.
- **City/country data verification** — Spanish-language crisis hotlines and local resources will be included only where I can source them reliably; otherwise the page focuses on family support + the Monday 8 PM PT meeting (which is timezone-friendly for all of LATAM). Tell me if you have preferred local resource lists per country.

## Content quality note

For ~275 pages, content will be original Spanish writing following the same structural template as the English site (hero → problem → solution → CTAs → FAQ), not machine translation. Tone: warm, family-focused, culturally attuned to Latin American families (importance of familia, respect for parents, stigma around addiction). It won't be a 1:1 copy of every English sentence — that would be both copyright-risky and less effective for a Spanish-speaking audience.

## Technical details

- TanStack Start file-based routes
- Dynamic segment routes (`$state/$city`, `$country`, `$slug`) with `notFound()` for unknown slugs
- Shared components: `LocationHero`, `LocationDirectory`, `AnswerCard`, `TopicLayout`, `CTAStrip`
- Sitemap generated at build via a server route reading the data files
- Estimated ~15-25 build turns given the volume

## Confirm before I start

1. **URL structure OK?** `/estados/california/los-angeles`, `/paises/mexico`, `/respuestas-familia/como-hablar-sin-pelear`, `/ai/traductor-realidad-adiccion` — or do you want the exact English slugs kept?
2. **Country list OK?** 20 countries above — add/remove any? (Note: Brazil is Portuguese, so excluded.)
3. **Country pages: include local crisis hotlines** where I can find reliable public sources, or keep it uniform (just family-focused content + the Monday meeting)?
4. **AI tools: landing pages only** for now, wire real AI later per tool — or do you want the AI chat working from the start (needs Lovable Cloud enabled)?
