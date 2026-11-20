import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/analytics/Track";
import { ArrowRight } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Parallax } from "@/components/ui/Parallax";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { site } from "@/content/site";
import { formatDate, getArticle, getArticles } from "@/lib/cms";
import { sanitizeArticleHtml, readingTime } from "@/lib/sanitize";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { hasEvidence } from "@/lib/utils";

export const revalidate = 1800;

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  /* CMS excerpts can run long; search results cut descriptions at roughly
     160 characters, so trim at a word boundary rather than mid-word. */
  const clip = (text: string, max = 158) =>
    text.length <= max ? text : `${text.slice(0, text.lastIndexOf(" ", max - 1)).replace(/[,;:—-]\s*$/, "")}…`;

  return buildMetadata({
    title: article.title,
    description: clip(article.excerpt || `${article.title} — an article from MIDIS.`),
    path: `/insights/${article.slug}`,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const html = sanitizeArticleHtml(article.html);
  const minutes = readingTime(article.html);

  const others = (await getArticles()).filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <>
      {/*
        Article schema. No `author` is asserted: the CMS has no author field,
        and inventing a byline would be fabricating authorship. Add an author
        field in Strapi and it can be emitted properly.
      */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt || undefined,
          image: article.image?.url ? [article.image.url] : undefined,
          datePublished: article.publishedAt || undefined,
          publisher: {
            "@type": "Organization",
            name: site.name,
            logo: { "@type": "ImageObject", url: `${site.url}/brand/icon-512.png` },
          },
          mainEntityOfPage: `${site.url}/insights/${article.slug}`,
        }}
      />

      <TrackView event="article_view" params={{ article: article.slug }} />

      <PageHero
        eyebrow="Insights"
        headlineLines={[article.title]}
        intro={article.excerpt || undefined}
        variant="signal"
crumbs={[
          { label: "Insights", href: "/insights" },
          { label: article.title, href: `/insights/${article.slug}` },
        ]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          )}
          <span aria-hidden="true" className="text-line">
            /
          </span>
          <span>{minutes} min read</span>
        </div>
      </PageHero>

      <Section tone="surface" className="!pt-0" aria-labelledby="article-body">
        <h2 id="article-body" className="sr-only">
          Article
        </h2>

        {article.image && (
          <Reveal className="mb-14">
            <Parallax className="relative aspect-[16/10] rounded-xl bg-line sm:aspect-[2/1]" distance={32}>
              <Image
                src={article.image.url}
                alt={article.image.alt}
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover"
              />
            </Parallax>
          </Reveal>
        )}

        {/*
          Sanitised server-side before injection — see lib/sanitize.ts.
          Typography is applied via descendant selectors because the markup
          comes from the CMS and cannot carry our classes.
        */}
        <div
          className="mx-auto max-w-2xl
            [&>*+*]:mt-6
            [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[length:var(--text-display-sm)] [&_h2]:tracking-tight [&_h2]:text-ink
            [&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:tracking-tight [&_h3]:text-ink
            [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-muted sm:[&_p]:text-lg
            [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-4
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_li]:mt-2 [&_li]:text-base [&_li]:leading-relaxed [&_li]:text-muted
            [&_strong]:font-semibold [&_strong]:text-ink
            [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-6 [&_blockquote]:text-ink
            [&_img]:rounded-xl
            [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-ink [&_pre]:p-5 [&_pre]:text-sm [&_pre]:text-surface
            [&_code]:text-[0.9em]
            [&_table]:w-full [&_table]:text-left [&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_th]:text-sm [&_th]:text-ink
            [&_td]:border-b [&_td]:border-line [&_td]:py-2 [&_td]:text-sm [&_td]:text-muted"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="rule mx-auto mt-[var(--space-block)] max-w-2xl pt-8">
          <Link
            href="/insights"
            className="group inline-flex items-center gap-2 text-sm font-medium text-ink"
          >
            <ArrowRight className="rotate-180 group-hover:-translate-x-1" />
            All insights
          </Link>
        </div>
      </Section>

      {hasEvidence(others) && (
        <Section tone="paper" aria-labelledby="more-heading">
          <SectionHeader id="more-heading" eyebrow="More reading" title="Other articles." />

          <ul className="mt-[var(--space-block)] grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((a, i) => (
              <Reveal key={a.slug} as="li" delay={(i % 3) * 80}>
                <Link href={`/insights/${a.slug}`} className="group block">
                  {a.image && (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-line">
                      <Image
                        src={a.image.url}
                        alt={a.image.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                      />
                    </div>
                  )}
                  <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-ink">
                    {a.title}
                  </h3>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
