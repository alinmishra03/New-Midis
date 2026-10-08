import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { FaqList, faqSchema } from "@/components/ui/FaqList";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getIndustry } from "@/content/industries";
import { getService, services } from "@/content/services";
import { site } from "@/content/site";
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
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return buildMetadata({
    title: service.seo.title,
    description: service.seo.description,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = (service.relatedServices ?? [])
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const industries = (service.relatedIndustries ?? [])
    .map((i) => getIndustry(i))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  const faqs = service.faqs ?? [];

  return (
    <>
      {/* Service schema. No pricing or rating is asserted, because neither is
          verified — see docs/02-evidence-intake.md. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.summary,
          serviceType: service.title,
          provider: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
          areaServed: ["IN", "Worldwide"],
          url: `${site.url}/services/${service.slug}`,
        }}
      />
      {hasEvidence(faqs) && <JsonLd data={faqSchema(faqs)} />}

      <PageHero
        eyebrow={service.title}
        headlineLines={[service.problem]}
        intro={service.summary}
        visualSeed={service.slug}
        variant="signal"
crumbs={[
          { label: "Services", href: "/services" },
          { label: service.title, href: `/services/${service.slug}` },
        ]}
      />

      {/* ------------------------------------------------------------ body */}
      <Section tone="surface" aria-labelledby="overview-heading">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeader id="overview-heading" eyebrow="Overview" title="How we approach it." />

            <div className="mt-10 space-y-6">
              <div className="rule pt-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  Who it&apos;s for
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{service.audience}</p>
              </div>

              <div className="rule pt-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  What you get
                </p>
                <ul className="mt-3 space-y-2">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-ink">
                      <span
                        aria-hidden="true"
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="max-w-2xl space-y-6">
            {(service.body ?? []).map((para, i) => (
              <Reveal key={i} delay={i * 60}>
                <p className="text-base leading-relaxed text-muted sm:text-lg">{para}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------- industries */}
      {hasEvidence(industries) && (
        <Section tone="paper" aria-labelledby="industries-heading">
          <SectionHeader
            id="industries-heading"
            eyebrow="Where this matters most"
            title="Sectors we apply this in."
          />

          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-3">
            {industries.map((ind, i) => (
              <Reveal key={ind.slug} as="li" delay={i * 70} className="bg-paper">
                <Link
                  href={`/industries/${ind.slug}`}
                  className="group flex h-full flex-col p-8 transition-colors hover:bg-surface"
                >
                  <h3 className="text-lg font-semibold tracking-tight text-ink">{ind.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {ind.challenges[0]}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink">
                    View sector
                    <ArrowRight />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* -------------------------------------------------------------- FAQ */}
      {hasEvidence(faqs) && (
        <Section tone="surface" aria-labelledby="faq-heading">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="faq-heading"
                eyebrow="Questions"
                title={`${service.title}, answered.`}
              />
            </div>
            <FaqList faqs={faqs} />
          </div>
        </Section>
      )}

      {/* --------------------------------------------------- related services */}
      {hasEvidence(related) && (
        <Section tone="paper" aria-labelledby="related-heading">
          <SectionHeader
            id="related-heading"
            eyebrow="Related"
            title="Often paired with."
          />

          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r, i) => (
              <Reveal key={r.slug} as="li" delay={(i % 4) * 60} className="bg-paper">
                <Link
                  href={`/services/${r.slug}`}
                  className="group flex h-full flex-col p-7 transition-colors hover:bg-surface"
                >
                  <h3 className="text-base font-semibold tracking-tight text-ink">{r.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{r.problem}</p>
                  <ArrowRight className="mt-5 text-muted transition-colors group-hover:text-accent-ink" />
                </Link>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      <CtaBand
        eyebrow="Next step"
        title={`Talk to us about ${service.title.toLowerCase()}.`}
        body="Tell us what you're trying to achieve. If this isn't the right service for it, we'll say so."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "See all services", href: "/services" }}
      />
    </>
  );
}
