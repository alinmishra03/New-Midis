import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FeaturedWork, Results, Testimonials, TrustStrip } from "@/components/home/Evidence";
import { Method, Problems, WhyMidis } from "@/components/home/Narrative";
import { IndustriesSection, ServicesSection, TeamSection } from "@/components/home/Offerings";
import { AuditSection, FaqSection, FinalCta } from "@/components/home/Conversion";
import { InsightsSection } from "@/components/home/Insights";
import { faqs } from "@/content/company";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "MIDIS — Website Design & Development Agency",
  description:
    "We design and build websites that make businesses look as serious as they actually are. Strategy, design, development and digital growth for ambitious businesses.",
  alternates: { canonical: "/" },
};

/**
 * FAQPage schema. Emitted because the page genuinely renders these questions
 * and answers in its markup — the content and the structured data cannot
 * drift apart, since both read from the same source.
 */
function FaqSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <FaqSchema />

      {/* 1  */} <Hero />
      {/* 2  */} <TrustStrip />
      {/* 3  */} <Problems />
      {/* 4  */} <FeaturedWork />
      {/* 5  */} <Results />
      {/* 6  */} <ServicesSection />
      {/* 7  */} <IndustriesSection />
      {/* 8  */} <Method />
      {/* 9  */} <WhyMidis />
      {/* 10 */} <Testimonials />
      {/* 11 */} <TeamSection />
      {/* 12 */} <AuditSection />
      {/* 13 */} <InsightsSection />
      {/* 14 */} <FaqSection />
      {/* 15 */} <FinalCta />
      {/* 16 — footer lives in the root layout, shared across every page */}

      <noscript>
        <p className="sr-only">
          This site works without JavaScript. For help, email {site.email}.
        </p>
      </noscript>
    </>
  );
}
