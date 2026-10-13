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

  /* The root layout's title template appends "| MIDIS". Several content
     entries already carry that suffix, which produced "… | MIDIS | MIDIS",
     so it is stripped here and the template is the single place it's added.
     Social titles don't pass through the template, so they get it back. */
  const base = title.replace(/\s*[|—–-]\s*MIDIS\s*$/i, "").trim();
  const full = `${base} | ${site.name}`;

  return {
    title: base,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_IN",
      url,
      title: full,
      description,
    },
    twitter: { card: "summary_large_image", title: full, description },
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
