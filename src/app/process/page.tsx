import { StickyStack } from "@/components/motion/StickyStack";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { processSteps } from "@/content/company";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Our Process",
  description:
    "The MIDIS method: Discover, Strategise, Design, Build, Launch and Grow. Six stages with defined outputs at every point.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="How we work"
        headlineLines={["The MIDIS", "method."]}
        accentWords={["method."]}
        intro="Six stages, each with outputs you can actually point at. You should never have to ask what we're doing this week."
        visualSeed="process"
        variant="depth"
crumbs={[{ label: "Our Process", href: "/process" }]}
      />

      {/* ---------------------------------------------------------- steps */}
      <Section tone="surface" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="sr-only">
          The six stages
        </h2>

        {/*
          Each stage pins in turn and the next slides over it, leaving an edge
          of the one before visible. It reads as a sequence being dealt out
          rather than six rows scrolling past — and it is pure
          `position: sticky`, so it costs nothing to run. Below a short
          viewport, and under reduced motion, it falls back to a plain list.
        */}
        <StickyStack top="5.5rem" offset="2.25rem" className="space-y-8">
          {processSteps.map((step) => (
            <article
              key={step.number}
              className="group rounded-2xl border border-line p-7 shadow-[0_1px_2px_rgba(23,25,28,0.04),0_12px_32px_-18px_rgba(23,25,28,0.18)] sm:p-9 lg:p-12"
            >
              <div className="grid gap-7 lg:grid-cols-[1fr_1fr] lg:gap-14">
                <div>
                  <span
                    aria-hidden="true"
                    className="block h-px w-10 bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:w-16"
                  />
                  <h3 className="mt-6 text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base font-medium text-ink/70">{step.summary}</p>
                </div>

                <div>
                  <p className="text-base leading-relaxed text-muted">{step.detail}</p>

                  <div className="rule mt-7 pt-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                      What you get
                    </p>
                    <ul className="mt-3 space-y-2">
                      {step.outputs.map((o) => (
                        <li key={o} className="flex items-start gap-3 text-sm text-ink/75">
                          <span
                            aria-hidden="true"
                            className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                          />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </StickyStack>
      </Section>

      {/* ------------------------------------------------------ principles */}
      <Section tone="ink" aria-labelledby="why-process-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionHeader
            id="why-process-heading"
            tone="dark"
            eyebrow="Why it matters"
            title="A process is only useful if it's visible."
          />

          <Reveal className="space-y-6 lg:pt-16">
            <p className="text-base leading-relaxed text-surface/65">
              Most agency processes are a diagram in a pitch deck that nobody refers to again.
              Ours exists so you can tell, at any point, which stage we&apos;re in, what it
              produces, and what has to be true before the next one starts.
            </p>
            <p className="text-base leading-relaxed text-surface/65">
              That matters commercially. Decisions made in Discover and Strategise are the ones
              that are expensive to reverse later — structure, positioning, URL architecture,
              what each page is responsible for. Getting those agreed before anyone opens a
              design tool is the single biggest thing that keeps a project on budget.
            </p>
            <p className="text-base leading-relaxed text-surface/65">
              It also means launch isn&apos;t the end. The Grow stage measures the goals set in
              Discover, so we find out whether the site actually did what it was built to do.
            </p>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
