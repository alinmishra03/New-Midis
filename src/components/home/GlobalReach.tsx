import { GlobalReachMap } from "@/components/home/GlobalReachMap";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section } from "@/components/ui/Section";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { site } from "@/content/site";
import { PRESENCE_COUNTRIES } from "@/content/world-map";

/**
 * Global reach.
 *
 * The countries highlighted on the map, and the ones named in the copy, come
 * from PRESENCE_COUNTRIES — the list MIDIS confirmed on 2026-10-12. Section
 * text and map therefore cannot disagree with each other, and the count in
 * the supporting line is derived rather than typed.
 *
 * Still no counters and still no results: how many countries MIDIS works in
 * is a fact it told us, while anything about what the work achieved there
 * would need the evidence that content/evidence.ts is still waiting for.
 */

/* Small enough to spell out, and spelling it out keeps a figure from reading
   as a statistic. Derived from the list so the word cannot go stale. */
const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];

export function GlobalReach() {
  const countryCount = PRESENCE_COUNTRIES.length;
  const countWord = COUNT_WORDS[countryCount] ?? String(countryCount);
  return (
    <Section tone="ink" aria-labelledby="global-reach-heading">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20">
        {/* ------------------------------------------------------- copy */}
        <div className="max-w-xl">
          <Eyebrow tone="dark">Our global reach</Eyebrow>

          <h2
            id="global-reach-heading"
            className="mt-7 text-[length:var(--text-display-md)] text-surface"
          >
            <MaskedLines stagger={0.08}>Our Presence Goes Beyond Borders.</MaskedLines>
          </h2>

          <Reveal delay={90}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-surface/60 sm:text-lg">
              From India to the world, we collaborate with businesses across the United States,
              United Kingdom, Canada, and Australia, delivering digital experiences that make an
              impact.
            </p>

            <p className="rule-dark mt-8 flex items-center gap-3 pt-6 text-sm text-surface/50">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>
                Headquartered in {site.address.countryName}. Collaborating with clients across{" "}
                {countWord} countries.
              </span>
            </p>

            <div className="mt-9">
              <Button href="/contact" variant="primary" size="lg" magnetic trackAs="global_reach_contact">
                Let&apos;s Work Together
                <ArrowRight />
              </Button>
            </div>
          </Reveal>
        </div>

        {/* -------------------------------------------------------- map */}
        <Reveal delay={140} className="min-w-0">
          <GlobalReachMap />
        </Reveal>
      </div>
    </Section>
  );
}
