import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Analytics, ConsentBanner } from "@/components/analytics/Analytics";
import { Header } from "@/components/layout/Header";
import { Cursor } from "@/components/ui/Cursor";
import { MotionProfileAttribute } from "@/components/ui/MotionProfileAttribute";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "MIDIS — Website Design & Development Agency",
    template: "%s | MIDIS",
  },
  description:
    "MIDIS designs and builds websites that make businesses look as serious as they actually are. Strategy, design, development and digital growth, from Mohali to clients worldwide.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    url: site.url,
    title: "MIDIS — Website Design & Development Agency",
    description:
      "Strategy, design, development and digital growth for ambitious businesses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIDIS — Website Design & Development Agency",
    description:
      "Strategy, design, development and digital growth for ambitious businesses.",
  },
  icons: {
    icon: [
      { url: "/brand/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
};

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
 * Runs before first paint. Adding `js` is what allows the reveal styles to
 * hide anything at all, so a JS-less visitor sees every section immediately.
 * The timeout is the failsafe for a bundle that never finishes hydrating.
 */
const REVEAL_BOOTSTRAP = `
(function(){
  var d=document.documentElement;
  d.classList.add('js');
  setTimeout(function(){d.classList.add('reveal-all');},2500);
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-surface"
        >
          Skip to content
        </a>
        <OrganizationSchema />
        <MotionProfileAttribute />
        <ScrollProgress />
        <Cursor />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
