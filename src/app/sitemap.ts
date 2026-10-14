import type { MetadataRoute } from "next";
import { industries } from "@/content/industries";
import { services } from "@/content/services";
import { legal } from "@/content/legal";
import { site } from "@/content/site";
import { hasPortfolio } from "@/content/work";
import { projects } from "@/content/evidence";
import { getArticles } from "@/lib/cms";

/**
 * Generated from the content layer, so a new service or industry appears in
 * the sitemap automatically and cannot be forgotten.
 *
 * Only indexable pages are listed. /contact/call is excluded because it is
 * noindexed and canonicalises to /contact.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  /* Articles come from the CMS, so the sitemap has to ask it. A CMS outage
     must not fail the build, so getArticles() already returns [] on error. */
  const articles = await getArticles();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/industries", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/why-midis", priority: 0.7, changeFrequency: "monthly" },
    { path: "/process", priority: 0.7, changeFrequency: "monthly" },
    { path: "/team", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
    { path: "/insights", priority: 0.7, changeFrequency: "weekly" },
    { path: "/tools/website-audit", priority: 0.7, changeFrequency: "monthly" },
    /* Listed only once MIDIS has reviewed them; until then both are
       noindexed, and a sitemap entry would contradict that. */
    ...(legal.reviewed
      ? ([
          { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
          { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
        ])
      : []),
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${site.url}${r.path === "/" ? "" : r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...services.map((s) => ({
      url: `${site.url}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    /*
     * /work is listed unconditionally. It used to be gated on hasPortfolio
     * along with the project pages, because it was then a noindexed empty
     * state and there was nothing to submit. It is now the work landing
     * page, which has its own content and is indexable whether or not
     * content/evidence.ts has been populated — so only the project URLs
     * below it still depend on that flag.
     */
    {
      url: `${site.url}/work`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...(hasPortfolio
      ? projects.map((p) => ({
          url: `${site.url}/work/${p.slug}`,
          lastModified: now,
          changeFrequency: "yearly" as const,
          priority: 0.7,
        }))
      : []),
    ...articles.map((a) => ({
      url: `${site.url}/insights/${a.slug}`,
      lastModified: a.publishedAt ? new Date(a.publishedAt) : now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...industries.map((i) => ({
      url: `${site.url}/industries/${i.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
