import assert from "node:assert/strict";
import test from "node:test";
import { BLOG_BY_SLUG, BLOG_POSTS } from "../src/data/blog.ts";
import {
  articleBreadcrumbs,
  READING_COLLECTIONS,
  relatedArticleSlugs,
} from "../src/data/readingPaths.ts";

test("reading paths use unique Spanish topic groups and existing article destinations", () => {
  const ids = READING_COLLECTIONS.map((group) => group.id);
  assert.equal(new Set(ids).size, ids.length);
  const targets = READING_COLLECTIONS.flatMap((group) => [...group.slugs]);
  assert.equal(new Set(targets).size, targets.length);
  assert.ok(targets.length >= 35);
  for (const group of READING_COLLECTIONS) {
    assert.match(group.id, /^[a-z-]+$/);
    assert.ok(group.title.length > 5);
    for (const slug of group.slugs) {
      assert.ok(BLOG_BY_SLUG[slug], `Missing article ${slug}`);
      assert.ok(BLOG_BY_SLUG[slug].content.length > 500);
    }
  }
});

test("related links stay in the selected topic, avoid self-links and enforce the cap", () => {
  for (const group of READING_COLLECTIONS) {
    for (const slug of group.slugs) {
      const related = relatedArticleSlugs(slug);
      assert.equal(related.length, 3);
      assert.equal(new Set(related).size, related.length);
      assert.ok(!related.includes(slug));
      assert.ok(related.every((target) => group.slugs.includes(target)));
      assert.equal(relatedArticleSlugs(slug, 1).length, 1);
    }
  }
});

test("unclassified and prototype-like slugs do not invent unrelated destinations", () => {
  for (const slug of ["missing", "constructor", "toString", "__proto__"]) {
    assert.deepEqual(relatedArticleSlugs(slug), []);
  }
  for (const limit of [0, -1, 0.5, NaN]) {
    assert.deepEqual(relatedArticleSlugs(READING_COLLECTIONS[0].slugs[0], limit), []);
  }
});

test("breadcrumb schema matches the visible Spanish hierarchy without changing article facts", () => {
  for (const post of BLOG_POSTS) {
    const schema = articleBreadcrumbs(post.title, post.slug);
    assert.equal(schema["@type"], "BreadcrumbList");
    assert.deepEqual(
      schema.itemListElement.map((item) => item.position),
      [1, 2, 3],
    );
    assert.deepEqual(
      schema.itemListElement.map((item) => item.name),
      ["Inicio", "Blog para familias", post.title],
    );
    assert.equal(schema.itemListElement[2].item, `https://ayudasobria.com/blog/${post.slug}`);
    assert.equal(schema.itemListElement[0].item, "https://ayudasobria.com/");
    assert.equal(schema.itemListElement[1].item, "https://ayudasobria.com/blog");
  }
});
