import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { differentiators, processSteps, websiteJobs } from "@/content/company";
import { MethodSteps } from "./MethodSteps";

/* ----------------------------------------------- §3 The business problem */

export function Problems() {
  return (
    <Section tone="surface" aria-labelledby="problems-heading">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeader
            id="problems-heading"
            eyebrow="Why this matters"
            title="Your website should do more than exist."
            intro="Most company websites are built as brochures and then judged as salespeople. Before we design anything, we agree on the one job yours has to do — because that decision changes every page that follows."
          />
        </div>

        <ol className="rule">
          {websiteJobs.map((j, i) => (
            <Reveal
              key={j.job}
              as="li"
              delay={i * 50}
              className="group border-b border-line py-6 transition-colors"
            >
              <div className="flex items-baseline gap-5">
                {/* An accent marker replaces the former index numeral. */}
                <span
                  aria-hidden="true"
                  className="mt-3 h-px w-6 shrink-0 bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:w-10"
                />
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                    {j.job}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{j.detail}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ------------------------------------------------- §8 The MIDIS method */

export function Method() {
  return (
    <Section tone="ink" aria-labelledby="method-heading">
      <SectionHeader
        id="method-heading"
        tone="dark"
        eyebrow="How we work"
        title="The MIDIS method."
        intro="Six stages, each with defined outputs. You always know what's being worked on, why, and what comes next."
        action={
          <Button href="/process" variant="outline-light">
            See the full process
            <ArrowRight />
          </Button>
        }
      />

      <MethodSteps steps={processSteps} />
    </Section>
  );
}

/* -------------------------------------------------------- §9 Why MIDIS */

export function WhyMidis() {
  return (
    <Section tone="paper" aria-labelledby="why-heading">
      <SectionHeader
        id="why-heading"
        eyebrow="Why MIDIS"
        title="Why clients come back."
        intro="Not adjectives — the specific things that change when you work with us."
        action={
          <Button href="/why-midis" variant="outline">
            Why work with MIDIS?
            <ArrowRight />
          </Button>
        }
      />

      <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {differentiators.map((d, i) => (
          <Reveal key={d.number} delay={(i % 4) * 70} className="rule pt-6">
            <span aria-hidden="true" className="block h-px w-6 bg-accent" />
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">{d.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{d.body}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
