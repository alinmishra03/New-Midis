import Image from "next/image";
import Link from "next/link";
import { RevealImage } from "@/components/motion/RevealImage";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { clientLogos, projects, results, testimonials, verifiedCounts } from "@/content/evidence";
import { hasEvidence } from "@/lib/utils";

/* ==========================================================================
   Evidence-gated homepage sections.

   Each returns null when its supporting content is absent. Nothing here
   degrades to placeholder copy, sample numbers or stock imagery — the audit
   found exactly that pattern on the old site and the report identifies it as
   the main reason the site fails to convert serious buyers.
   ========================================================================== */

/* ------------------------------------------------------------ §2 Trust */

export function TrustStrip() {
  const counts = [
    { value: verifiedCounts.projectsDelivered, label: "Projects delivered" },
    { value: verifiedCounts.yearsOperating, label: "Years operating" },
    { value: verifiedCounts.clientsServed, label: "Clients served" },
    { value: verifiedCounts.teamMembers, label: "People on the team" },
  ].filter((c): c is { value: number; label: string } => typeof c.value === "number");

  const logos = clientLogos.filter((l) => l.permissionOnFile);

  /*
   * A single headcount is not proof, and one lonely figure in a four-column
   * grid reads as an unfinished section. The strip appears only once there is
   * either a permitted client logo or at least two verified figures.
   */
  const countsWorthShowing = counts.length >= 2 ? counts : [];
  if (!hasEvidence(logos) && countsWorthShowing.length === 0) return null;

  return (
    <Section tone="surface" className="!py-10 lg:!py-14" aria-labelledby="trust-heading">
      <h2 id="trust-heading" className="sr-only">
        Clients and company facts
      </h2>

      {countsWorthShowing.length > 0 && (
        <Reveal className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {countsWorthShowing.map((c) => (
            <div key={c.label}>
              <p className="tabular font-display text-[length:var(--text-display-sm)] text-ink">
                {c.value}
              </p>
              <p className="mt-1 text-sm text-muted">{c.label}</p>
            </div>
          ))}
        </Reveal>
      )}

      {hasEvidence(logos) && (
        <Reveal className={countsWorthShowing.length > 0 ? "rule mt-[var(--space-block)] pt-[var(--space-block)]" : undefined}>
          <p className="mb-8 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Trusted by
          </p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-8">
            {logos.map((l) => (
              <li key={l.name}>
                <Image
                  src={l.logo}
                  alt={l.name}
                  width={160}
                  height={48}
                  className="h-8 w-auto opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </Section>
  );
}

/* ------------------------------------------------------- §4 Featured work */

export function FeaturedWork() {
  const featured = projects.slice(0, 9);
  if (!hasEvidence(featured)) return null;

  return (
    <Section tone="paper" aria-labelledby="work-heading">
      <SectionHeader
        id="work-heading"
        eyebrow="Selected work"
        title="Don't take our word for it. Look at what we built."
        action={
          <Button href="/work" variant="outline">
            View all projects
            <ArrowRight />
          </Button>
        }
      />

      <div className="mt-[var(--space-block)] grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 90}>
            <Link href={`/work/${p.slug}`} className="group block">
              {/* Fixed 16:10 across every card so the grid never jitters and
                  no project's interface gets cropped out of recognition. */}
              <RevealImage className="relative aspect-[16/10] rounded-xl bg-line">
                <Image
                  src={p.thumbnail}
                  alt={p.thumbnailAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-ink/0 transition-colors duration-[var(--dur-base)] group-hover:bg-ink/10"
                />
              </RevealImage>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">{p.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.summary}</p>
                </div>
                <ArrowRight className="mt-1.5 shrink-0 text-muted transition-colors group-hover:text-accent-ink" />
              </div>

              <p className="mt-3 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                {p.industry}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------- §5 Real results */

export function Results() {
  if (!hasEvidence(results)) return null;

  return (
    <Section tone="ink" aria-labelledby="results-heading">
      <SectionHeader
        id="results-heading"
        tone="dark"
        eyebrow="Real results"
        title="Beautiful is not enough."
        intro="Every figure below names the client, the starting point, the period it was measured over and how it was measured. If we can't show you that, we don't publish the number."
      />

      <div className="mt-[var(--space-block)] grid gap-px overflow-hidden rounded-xl bg-line-dark sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r, i) => (
          <Reveal key={`${r.client}-${r.label}`} delay={(i % 3) * 80} className="bg-ink p-5 sm:p-6">
            <p className="tabular font-display text-[length:var(--text-display-sm)] text-accent">
              {r.value}
            </p>
            <p className="mt-2 text-base font-medium text-surface">{r.label}</p>

            <dl className="mt-6 space-y-2 text-sm">
              {[
                ["Client", r.client],
                ["Industry", r.industry],
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

            <Link
              href={`/work/${r.caseStudy}`}
              className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent"
            >
              See the case study
              <ArrowRight />
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* --------------------------------------------------------- §10 Testimonials */

export function Testimonials() {
  if (!hasEvidence(testimonials)) return null;

  return (
    <Section tone="surface" aria-labelledby="testimonials-heading">
      <SectionHeader
        id="testimonials-heading"
        eyebrow="Client feedback"
        title="Real people. Real companies."
      />

      <div className="mt-[var(--space-block)] grid gap-8 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal
            key={`${t.name}-${t.company}`}
            delay={(i % 3) * 90}
            className="flex flex-col rounded-xl border border-line p-5 sm:p-6"
          >
            <blockquote className="flex-1 text-lg leading-relaxed text-ink">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <footer className="rule mt-8 flex items-center gap-4 pt-6">
              {t.photo && (
                <Image
                  src={t.photo}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm font-semibold text-ink">{t.name}</p>
                <p className="text-sm text-muted">
                  {t.role}, {t.company}
                </p>
              </div>
            </footer>
            {t.sourceUrl && (
              <a
                href={t.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs text-muted underline underline-offset-4 hover:text-ink"
              >
                Verified review
              </a>
            )}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
