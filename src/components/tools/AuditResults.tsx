import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import type { AuditSuccess } from "@/lib/pagespeed";
import { hasEvidence } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Renders genuine Lighthouse output.
 *
 * Every number on this page came from Google. Nothing here is derived,
 * estimated or padded out — if Lighthouse didn't report it, it isn't shown.
 */

function scoreTone(score: number) {
  if (score >= 90) return { ring: "#1F7A4D", label: "Good" };
  if (score >= 50) return { ring: "#B4600A", label: "Needs work" };
  return { ring: "#B4231A", label: "Poor" };
}

function ScoreDial({ score, label }: { score: number; label: string }) {
  const tone = scoreTone(score);
  const circumference = 2 * Math.PI * 34;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-line)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={tone.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <span className="tabular absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold text-ink">
          {score}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-muted">{tone.label}</p>
    </div>
  );
}

const RATING_STYLES: Record<string, string> = {
  good: "text-[#1F7A4D]",
  "needs-improvement": "text-[#B4600A]",
  poor: "text-[#B4231A]",
  unknown: "text-muted",
};

export function AuditResults({ result }: { result: AuditSuccess }) {
  return (
    <>
      <Section tone="surface" className="!pt-0" aria-labelledby="scores-heading">
        <SectionHeader
          id="scores-heading"
          eyebrow={`Results — ${result.strategy}`}
          title="What Google found."
          intro={
            <>
              Analysed{" "}
              <span className="break-all font-medium text-ink">{result.finalUrl}</span> using
              Google PageSpeed Insights, which runs Lighthouse against the live page. These are
              Google&apos;s figures, not ours.
            </>
          }
        />

        <Reveal className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {result.categories.map((c) => (
            <ScoreDial key={c.id} score={c.score} label={c.label} />
          ))}
        </Reveal>

        {hasEvidence(result.metrics) && (
          <Reveal className="rule mt-14 pt-10">
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Core metrics
            </h3>
            <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {result.metrics.map((m) => (
                <div key={m.id} className="rule pt-4">
                  <dt className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-ink">{m.label}</span>
                    <span
                      className={cn("tabular text-base font-semibold", RATING_STYLES[m.rating])}
                    >
                      {m.display}
                    </span>
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted">{m.explanation}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </Section>

      {hasEvidence(result.opportunities) && (
        <Section tone="paper" aria-labelledby="opportunities-heading">
          <SectionHeader
            id="opportunities-heading"
            eyebrow="Opportunities"
            title="What Lighthouse flagged."
            intro="Specific issues Google identified on this page, ordered by estimated impact. These are its findings, reported as given."
          />

          <ul className="rule mt-12">
            {result.opportunities.map((o, i) => (
              <Reveal key={o.title} as="li" delay={Math.min(i, 5) * 50} className="border-b border-line py-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                  <h3 className="text-base font-medium text-ink">{o.title}</h3>
                  <span className="tabular shrink-0 text-sm font-semibold text-accent-ink">
                    {o.display}
                  </span>
                </div>
                {o.description && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                    {o.description}
                  </p>
                )}
              </Reveal>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
