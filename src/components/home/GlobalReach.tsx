import { GlobalReachMap } from "@/components/home/GlobalReachMap";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section } from "@/components/ui/Section";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { site } from "@/content/site";

/**
 * Global reach.
 *
 * The map carries no claim about where MIDIS's clients are, because there is
 * no verified data on that — content/evidence.ts is empty by design and
 * inventing markers or routes here would be fabricating exactly the kind of
 * proof the rest of the site refuses to fake. India is marked because the
 * registered address is a fact; everywhere else is simply the world.
 *
 * For the same reason there is no country count and no counter. The claim
 * being made is "we work across borders", which the copy states plainly and
 * the map illustrates.
 */
export function GlobalReach() {
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
            <MaskedLines stagger={0.08}>Based in India. Connected to the World.</MaskedLines>
          </h2>

          <Reveal delay={90}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-surface/60 sm:text-lg">
              Working across borders to bring thoughtful design, development, and digital
              solutions to businesses worldwide.
            </p>

            <p className="rule-dark mt-8 flex items-center gap-3 pt-6 text-sm text-surface/50">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>
                Studio in {site.address.locality}, {site.address.countryName} — set up for remote
                collaboration across time zones.
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
