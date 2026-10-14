import { BrowserFrame } from "./BrowserFrame";
import { ExternalArrow } from "./ExternalArrow";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PORTFOLIO_URL, portfolioPreview, portfolioProjectCount } from "@/content/featured-work";

/**
 * The gateway to the existing portfolio — the page's main conversion point.
 *
 * On ink rather than paper, which is the site's own way of marking a section
 * as the one that matters; the closing CTA uses the same tone, and these are
 * the only two on the page that do.
 *
 * The preview is a screenshot of the portfolio, not an iframe. An iframe
 * would be a third-party page rendering inside this one — slow, impossible
 * to make responsive at this size, and it would put someone else's scroll
 * area in the middle of the section. A still of it in the same browser frame
 * the rest of the page uses says the same thing and costs one image.
 */
export function PortfolioGateway() {
  return (
    <section
      aria-labelledby="portfolio-gateway-heading"
      className="relative isolate overflow-hidden bg-ink text-surface"
    >
      {/* The same accent wash the homepage's closing section uses, so the
          two read as the same kind of moment. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(circle, #EF8716 0%, transparent 70%)" }}
      />

      <div className="container-site relative py-[var(--space-section)]">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="min-w-0">
            <Reveal>
              <Eyebrow tone="dark">The full portfolio</Eyebrow>

              <h2
                id="portfolio-gateway-heading"
                className="mt-8 max-w-[14ch] text-[length:var(--text-display-lg)] leading-[0.95] tracking-[-0.04em] text-surface"
              >
                There&apos;s More to <span className="text-accent">Explore.</span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-surface/60 sm:text-lg">
                From custom websites and e-commerce experiences to thoughtfully designed digital
                platforms, discover more of the work we&apos;ve brought to life.
              </p>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  "group mt-10 inline-flex items-center gap-2.5 rounded-full bg-accent px-8 text-base font-medium tracking-tight text-ink " +
                  "h-14 max-sm:h-12 " +
                  "transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
                  "hover:bg-surface hover:text-ink active:scale-[0.98] " +
                  "focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                }
              >
                View Complete Portfolio
                <ExternalArrow />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>

              <p className="mt-6 text-sm text-surface/45">
                {portfolioProjectCount} projects, each with its own walkthrough.
              </p>
            </Reveal>
          </div>

          <Reveal delay={120} className="min-w-0">
            <BrowserFrame
              src={portfolioPreview.src}
              alt={portfolioPreview.alt}
              host={portfolioPreview.host}
              tone="dark"
              sizes="(min-width: 1024px) 48vw, 92vw"
              className="shadow-[0_40px_90px_-50px_rgb(0_0_0/0.8)]"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
