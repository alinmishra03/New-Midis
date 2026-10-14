import { ArrowRight, Button } from "@/components/ui/Button";
import { ExternalArrow } from "./ExternalArrow";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PORTFOLIO_URL } from "@/content/featured-work";

/**
 * Closing section.
 *
 * Deliberately a near-twin of FinalCta from components/home/Conversion rather
 * than a call to it: that component's second button is the strategy call, and
 * this page's second button is the portfolio. Giving FinalCta a prop for its
 * secondary action would change a component six other pages render, to serve
 * one page — so the one page carries its own, built from the same parts, with
 * the same tone, type scale and wash.
 */
export function WorkClosingCta() {
  return (
    /* The hairline and the shorter top padding are because of what sits
       above this: the portfolio gateway is also on ink, and two ink sections
       with full padding ran together into one undivided field of black about
       260px deep. The rule gives the boundary an edge and the padding stops
       doubling up on it. */
    <section
      aria-labelledby="work-closing-heading"
      className="relative isolate overflow-hidden border-t border-surface/10 bg-ink pt-20 text-surface lg:pt-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(circle, #EF8716 0%, transparent 70%)" }}
      />

      <div className="container-site relative pb-24 text-center lg:pb-36">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow tone="dark">What&apos;s next</Eyebrow>
          </div>

          <h2
            id="work-closing-heading"
            className="mx-auto mt-8 max-w-[16ch] text-[length:var(--text-display-lg)] text-surface"
          >
            Your Brand Could Be <span className="text-accent">Next.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/60 sm:text-lg">
            Have a project in mind? Let&apos;s build something that makes your business stand out.
          </p>

          <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact" variant="primary" size="lg" magnetic trackAs="work_start_project" className="max-sm:h-12">
              Start Your Project
              <ArrowRight />
            </Button>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={
                "group inline-flex items-center justify-center gap-2.5 rounded-full border border-surface/25 px-8 " +
                "h-14 max-sm:h-12 max-sm:w-full text-base font-medium tracking-tight text-surface " +
                "transition-[background-color,color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
                "hover:bg-surface hover:text-ink active:scale-[0.98] " +
                "focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              }
            >
              Explore Our Portfolio
              <ExternalArrow />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
