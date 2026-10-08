import { MaskedLines } from "@/components/motion/MaskedLines";
import { ArrowRight, Button } from "@/components/ui/Button";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { HeroVisual } from "./HeroVisual";

/**
 * Hero.
 *
 * Copy, CTAs and structure are unchanged — this is a visual treatment only.
 * The headline now reveals line-by-line out of clipping masks, and the
 * supporting elements stagger in behind it.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-paper"
    >
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
          backgroundImage:
            "linear-gradient(to right, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "min(14vw, 11rem) 100%",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 60%, transparent)",
        }}
      />

      <div className="container-site relative">
        <div className="flex min-h-[calc(100svh-5rem)] flex-col justify-center pb-[44vh] pt-16 sm:pb-[46vh] lg:pb-[40vh] lg:pt-20">
          <div data-hero-stagger style={{ "--hero-delay": "80ms" } as React.CSSProperties} className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
              Website design &amp; development
            </p>
          </div>

          <h1
            id="hero-heading"
            className="mt-8 max-w-[18ch] text-[length:var(--text-display-xl)] font-semibold leading-[0.9] tracking-[-0.045em]"
          >
            <MaskedLines delay={0.15} stagger={0.09}>
              Digital experiences. Built to make business{" "}
              <span className="text-accent">move.</span>
            </MaskedLines>
          </h1>

          <div data-hero-stagger style={{ "--hero-delay": "620ms" } as React.CSSProperties}>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              We combine strategy, design, technology and digital growth to help ambitious
              businesses create stronger brands and better online experiences.
            </p>
          </div>

          <div data-hero-stagger style={{ "--hero-delay": "760ms" } as React.CSSProperties} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/contact" variant="primary" size="lg" magnetic trackAs="hero_start_project">
              Start your project
              <ArrowRight />
            </Button>
            <Button href="/work" variant="outline" size="lg" trackAs="hero_explore_work">
              Explore our work
            </Button>
          </div>
        </div>
      </div>

      <HeroVisual />

      {/* Scroll cue — decorative, with a travelling pulse down the line. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
      >
        <span className="text-[0.625rem] uppercase tracking-[0.25em] text-muted">Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-ink/12">
          <span className="absolute inset-x-0 top-0 h-4 animate-scroll-cue bg-accent" />
        </span>
      </div>
    </section>
  );
}
