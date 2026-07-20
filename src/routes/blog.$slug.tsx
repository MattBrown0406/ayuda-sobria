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
      return { meta: [{ title: "Artículo no encontrado" }, { name: "robots", content: "noindex" }] };
    const url = `/blog/${params.slug}`;
    return {
      meta: [
        { title: `${loaderData.post.title} — AyudaSobria` },
        { name: "description", content: loaderData.post.description },
        { property: "og:title", content: loaderData.post.title },
        { property: "og:description", content: loaderData.post.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
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
      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-2xl prose-h3:mt-6 prose-h3:text-xl prose-a:text-primary prose-a:underline prose-li:my-1 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        <hr className="my-10" />
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