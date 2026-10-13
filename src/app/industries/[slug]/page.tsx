import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipWipe } from "@/components/motion/ClipWipe";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { ArrowRight } from "@/components/ui/Button";
import { FaqList, faqSchema } from "@/components/ui/FaqList";
import { PageHero } from "@/components/ui/PageHero";
import { FinalCta } from "@/components/home/Conversion";
import { ServiceVisual, type PageVisualKind } from "@/components/services/ServiceVisual";
import type { ServiceVisual as ServiceVisualKind } from "@/content/service-details/types";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getIndustry, industries } from "@/content/industries";
import { getService } from "@/content/services";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { hasEvidence } from "@/lib/utils";

/**
 * Only the slugs generated below are valid routes. Without this, an unknown
 * slug is served as a partially-prerendered 200 shell and notFound() cannot
 * change the status after streaming has begun — a soft 404, which search
 * engines treat as a thin duplicate page.
 */
export const dynamicParams = false;

/** Hero artwork per sector: what a visitor in that sector actually does on the site. */
const sectorVisual: Record<string, PageVisualKind | ServiceVisualKind> = {
  saas: "uiux",
  healthcare: "booking",
  "real-estate": "listing",
  ecommerce: "ecommerce",
  startups: "web",
  education: "content",
  "professional-services": "booking",
  manufacturing: "specs",
};

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return {};

  return buildMetadata({
    title: industry.seo.title,
    description: industry.seo.description,
    path: `/industries/${industry.slug}`,
  });
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const relatedServices = (industry.relatedServices ?? [])
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const faqs = industry.faqs ?? [];
  /* Lower-cased mid-sentence, except names with internal capitals such as
     "SaaS", which previously rendered as "Websites for saas." */
  const sector = /[a-z][A-Z]/.test(industry.name) ? industry.name : industry.name.toLowerCase();

  return (
    <>
      {hasEvidence(faqs) && <JsonLd data={faqSchema(faqs)} />}

      <PageHero
        eyebrow={`${industry.name} websites`}
        keyword={industry.seo.title.replace(/\s*\|\s*MIDIS\s*$/, "")}
        headlineLines={[`Websites for`, `${sector}.`]}
        accentWords={[`${sector.split(" ").pop()}.`]}
        aside={<ServiceVisual kind={sectorVisual[industry.slug] ?? "web"} className="mx-auto max-w-lg lg:max-w-none" />}
        intro={industry.intro?.[0]}
        visualSeed={industry.slug}
        variant="weave"
        crumbs={[
          { label: "Industries", href: "/industries" },
          { label: industry.name, href: `/industries/${industry.slug}` },
        ]}
      />

      {/* ---------------------------------------------------- the problem */}
      <Section tone="surface" aria-labelledby="challenges-heading">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeader
              id="challenges-heading"
              eyebrow="The problem"
              title={`What makes ${sector} different.`}
            />
          </div>

          <div className="max-w-2xl">
            <StaggerGroup className="space-y-6" step={80}>
              {(industry.intro ?? []).slice(1).map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-muted sm:text-lg">
                  {para}
                </p>
              ))}
            </StaggerGroup>

            <StaggerGroup as="ol" className="rule mt-10" step={60}>
              {industry.challenges.map((c) => (
                <li key={c} className="border-b border-line py-5">
                  <div className="flex items-baseline gap-5">
                    <span aria-hidden="true" className="mt-3 h-px w-6 shrink-0 bg-accent" />
                    <p className="text-base leading-relaxed text-ink">{c}</p>
                  </div>
                </li>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------- approach */}
      {hasEvidence(industry.approach) && (
        <Section tone="ink" aria-labelledby="approach-heading">
          <SectionHeader
            id="approach-heading"
            tone="dark"
            eyebrow="Our approach"
            title="How we respond to it."
          />

          <StaggerGroup
            as="ol"
            className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line-dark md:grid-cols-3"
            step={90}
          >
            {industry.approach!.map((a) => (
              <li key={a} className="bg-ink p-8 lg:p-10">
                <span aria-hidden="true" className="block h-px w-10 bg-accent" />
                <p className="mt-5 text-base leading-relaxed text-surface/75">{a}</p>
              </li>
            ))}
          </StaggerGroup>
        </Section>
      )}

      {/* ---------------------------------------------------------- buyers */}
      {hasEvidence(industry.buyers) && (
        <Section tone="paper" aria-labelledby="buyers-heading">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="buyers-heading"
                eyebrow="The decision"
                title="Who has to say yes."
                intro={`A ${sector} website is rarely one person's call. These are the people in the room, and the question each of them needs settled before anything moves.`}
              />
            </div>

            <StaggerGroup as="ul" className="space-y-px overflow-hidden rounded-xl bg-line" step={90}>
              {industry.buyers!.map((b) => (
                <li key={b.role} className="bg-paper p-7 sm:p-8">
                  <h3 className="text-base font-semibold tracking-tight text-ink">{b.role}</h3>
                  <p className="mt-2.5 text-base leading-relaxed text-muted">{b.needs}</p>
                </li>
              ))}
            </StaggerGroup>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------------- features */}
      {hasEvidence(industry.features) && (
        <Section tone="surface" aria-labelledby="features-heading">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="features-heading"
                eyebrow="What matters here"
                title="Features that earn their place."
                intro="Not an exhaustive list — the things that disproportionately affect whether a site in this sector works."
              />
            </div>

            <StaggerGroup as="ul" className="grid gap-x-8 gap-y-5 sm:grid-cols-2" step={55}>
              {industry.features!.map((f) => (
                <li key={f} className="rule pt-4">
                  <p className="text-base leading-relaxed text-ink">{f}</p>
                </li>
              ))}
            </StaggerGroup>
          </div>
        </Section>
      )}

      {/* ------------------------------------------- platform and plumbing */}
      {industry.platform && (
        <Section tone="ink" aria-labelledby="platform-heading">
          <SectionHeader
            id="platform-heading"
            tone="dark"
            eyebrow="The build"
            title="What we'd build it on."
            intro="A recommendation is only useful if it also says where it stops being right. This is the default for the sector, and the case against it."
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            {/* The recommendation is uncovered rather than faded in — it is
                the answer the section exists to give. */}
            <ClipWipe className="rounded-xl border border-line-dark p-8 lg:p-10">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Our default
              </p>
              <p className="mt-5 text-[length:var(--text-display-sm)] leading-tight tracking-tight text-surface">
                {industry.platform.recommendation}
              </p>
              <p className="mt-6 text-base leading-relaxed text-surface/70">
                {industry.platform.rationale}
              </p>

              <div className="rule-dark mt-8 pt-6">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-surface/50">
                  Where it stops being the answer
                </p>
                <p className="mt-3 text-base leading-relaxed text-surface/70">
                  {industry.platform.exception}
                </p>
              </div>
            </ClipWipe>

            {hasEvidence(industry.integrations) && (
              <div>
                <h3 className="text-base font-semibold tracking-tight text-surface">
                  What it usually has to talk to
                </h3>
                <StaggerGroup as="ul" className="mt-6 space-y-0" step={50}>
                  {industry.integrations!.map((item) => (
                    <li key={item} className="flex items-baseline gap-4 border-b border-line-dark py-3.5">
                      <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-accent" />
                      <span className="text-[0.9375rem] leading-relaxed text-surface/70">{item}</span>
                    </li>
                  ))}
                </StaggerGroup>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ------------------------------------------- measurement and time */}
      {(hasEvidence(industry.metrics) || industry.timeline) && (
        <Section tone="paper" aria-labelledby="expect-heading">
          <SectionHeader
            id="expect-heading"
            eyebrow="What to expect"
            title="How we'd know it worked, and what moves the date."
          />

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
            {hasEvidence(industry.metrics) && (
              <div>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  Worth measuring once it&apos;s live
                </h3>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted">
                  Traffic is the easiest number to move and the least useful. These are the ones
                  that correspond to the business.
                </p>
                <StaggerGroup as="ul" className="mt-7" step={55}>
                  {industry.metrics!.map((m) => (
                    <li key={m} className="flex items-baseline gap-4 border-b border-line py-3.5">
                      <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-accent" />
                      <span className="text-[0.9375rem] leading-relaxed text-ink">{m}</span>
                    </li>
                  ))}
                </StaggerGroup>
              </div>
            )}

            {industry.timeline && (
              <Reveal delay={120}>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  How long it tends to take
                </h3>
                <p className="mt-4 text-base leading-relaxed text-ink sm:text-lg">
                  {industry.timeline.shape}
                </p>

                <p className="mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  What actually moves it
                </p>
                <StaggerGroup as="ol" className="mt-5 space-y-5" step={70}>
                  {industry.timeline.drivers.map((d) => (
                    <li key={d} className="flex items-baseline gap-4">
                      <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-accent" />
                      <span className="text-[0.9375rem] leading-relaxed text-muted">{d}</span>
                    </li>
                  ))}
                </StaggerGroup>
              </Reveal>
            )}
          </div>
        </Section>
      )}

      {/* ------------------------------------------------- rebuild signals */}
      {hasEvidence(industry.rebuildSignals) && (
        <Section tone="surface" aria-labelledby="signals-heading">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="signals-heading"
                eyebrow="Is this you?"
                title="Signs the site has become the constraint."
                intro="None of these are design complaints. They are the symptoms that show up in the business first, usually long before anyone blames the website."
              />
            </div>

            <StaggerGroup as="ul" className="grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2" step={80}>
              {industry.rebuildSignals!.map((s) => (
                <li key={s} className="flex items-start gap-4 bg-surface p-7">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M8 2.5v7M8 12.8v.7" />
                  </svg>
                  <p className="text-base leading-relaxed text-ink">{s}</p>
                </li>
              ))}
            </StaggerGroup>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------ related services */}
      {hasEvidence(relatedServices) && (
        <Section tone="paper" aria-labelledby="services-heading">
          <SectionHeader
            id="services-heading"
            eyebrow="Services"
            title={`What we typically do for ${sector} clients.`}
          />

          <StaggerGroup
            as="ul"
            className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-4"
            step={70}
          >
            {relatedServices.map((s) => (
              <li key={s.slug} className="bg-paper">
                <Link
                  href={`/services/${s.slug}`}
                  className="group flex h-full flex-col p-7 transition-colors hover:bg-surface"
                >
                  <h3 className="text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
                  <ArrowRight className="mt-5 text-muted transition-colors group-hover:text-accent-ink" />
                </Link>
              </li>
            ))}
          </StaggerGroup>
        </Section>
      )}

      {/* ------------------------------------------------------------ FAQ */}
      {hasEvidence(faqs) && (
        <Section tone="surface" aria-labelledby="faq-heading">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="faq-heading"
                eyebrow="Questions"
                title={`${industry.name} questions we're asked.`}
              />
            </div>
            <FaqList faqs={faqs} />
          </div>
        </Section>
      )}

      <FinalCta title={`Planning a ${sector} website?`} />
    </>
  );
}
