import type { Metadata } from "next";
import { site } from "@/content/site";

/**
 * Builds per-page metadata with a correct canonical and matching Open Graph
 * tags. The old site shared one title and description across all nine routes
 * and emitted no canonical at all; every page here gets its own.
 */
export function buildMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  /** Route path beginning with "/". */
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${site.url}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_IN",
      url,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export interface Crumb {
  label: string;
  href: string;
}

/**
 * BreadcrumbList structured data. Emitted alongside visible breadcrumbs only,
 * so the markup and the schema always describe the same thing.
 */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ label: "Home", href: "/" }, ...crumbs].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${site.url}${c.href === "/" ? "" : c.href}`,
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Developer-authored content only; no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
