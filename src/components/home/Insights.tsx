import Image from "next/image";
import Link from "next/link";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { formatDate, getArticles } from "@/lib/cms";
import { hasEvidence } from "@/lib/utils";

/* ------------------------------------------------------------ §13 Insights */

export async function InsightsSection() {
  const articles = await getArticles(3);

  // Gated like every other proof surface: no articles, no section.
  if (!hasEvidence(articles)) return null;

  return (
    <Section tone="paper" aria-labelledby="insights-heading">
      <SectionHeader
        id="insights-heading"
        eyebrow="Insights"
        title="What we're thinking about."
        action={
          <Button href="/insights" variant="outline">
            All insights
            <ArrowRight />
          </Button>
        }
      />

      <StaggerGroup as="ul" step={85} className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/insights/${a.slug}`} className="group block">
              {a.image && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
                  <Image
                    src={a.image.url}
                    alt={a.image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">{a.excerpt}</p>
              )}

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink">
                Read
                <ArrowRight />
              </span>
            </Link>
          </li>
        ))}
      </StaggerGroup>
    </Section>
  );
}
