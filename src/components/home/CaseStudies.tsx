import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CaseStudyExplorer } from "./CaseStudyExplorer";
import { shownCaseStudies, activeCaseStudyIndustries } from "@/content/case-studies";

/**
 * "Our Work. Real Results." — the homepage case-study explorer.
 *
 * The heading, copy and section chrome are server-rendered; only the tabs
 * and the panel are a client component, so the project names, descriptions
 * and links are all in the initial HTML and crawlable.
 *
 * The section renders nothing at all if the data ever empties out, which
 * keeps it consistent with the rest of the evidence-gated homepage: a
 * section with no content is worse than no section.
 */
export function CaseStudiesSection() {
  if (shownCaseStudies.length === 0 || activeCaseStudyIndustries.length === 0) return null;

  return (
    <Section tone="paper" aria-labelledby="case-studies-heading">
      <SectionHeader
        id="case-studies-heading"
        eyebrow="Proof of our work"
        title="Our Work. Real Results."
        intro="Explore the digital experiences we've delivered across different industries. Real projects, real challenges, and results worth sharing."
      />

      {/* The panel settles in after the heading, like every other block
          on the page. Reveal is a CSS transition behind one observer, so
          the entrance costs nothing on the main thread. */}
      <Reveal delay={80}>
        <CaseStudyExplorer />
      </Reveal>

      {/*
        Says plainly why the panels show no numbers yet. Without it the
        empty analytics frames read as an unfinished build rather than a
        deliberate standard — and the standard is the more persuasive fact.
      */}
      <Reveal delay={60}>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
          Every project here is a real client engagement. Performance figures and analytics are
          published once the client has approved them and we can show the source and reporting
          period alongside the number.
        </p>
      </Reveal>
    </Section>
  );
}
