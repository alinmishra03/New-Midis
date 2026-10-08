import { CtaBand } from "@/components/ui/CtaBand";
import { FaqList, faqSchema } from "@/components/ui/FaqList";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { faqs } from "@/content/company";
import { JsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Website costs, timelines, our process, platform choices, SEO, redesigns without losing rankings, integrations and post-launch support — answered plainly.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />

      <PageHero
        eyebrow="FAQ"
        headlineLines={["The things clients", "ask before", "starting."]}
        accentWords={["starting."]}
        intro="Straight answers to the questions that come up most. If yours isn't here, ask us — we'd rather have the conversation than have you guess."
        visualSeed="faq"
        variant="focus"
crumbs={[{ label: "FAQ", href: "/faq" }]}
      />

      <Section tone="surface" className="!pt-0" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="sr-only">
          Frequently asked questions
        </h2>
        <div className="mx-auto max-w-3xl">
          <FaqList faqs={faqs} />
        </div>
      </Section>

      <CtaBand
        eyebrow="Still deciding?"
        title="Ask us the question that isn't here."
        body="Most projects start with someone describing a problem rather than requesting a service. That's a good place to begin."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "Book a strategy call", href: "/contact/call" }}
      />
    </>
  );
}
