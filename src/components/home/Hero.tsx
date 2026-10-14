import type { CSSProperties } from "react";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { ArrowRight, Button } from "@/components/ui/Button";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { HeroShowcase } from "./HeroShowcase";
import { HeroVisual } from "./HeroVisual";

/**
 * Hero.
 *
 * THE 14-DAY CLAIM
 *
 * The headline is the one MIDIS asked for. Nothing in this repository backs
 * a 14-day delivery promise, and the published FAQ in content/company.ts
 * says the opposite for most work: "A straightforward marketing website
 * typically runs from discovery to launch over a number of weeks;
 * e-commerce and custom application work takes longer."
 *
 * The brief anticipated that and said to qualify the claim rather than drop
 * it, so QUALIFIER below sits directly under the headline — not in a
 * footnote, not below the fold — and names what the 14 days covers. An
 * unqualified version would promise every e-commerce and custom build in a
 * fortnight, which the brief also rules out and which MIDIS would have to
 * honour. If MIDIS confirms a different eligible scope, that one line is the
 * only thing to change.
 *
 * LAYOUT
 *
 *   < lg   one column, with the growth-bar canvas as a band across the foot
 *          of the hero. That band and its paddings were tuned for the fold
 *          on a phone in an earlier pass and are untouched here.
 *   lg+    the headline still spans the full measure, and the supporting
 *          column sits beside the showcase. The canvas band is dropped at
 *          this width because the showcase carries the same growth motif —
 *          two of them would be competing for the same idea.
 */

/* Qualifies the headline. See the note above before editing. */
const QUALIFIER =
  "The 14-day timeline covers eligible starter website projects. Larger e-commerce and custom builds are scoped on their own timeline, and we tell you which yours is before you commit.";

const VALUE_POINTS = [
  "Fast & Focused Delivery",
  "Custom-Built Solutions",
  "Built for Business Growth",
];

function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="h-3.5 w-3.5 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 8.5 3.5 3.5L13 4.5" />
    </svg>
  );
}

/** Keeps the inline `--hero-delay` declarations readable below. */
const delay = (ms: number) => ({ "--hero-delay": `${ms}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-paper">
      {/* Cinematic generated background — the homepage gets the densest
          composition, with pointer parallax on capable devices. */}
      <HeroBackground seed="midis-home" variant="signal" />

      {/* Two offset accent washes give the background depth without colour
          dominating. Combined opacity stays under 12%. */}
      <div
        aria-hidden="true"
        className="accent-glow pointer-events-none absolute -top-32 right-[-10%] h-[36rem] w-[36rem] rounded-full opacity-[0.07] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="accent-glow pointer-events-none absolute left-[-15%] top-[30%] h-[28rem] w-[28rem] rounded-full opacity-[0.04] blur-3xl"
      />

      {/* Hairline grid: structure you feel rather than see. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage: "linear-gradient(to right, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "min(14vw, 11rem) 100%",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 60%, transparent)",
        }}
      />

      <div className="container-site relative">
        {/*
          The reserved band at the foot holds the growth canvas below lg. At
          44vh on a phone the fold landed where that canvas's bars are still
          only a few pixels tall, so the bottom third of the first screen read
          as blank — hence the much smaller reservation on mobile. From lg the
          showcase replaces the band, so the reservation goes with it.
        */}
        <div className="flex min-h-[calc(100svh-5rem-var(--announce-h))] flex-col justify-center pb-[24vh] pt-6 sm:pb-[40vh] sm:pt-16 lg:pb-16 lg:pt-20">
          {/* ----------------------------------------------- eyebrow */}
          <div data-hero-stagger style={delay(80)} className="flex items-center gap-3">
            <span className="h-px w-8 shrink-0 bg-accent" aria-hidden="true" />
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[0.6875rem] sm:tracking-[0.2em]">
              {/* Separators are decorative, so they are hidden from screen
                  readers rather than read out as "middle dot".

                  THE TWO GROUPS ARE THE MOBILE LINE BREAK.

                  The four terms are one run of text, and below sm the measure
                  is too narrow for them: 236px at 320px against a line that
                  wants 414. The greedy wrapper took the only break point it
                  could reach, which is the hyphen in "E-commerce" — so the
                  line ended "E-" and the next began "commerce". From 390 it
                  kept the word whole but ended the line on a dangling
                  separator and left "Digital Growth" alone underneath.

                  Holding each pair together puts the break between them
                  instead: two terms per line, no hyphen break, nothing
                  orphaned. The middle separator is dropped below sm because
                  the line break is already doing its job, and a trailing "·"
                  at the end of the first line reads as a mistake.

                  Each group is a block below sm rather than relying on the
                  wrap, because the separator is hidden by a breakpoint and the
                  wrap is decided by text metrics, and the two disagreed: from
                  about 500px the run fits on one line again, and it rendered
                  as "Development E-commerce" with the dot missing. A block
                  makes the two lines certain wherever the hidden separator is,
                  so the pair cannot come apart — and it does not depend on how
                  wide the font happens to measure.

                  All three are max-sm only. From sm the whole run fits on one
                  line with room to spare (472px of text in 538px at 640), so
                  above the breakpoint this renders exactly as it did. */}
              <span className="max-sm:block max-sm:whitespace-nowrap">
                Web Design <span aria-hidden="true">·</span> Development
              </span>{" "}
              <span aria-hidden="true" className="max-sm:hidden">
                ·
              </span>{" "}
              <span className="max-sm:block max-sm:whitespace-nowrap">
                E-commerce <span aria-hidden="true">·</span> Digital Growth
              </span>
            </p>
          </div>

          {/* ---------------------------------------------- headline */}
          <h1
            id="hero-heading"
            /*
              Its own clamp rather than --text-display-xl. That token is
              sized for a shorter headline; this one is 46 characters, and at
              display-xl it set five lines on a 320px screen and pushed both
              CTAs below the fold — on the page whose job is converting. This
              curve holds it to three lines on a phone and two on a desktop,
              and still caps far above every other heading on the site.

              THE SECOND CLAMP IS THE PHONE, AND IT IS SIZED BY THE LONGEST
              PHRASE RATHER THAN BY TASTE.

              The base curve bottoms out at 36px, which was reading a size
              too large on a phone and, at 320px, broke to four lines with
              "Weeks." alone on the last. The mobile curve runs 28px at 320
              to 36px at 430 and holds 36 from there to the sm step.

              Its floor is set by "Launch Your Business", which the wrappers
              below hold on one line: that phrase is 9.2x the font size, and
              the measure at 320px is 280px, so 30px would leave 4px spare
              and clip the moment a fallback font is a few percent wide.
              28px leaves 22px, about 8%, which a metric-matched fallback
              fits inside. From 360px up the curve is back above 30px, so
              only the narrowest screen pays for the margin.
            */
            className="mt-6 max-w-[24ch] max-sm:mt-4 sm:mt-8 text-[clamp(2.25rem,1rem+5.2vw,6.5rem)] max-sm:text-[clamp(1.75rem,0.296rem+7.27vw,2.25rem)] font-semibold leading-[0.92] tracking-[-0.045em]"
          >
            <MaskedLines delay={0.15} stagger={0.09}>
              {/*
                No `text-accent` here: .hero-mark sets the colour itself, so
                the same rule owns both the resting colour and the reveal.

                The full stop is INSIDE the span on purpose. MaskedLines
                wraps every word in an inline-block, so a stop left outside
                became its own word box with a legal break before it — and at
                390px the line duly began ". Not 14 Weeks." Keeping it with
                "Days" removes the break opportunity; the cost is a two-pixel
                orange dot.

                THE PHRASE WRAPPERS ARE THE LINE BREAKS, BELOW sm ONLY.

                `text-wrap: balance` on the global h1 rule cannot do this job
                here: MaskedLines turns every word into an inline-block, and
                the balancer does not reach across those, so the headline
                falls back to a greedy wrap. Greedy gave "Launch Your" on a
                half-empty first line from 360 up, and orphaned "Weeks." on a
                fourth line at 320.

                Holding each phrase together instead puts the break where the
                sentence already turns, and lands the contrast the headline is
                making — "in 14 Days." against "Not 14 Weeks." — on two
                consecutive lines. Only below sm: above it the measure is wide
                enough that the original wrap is what renders, and nothing
                about the desktop headline changes.

                Each phrase must still fit the measure on its own, since
                nowrap removes its internal break points. The longest is
                "Launch Your Business", which is checked at 320px — the
                narrowest width the site targets — in the mobile clamp above.
              */}
              <span className="max-sm:whitespace-nowrap">Launch Your Business</span>{" "}
              <span className="max-sm:whitespace-nowrap">
                in <span className="hero-mark">14 Days.</span>
              </span>{" "}
              <span className="max-sm:whitespace-nowrap">Not 14 Weeks.</span>
            </MaskedLines>
          </h1>

          {/* Everything below the headline. Two columns from lg, with the
              showcase taking the second one. */}
          <div className="mt-7 max-sm:mt-5 grid gap-10 sm:mt-9 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:items-center lg:gap-16">
            <div>
              {/* -------------------------------------- the qualifier */}
              <div data-hero-stagger style={delay(560)}>
                <p className="flex max-w-xl gap-2.5 text-[0.8125rem] leading-relaxed text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span>{QUALIFIER}</span>
                </p>
              </div>

              {/* ------------------------------------- the subheading */}
              <div data-hero-stagger style={delay(660)}>
                {/* 15px/1.55 below sm. At 16px/1.625 the paragraph set five
                    lines on every phone width and carried the most vertical
                    weight of anything under the headline, which is what made
                    the CTAs sit so low. The size step is small enough that
                    the measure barely changes — it buys back the height from
                    the leading, not from re-wrapping the text. */}
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted max-sm:text-[0.9375rem] max-sm:leading-[1.55] sm:mt-6 sm:text-lg">
                  Build a powerful online presence with custom websites, Shopify stores, smart
                  digital experiences, and growth-focused solutions. From first idea to launch,
                  MIDIS helps ambitious brands move faster and grow smarter.
                </p>
              </div>

              {/* --------------------------------------------- CTAs */}
              <div
                data-hero-stagger
                style={delay(780)}
                className="mt-8 max-sm:mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center"
              >
                {/* 48px below sm rather than the 56px of `size="lg"`. The
                    column already stretches both to the same full width, so
                    only the height needed bringing down — 56px on a stacked
                    pair reads as two slabs, and 48 is still comfortably above
                    the 44px touch minimum. Everything else about the buttons,
                    including the magnetism and the hover swap, is the size
                    they already were. */}
                <Button href="/contact" variant="primary" size="lg" magnetic trackAs="hero_start_project" className="max-sm:h-12">
                  Start Your Project
                  <ArrowRight />
                </Button>
                <Button href="/work" variant="outline" size="lg" trackAs="hero_explore_work" className="max-sm:h-12">
                  Explore Our Work
                  <ArrowRight />
                </Button>
              </div>

              {/* --------------------------------------- value strip */}
              {/*
                Three statements about how MIDIS works, not three claims
                about results. No figures, because none are verified — see
                content/evidence.ts.
              */}
              <ul
                data-hero-stagger
                style={delay(900)}
                /* Below sm the rule sat 36px under the CTAs and 28px above
                   the first item, 64px of clear space that detached the strip
                   from the hero it belongs to. 24 above and 20 below keeps the
                   separator but closes the gap and leans it towards the items
                   it introduces. */
                className="mt-9 max-sm:mt-6 flex flex-col gap-2.5 border-t border-line pt-7 max-sm:pt-5 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-2.5"
              >
                {VALUE_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-ink/75">
                    <Tick />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop only. On a phone the canvas band below is the visual,
                and a second composition would push the CTAs past the fold. */}
            <div data-hero-stagger style={delay(840)} className="hidden lg:block">
              <HeroShowcase />
            </div>
          </div>
        </div>
      </div>

      {/* The growth band. Hidden from lg, where the showcase carries it. */}
      <HeroVisual className="lg:hidden" />

      {/* Scroll cue — decorative, with a travelling pulse down the line. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex lg:bottom-4"
      >
        <span className="text-[0.625rem] uppercase tracking-[0.25em] text-muted">Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-ink/12">
          <span className="absolute inset-x-0 top-0 h-4 animate-scroll-cue bg-accent" />
        </span>
      </div>
    </section>
  );
}
