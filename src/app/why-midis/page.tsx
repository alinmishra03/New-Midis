import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
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

        <ol className="rule">
          {differentiators.map((d, i) => (
            <Reveal
              key={d.number}
              as="li"
              delay={Math.min(i, 5) * 50}
              className="group border-b border-line py-10 lg:py-12"
            >
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
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------ what you get */}
      <Section tone="paper" aria-labelledby="gain-heading">
        <SectionHeader
          id="gain-heading"
          eyebrow="In practice"
          title="What that means day to day."
        />

        <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {whatYouGain.map((g, i) => (
            <Reveal key={g.title} delay={(i % 4) * 70} className="rule pt-6">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{g.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{g.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand
        eyebrow="Next step"
        title="See whether we're the right fit."
        body="Tell us what you're trying to achieve. If we're not the right people for it, we'll say so."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "Read our process", href: "/process" }}
      />
    </>
  );
}
