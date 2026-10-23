export interface ReadingCollection {
  id: string;
  title: string;
  slugs: readonly string[];
}

// Editorial reading paths, not new country pages or clinical recommendations.
// Titles and summaries remain owned by the existing article records.
export const READING_COLLECTIONS: readonly ReadingCollection[] = [
  {
    id: "conversaciones",
    title: "Conversaciones con un ser querido",
    slugs: [
      "how-to-talk-to-loved-one-about-addiction",
      "how-to-have-productive-conversation-about-addiction",
      "how-to-talk-to-your-adult-child-about-addiction",
      "how-to-talk-to-a-sibling-about-addiction",
      "family-meeting-about-addiction-guide",
    ],
  },
  {
    id: "limites",
    title: "Límites y relaciones familiares",
    slugs: [
      "how-to-set-healthy-boundaries-with-an-addicted-family-member",
      "holding-boundaries-addiction-families",
      "how-to-stop-enabling-addiction",
      "enabling-codependency",
      "detach-with-love-addiction-families",
    ],
  },
  {
    id: "hijos-y-pareja",
    title: "Hijos, pareja y vida familiar",
    slugs: [
      "creci-con-un-padre-alcoholico-ahora-soy-mama",
      "hija-de-padre-alcoholico-relaciones-de-pareja",
      "alcoholism-in-the-home-why-children-adapt-long-before-adults-notice",
      "parentification-when-children-become-caretakers-addiction-families",
      "how-to-talk-to-children-about-a-parents-addiction",
      "como-hablar-con-mis-hijos-sobre-el-alcoholismo-de-su-papa",
      "addiction-marriage-family-protection",
      "mi-esposo-toma-mucho-y-mi-familia-dice-que-aguante",
      "mi-esposo-se-pone-agresivo-cuando-toma",
      "mi-hijo-fuma-marihuana-que-hago",
    ],
  },
  {
    id: "apoyo-familiar",
    title: "Apoyo y bienestar de la familia",
    slugs: [
      "why-families-need-support-even-when-loved-one-refuses-help",
      "therapy-for-family-members-of-addicts",
      "al-anon-family-support-groups-addiction",
      "letting-go-of-guilt-when-loved-one-has-addiction",
      "social-isolation-when-loved-one-has-addiction",
    ],
  },
  {
    id: "tratamiento",
    title: "Preguntas sobre el tratamiento",
    slugs: [
      "rehab-admissions-process-family-guide",
      "questions-to-ask-treatment-center",
      "verify-rehab-accreditation-licensing",
      "what-does-evidence-based-addiction-treatment-mean",
      "how-long-should-rehab-last",
    ],
  },
  {
    id: "regreso-a-casa",
    title: "Recuperación y regreso a casa",
    slugs: [
      "aftercare-planning-addiction-recovery-family-guide",
      "continuing-care-after-rehab-family-guide",
      "what-to-do-while-loved-one-is-in-rehab",
      "recovery-friendly-home-after-rehab",
      "rebuilding-trust-after-addiction-family-guide",
    ],
  },
  {
    id: "educacion",
    title: "Educación y primeros pasos",
    slugs: [
      "understanding-addiction-in-families",
      "why-families-need-education-before-answers",
      "understanding-addiction-without-crisis-education-matters",
      "help-family-member-addiction",
      "early-intervention-family-changes-first",
    ],
  },
];

export function relatedArticleSlugs(slug: string, limit = 3): string[] {
  if (!Number.isInteger(limit) || limit < 1) return [];
  const collection = READING_COLLECTIONS.find((group) => group.slugs.includes(slug));
  return collection ? collection.slugs.filter((item) => item !== slug).slice(0, limit) : [];
}

export function articleBreadcrumbs(title: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://ayudasobria.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog para familias",
        item: "https://ayudasobria.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `https://ayudasobria.com/blog/${slug}`,
      },
    ],
  };
}
