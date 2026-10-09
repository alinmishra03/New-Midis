import { DrawLine } from "@/components/motion/DrawLine";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { differentiators, whatYouGain } from "@/content/company";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Why MIDIS",
  description:
    "Eight specific reasons businesses choose MIDIS — strategy before design, business-first decisions, and search-ready builds from day one.",
  path: "/why-midis",
});

export default function WhyMidisPage() {
  return (
    <>
      <PageHero
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
                <div className="grid gap-5 lg:grid-cols-[6rem_1fr_1.2fr] lg:items-start lg:gap-10">
                  <span
                    aria-hidden="true"
                    className="mt-4 block h-px w-10 bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] lg:group-hover:w-16"
                  />
                  <h3 className="text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] lg:group-hover:translate-x-1.5">
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
          className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {whatYouGain.map((g) => (
            <li key={g.title} className="rule pt-6">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{g.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{g.body}</p>
            </li>
          ))}
        </StaggerGroup>
      </Section>
    </>
  );
}
