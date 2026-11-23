import Link from "next/link";
import { notFound } from "next/navigation";
import { DrawLine } from "@/components/motion/DrawLine";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { FinalCta } from "@/components/home/Conversion";
import { ServiceVisual } from "@/components/services/ServiceVisual";
import { CardMedia } from "@/components/ui/CardMedia";
import { ArrowRight, Button } from "@/components/ui/Button";
import { FaqList, faqSchema } from "@/components/ui/FaqList";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getIndustry } from "@/content/industries";
import { getService, serviceGroups, services } from "@/content/services";
import { getServiceImage } from "@/content/service-imagery";
import { site } from "@/content/site";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { cn, hasEvidence, midSentence } from "@/lib/utils";

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
    title: service.detail?.seoTitle ?? service.seo.title,
    description: service.detail?.seoDescription ?? service.seo.description,
    path: `/services/${service.slug}`,
  });
}

/** Small uppercase label used throughout the page. */
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted", className)}>
      {children}
    </p>
  );
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const detail = service.detail;
  const groupLabel = serviceGroups.find((g) => g.id === service.group)?.label;
  const serviceImage = getServiceImage(service.slug);

  const related = (service.relatedServices ?? [])
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const industries = (service.relatedIndustries ?? [])
    .map((i) => getIndustry(i))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  const faqs = [...(service.faqs ?? []), ...(detail?.extraFaqs ?? [])];
  const contactHref = `/contact?service=${service.slug}`;

  return (
    <>
      {/* Service schema. No pricing or rating is asserted, because neither is
          verified — see docs/02-evidence-intake.md. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: detail?.seoDescription ?? service.summary,
          serviceType: detail?.keywords.primary ?? service.title,
          ...(groupLabel && { category: groupLabel }),
          provider: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
          areaServed: ["IN", "Worldwide"],
          url: `${site.url}/services/${service.slug}`,
          ...(detail && {
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: `${service.title} services`,
              itemListElement: detail.offerings.map((o) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: o.title, description: o.body },
              })),
            },
          }),
        }}
      />
      {hasEvidence(faqs) && <JsonLd data={faqSchema(faqs)} />}

      {/* ------------------------------------------------------------ hero */}
      <PageHero
        eyebrow={service.title}
        keyword={detail?.h1}
        headlineLines={[service.problem]}
        intro={service.summary}
        visualSeed={service.slug}
        variant="signal"
        crumbs={[
          { label: "Services", href: "/services" },
          { label: service.title, href: `/services/${service.slug}` },
        ]}
        aside={detail && <ServiceVisual kind={detail.visual} label={service.navLabel} className="mx-auto max-w-lg lg:max-w-none" />}
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button href={contactHref} size="lg" magnetic trackAs={`service-hero-${service.slug}`}>
            Start your project
            <ArrowRight />
          </Button>
          <Button href="/tools/website-audit" variant="outline" size="lg">
            Free website audit
          </Button>
        </div>

        <ul className="mt-9 flex flex-wrap gap-2" aria-label="What you get">
          {service.deliverables.map((d) => (
            <li
              key={d}
              className="rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs text-ink backdrop-blur"
            >
              {d}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* ------------------------------------------------------ challenges */}
      {detail && (
        <Section tone="ink" aria-labelledby="challenges-heading">
          <SectionHeader
            id="challenges-heading"
            tone="dark"
            eyebrow="Business challenges we solve"
            title={`Where ${midSentence(service.title)} usually goes wrong.`}
          />

          <StaggerGroup as="ol" step={90} className="mt-[var(--space-block)] grid gap-px overflow-hidden rounded-2xl bg-line-dark md:grid-cols-3">
            {detail.challenges.map((c, i) => (
              <li key={c.title} className="group relative bg-ink p-5 transition-colors duration-[var(--dur-base)] hover:bg-ink-soft sm:p-6 lg:p-8">
                <span className="font-display text-sm font-semibold text-accent tabular">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-surface">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-surface/60">{c.body}</p>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-x-100"
                />
              </li>
            ))}
          </StaggerGroup>
        </Section>
      )}

      {/* --------------------------------------------------------- approach */}
      <Section tone="surface" aria-labelledby="overview-heading">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeader
              id="overview-heading"
              eyebrow="Our approach"
              title={`How we approach ${midSentence(service.title)}.`}
            />

            <div className="mt-10 space-y-6">
              <div className="rule pt-5">
                <Label>Who it&apos;s for</Label>
                <p className="mt-2 text-sm leading-relaxed text-ink">{service.audience}</p>
              </div>

              <div className="rule pt-5">
                <Label>What you get</Label>
                <ul className="mt-3 space-y-2">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-ink">
                      <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <StaggerGroup className="max-w-2xl space-y-6" step={80}>
            {(service.body ?? []).map((para, i) => (
              <p
                key={i}
                className={cn(
                  "leading-relaxed",
                  i === 0 ? "text-lg text-ink sm:text-xl" : "text-base text-muted sm:text-lg",
                )}
              >
                {para}
              </p>
            ))}
          </StaggerGroup>
        </div>
      </Section>

      {/* ----------------------------------------------------- what we offer */}
      {detail && (
        <Section tone="paper" aria-labelledby="offer-heading">
          <SectionHeader
            id="offer-heading"
            eyebrow="What we offer"
            title={`Our ${midSentence(service.title)} services.`}
          />

          {/* Bento: the first offering leads at double width on large screens. */}
          <StaggerGroup as="ul" step={70} className="mt-[var(--space-block)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detail.offerings.map((o, i) => (
              <li
                key={o.title}
                className={cn(
                  "group relative isolate flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(23,25,28,0.35)] lg:p-8",
                  i === 0
                    ? "border-ink bg-ink text-surface sm:col-span-2 lg:row-span-2"
                    : "border-line bg-surface hover:border-accent/50",
                )}
              >
                {/*
                  Only the lead card. The brief this was built to asks for
                  background imagery on the featured card and warns against
                  forcing a picture onto every small one — five photographs in
                  a bento grid would fight each other and leave nowhere for
                  the eye to rest. The smaller cards stay typographic.
                */}
                {i === 0 && serviceImage && (
                  <CardMedia
                    src={serviceImage.src}
                    tone="dark"
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 94vw, 62vw"
                    intensifyOnHover
                  />
                )}
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-semibold tabular",
                    i === 0 ? "bg-accent text-ink" : "bg-accent-soft text-accent-ink",
                  )}
                >
                  0{i + 1}
                </span>
                <h3
                  className={cn(
                    "mt-6 font-semibold tracking-tight",
                    i === 0 ? "text-2xl text-surface sm:text-3xl lg:mt-auto" : "text-lg text-ink",
                  )}
                >
                  {o.title}
                </h3>
                <p
                  className={cn(
                    "mt-3 leading-relaxed",
                    i === 0 ? "max-w-md text-base text-surface/65" : "text-sm text-muted",
                  )}
                >
                  {o.body}
                </p>
                {i === 0 && (
                  <div
                    aria-hidden="true"
                    className="accent-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-2xl transition-opacity duration-[var(--dur-slow)] group-hover:opacity-40"
                  />
                )}
              </li>
            ))}
          </StaggerGroup>
        </Section>
      )}

      {/* ---------------------------------------------------------- process */}
      {detail && (
        <Section tone="surface" aria-labelledby="process-heading">
          <SectionHeader
            id="process-heading"
            eyebrow="How it works"
            title="Our process, step by step."
            action={
              <Button href="/process" variant="outline">
                The full MIDIS method
              </Button>
            }
          />

          <div className="relative mt-[var(--space-block)]">
            <DrawLine orientation="horizontal" className="absolute left-0 right-0 top-5 hidden bg-line lg:block" />
            <DrawLine orientation="vertical" className="absolute bottom-0 left-5 top-0 bg-line lg:hidden" />

            <StaggerGroup as="ol" step={110} className="relative grid gap-8 lg:grid-cols-4 lg:gap-8">
              {detail.process.map((p, i) => (
                <li key={p.title} className="relative pl-16 lg:pl-0">
                  <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-surface font-display text-sm font-semibold text-accent-ink lg:relative">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink lg:mt-8">{p.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.body}</p>
                </li>
              ))}
            </StaggerGroup>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------ tech + industries */}
      {(detail || hasEvidence(industries)) && (
        <Section tone="paper" aria-labelledby="stack-heading">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            {detail && (
              <div>
                <SectionHeader id="stack-heading" eyebrow="Tools & technologies" title="What we work with." />
                <StaggerGroup as="ul" step={35} className="mt-10 flex flex-wrap gap-2.5">
                  {detail.tech.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition-colors duration-[var(--dur-fast)] hover:border-accent hover:bg-accent-soft"
                    >
                      {t}
                    </li>
                  ))}
                </StaggerGroup>
              </div>
            )}

            {hasEvidence(industries) && (
              <div>
                <SectionHeader
                  id={detail ? "industries-heading" : "stack-heading"}
                  eyebrow="Industries we serve"
                  title="Where this matters most."
                />
                <StaggerGroup as="ul" step={70} className="mt-10 divide-y divide-line border-y border-line">
                  {industries.map((ind) => (
                    <li key={ind.slug}>
                      <Link
                        href={`/industries/${ind.slug}`}
                        className="group flex items-start justify-between gap-6 py-5 transition-colors"
                      >
                        <span>
                          <span className="block text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                            {ind.name}
                          </span>
                          <span className="mt-1.5 block text-sm leading-relaxed text-muted">{ind.challenges[0]}</span>
                        </span>
                        <ArrowRight className="mt-1.5 shrink-0 text-muted transition-[color,transform] duration-[var(--dur-base)] group-hover:translate-x-1 group-hover:text-accent-ink" />
                      </Link>
                    </li>
                  ))}
                </StaggerGroup>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* -------------------------------------------------------------- FAQ */}
      {hasEvidence(faqs) && (
        <Section tone="surface" aria-labelledby="faq-heading">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeader
                id="faq-heading"
                eyebrow="Frequently asked questions"
                title={`${service.title}, answered.`}
              />
              <p className="mt-6 text-sm leading-relaxed text-muted">
                Something else on your mind?{" "}
                <Link href={contactHref} className="font-medium text-ink underline decoration-accent underline-offset-4">
                  Ask us directly
                </Link>
                .
              </p>
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
            eyebrow="Related services"
            title="Often paired with."
            action={
              <Button href="/services" variant="outline">
                All services
              </Button>
            }
          />

          <StaggerGroup as="ul" step={60} className="mt-[var(--space-block)] grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => {
              /*
                Each related card shows the service it links to, not the one
                being read — so four different pictures, and following the
                link lands on the page that same picture leads.
              */
              const image = getServiceImage(r.slug);
              return (
                <li key={r.slug}>
                  <Link
                    href={`/services/${r.slug}`}
                    className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 transition-[transform,border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_24px_60px_-30px_rgba(23,25,28,0.3)]"
                  >
                    {image && (
                      <CardMedia
                        src={image.src}
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
                        intensifyOnHover
                      />
                    )}
                    <h3 className="text-base font-semibold tracking-tight text-ink">{r.title}</h3>
                    <p
                      className={cn(
                        "mt-2.5 flex-1 text-sm leading-relaxed",
                        image ? "text-muted-strong" : "text-muted",
                      )}
                    >
                      {r.problem}
                    </p>
                    <ArrowRight
                      className={cn(
                        "mt-5 transition-[color,transform] duration-[var(--dur-base)] group-hover:translate-x-1 group-hover:text-accent-ink",
                        image ? "text-muted-strong" : "text-muted",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </StaggerGroup>
        </Section>
      )}

      <FinalCta
        eyebrow={service.title}
        title={`Ready to talk about ${midSentence(service.title)}?`}
        intro="Tell us where things stand today and what you need it to do. We’ll come back with an honest view of scope, approach and whether we’re the right fit."
        primaryHref={contactHref}
        primaryLabel="Start your project"
      />
    </>
  );
}
