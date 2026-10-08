import { Suspense } from "react";
import { WorkGrid } from "@/components/work/WorkGrid";
import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { projects } from "@/content/evidence";
import { activeCategories, hasPortfolio } from "@/content/work";
import { buildMetadata } from "@/lib/seo";

/**
 * Noindexed while the portfolio is empty. An indexed page announcing that
 * there is no work to show is worse than no page at all — and the moment
 * real projects land it becomes indexable automatically.
 */
export const metadata = buildMetadata({
  title: "Our Work",
  description:
    "Selected projects from MIDIS — websites, e-commerce builds, web applications, branding and growth work, with the thinking behind each one.",
  path: "/work",
  noIndex: !hasPortfolio,
});

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Selected work"
        headlineLines={
          hasPortfolio
            ? ["Don't take our word", "for it. Look at", "what we built."]
            : ["The work,", "properly documented."]
        }
        accentWords={["built.", "documented."]}
        intro={
          hasPortfolio
            ? "A selection of projects, each with the business problem it solved and what changed as a result."
            : undefined
        }
        visualSeed="work"
        variant="weave"
crumbs={[{ label: "Our Work", href: "/work" }]}
      />

      <Section tone="surface" className="!pt-0" aria-labelledby="work-heading">
        <h2 id="work-heading" className="sr-only">
          Projects
        </h2>

        {hasPortfolio ? (
          <Suspense fallback={null}>
            <WorkGrid projects={projects} categories={activeCategories()} />
          </Suspense>
        ) : (
          /*
           * Honest empty state.
           *
           * The alternative — placeholder projects, stock imagery or
           * "Client A" case studies — is exactly what the audit found on the
           * previous site and what the report identifies as the reason
           * serious buyers don't convert. We would rather say plainly that
           * the case studies are being written than fabricate them.
           */
          <Reveal className="mx-auto max-w-2xl rounded-2xl border border-line bg-paper p-10 text-center lg:p-14">
            <h3 className="text-2xl tracking-tight text-ink">
              Our case studies are being written properly.
            </h3>
            <p className="mt-5 text-base leading-relaxed text-muted">
              We&apos;re documenting completed projects with the client, the brief, the work and
              the measured outcome — rather than publishing a wall of screenshots with nothing
              behind them. They&apos;ll appear here as each one is confirmed.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              In the meantime, we&apos;re happy to walk you through relevant work directly and
              introduce you to the clients involved.
            </p>
          </Reveal>
        )}
      </Section>

      <CtaBand
        eyebrow={hasPortfolio ? "Your project next" : "Ask us directly"}
        title={
          hasPortfolio
            ? "Let's create one we're both proud of."
            : "Ask to see work relevant to your project."
        }
        body={
          hasPortfolio
            ? "Tell us where the business is now and what the site needs to achieve."
            : "Tell us what you're planning and we'll show you the most relevant things we've built, and put you in touch with the clients behind them."
        }
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "Book a strategy call", href: "/contact/call" }}
      />
    </>
  );
}
