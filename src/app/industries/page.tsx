import Link from "next/link";
import { ArrowRight } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { getAllIndustries } from "@/content/industries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Industries",
  description:
    "Websites built around what's specific to your sector — SaaS, healthcare, real estate, e-commerce, startups, education, professional services and manufacturing.",
  path: "/industries",
});

export default function IndustriesPage() {
  const industries = getAllIndustries();

  return (
    <>
      <PageHero
        eyebrow="Industries"
        headlineLines={["Different businesses", "need different", "websites."]}
        accentWords={["websites."]}
        intro="A SaaS product and a healthcare practice are not solving the same problem, and a template that serves both equally serves neither well. These pages set out what's actually different."
        visualSeed="industries-hub"
        variant="weave"
crumbs={[{ label: "Industries", href: "/industries" }]}
      />

      <Section tone="surface" aria-labelledby="sectors-heading">
        <h2 id="sectors-heading" className="sr-only">
          Sectors we work in
        </h2>

        <ul className="grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2">
          {industries.map((ind, i) => (
            <Reveal key={ind.slug} as="li" delay={(i % 2) * 70} className="bg-surface">
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

                <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-ink">
                  Read more
                  <ArrowRight />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      <CtaBand
        eyebrow="Not listed?"
        title="We've probably solved something similar."
        body="Sector experience helps, but the underlying questions are consistent. Tell us what your business needs the site to do."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "See all services", href: "/services" }}
      />
    </>
  );
}
