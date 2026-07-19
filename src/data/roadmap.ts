export interface Step {
  slug: string;
  title: string;
  blurb: string;
}
export const STEPS: Step[] = [
  {
    slug: "assessment",
    title: "Evaluación",
    blurb:
      "En la etapa de evaluación, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "crisis",
    title: "Crisis",
    blurb:
      "En la etapa de crisis, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "early-recovery",
    title: "Recuperación temprana",
    blurb:
      "En la etapa de recuperación temprana, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "long-term-recovery",
    title: "Recuperación a largo plazo",
    blurb:
      "En la etapa de recuperación a largo plazo, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "pre-intervention",
    title: "Pre-intervención",
    blurb:
      "En la etapa de pre-intervención, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "relapse",
    title: "Recaída",
    blurb:
      "En la etapa de recaída, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "suspicion",
    title: "Sospecha",
    blurb:
      "En la etapa de sospecha, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
  {
    slug: "treatment",
    title: "Tratamiento",
    blurb:
      "En la etapa de tratamiento, la familia necesita orientación distinta. Aquí encontrarás qué hacer, qué decir y qué evitar.",
  },
];
export const STEP_MAP: Record<string, Step> = Object.fromEntries(STEPS.map((s) => [s.slug, s]));
