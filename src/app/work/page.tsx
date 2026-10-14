import Link from "next/link";
import { ArrowRight, Button } from "@/components/ui/Button";
import { ExternalArrow } from "@/components/work/ExternalArrow";
import { FeaturedProjects } from "@/components/work/FeaturedProjects";
import { PortfolioGateway } from "@/components/work/PortfolioGateway";
import { WorkClosingCta } from "@/components/work/WorkClosingCta";
import { WorkHeroStack } from "@/components/work/WorkHeroStack";
import { WorkShowcase } from "@/components/work/WorkShowcase";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PORTFOLIO_URL, featuredProjects } from "@/content/featured-work";
import { buildMetadata } from "@/lib/seo";

/**
 * /work — the landing page in front of the portfolio.
 *
 * WHAT THIS PAGE IS FOR.
 *
 * The portfolio is a separate site and already holds the projects. This page
 * is the step before it: it introduces the work, shows a few of them
 * properly, and then sends a visitor to one of two places — the portfolio,
 * or the live site of a project they just looked at. It is not a second
 * portfolio and it does not try to be; there are no project pages here and
 * nothing under /work/ is linked from it.
 *
 * WHY IT REPLACED THE EMPTY STATE.
 *
 * What was here before said the case studies were being written, which was
 * true and is still true — documented case studies need client sign-off,
 * baselines and measurement, and content/evidence.ts is still empty because
 * none of that is verified yet. None of it is implied here either: this page
 * shows what the work looks like and links to it running, and claims no
 * outcome for any of it. The two are different promises and only the second
 * one can be kept today.
 *
 * EVERY PROJECT LINK LEAVES THE SITE.
 *
 * That is the point of the page, so it is consistent: featured rows, the
 * showcase and both portfolio buttons all open in a new tab, all carry
 * `rel="noopener noreferrer"`, and all say where they are going in their
 * accessible name. See content/featured-work.ts for how each URL was
 * verified and why these six.
 */

export const metadata = buildMetadata({
  /*
   * The brief suggested "MIDIS Projects & Our Work | Web Development &
   * Digital Solutions". The root layout appends "| MIDIS" to every title, so
   * that would have rendered the brand at both ends of an 87-character
   * string. Same keywords, brand once, and 65 characters rendered — which is
   * about what a result actually shows.
   */
  title: "Our Work & Projects | Web Development & Digital Solutions",
  description:
    "Explore selected MIDIS projects, including custom websites, Shopify stores, and digital experiences. Discover our complete portfolio and see what we can build for your business.",
  path: "/work",
});

/** The hero's stack reads back-to-front, so the subject is first. */
const HERO_STACK = featuredProjects.slice(0, 3);

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Our work"
        headlineLines={["Our Work.", "Real Impact."]}
        accentWords={["Impact."]}
        intro="Every project is an opportunity to create something meaningful. Explore the digital experiences, websites, and solutions we've built for ambitious brands."
        visualSeed="work"
        variant="weave"
        crumbs={[{ label: "Our Work", href: "/work" }]}
        aside={<WorkHeroStack projects={HERO_STACK} />}
      >
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={
              "group inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-accent px-8 " +
              "max-sm:h-12 text-base font-medium tracking-tight text-ink " +
              "transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
              "hover:bg-ink hover:text-surface active:scale-[0.98] " +
              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            }
          >
            Explore Our Complete Portfolio
            <ExternalArrow />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>

          {/*
            An anchor, not a scroll handler. The browser's own
            same-page navigation moves focus as well as the viewport, and
            `scroll-behavior: smooth` is already set globally in globals.css —
            so this is smooth, keyboard-correct and works before hydration,
            which a click handler calling scrollIntoView would not be.
          */}
          <Button href="#featured-work" variant="outline" size="lg" className="max-sm:h-12">
            See Featured Projects
            <ArrowRight />
          </Button>
        </div>
      </PageHero>

      {/* ------------------------------------------------ featured work */}
      <Section id="featured-work" tone="surface" aria-labelledby="featured-work-heading">
        <SectionHeader
          id="featured-work-heading"
          eyebrow="Selected work"
          title={
            <>
              Selected Work. Built With <span className="text-accent">Purpose.</span>
            </>
          }
          intro="A few of the projects behind the portfolio, each one live and open to visit. Click any of them to see the site itself rather than a write-up of it."
        />

        <FeaturedProjects projects={featuredProjects} />
      </Section>

      {/* --------------------------------------------------- showcase */}
      <Section tone="paper" aria-labelledby="showcase-heading">
        <SectionHeader
          id="showcase-heading"
          eyebrow="The MIDIS showcase"
          title={
            <>
              Ideas Into Digital <span className="text-accent">Experiences.</span>
            </>
          }
          intro="Pick a project to bring it up, then visit it running. Same six projects, shown one at a time."
        />

        <WorkShowcase projects={featuredProjects} />
      </Section>

      {/* ---------------------------------------- the portfolio itself */}
      <PortfolioGateway />

      {/* ------------------------------------------------- closing CTA */}
      <WorkClosingCta />

      {/* A plain path back into the site for anyone who reached the foot of
          the page without taking either CTA. */}
      <Section tone="surface" className="!py-14">
        <Reveal className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
          <span>Looking for something specific?</span>
          {[
            { href: "/services", label: "What we do" },
            { href: "/process", label: "How we work" },
            { href: "/contact", label: "Talk to us" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </Reveal>
      </Section>
    </>
  );
}
