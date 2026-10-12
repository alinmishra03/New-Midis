"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { ArrowRight, Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Service cards with a plan-details dialog.
 *
 * WHY A DIALOG AND NOT A PRICING PAGE
 *
 * There is no pricing route on this site and no verified rate to build one
 * from (see content/pricing.ts). "View Plans" therefore opens the scope that
 * IS verified — the deliverables, the audience and the problem each service
 * addresses, all read from the same catalogue the service pages render — and
 * links through to the full page. No invented Basic / Standard / Premium
 * tiers, and no button that goes nowhere.
 *
 * WHY ONE DIALOG FOR EIGHT CARDS
 *
 * Eight panels of service copy in the homepage markup would duplicate the
 * service pages' own content on the page that competes with them, which is
 * the one thing §9 of the brief rules out. One dialog, populated from the
 * active card, keeps the homepage carrying the summaries only. The crawlable
 * route to the detail is the link on every card heading, so nothing of value
 * depends on the dialog opening.
 *
 * WHY THE NATIVE <dialog>
 *
 * `showModal()` gives the focus trap, Escape-to-close, background inertness,
 * focus restoration to the invoking button and top-layer stacking from the
 * browser rather than from code — four of the brief's accessibility
 * requirements that hand-rolled modals routinely get subtly wrong. What it
 * does not do is stop the page behind it scrolling, so that part is handled
 * below, with the scrollbar width compensated so locking it cannot shift the
 * layout.
 */

export interface PricingCard {
  slug: string;
  title: string;
  /** Catalogue group label, e.g. "E-commerce". */
  group: string;
  /** The business problem, in the client's language. */
  problem: string;
  summary: string;
  deliverables: readonly string[];
  audience: string;
  /**
   * A formatted, verified starting price, or null when none is published —
   * which is every service today. Never a placeholder figure.
   */
  price: string | null;
  contactHref: string;
}

/** How many deliverables the card shows before the dialog shows the rest. */
const DELIVERABLES_ON_CARD = 3;

const PRICE_FALLBACK = "Custom Quote";

/** Exit animation length. Must match --plan-dialog-exit in globals.css. */
const EXIT_MS = 180;

const labelClass = "text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted";

function Tick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={cn("mt-[0.3rem] h-3 w-3 shrink-0 text-accent", className)}
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

export function PricingGrid({ cards }: { cards: readonly PricingCard[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<PricingCard | null>(null);

  /*
   * Opening is split across a render: the card goes into state first so the
   * panel has content, and the dialog is shown from this effect once it is
   * there. Calling showModal() straight from the click handler would open an
   * empty panel for one frame.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !active) return;

    if (!dialog.open) dialog.showModal();

    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    /* Removing the scrollbar widens the page by its width. Replacing it with
       padding keeps every fixed and centred element exactly where it was. */
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [active]);

  /*
   * Escape and the browser's own dismissal both fire `close`, so state is
   * synced from the event rather than from each call site.
   */
  function handleClose() {
    const dialog = dialogRef.current;
    if (dialog) delete dialog.dataset.closing;
    setActive(null);
  }

  /** Plays the exit animation, then closes for real. */
  function requestClose() {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) return;
    /* A second click while the first exit is running must not queue another
       timer, or `close()` lands after the dialog has already reopened. */
    if (dialog.dataset.closing) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      return;
    }

    dialog.dataset.closing = "true";
    window.setTimeout(() => {
      if (dialog.dataset.closing) dialog.close();
    }, EXIT_MS);
  }

  return (
    <>
      <StaggerGroup
        as="ul"
        step={60}
        shift="1.5rem"
        /*
         * Two columns from 640px, four from 1280px. Eight cards divide evenly
         * into both, so no breakpoint ever leaves a half-empty final row —
         * which a three-column step would, at 3 + 3 + 2. Between 1024px and
         * 1280px that means two generous columns rather than four cramped
         * ones; a 230px card cannot hold a heading, a summary, three
         * deliverables and two CTAs without clipping something.
         */
        className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
      >
        {cards.map((card) => (
          <li key={card.slug} className="min-w-0">
            <article
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6",
                "transition-[border-color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                "hover:border-accent/45 hover:shadow-[0_20px_50px_-34px_rgba(23,25,28,0.55)]",
                "focus-within:border-accent/45 motion-safe:hover:-translate-y-1 sm:p-7",
              )}
            >
              {/* Accent rule that draws across the top edge on hover or
                  keyboard focus, so the effect is never pointer-only. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-accent transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-focus-within:scale-x-100"
              />

              <p className={cn("flex items-center gap-2.5", labelClass)}>
                <span aria-hidden="true" className="h-px w-4 shrink-0 bg-accent" />
                {card.group}
              </p>

              {/* The heading carries the crawlable link to the service page.
                  Everything the dialog shows is reachable without it. */}
              <h3 className="mt-4 text-xl leading-snug tracking-tight text-ink sm:text-[1.3125rem]">
                <Link
                  href={`/services/${card.slug}`}
                  className="rounded-sm underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-accent-ink hover:underline"
                >
                  {card.title}
                </Link>
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-muted">{card.summary}</p>

              <ul className="mt-5 space-y-2">
                {card.deliverables.slice(0, DELIVERABLES_ON_CARD).map((item) => (
                  <li key={item} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-ink/75">
                    <Tick />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* mt-auto pins the price and the CTAs to the bottom, so they
                  line up across a row whatever the summaries do above. */}
              <div className="mt-auto pt-6">
                <div className="rule pt-5">
                  <p className={labelClass}>Pricing</p>
                  <p className="mt-1.5 text-lg tracking-tight text-ink">
                    {card.price ?? PRICE_FALLBACK}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    aria-haspopup="dialog"
                    onClick={() => setActive(card)}
                    className="w-full"
                  >
                    View Plans
                  </Button>

                  <Link
                    href={card.contactHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-5 text-[0.9375rem] font-medium text-ink transition-colors duration-[var(--dur-fast)] hover:border-ink hover:bg-ink hover:text-surface"
                  >
                    Contact Us
                    <ArrowRight />
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </StaggerGroup>

      {/* ---------------------------------------------------- plan details */}
      <dialog
        ref={dialogRef}
        onClose={handleClose}
        /* The dialog box itself is the backdrop area around the panel, so a
           click landing on it — and not on a descendant — is a click
           outside. */
        onClick={(event) => {
          if (event.target === dialogRef.current) requestClose();
        }}
        aria-labelledby="plan-dialog-title"
        className="plan-dialog"
      >
        {active && (
          <div
            autoFocus
            tabIndex={-1}
            className="plan-dialog-panel w-full max-w-xl rounded-t-2xl border border-line bg-surface outline-none sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-6 sm:p-7">
              <div className="min-w-0">
                <p className={cn("flex items-center gap-2.5", labelClass)}>
                  <span aria-hidden="true" className="h-px w-4 shrink-0 bg-accent" />
                  {active.group}
                </p>
                <h2
                  id="plan-dialog-title"
                  className="mt-3 text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink"
                >
                  {active.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={requestClose}
                className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors duration-[var(--dur-fast)] hover:border-ink hover:text-ink"
              >
                <span className="sr-only">Close plan details</span>
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  focusable="false"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            <div className="max-h-[min(60vh,32rem)] overflow-y-auto p-6 sm:p-7">
              <p className="text-base leading-relaxed text-ink">{active.problem}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{active.summary}</p>

              <h3 className={cn("mt-7", labelClass)}>What&apos;s included</h3>
              <ul className="mt-3 space-y-2.5">
                {active.deliverables.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                    <Tick className="mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className={cn("mt-7", labelClass)}>Who it&apos;s for</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{active.audience}</p>

              <h3 className={cn("mt-7", labelClass)}>
                {active.price ? "Starting price" : "What it costs"}
              </h3>
              <p className="mt-2 text-lg tracking-tight text-ink">
                {active.price ?? PRICE_FALLBACK}
              </p>
              {/* No figure is published for any service yet, so the panel says
                  how the number is arrived at instead of implying one. */}
              {!active.price && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Scope drives the number, not page count. We work out what the project
                  actually needs, then the proposal breaks down what the cost is made of so
                  you can adjust scope rather than guess.
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  href={active.contactHref}
                  variant="primary"
                  trackAs={`pricing_dialog_contact_${active.slug}`}
                  className="w-full sm:w-auto"
                >
                  Enquire about this
                  <ArrowRight />
                </Button>
                <Button
                  href={`/services/${active.slug}`}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Full service details
                </Button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
