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
                  readers rather than read out as "middle dot". */}
              Web Design <span aria-hidden="true">·</span> Development{" "}
              <span aria-hidden="true">·</span> E-commerce{" "}
              <span aria-hidden="true">·</span> Digital Growth
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
            */
            className="mt-6 max-w-[24ch] sm:mt-8 text-[clamp(2.25rem,1rem+5.2vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.045em]"
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
              */}
              Launch Your Business in <span className="hero-mark">14 Days.</span> Not 14 Weeks.
            </MaskedLines>
          </h1>

          {/* Everything below the headline. Two columns from lg, with the
              showcase taking the second one. */}
          <div className="mt-7 grid gap-10 sm:mt-9 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:items-center lg:gap-16">
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
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:mt-6 sm:text-lg">
                  Build a powerful online presence with custom websites, Shopify stores, smart
                  digital experiences, and growth-focused solutions. From first idea to launch,
                  MIDIS helps ambitious brands move faster and grow smarter.
                </p>
              </div>

              {/* --------------------------------------------- CTAs */}
              <div
                data-hero-stagger
                style={delay(780)}
                className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center"
              >
                <Button href="/contact" variant="primary" size="lg" magnetic trackAs="hero_start_project">
                  Start Your Project
                  <ArrowRight />
                </Button>
                <Button href="/work" variant="outline" size="lg" trackAs="hero_explore_work">
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
                className="mt-9 flex flex-col gap-2.5 border-t border-line pt-7 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-2.5"
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
