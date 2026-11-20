import type { ReactNode } from "react";
import { Analytics, ConsentBanner } from "@/components/analytics/Analytics";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RouteTransition } from "@/components/motion/RouteTransition";
import { Cursor } from "@/components/ui/Cursor";
import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";
import { MotionProfileAttribute } from "@/components/ui/MotionProfileAttribute";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { site } from "@/content/site";

/**
 * Structured data. Only types genuinely supported by page content are
 * emitted — notably NO AggregateRating or Review, because MIDIS has no
 * verified reviews yet and fabricating them would be both dishonest and a
 * structured-data policy violation.
 */
function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        logo: `${site.url}/brand/icon-512.png`,
        email: site.email,
        telephone: site.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.locality,
          addressRegion: site.address.region,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        sameAs: site.socials.map((s) => s.url),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": `${site.url}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Static, developer-authored JSON — no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Everything the public marketing site wraps its pages in: header, footer,
 * motion layer, WhatsApp button, and consent-gated analytics.
 *
 * It lives here rather than in the root layout so that the employee portal
 * under /crm does not inherit any of it — least of all the analytics and
 * Meta Pixel, which have no business running on internal HR pages. Used by
 * app/(site)/layout.tsx and by the root not-found page, which renders inside
 * the root layout only and would otherwise lose the site chrome.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-surface"
      >
        Skip to content
      </a>
      <OrganizationSchema />
      <RouteTransition />
      <MotionProfileAttribute />
      <ScrollProgress />
      <Cursor />
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
      <ConsentBanner />
      <Analytics />
    </>
  );
}
