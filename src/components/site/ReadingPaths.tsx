import { Link } from "@tanstack/react-router";
import { BLOG_BY_SLUG } from "@/data/blog";
import { READING_COLLECTIONS } from "@/data/readingPaths";

export function ReadingPaths() {
  return (
    <section aria-labelledby="reading-paths-heading" className="mb-12">
      <h2 id="reading-paths-heading" className="text-2xl font-semibold tracking-tight">
        Encuentra artículos por tema
      </h2>
      <p className="mt-3 text-muted-foreground">
        Elige un tema para explorar artículos en español. También puedes consultar la lista completa
        del blog.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {READING_COLLECTIONS.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`reading-${group.id}`}
            className="min-w-0 rounded-xl border border-border bg-card p-5"
          >
            <h3 id={`reading-${group.id}`} className="text-lg font-semibold">
              {group.title}
            </h3>
            <ul className="mt-3 space-y-3">
              {group.slugs.map((slug) => {
                const post = BLOG_BY_SLUG[slug];
                if (!post) return null;
                return (
                  <li key={slug}>
                    <Link
                      to="/blog/$slug"
                      params={{ slug }}
                      className="text-primary underline underline-offset-4 hover:no-underline"
                    >
                      {post.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
