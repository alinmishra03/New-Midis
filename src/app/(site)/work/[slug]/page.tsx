import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/analytics/Track";
import { ArrowRight } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Parallax } from "@/components/ui/Parallax";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { projects } from "@/content/evidence";
import { site } from "@/content/site";
import { getProject, relatedProjects } from "@/content/work";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { hasEvidence } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return buildMetadata({
    title: `${project.name} — ${project.industry} case study`,
    description: project.summary,
    path: `/work/${project.slug}`,
  });
}

/** Small labelled fact, used in the project meta rail. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rule pt-4">
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

/** A titled block of the narrative — rendered only when it has content. */
function Chapter({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs?: string[];
}) {
  if (!hasEvidence(paragraphs)) return null;

  return (
    <Reveal className="grid gap-5 border-b border-line py-10 lg:grid-cols-[8rem_1fr] lg:gap-8 lg:py-14">
      <div>
        <h2 className="text-xl tracking-tight text-ink">{title}</h2>
      </div>
      <div className="max-w-2xl space-y-5">
        {paragraphs!.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-muted sm:text-lg">
            {p}
          </p>
        ))}
      </div>
    </Reveal>
  );
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const study = project.caseStudy;
  const related = relatedProjects(slug);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.name,
          description: project.summary,
          about: project.industry,
          url: `${site.url}/work/${project.slug}`,
          dateCreated: project.year,
          creator: { "@type": "Organization", name: site.name, url: site.url },
        }}
      />

      <TrackView event="project_view" params={{ project: project.slug }} />

      <PageHero
        eyebrow={`${project.industry} — ${project.year}`}
        headlineLines={[project.name]}
        intro={project.summary}
        variant="weave"
crumbs={[
          { label: "Our Work", href: "/work" },
          { label: project.name, href: `/work/${project.slug}` },
        ]}
      />

      {/* ------------------------------------------------------ hero image */}
      <Section tone="surface" className="!pt-0">
        <Reveal>
          <Parallax className="relative aspect-[16/10] rounded-xl bg-line sm:aspect-[2/1]" distance={32}>
            <Image
              src={project.thumbnail}
              alt={project.thumbnailAlt}
              fill
              priority
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="object-cover object-top"
            />
          </Parallax>
        </Reveal>

        {/* ------------------------------------------------ overview + facts */}
        <div className="mt-[var(--space-block)] grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-14">
          <div>
            <SectionHeader eyebrow="Overview" title="The project." />
            <div className="mt-8 max-w-2xl space-y-5">
              {(study?.overview ?? [project.summary]).map((p, i) => (
                <p key={i} className="text-base leading-relaxed text-muted sm:text-lg">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <Reveal>
            <dl className="space-y-5">
              <Fact label="Client">{project.client}</Fact>
              <Fact label="Industry">{project.industry}</Fact>
              {project.location && <Fact label="Location">{project.location}</Fact>}
              <Fact label="Year">{project.year}</Fact>
              <Fact label="Services delivered">
                <ul className="space-y-1.5">
                  {project.services.map((s) => (
                    <li key={s} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </Fact>
              {hasEvidence(study?.stack) && (
                <Fact label="Technology">
                  <ul className="flex flex-wrap gap-1.5">
                    {study!.stack.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-line px-3 py-1 text-xs text-ink"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </Fact>
              )}
              {project.liveUrl && (
                <Fact label="Live site">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-accent-ink underline-offset-4 hover:underline"
                  >
                    Visit site
                    <ArrowRight />
                  </a>
                </Fact>
              )}
            </dl>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------------------- narrative */}
      {study && (
        <Section tone="paper" aria-labelledby="story-heading">
          <h2 id="story-heading" className="sr-only">
            How the project was delivered
          </h2>

          <div className="rule">
            <Chapter title="The challenge" paragraphs={study.challenge} />
            <Chapter title="Our approach" paragraphs={study.approach} />
            <Chapter title="The design" paragraphs={study.design} />
            <Chapter title="The build" paragraphs={study.development} />
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------- gallery */}
      {hasEvidence(study?.images) && (
        <Section tone="surface" aria-labelledby="gallery-heading">
          <h2 id="gallery-heading" className="sr-only">
            Project visuals
          </h2>

          <div className="space-y-8">
            {study!.images.map((img, i) => (
              <Reveal key={img.src} delay={(i % 2) * 70}>
                <figure>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 1440px) 100vw, 1440px"
                      className="object-cover object-top"
                    />
                  </div>
                  {img.caption && (
                    <figcaption className="mt-3 text-sm text-muted">{img.caption}</figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------- results */}
      {hasEvidence(study?.results) && (
        <Section tone="ink" aria-labelledby="results-heading">
          <SectionHeader
            id="results-heading"
            tone="dark"
            eyebrow="The results"
            title="What changed."
            intro="Each figure below names its baseline, the period it covers and how it was measured."
          />

          <div className="mt-[var(--space-block)] grid gap-px overflow-hidden rounded-xl bg-line-dark sm:grid-cols-2 lg:grid-cols-3">
            {study!.results.map((r, i) => (
              <Reveal key={r.label} delay={(i % 3) * 80} className="bg-ink p-5 sm:p-6">
                <p className="tabular font-display text-[length:var(--text-display-sm)] text-accent">
                  {r.value}
                </p>
                <p className="mt-2 text-base font-medium text-surface">{r.label}</p>

                <dl className="mt-6 space-y-2 text-sm">
                  {[
                    ["Baseline", r.baseline],
                    ["Period", r.period],
                    ["Measured by", r.measurement],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-24 shrink-0 text-surface/40">{k}</dt>
                      <dd className="text-surface/75">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ------------------------------------------------------ testimonial */}
      {study?.testimonial && (
        <Section tone="surface" aria-labelledby="testimonial-heading">
          <h2 id="testimonial-heading" className="sr-only">
            What the client said
          </h2>

          <Reveal className="mx-auto max-w-3xl text-center">
            <blockquote className="text-[length:var(--text-display-sm)] leading-snug tracking-tight text-ink">
              &ldquo;{study.testimonial.quote}&rdquo;
            </blockquote>
            <footer className="mt-8 flex items-center justify-center gap-4">
              {study.testimonial.photo && (
                <Image
                  src={study.testimonial.photo}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">{study.testimonial.name}</p>
                <p className="text-sm text-muted">
                  {study.testimonial.role}, {study.testimonial.company}
                </p>
              </div>
            </footer>
          </Reveal>
        </Section>
      )}

      {/* ------------------------------------------------- related projects */}
      {hasEvidence(related) && (
        <Section tone="paper" aria-labelledby="related-heading">
          <SectionHeader id="related-heading" eyebrow="More work" title="Related projects." />

          <ul className="mt-[var(--space-block)] grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <Reveal key={p.slug} as="li" delay={(i % 3) * 80}>
                <Link href={`/work/${p.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
                    <Image
                      src={p.thumbnail}
                      alt={p.thumbnailAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{p.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.summary}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
