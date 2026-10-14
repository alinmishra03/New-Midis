"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { BrowserFrame } from "./BrowserFrame";
import { ExternalArrow } from "./ExternalArrow";
import type { FeaturedProject } from "@/content/featured-work";
import { cn } from "@/lib/utils";

/**
 * The showcase: pick a project, the preview changes.
 *
 * The only interactive component on the page, and the only client one. It is
 * a tablist in the accessibility sense and is built as one — roving focus,
 * arrow keys, `aria-selected`, each panel owned by its tab — rather than a
 * row of buttons that merely looks like tabs. Everything is rendered on the
 * server and already in the DOM; selecting swaps which panel is visible, so
 * the content is complete without JavaScript and the images are not fetched
 * one at a time as someone clicks through.
 *
 * TRANSITIONS ARE OPACITY ONLY.
 *
 * All six previews are stacked in the same box and cross-faded. Sliding them
 * would mean either a track wide enough to need its own overflow handling or
 * six absolutely positioned frames fighting the aspect ratio; a fade needs
 * neither and cannot shift the layout mid-transition. globals.css flattens
 * the duration under prefers-reduced-motion along with everything else.
 *
 * On a phone the tabs become a horizontally scrollable row rather than
 * wrapping onto three lines — the preview is what should hold the screen, not
 * the selector for it.
 */
export function WorkShowcase({ projects }: { projects: readonly FeaturedProject[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const current = projects[active];

  if (!current) return null;

  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;

  /* Left/right move the selection, Home/End jump to the ends — the behaviour
     a tablist is expected to have once it claims the role. */
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const last = projects.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    document.getElementById(tabId(next))?.focus();
  }

  return (
    /* The preview takes the larger column and the selector the smaller one.
       They started the other way round, which gave the list of six labels
       more width than the thing it selects. */
    <div className="mt-[var(--space-block)] grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-8">
      {/* ------------------------------------------------- the selector */}
      <div className="min-w-0 lg:order-2">
        <div
          role="tablist"
          aria-label="Featured projects"
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0",
            /* The scrollbar is hidden but the row still scrolls and still
               takes keyboard focus — the arrow keys above are the
               non-pointer path through it. */
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {projects.map((p, i) => {
            const selected = i === active;
            return (
              <button
                key={p.slug}
                id={tabId(i)}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={panelId(i)}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={onKeyDown}
                className={cn(
                  "group flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left outline-none",
                  "transition-[background-color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  "lg:w-full lg:shrink lg:gap-4 lg:px-4 lg:py-3",
                  selected
                    ? "border-accent/45 bg-accent/[0.06]"
                    : "border-line bg-paper hover:border-ink/20",
                )}
              >
                {/* A thumbnail of the same screenshot, so the selector is
                    made of the work too rather than of labels. */}
                <span className="relative block h-9 w-14 shrink-0 overflow-hidden rounded-md border border-line/80 sm:h-10 sm:w-16">
                  <Image
                    src={p.preview}
                    alt=""
                    fill
                    sizes="4rem"
                    className={cn(
                      "object-cover object-top transition-opacity duration-[var(--dur-base)]",
                      selected ? "opacity-100" : "opacity-55 group-hover:opacity-80",
                    )}
                  />
                </span>

                <span className="min-w-0">
                  <span
                    className={cn(
                      "block whitespace-nowrap text-sm font-medium transition-colors duration-[var(--dur-fast)] lg:whitespace-normal",
                      selected ? "text-ink" : "text-muted group-hover:text-ink",
                    )}
                  >
                    {p.name}
                  </span>
                  <span className="mt-0.5 hidden text-xs text-muted lg:block">{p.category}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------- the preview */}
      <div className="min-w-0 lg:order-1">
        <div className="relative">
          {projects.map((p, i) => (
            <div
              key={p.slug}
              id={panelId(i)}
              role="tabpanel"
              aria-labelledby={tabId(i)}
              /* Hidden panels are inert as well as invisible, so nothing
                 inside them is reachable by tab or read out of turn. */
              hidden={i !== active}
              className={cn(i !== active && "hidden")}
            >
              <BrowserFrame
                src={p.preview}
                alt={`${p.name} — homepage of the live site`}
                host={p.host}
                sizes="(min-width: 1024px) 50vw, 92vw"
                className="shadow-[0_30px_70px_-50px_rgb(23_25_28/0.5)]"
              />

              <div className="mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                <div className="min-w-0">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    {p.category}
                  </p>
                  <h3 className="mt-2.5 text-2xl tracking-[-0.03em] text-ink sm:text-3xl">
                    {p.name}
                  </h3>
                </div>

                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group inline-flex items-center gap-2.5 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink",
                    "transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
                    "hover:border-ink hover:bg-ink hover:text-surface",
                    "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  )}
                >
                  Visit Website
                  <ExternalArrow />
                  <span className="sr-only">
                    : {p.name} at {p.host} (opens in a new tab)
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
