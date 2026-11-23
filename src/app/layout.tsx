import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
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
    // suppressHydrationWarning: the bootstrap script below adds `js` to <html>
    // before React hydrates, which is intentional, not a mismatch to report.
    <html lang="en" className={`${inter.variable} ${interTight.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper">
        {/* Site chrome lives in (site)/layout.tsx; the employee portal at /crm
            brings its own shell. See components/layout/SiteChrome.tsx. */}
        {children}
      </body>
    </html>
  );
}
