import { DrawLine } from "@/components/motion/DrawLine";
import { ServiceVisual } from "@/components/services/ServiceVisual";
import { FinalCta } from "@/components/home/Conversion";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { differentiators, whatYouGain } from "@/content/company";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Why Choose MIDIS as Your Web Design Agency",
  description:
    "Why businesses choose MIDIS as their web design and development agency: strategy before design, business-first decisions and search-ready builds from day one.",
  path: "/why-midis",
});

export default function WhyMidisPage() {
  return (
    <>
      <PageHero
        keyword="Why choose MIDIS as your web agency"
        aside={<ServiceVisual kind="why" className="mx-auto max-w-lg lg:max-w-none" />}
        eyebrow="Why MIDIS"
        headlineLines={["Why clients", "come back."]}
        accentWords={["back."]}
        intro="Not adjectives. Eight specific things that change when you work with us — each one something you can hold us to."
        visualSeed="why-midis"
        variant="depth"
crumbs={[{ label: "Why MIDIS", href: "/why-midis" }]}
      />

      {/* ------------------------------------------------- differentiators */}
      <Section tone="surface" aria-labelledby="reasons-heading">
        <h2 id="reasons-heading" className="sr-only">
          Reasons to work with MIDIS
        </h2>

        <div className="relative">
          <DrawLine
            orientation="vertical"
            className="absolute left-[1.25rem] top-0 hidden h-full bg-line lg:block"
          />

          <StaggerGroup as="ol" step={70} className="rule relative">
            {differentiators.map((d) => (
              <li key={d.number} className="group border-b border-line py-10 lg:py-12">
                {/* The first column is empty now that the decorative rule has
                    gone, and it stays: the vertical line above is drawn at
                    1.25rem and this column is the gutter it runs down. Closing
                    it would put that line through the headings. The title is
                    placed in column two explicitly, since there is no longer a
                    first child to occupy column one. */}
                <div className="grid gap-5 lg:grid-cols-[6rem_1fr_1.2fr] lg:items-start lg:gap-8">
                  <h3 className="text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] lg:col-start-2 lg:group-hover:translate-x-1.5">
                    {d.title}
                  </h3>
                  <p className="max-w-xl text-base leading-relaxed text-muted">{d.body}</p>
                </div>
              </li>
            ))}
          </StaggerGroup>
        </div>
      </Section>

      {/* ------------------------------------------------------ what you get */}
      <Section tone="paper" aria-labelledby="gain-heading">
        <SectionHeader
          id="gain-heading"
          eyebrow="In practice"
          title="What that means day to day."
        />

        <StaggerGroup
          as="ul"
          step={70}
          className="mt-[var(--space-block)] grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {whatYouGain.map((g) => (
            <li key={g.title} className="rule pt-6">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{g.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{g.body}</p>
            </li>
          ))}
        </StaggerGroup>
      </Section>

      <FinalCta title="Hold us to all eight." />
    </>
  );
}
