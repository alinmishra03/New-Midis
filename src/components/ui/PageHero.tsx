import Link from "next/link";
import type { ReactNode } from "react";
import { AbstractVisual } from "@/components/ui/AbstractVisual";
import { HeroBackground, type HeroVariant } from "@/components/ui/HeroBackground";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { JsonLd, breadcrumbSchema, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Shared hero for inner pages.
 *
 * Renders visible breadcrumbs and the matching BreadcrumbList schema from the
 * same source, so the two can never drift apart.
 */
export function PageHero({
  eyebrow,
  headlineLines,
  accentWords,
  intro,
  crumbs,
  children,
  className,
  /** Seeds the generated artwork and hero background. Usually the page slug. */
  visualSeed,
  /** Chooses the hero background composition. */
  variant = "signal",
  keyword,
  aside,
}: {
  eyebrow: string;
  headlineLines: string[];
  accentWords?: string[];
  intro?: string;
  crumbs: Crumb[];
  children?: ReactNode;
  className?: string;
  visualSeed?: string;
  variant?: HeroVariant;
  /**
   * Search-intent phrase for the page (e.g. "Website Design Agency"). When
   * given, it replaces the eyebrow and is rendered INSIDE the h1, above the
   * display line, so the heading search engines read leads with what the
   * page is about while the visual hierarchy stays editorial.
   */
  keyword?: string;
  /** Right-hand visual. Switches the hero to a two-column layout on lg. */
  aside?: ReactNode;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-paper", className)}>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      {/* Cinematic generated background, seeded per page. */}
      <HeroBackground seed={visualSeed ?? crumbs[crumbs.length - 1]?.href ?? "midis"} variant={variant} />

      <div
        aria-hidden="true"
        className="accent-glow pointer-events-none absolute -top-40 right-[-12%] h-[30rem] w-[30rem] rounded-full opacity-[0.06] blur-3xl"
      />

      {/* Original generated artwork, seeded per page — see AbstractVisual. */}
      {visualSeed && !aside && (
        <AbstractVisual
          seed={visualSeed}
          className="absolute bottom-0 right-0 hidden h-[60%] w-[46%] opacity-70 lg:block"
        />
      )}

      <div className="container-site relative pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
            </li>
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-line">
                  /
                </span>
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="transition-colors hover:text-ink">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={cn(aside && "lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16")}>
          <div className="min-w-0">
            {!keyword && (
              <p className="mt-10 flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
                <span className="h-px w-8 bg-accent" aria-hidden="true" />
                {eyebrow}
              </p>
            )}

            <h1
              className={cn(
                "max-w-[20ch] font-semibold tracking-[-0.04em]",
                keyword ? "mt-10" : "mt-7",
                aside ? "text-[length:var(--text-display-md)] leading-[0.98]" : "text-[length:var(--text-display-lg)] leading-[0.92]",
              )}
            >
              {keyword && (
                <span className="mb-6 flex items-center gap-3 text-[0.75rem] font-semibold uppercase leading-snug tracking-[0.18em] text-accent-ink sm:text-[0.8125rem]">
                  <span className="h-px w-8 shrink-0 bg-accent" aria-hidden="true" />
                  {keyword}
                  {/* Keeps the two parts apart in the accessible name and the
                      text search engines read: "Keyword: Headline". */}
                  <span className="sr-only">: </span>
                </span>
              )}
              <MaskedLines>
                {/* Lines are joined and allowed to wrap naturally; MaskedLines
                    measures the rendered layout rather than assuming breaks.
                    Accent words keep their orange highlight. */}
                {headlineLines
                  .join(" ")
                  .split(" ")
                  .map((word, i, all) => {
                    const normalised = word.toLowerCase().replace(/[.,?]/g, "");
                    const isAccent = accentWords?.some(
                      (a) => a.toLowerCase().replace(/[.,?]/g, "") === normalised,
                    );
                    return (
                      <span key={i} className={isAccent ? "text-accent" : undefined}>
                        {word}
                        {i < all.length - 1 ? " " : ""}
                      </span>
                    );
                  })}
              </MaskedLines>
            </h1>

            {intro && (
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{intro}</p>
            )}

            {children}
          </div>

          {aside && <div className="mt-14 min-w-0 lg:mt-10">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
