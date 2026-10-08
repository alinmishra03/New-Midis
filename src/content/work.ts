import { projects } from "./evidence";
import type { Project, ProjectCategory } from "./types";

export const projectCategories: { id: ProjectCategory; label: string }[] = [
  { id: "websites", label: "Websites" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "web-apps", label: "Web Applications" },
  { id: "branding", label: "Branding" },
  { id: "seo-growth", label: "SEO & Growth" },
];

/**
 * Whether there is any portfolio to show.
 *
 * This drives more than the /work page itself: the "Our Work" navigation
 * item, the footer's work links and the sitemap entry are all gated on it.
 * Sending a prospect to an empty portfolio costs more confidence than a
 * missing nav item does, so until real projects exist the section is simply
 * not advertised. The moment `projects` is populated, all of it appears.
 */
export const hasPortfolio = projects.length > 0;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Only categories that actually contain work — never an empty filter tab. */
export function activeCategories() {
  return projectCategories.filter((c) => projects.some((p) => p.category === c.id));
}

export function projectsByCategory(category: ProjectCategory | "all"): readonly Project[] {
  return category === "all" ? projects : projects.filter((p) => p.category === category);
}

/** Case studies are a subset of projects — not every project has one written. */
export function projectsWithCaseStudies(): readonly Project[] {
  return projects.filter((p) => p.caseStudy);
}

export function relatedProjects(slug: string, limit = 3): readonly Project[] {
  const current = getProject(slug);
  if (!current) return [];

  const explicit = (current.caseStudy?.relatedProjects ?? [])
    .map((s) => getProject(s))
    .filter((p): p is Project => Boolean(p));

  if (explicit.length >= limit) return explicit.slice(0, limit);

  // Fill remaining slots with same-category work, then anything else.
  const fallback = projects.filter(
    (p) => p.slug !== slug && !explicit.some((e) => e.slug === p.slug),
  );
  const sameCategory = fallback.filter((p) => p.category === current.category);
  const others = fallback.filter((p) => p.category !== current.category);

  return [...explicit, ...sameCategory, ...others].slice(0, limit);
}
