import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { formatDate, getArticles } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";
import { hasEvidence } from "@/lib/utils";

export const revalidate = 1800;

export const metadata = buildMetadata({
  title: "Insights",
  description:
    "Articles, guides and technical breakdowns on website design, development, performance and search — written from work we've actually done.",
  path: "/insights",
});

export default async function InsightsPage() {
  const articles = await getArticles();
  const [lead, ...rest] = articles;

  return (
    <>
      <PageHero
        eyebrow="Insights"
        headlineLines={["What we're", "thinking about."]}
        accentWords={["about."]}
        intro="Articles and breakdowns on design, development, performance and search. We'd rather publish a few things worth reading than a post a week nobody finishes."
        visualSeed="insights"
        variant="signal"
crumbs={[{ label: "Insights", href: "/insights" }]}
      />

      <Section tone="surface" className="!pt-0" aria-labelledby="articles-heading">
        <h2 id="articles-heading" className="sr-only">
          Articles
        </h2>

        {!hasEvidence(articles) ? (
          /*
           * Honest empty state. The CMS is the source of truth; if it is
           * unreachable or has nothing published, we say so rather than
           * rendering filler.
           */
          <Reveal className="mx-auto max-w-2xl rounded-2xl border border-line bg-paper p-10 text-center lg:p-14">
            <h3 className="text-2xl tracking-tight text-ink">Nothing published here yet.</h3>
            <p className="mt-5 text-base leading-relaxed text-muted">
              We&apos;re working on it. In the meantime, if there&apos;s something you&apos;d
              like our view on, ask us directly — we&apos;ll usually answer properly.
            </p>
          </Reveal>
        ) : (
          <>
            {/* ------------------------------------------------ lead article */}
            <Reveal>
              <Link href={`/insights/${lead.slug}`} className="group block">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-14 lg:items-center">
                  {lead.image && (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
                      <Image
                        src={lead.image.url}
                        alt={lead.image.alt}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                      Latest
                    </p>
                    <h3 className="mt-4 text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink">
                      {lead.title}
                    </h3>
                    {lead.excerpt && (
                      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                        {lead.excerpt}
                      </p>
                    )}
                    <div className="mt-6 flex items-center gap-4">
                      {lead.publishedAt && (
                        <time
                          dateTime={lead.publishedAt}
                          className="text-sm text-muted"
                        >
                          {formatDate(lead.publishedAt)}
                        </time>
                      )}
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                        Read
                        <ArrowRight />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>

            {/* ------------------------------------------------- the rest */}
            {hasEvidence(rest) && (
              <ul className="rule mt-16 grid gap-x-8 gap-y-14 pt-16 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a, i) => (
                  <Reveal key={a.slug} as="li" delay={(i % 3) * 80}>
                    <Link href={`/insights/${a.slug}`} className="group block">
                      {a.image && (
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
                          <Image
                            src={a.image.url}
                            alt={a.image.alt}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                          />
                        </div>
                      )}
                      {a.publishedAt && (
                        <time
                          dateTime={a.publishedAt}
                          className="mt-5 block text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted"
                        >
                          {formatDate(a.publishedAt)}
                        </time>
                      )}
                      <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-ink">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">
                          {a.excerpt}
                        </p>
                      )}
                    </Link>
                  </Reveal>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>

      <CtaBand
        eyebrow="Got a question?"
        title="Ask us the thing you can't find an answer to."
        body="If it's a good question, it probably becomes the next article."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "Get a free website audit", href: "/tools/website-audit" }}
      />
    </>
  );
}
