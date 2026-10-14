"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Button } from "@/components/ui/Button";
import { loadGsap } from "@/lib/gsap";
import { useAllowsMovement } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  activeCaseStudyIndustries,
  caseStudiesIn,
  clientFor,
  projectHref,
  type AnalyticsImage,
  type CaseStudyIndustry,
  type CaseStudyProject,
} from "@/content/case-studies";

/**
 * The interactive half of the case-study section.
 *
 * One panel, driven by data — not a panel per category. Changing the
 * category swaps the project set; changing the project swaps the content of
 * the same panel. Nothing about a project is written into this file, so
 * adding a real challenge, a real result or a real analytics screenshot is
 * an edit to content/case-studies.ts and nothing else.
 *
 * Accessibility follows the APG tabs pattern with automatic activation:
 * arrow keys move between categories and switch the panel as they go, Home
 * and End jump to the ends, and only the selected tab is in the tab
 * sequence, so Tab leaves the strip rather than walking seven buttons.
 *
 * The project selector inside the panel is deliberately NOT a second
 * tablist. Nested tablists are ambiguous to announce; a navigation group of
 * ordinary buttons marked with aria-current says the same thing plainly.
 */

/* ------------------------------------------------------------- icons */

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" />
      <path d="M7.5 15.5V12M12 15.5V8.5M16.5 15.5v-5" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 3H3.5A.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-3" />
      <path d="M9.5 2.5H13.5V6.5M13 3l-5.5 5.5" />
    </svg>
  );
}

/* --------------------------------------------------------- sub-panels */

/**
 * Labelled block of prose, or the pending state where MIDIS has not yet
 * supplied the detail. The pending state is visibly a pending state — a
 * dotted rule and muted italics — rather than filler that reads like fact.
 */
function Field({ label, value, pending }: { label: string; value: string | null; pending: string }) {
  return (
    <div>
      <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </h4>
      {value ? (
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{value}</p>
      ) : (
        <p className="mt-2 border-l-2 border-dotted border-line pl-3 text-[0.9375rem] italic leading-relaxed text-muted">
          {pending}
        </p>
      )}
    </div>
  );
}

/**
 * The analytics area.
 *
 * Projects without a report render the placeholder the brief describes.
 * Published ones show their screenshots: images keep their own aspect ratio, are contained
 * rather than cropped so axis labels survive, and open full-screen in a
 * native dialog — which brings the focus trap, Escape and focus restoration
 * with it instead of us reimplementing them.
 */
function Analytics({
  project,
  onOpen,
}: {
  project: CaseStudyProject;
  onOpen: (image: AnalyticsImage) => void;
}) {
  const published = project.analyticsStatus === "published" && project.analyticsImages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
          Performance insights
        </h4>
        {published && project.analyticsPeriod && (
          <p className="text-[0.6875rem] tracking-tight text-muted">{project.analyticsPeriod}</p>
        )}
      </div>

      {published ? (
        <>
          <ul
            className={cn(
              "mt-4 grid gap-3",
              project.analyticsImages.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1",
            )}
          >
            {project.analyticsImages.map((img) => (
              <li key={img.src}>
                <button
                  type="button"
                  onClick={() => onOpen(img)}
                  className="group/shot block w-full overflow-hidden rounded-lg border border-line bg-paper p-2 transition-colors duration-[var(--dur-fast)] hover:border-accent/50 focus-visible:border-accent/50"
                >
                  {/* contain, never cover — a cropped axis is a useless chart. */}
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    className="h-auto w-full rounded-md object-contain transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover/shot:scale-[1.015] motion-reduce:transition-none"
                  />
                  <span className="sr-only">View full size</span>
                </button>
                {img.caption && <p className="mt-1.5 text-xs text-muted">{img.caption}</p>}
              </li>
            ))}
          </ul>
          {project.analyticsSource && (
            <p className="mt-3 text-xs text-muted">Source: {project.analyticsSource}</p>
          )}
        </>
      ) : (
        /*
          Placeholder, not a mock dashboard. No numbers, no fake chart, no
          borrowed screenshot — a reserved frame that says what will go here.
        */
        <div className="mt-4 flex min-h-[13rem] max-h-[21rem] flex-1 items-center justify-center rounded-xl border border-dashed border-line bg-paper/80 px-6 py-10 sm:aspect-[16/10] sm:py-0">
          <div className="max-w-xs text-center">
            <ChartIcon className="mx-auto h-7 w-7 text-muted/55" />
            <p className="mt-4 text-sm font-medium tracking-tight text-ink-soft">
              Verified project analytics coming soon.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              We publish performance figures with their source and reporting period, or we don&apos;t
              publish them at all.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- panel */

function Panel({
  project,
  industryLabel,
  onOpenImage,
}: {
  project: CaseStudyProject;
  industryLabel: string;
  onOpenImage: (image: AnalyticsImage) => void;
}) {
  const href = projectHref(project);
  const client = clientFor(project);

  return (
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-8 lg:p-8">
      {/* ------------------------------------------------ the project */}
      <div className="flex min-w-0 flex-col">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent-ink">
          {industryLabel}
        </p>

        <h3 className="mt-3 text-[clamp(1.5rem,1.1rem+1.4vw,2.125rem)] font-semibold leading-[1.1] tracking-tight text-ink">
          {project.projectName}
        </h3>

        {/* The client's own description of itself. */}
        <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
          {project.profile}
        </p>

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.projectName} website — ${href.replace(/^https?:\/\//, "")} (opens in a new tab)`}
            className="group/url mt-3 inline-flex w-fit max-w-full items-center gap-1.5 text-sm text-accent-ink underline-offset-4 hover:underline"
          >
            <span className="truncate">{href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
            <ExternalIcon className="h-3.5 w-3.5 shrink-0" />
          </a>
        )}

        <div className="mt-7 grid gap-5 border-t border-line pt-7">
          <Field
            label="The challenge"
            value={project.challenge}
            pending="The client's brief for this project hasn't been published yet."
          />
          <Field
            label="Our approach"
            value={project.approach ?? project.services}
            pending="Scope is recorded with the client and published once they've approved the wording."
          />
          <div>
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Results
            </h4>
            {project.results.length > 0 ? (
              <ul className="mt-2 grid gap-1.5">
                {project.results.map((r) => (
                  <li key={r} className="text-[0.9375rem] leading-relaxed text-ink-soft">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 flex items-start gap-2 text-[0.9375rem] leading-relaxed text-muted">
                <span
                  aria-hidden="true"
                  className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60"
                />
                Reporting in progress — no figures published yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-1">
          {href ? (
            <Button
              href={href}
              variant="outline"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View the ${project.projectName} project (opens in a new tab)`}
              trackAs={`case-study-${project.slug}`}
            >
              View project
              <ArrowRight />
            </Button>
          ) : (
            /* No live site, so no link — a broken "View Project" costs more
               than the missing button does. */
            <p className="text-sm text-muted">
              {client.note ?? "This site isn't currently available to visit."}
            </p>
          )}
        </div>
      </div>

      {/* ---------------------------------------------- the analytics */}
      <div className="min-w-0 lg:border-l lg:border-line lg:pl-12">
        <Analytics project={project} onOpen={onOpenImage} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- explorer */

export function CaseStudyExplorer() {
  const industries = activeCaseStudyIndustries;
  const baseId = useId();
  const allowsMovement = useAllowsMovement();

  const [industry, setIndustry] = useState<CaseStudyIndustry>(industries[0].id);
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<AnalyticsImage | null>(null);

  const projects = caseStudiesIn(industry);
  /* Clamped rather than trusted: a category change resets the index in the
     same update, but clamping means no render can ever read past the end. */
  const project = projects[Math.min(index, projects.length - 1)];
  const industryLabel = industries.find((c) => c.id === industry)?.label ?? "";

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  /* The first paint is the section's own entrance; only later changes get
     the crossfade, otherwise the panel animates twice on arrival. */
  const settled = useRef(false);

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  const select = useCallback((id: CaseStudyIndustry) => {
    setIndustry(id);
    setIndex(0);
  }, []);

  /* ---- the content crossfade ---- */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (!settled.current) {
      settled.current = true;
      return;
    }
    if (!allowsMovement) return;

    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !panelRef.current) return;
      /* Opacity and a few pixels only. Animating height or position would
         move the CTA under the pointer mid-click and shift the page. */
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.42, ease: "expo.out", overwrite: "auto" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [allowsMovement, project.slug]);

  /* ---- full-screen image preview ---- */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (preview && !dialog.open) dialog.showModal();
    if (!preview && dialog.open) dialog.close();
  }, [preview]);

  function onTabKeyDown(e: React.KeyboardEvent, i: number) {
    const last = industries.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;

    e.preventDefault();
    select(industries[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mt-[var(--space-block)]">
      {/*
        ---------------------------------------------- category tabs

        These wrap rather than scroll. Seven categories measure 1161px and
        a 390px phone offers 350px, so a scroller would put five of them
        behind a gesture with no reliable way to signal it — a fade reads
        as nothing over a white pill on an off-white section. Two or three
        rows on a phone is the better trade.
      */}
      <div>
        <div role="tablist" aria-label="Project industries" className="flex flex-wrap gap-2">
          {industries.map((cat, i) => {
            const selected = cat.id === industry;
            return (
              <button
                key={cat.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={tabId(cat.id)}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(cat.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-5 text-sm font-medium tracking-tight",
                  "transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)]",
                  selected
                    ? "border-ink bg-ink text-surface"
                    : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------- featured panel */}
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(industry)}
        className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface"
      >
        {/* Project selector, only where the category holds more than one. */}
        {projects.length > 1 && (
          <nav
            aria-label={`Projects in ${industryLabel}`}
            className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6"
          >
            {projects.map((p, i) => {
              const current = p.slug === project.slug;
              return (
                <button
                  key={p.slug}
                  type="button"
                  aria-current={current ? "true" : undefined}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[0.8125rem] font-medium tracking-tight",
                    "transition-colors duration-[var(--dur-fast)]",
                    current
                      ? "bg-accent-soft text-accent-ink"
                      : "text-muted hover:bg-paper hover:text-ink",
                  )}
                >
                  {p.projectName}
                </button>
              );
            })}
          </nav>
        )}

        <div ref={panelRef}>
          <Panel project={project} industryLabel={industryLabel} onOpenImage={setPreview} />
        </div>
      </div>

      {/*
        Full-screen preview. Native <dialog> so the focus trap, Escape and
        focus restoration are the browser's. Inert until a project actually
        has screenshots.
      */}
      <dialog
        ref={dialogRef}
        className="shot-dialog"
        onClose={() => setPreview(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setPreview(null);
        }}
      >
        {preview && (
          <figure className="shot-dialog-panel">
            <Image
              src={preview.src}
              alt={preview.alt}
              width={preview.width}
              height={preview.height}
              sizes="95vw"
              className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
            <figcaption className="mt-3 text-sm text-muted">
              {preview.caption ?? preview.alt}
            </figcaption>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="mt-4 inline-flex h-10 items-center rounded-full border border-line px-5 text-sm font-medium text-ink hover:bg-paper"
            >
              Close
            </button>
          </figure>
        )}
      </dialog>
    </div>
  );
}
