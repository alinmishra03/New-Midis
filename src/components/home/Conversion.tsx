import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { faqs } from "@/content/company";

/* ------------------------------------------------------ §12 Free audit */

export function AuditSection() {
  return (
    <Section tone="surface" aria-labelledby="audit-heading">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeader
            id="audit-heading"
            eyebrow="Free website growth audit"
            title="Is your website helping your business grow?"
            intro="Enter your address and we'll run real diagnostics against it — performance, accessibility, SEO fundamentals and mobile usability — then tell you what's actually holding it back."
          />
        </div>

        <Reveal className="lg:pt-16">
          {/*
            A plain GET form. It works with JavaScript disabled, and the audit
            page performs the real analysis. We never generate a score here.
          */}
          <form action="/tools/website-audit" method="get" className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="audit-url" className="sr-only">
                Your website address
              </label>
              <input
                id="audit-url"
                name="url"
                type="url"
                required
                inputMode="url"
                placeholder="yourcompany.com"
                autoComplete="url"
                className="h-14 w-full rounded-full border border-line bg-paper px-6 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus-visible:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="lg">
              Audit my site
              <ArrowRight />
            </Button>
          </form>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Core Web Vitals and load performance",
              "Accessibility issues that affect real users",
              "Technical SEO fundamentals",
              "Mobile usability problems",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Results come from Google&apos;s PageSpeed Insights, running Lighthouse against your
            live site. We don&apos;t estimate scores or invent issue counts — you see the same
            data we would.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- §14 FAQ */

export function FaqSection() {
  /* Native <details> — keyboard accessible and fully functional with no JS. */
  return (
    <Section tone="paper" aria-labelledby="faq-heading">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeader
            id="faq-heading"
            eyebrow="Questions"
            title="The things clients ask before starting."
            intro="If something isn't answered here, ask us directly — we'd rather have the conversation than have you guess."
          />
        </div>

        <div className="rule">
          {faqs.map((f, i) => (
            <Reveal key={f.question} delay={Math.min(i, 6) * 40}>
              <details className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-medium tracking-tight text-ink sm:text-lg">
                    {f.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="relative mt-2 block h-3 w-3 shrink-0"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                    <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-open:rotate-90 group-open:opacity-0" />
                  </span>
                </summary>
                <div className="pb-6 pr-10">
                  <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                    {f.answer}
                  </p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------ §15 Final CTA */

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(circle, #EF8716 0%, transparent 70%)" }}
      />

      <div className="container-site relative py-24 text-center lg:py-36">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow tone="dark">Start here</Eyebrow>
          </div>

          <h2 className="mx-auto mt-8 max-w-[16ch] text-[length:var(--text-display-lg)] text-surface">
            Let&apos;s build something your business can grow with.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/60 sm:text-lg">
            Tell us where the business is now and where you want it to be. We&apos;ll tell you
            honestly whether we&apos;re the right people to get you there.
          </p>

          <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact" variant="primary" size="lg" magnetic>
              Tell us about the project
              <ArrowRight />
            </Button>
            <Button href="/contact/call" variant="outline-light" size="lg">
              Book a strategy call
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
