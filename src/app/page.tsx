import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FeaturedWork, Results, Testimonials, TrustStrip } from "@/components/home/Evidence";
import { Method, Problems, WhyMidis } from "@/components/home/Narrative";
import { IndustriesSection, ServicesSection, TeamSection } from "@/components/home/Offerings";
import { AuditSection, FaqSection, FinalCta } from "@/components/home/Conversion";
import { GlobalReach } from "@/components/home/GlobalReach";
import { InsightsSection } from "@/components/home/Insights";
import { PricingSection } from "@/components/home/Pricing";
import { ClientsSection } from "@/components/home/Clients";
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
      {/*
        8 — Services and pricing. It sits after the two sections that
        establish what we do and who it is for, so the cost question is
        reached having already answered "is this for me". Paper between
        Industries (surface) and Method (ink) also keeps the page's tonal
        alternation intact, which placing it directly after Services would
        have broken.
      */}
      {/* 8  */} <PricingSection />
      {/*
        9 — Who the work was for. It follows the offer and its pricing, so
        the proof lands on the question just asked, and it is surface between
        Pricing (paper) and Method (ink).
      */}
      {/* 9  */} <ClientsSection />
      {/* 10 */} <Method />
      {/* 11 */} <WhyMidis />
      {/* 12 */} <Testimonials />
      {/* 13 */} <TeamSection />
      {/* 14 */} <GlobalReach />
      {/* 15 */} <AuditSection />
      {/* 16 */} <InsightsSection />
      {/* 17 */} <FaqSection />
      {/* 18 */} <FinalCta />
      {/* 19 — footer lives in the root layout, shared across every page */}

      <noscript>
        <p className="sr-only">
          This site works without JavaScript. For help, email {site.email}.
        </p>
      </noscript>
    </>
  );
}
