import { createFileRoute, Link } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/data/blog";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog para familias — AyudaSobria" },
      {
        name: "description",
        content:
          "Artículos en español para familias que enfrentan la adicción de un ser querido: educación, límites, tratamiento y recuperación.",
      },
      { property: "og:title", content: "Blog para familias — AyudaSobria" },
      {
        property: "og:description",
        content: "Educación clara en español sobre adicción, recuperación y apoyo familiar.",
      },
      { property: "og:url", content: "https://ayudasobria.com/blog" },
    ],
    links: [{ rel: "canonical", href: "https://ayudasobria.com/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = [...BLOG_POSTS].sort((a, b) => a.title.localeCompare(b.title, "es"));
  return (
    <>
      <PageHero
        eyebrow="Biblioteca"
        title="Blog para familias"
        description="Más de 130 artículos en español para entender la adicción, poner límites y acompañar la recuperación de un ser querido."
      />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-muted-foreground">
          {posts.length} artículos. Todos escritos para la familia, no para la persona con adicción.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-sm"
              >
                <h2 className="text-lg font-semibold leading-snug">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary">
                  Leer artículo →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <CTAStrip />
    </>
  );
}
