import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { FaqList, faqSchema } from "@/components/ui/FaqList";
import { PageHero } from "@/components/ui/PageHero";
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

  return (
    <>
      {hasEvidence(faqs) && <JsonLd data={faqSchema(faqs)} />}

      <PageHero
        eyebrow={`${industry.name} websites`}
        headlineLines={[`Websites for`, `${industry.name.toLowerCase()}.`]}
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
              title={`What makes ${industry.name.toLowerCase()} different.`}
            />
          </div>

          <div className="max-w-2xl">
            <div className="space-y-6">
              {(industry.intro ?? []).slice(1).map((para, i) => (
                <Reveal key={i} delay={i * 60}>
                  <p className="text-base leading-relaxed text-muted sm:text-lg">{para}</p>
                </Reveal>
              ))}
            </div>

            <ol className="rule mt-10">
              {industry.challenges.map((c, i) => (
                <Reveal key={c} as="li" delay={i * 50} className="border-b border-line py-5">
                  <div className="flex items-baseline gap-5">
                    <span aria-hidden="true" className="mt-3 h-px w-6 shrink-0 bg-accent" />
                    <p className="text-base leading-relaxed text-ink">{c}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
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

          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line-dark md:grid-cols-3">
            {industry.approach!.map((a, i) => (
              <Reveal key={a} as="li" delay={i * 80} className="bg-ink p-8 lg:p-10">
                <span aria-hidden="true" className="block h-px w-10 bg-accent" />
                <p className="mt-5 text-base leading-relaxed text-surface/75">{a}</p>
              </Reveal>
            ))}
          </ol>
        </Section>
      )}

      {/* ------------------------------------------------------- features */}
      {hasEvidence(industry.features) && (
        <Section tone="paper" aria-labelledby="features-heading">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="features-heading"
                eyebrow="What matters here"
                title="Features that earn their place."
                intro="Not an exhaustive list — the things that disproportionately affect whether a site in this sector works."
              />
            </div>

            <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {industry.features!.map((f, i) => (
                <Reveal key={f} as="li" delay={(i % 2) * 60} className="rule pt-4">
                  <p className="text-base leading-relaxed text-ink">{f}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------ related services */}
      {hasEvidence(relatedServices) && (
        <Section tone="surface" aria-labelledby="services-heading">
          <SectionHeader
            id="services-heading"
            eyebrow="Services"
            title={`What we typically do for ${industry.name.toLowerCase()} clients.`}
          />

          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-4">
            {relatedServices.map((s, i) => (
              <Reveal key={s.slug} as="li" delay={(i % 4) * 60} className="bg-surface">
                <Link
                  href={`/services/${s.slug}`}
                  className="group flex h-full flex-col p-7 transition-colors hover:bg-paper"
                >
                  <h3 className="text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
                  <ArrowRight className="mt-5 text-muted transition-colors group-hover:text-accent-ink" />
                </Link>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* ------------------------------------------------------------ FAQ */}
      {hasEvidence(faqs) && (
        <Section tone="paper" aria-labelledby="faq-heading">
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

      <CtaBand
        eyebrow="Next step"
        title={`Let's talk about your ${industry.name.toLowerCase()} project.`}
        body="Tell us what the site needs to achieve and what's getting in the way today."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "All industries", href: "/industries" }}
      />
    </>
  );
}
