import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BLOG_BY_SLUG } from "@/data/blog";
import { PageHero, CTAStrip } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = BLOG_BY_SLUG[params.slug];
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return {
        meta: [{ title: "Artículo no encontrado" }, { name: "robots", content: "noindex" }],
      };
    const url = `https://ayudasobria.com/blog/${params.slug}`;
    return {
      meta: [
        { title: loaderData.post.title },
        { name: "description", content: loaderData.post.description },
        { property: "og:title", content: loaderData.post.title },
        { property: "og:description", content: loaderData.post.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: loaderData.post.title,
            description: loaderData.post.description,
            url,
            mainEntityOfPage: url,
            inLanguage: "es",
            author: { "@id": "https://ayudasobria.com/#organization" },
            publisher: { "@id": "https://ayudasobria.com/#organization" },
            image: "https://ayudasobria.com/og-ayudasobria.png",
            isPartOf: { "@id": "https://ayudasobria.com/#website" },
          }),
        },
      ],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Artículo no encontrado</h1>
      <p className="mt-3 text-muted-foreground">
        Puede que el enlace esté desactualizado. Vuelve al{" "}
        <Link to="/blog" className="text-primary underline">
          blog
        </Link>
        .
      </p>
    </div>
  ),
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Blog" title={post.title} description={post.description} />
      <article className="mx-auto max-w-3xl px-4 py-12 text-base leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_strong]:font-semibold [&_hr]:my-8 [&_hr]:border-border">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        <hr className="my-10" />
        <p className="text-sm text-muted-foreground">
          Publicado por AyudaSobria con fines educativos. No sustituye una evaluación médica,
          psicológica o legal. Conoce más sobre nuestro enfoque en{" "}
          <Link to="/sobre-nosotros" className="text-primary underline">
            quiénes somos
          </Link>
          .
        </p>
        <p className="text-sm text-muted-foreground">
          Ver más artículos en el{" "}
          <Link to="/blog" className="text-primary underline">
            blog para familias
          </Link>
          .
        </p>
      </article>
      <CTAStrip />
    </>
  );
}
