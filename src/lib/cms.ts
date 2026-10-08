import { site } from "@/content/site";

/**
 * Thin client for the EXISTING MIDIS Strapi instance.
 *
 * The current site already publishes articles and receives enquiries through
 * this CMS, so it is reused rather than replaced — no second CMS is
 * introduced. Shapes below match Strapi v5's flat response format, verified
 * against the live endpoint during the Phase 1 audit.
 */

export interface StrapiImage {
  url?: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
}

export interface StrapiArticle {
  id: number;
  documentId: string;
  title: string;
  shortDescription?: string | null;
  /** Capital-S in the CMS schema, and currently null on every record. */
  Slug?: string | null;
  longDescription?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  image?: StrapiImage | null;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  publishedAt: string | null;
  image: { url: string; alt: string } | null;
}

/** Stable, readable URL slug. Falls back to documentId when Slug is unset. */
export function articleSlug(a: StrapiArticle): string {
  if (a.Slug && a.Slug.trim()) return a.Slug.trim();
  const fromTitle = a.title
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 72);
  return fromTitle || a.documentId;
}

function normalise(a: StrapiArticle): Article {
  const url = a.image?.url;
  return {
    slug: articleSlug(a),
    title: a.title,
    excerpt: a.shortDescription?.trim() ?? "",
    html: a.longDescription ?? "",
    publishedAt: a.publishedAt ?? a.createdAt ?? null,
    image: url
      ? {
          url: url.startsWith("http") ? url : `${site.cms.baseUrl}${url}`,
          alt: a.image?.alternativeText ?? a.title,
        }
      : null,
  };
}

/**
 * Fetches published articles.
 *
 * Returns [] on any failure rather than throwing: the Insights section is
 * evidence-gated like every other proof surface, so an unreachable CMS makes
 * the section disappear instead of breaking the page.
 */
export async function getArticles(limit?: number): Promise<Article[]> {
  try {
    const url = `${site.cms.baseUrl}${site.cms.blogs}?populate=*&sort=publishedAt:desc`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const json = (await res.json()) as { data?: StrapiArticle[] };
    const items = (json.data ?? []).filter((a) => a?.title).map(normalise);
    return typeof limit === "number" ? items.slice(0, limit) : items;
  } catch {
    return [];
  }
}

export async function getArticle(slug: string): Promise<Article | null> {
  const all = await getArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
