import Link from "next/link";
import { ServiceVisual } from "@/components/services/ServiceVisual";
import { FinalCta } from "@/components/home/Conversion";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { ArrowRight } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getAllIndustries } from "@/content/industries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Industry-Specific Website Design & Development",
  description:
    "Industry-specific website design and development for SaaS, healthcare, real estate, e-commerce, startups, education, professional services and manufacturing.",
  path: "/industries",
});

export default function IndustriesPage() {
  const industries = getAllIndustries();

  return (
    <>
      <PageHero
        keyword="Industry-specific website design & development"
        aside={<ServiceVisual kind="sectors" className="mx-auto max-w-lg lg:max-w-none" />}
        eyebrow="Industries"
        headlineLines={["Different businesses", "need different", "websites."]}
        accentWords={["websites."]}
        intro="A SaaS product and a healthcare practice are not solving the same problem, and a template that serves both equally serves neither well. These pages set out what's actually different."
        visualSeed="industries-hub"
        variant="weave"
        crumbs={[{ label: "Industries", href: "/industries" }]}
      />

      {/* ---------------------------------------------------- sector cards */}
      <Section tone="surface" aria-labelledby="sectors-heading">
        <h2 id="sectors-heading" className="sr-only">
          Sectors we work in
        </h2>

        <StaggerGroup
          as="ul"
          className="grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2"
          step={80}
        >
          {industries.map((ind) => (
            <li key={ind.slug} className="bg-surface">
              <Link
                href={`/industries/${ind.slug}`}
                className="group flex h-full flex-col p-8 transition-colors duration-[var(--dur-base)] hover:bg-paper lg:p-10"
              >
                <div className="flex items-baseline gap-4">
                  <span
                    aria-hidden="true"
                    className="h-px w-6 bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:w-10"
                  />
                  <h3 className="text-2xl tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                    {ind.name}
                  </h3>
                </div>

                <p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  What makes it hard
                </p>
                <ul className="mt-3 flex-1 space-y-2">
                  {ind.challenges.slice(0, 3).map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                      <span
                        aria-hidden="true"
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                      />
                      {c}
                    </li>
                  ))}
                </ul>

                {ind.buyers && ind.buyers.length > 0 && (
                  <p className="rule mt-6 pt-4 text-xs leading-relaxed text-muted">
                    <span className="font-medium text-ink">Who decides: </span>
                    {ind.buyers.map((b) => b.role).join(" · ")}
                  </p>
                )}

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink">
                  Read more
                  <ArrowRight />
                </span>
              </Link>
            </li>
          ))}
        </StaggerGroup>
      </Section>

      {/* ------------------------------------------------------ at a glance */}
      <Section tone="paper" aria-labelledby="glance-heading">
        <SectionHeader
          id="glance-heading"
          eyebrow="Side by side"
          title="The same decision, answered differently."
          intro="Every sector arrives at a website with a different shape of problem — a different group of people to convince, and a different sensible default to build on. This is where those answers diverge."
        />

        <div className="mt-12 overflow-hidden rounded-xl border border-line">
          {/* Column headings, hidden on mobile where each row stacks and
              carries its own labels instead. */}
          <div
            aria-hidden="true"
            className="hidden bg-surface px-7 py-4 md:grid md:grid-cols-[1fr_1.6fr_1.2fr] md:gap-8"
          >
            {["Sector", "Who has to say yes", "Usually built on"].map((h) => (
              <p
                key={h}
                className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted"
              >
                {h}
              </p>
            ))}
          </div>

          <StaggerGroup as="ul" step={60}>
            {industries.map((ind) => (
              <li
                key={ind.slug}
                className="border-t border-line bg-paper px-7 py-6 transition-colors hover:bg-surface md:grid md:grid-cols-[1fr_1.6fr_1.2fr] md:items-baseline md:gap-8"
              >
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  <Link
                    href={`/industries/${ind.slug}`}
                    className="group/row inline-flex items-center gap-2 transition-colors hover:text-accent-ink"
                  >
                    {ind.name}
                    <ArrowRight className="h-3.5 w-3.5 text-muted transition-colors group-hover/row:text-accent-ink" />
                  </Link>
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted md:mt-0">
                  <span className="font-medium uppercase tracking-[0.14em] text-[0.625rem] text-muted md:hidden">
                    Who has to say yes
                    <br />
                  </span>
                  {(ind.buyers ?? []).map((b) => b.role).join(" · ")}
                </p>

                <p className="mt-2 text-sm leading-relaxed text-ink md:mt-0">
                  <span className="font-medium uppercase tracking-[0.14em] text-[0.625rem] text-muted md:hidden">
                    Usually built on
                    <br />
                  </span>
                  {ind.platform?.label}
                </p>
              </li>
            ))}
          </StaggerGroup>
        </div>

        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-muted">
          A default is a starting point, not a rule. Each sector page sets out the reasoning behind
          its recommendation — and the circumstances where we would argue against it.
        </p>
      </Section>

      <FinalCta title="Don’t see your sector listed?" intro="The principles carry across. Tell us what makes buying in your market different and we’ll show you how the site should answer it." />
    </>
  );
}
