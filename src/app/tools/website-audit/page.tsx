import { Suspense } from "react";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { TrackView } from "@/components/analytics/Track";
import { AuditResults } from "@/components/tools/AuditResults";
import { ArrowRight, Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { site } from "@/content/site";
import { runAudit, type AuditStrategy } from "@/lib/pagespeed";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Free Website Growth Audit",
  description:
    "Run a free, genuine audit of your website — performance, accessibility, SEO fundamentals and best practices, measured by Google Lighthouse. No invented scores.",
  path: "/tools/website-audit",
});

function AuditForm({ defaultUrl, strategy }: { defaultUrl?: string; strategy?: AuditStrategy }) {
  return (
    /* Plain GET form: fully functional with JavaScript disabled, and the
       resulting URL is shareable. */
    <form action="/tools/website-audit" method="get" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="url" className="sr-only">
            Your website address
          </label>
          <input
            id="url"
            name="url"
            type="text"
            inputMode="url"
            required
            defaultValue={defaultUrl}
            placeholder="yourcompany.com"
            autoComplete="url"
            className="h-14 w-full rounded-full border border-line bg-surface px-6 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus-visible:outline-none"
          />
        </div>
        <Button type="submit" variant="primary" size="lg">
          Run the audit
          <ArrowRight />
        </Button>
      </div>

      <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <legend className="sr-only">Device to test</legend>
        {(["mobile", "desktop"] as const).map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm text-muted">
            <input
              type="radio"
              name="strategy"
              value={s}
              defaultChecked={(strategy ?? "mobile") === s}
              className="h-4 w-4 accent-[#EF8716]"
            />
            <span className="capitalize">{s}</span>
          </label>
        ))}
        <span className="text-xs text-muted">Analysis takes up to a minute.</span>
      </fieldset>
    </form>
  );
}

/** Honest failure state. Never substitutes estimated numbers for real ones. */
function AuditFallback({ reason, retryable, url }: { reason: string; retryable: boolean; url?: string }) {
  return (
    <Section tone="surface" className="!pt-0" aria-labelledby="fallback-heading">
      <Reveal className="mx-auto max-w-2xl rounded-2xl border border-line bg-paper p-8 lg:p-12">
        <h2 id="fallback-heading" className="text-2xl tracking-tight text-ink">
          We couldn&apos;t complete that audit.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">{reason}</p>

        <p className="mt-6 text-base leading-relaxed text-muted">
          We won&apos;t show you estimated scores in place of real ones. If the automated check
          can&apos;t run, we&apos;ll do it by hand instead — send us the address and we&apos;ll
          review performance, accessibility, SEO fundamentals and the conversion path
          ourselves, then write back with what we find.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            href={`/contact?${new URLSearchParams({ ...(url ? { site: url } : {}) }).toString()}`}
            variant="primary"
            size="lg"
          >
            Request a manual audit
            <ArrowRight />
          </Button>
          {retryable && (
            <Button href="/tools/website-audit" variant="outline" size="lg">
              Try again
            </Button>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

async function AuditRunner({ url, strategy }: { url: string; strategy: AuditStrategy }) {
  const result = await runAudit(url, strategy);

  if (!result.ok) {
    return <AuditFallback reason={result.reason} retryable={result.retryable} url={url} />;
  }
  return (
    <>
      <TrackView event="audit_submit" params={{ outcome: "success", strategy }} />
      <AuditResults result={result} />
    </>
  );
}

function Skeleton() {
  return (
    <Section tone="surface" className="!pt-0">
      <div className="mx-auto max-w-2xl text-center" role="status" aria-live="polite">
        <div
          aria-hidden="true"
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent"
        />
        <p className="mt-6 text-base text-ink">Running Lighthouse against your site…</p>
        <p className="mt-2 text-sm text-muted">
          Google is loading the page and measuring it properly. This usually takes 20–60 seconds.
        </p>
      </div>
    </Section>
  );
}

export default async function WebsiteAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; strategy?: string }>;
}) {
  const { url, strategy: rawStrategy } = await searchParams;
  const strategy: AuditStrategy = rawStrategy === "desktop" ? "desktop" : "mobile";
  const hasQuery = Boolean(url?.trim());

  return (
    <>
      <PageHero
        eyebrow="Free website growth audit"
        headlineLines={["Is your website", "helping your", "business grow?"]}
        accentWords={["grow?"]}
        intro="Enter your address and we'll run Google Lighthouse against your live site — real performance, accessibility, SEO and best-practice scores, with the specific issues it finds."
        crumbs={[
          { label: "Free Website Audit", href: "/tools/website-audit" },
        ]}
      >
        <div className="mt-10 max-w-2xl">
          <AuditForm defaultUrl={url} strategy={strategy} />
        </div>
      </PageHero>

      {hasQuery ? (
        <Suspense key={`${url}-${strategy}`} fallback={<Skeleton />}>
          <AuditRunner url={url!} strategy={strategy} />
        </Suspense>
      ) : (
        <Section tone="surface" className="!pt-0" aria-labelledby="what-heading">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeader
                id="what-heading"
                eyebrow="What you get"
                title="Real measurements, not a sales pitch."
              />
              <StaggerGroup as="ul" step={70} className="mt-10 space-y-5">
                {[
                  {
                    title: "Performance",
                    body: "Largest Contentful Paint, layout shift and blocking time — the metrics that decide whether visitors wait or leave.",
                  },
                  {
                    title: "Accessibility",
                    body: "Issues that genuinely exclude people: contrast failures, unlabelled controls, broken focus order.",
                  },
                  {
                    title: "SEO fundamentals",
                    body: "Whether your pages can be crawled, understood and indexed properly in the first place.",
                  },
                  {
                    title: "Best practices",
                    body: "Security, deprecated APIs and the technical hygiene that quietly degrades a site over time.",
                  },
                ].map((item) => (
                  <li key={item.title} className="rule pt-5">
                    <h3 className="text-lg font-semibold tracking-tight text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                  </li>
                ))}
              </StaggerGroup>
            </div>

            <Reveal delay={120} className="lg:pt-16">
              <div className="rounded-2xl border border-line bg-paper p-8">
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  Where these numbers come from
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  We call Google&apos;s PageSpeed Insights API, which runs Lighthouse against your
                  live page. You see exactly what Google reports — the same data you&apos;d get
                  running it yourself.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  We don&apos;t estimate scores, invent issue counts, or project traffic and
                  revenue figures we have no way of knowing. If the check can&apos;t run, we say
                  so and offer to audit your site by hand instead.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  A Lighthouse score is a starting point, not a verdict. It measures how the page
                  is built — not whether it says the right things to the right people. That part
                  needs a human, and we&apos;re happy to do it.
                </p>
                <p className="mt-6 text-sm leading-relaxed text-muted">
                  Questions?{" "}
                  <a
                    href={`mailto:${site.email}`}
                    className="text-accent-ink underline underline-offset-4"
                  >
                    {site.email}
                  </a>
                </p>
              </div>
            </Reveal>
          </div>
        </Section>
      )}
    </>
  );
}
