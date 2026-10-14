import { BrowserFrame } from "./BrowserFrame";
import { ExternalArrow } from "./ExternalArrow";
import { Reveal } from "@/components/ui/Reveal";
import type { FeaturedProject } from "@/content/featured-work";
import { cn } from "@/lib/utils";

/**
 * The featured work, as alternating editorial rows.
 *
 * Not a card grid. A grid of six equal tiles makes six screenshots compete
 * at thumbnail size; a row gives each project the full measure, which is the
 * only size at which a website preview is actually readable. Alternating the
 * side the preview sits on keeps six rows from reading as a list.
 *
 * EVERY ROW IS ONE LINK, AND IT GOES STRAIGHT TO THE LIVE SITE.
 *
 * There is no project page on this site to go to — by design, and the whole
 * row is the target rather than a "view" link at the end of it, so the
 * preview a visitor is looking at is the thing they can click. External, so
 * each one is marked up as leaving: new tab, `rel` set, and the destination
 * named in the accessible name rather than left to the arrow to imply.
 */
export function FeaturedProjects({ projects }: { projects: readonly FeaturedProject[] }) {
  return (
    <ul className="mt-[var(--space-block)] flex flex-col gap-10 lg:gap-14">
      {projects.map((project, i) => {
        /* The preview leads on the left for even rows and the right for odd
           ones. Below lg everything is one column and the preview always
           leads, because a stacked row that starts with text reads as a
           caption for the picture under it. */
        const previewRight = i % 2 === 1;

        return (
          <li key={project.slug}>
            <Reveal>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group grid items-center gap-8 rounded-2xl outline-none sm:gap-8 lg:grid-cols-2 lg:gap-12",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-8 focus-visible:ring-offset-paper",
                )}
              >
                {/* ------------------------------------------- preview */}
                <div className={cn("min-w-0", previewRight && "lg:order-2")}>
                  <BrowserFrame
                    src={project.preview}
                    alt={`${project.name} — homepage of the live site`}
                    host={project.host}
                    sizes="(min-width: 1024px) 44vw, 92vw"
                    className={cn(
                      "shadow-[0_30px_70px_-50px_rgb(23_25_28/0.5)]",
                      "transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                      "group-hover:-translate-y-1 group-hover:shadow-[0_40px_90px_-50px_rgb(23_25_28/0.55)]",
                    )}
                  >
                    {/* A warm wash on hover, so the preview responds without
                        the screenshot itself moving inside its frame. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-[var(--dur-base)] group-hover:bg-accent/[0.07]"
                    />
                  </BrowserFrame>
                </div>

                {/* ---------------------------------------------- text */}
                <div className={cn("min-w-0", previewRight && "lg:order-1")}>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    {project.category}
                  </p>

                  <h3 className="mt-5 text-[length:var(--text-display-sm)] leading-[1.05] tracking-[-0.03em] text-ink">
                    {project.name}
                  </h3>

                  <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    {project.summary}
                  </p>

                  <span className="mt-8 inline-flex items-center gap-2.5 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] group-hover:text-accent">
                    Visit {project.host}
                    <ExternalArrow />
                  </span>
                  {/* Says where the link goes and that it leaves the site.
                      The visible label above already names the host, so this
                      only adds what the arrow is standing in for. */}
                  <span className="sr-only"> (opens in a new tab)</span>
                </div>
              </a>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
