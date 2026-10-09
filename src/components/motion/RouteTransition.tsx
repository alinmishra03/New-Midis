"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { loadedGsap } from "@/lib/gsap";

/**
 * Puts a new page at the top, and re-measures scroll animations after the
 * route changes. One component in the root layout, nothing per page.
 *
 * WHY THIS IS NEEDED — the App Router's own scroll reset does not survive
 * this site's CSS. Two things combined to leave a new page sitting at the
 * previous page's scroll position:
 *
 *   1. `html { scroll-behavior: smooth }` (globals.css) applies to the
 *      router's scroll as much as to a visitor's anchor click, so the reset
 *      became an ~800ms ANIMATION instead of a jump. Next does try to avoid
 *      this — its scroll helper sets `scroll-behavior: auto` on <html> first
 *      — but it runs that path with `dontForceLayout`, skipping the reflow
 *      that would make the override take effect, so the declaration in the
 *      stylesheet still won. Measured: `html.scrollTop = 0` left scrollY at
 *      2200 and only reached 1 some 800ms later; the same assignment with
 *      `scroll-behavior: auto` genuinely applied landed on 0 immediately.
 *
 *   2. Anything touching the scroll position during that window cancelled
 *      the animation. GSAP's `ScrollTrigger.refresh()` was being called from
 *      component cleanup on every route change, and refresh() snapshots the
 *      scroll position and restores it afterwards — so it actively put the
 *      old position back, twelve times over on the homepage. That call is
 *      gone (see MaskedLines); this file is where a refresh now happens,
 *      once, and only after the scroll has settled.
 *
 * WHAT IT DELIBERATELY DOES NOT TOUCH
 *   - Back and Forward: the browser restores the position the visitor left,
 *     which is the behaviour to keep, so a history-driven change is detected
 *     via popstate and the scroll is left alone.
 *   - Hash navigation (`/faq#pricing`, the skip link): the fragment owns the
 *     scroll position, so a URL carrying one is left alone.
 *   - Ordinary scrolling, menus, modals and form interaction: this only ever
 *     runs on a pathname change, so none of them can trigger it.
 */

/** An instant, uninterruptible jump to the top, whatever the stylesheet says. */
function jumpToTop() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;

  /* The inline declaration beats the stylesheet, but only once the browser
     has taken it into account — hence the forced reflow, which is precisely
     the step the router's own helper skips. Without it the assignment below
     is still treated as a smooth scroll. */
  html.style.scrollBehavior = "auto";
  void html.offsetHeight;

  window.scrollTo(0, 0);

  html.style.scrollBehavior = previous;
}

/* Poll interval and quiet-run count for deciding a scroll has stopped, plus
   the point at which we stop waiting and re-measure regardless. */
const SETTLE_INTERVAL_MS = 60;
const SETTLE_QUIET_RUNS = 3;
const SETTLE_TIMEOUT_MS = 1000;

export function RouteTransition() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const cameFromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      cameFromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    /* Nothing to correct on the first render: a fresh load, or a deep link
       with a fragment, is already where it should be. */
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const fromHistory = cameFromHistory.current;
    cameFromHistory.current = false;

    const hasFragment = window.location.hash.length > 1;
    const shouldReset = !fromHistory && !hasFragment;

    if (shouldReset) jumpToTop();

    /*
     * Header and Footer live in the layout and never unmount, so their
     * triggers stay measured against the previous page's height until
     * something re-measures them.
     *
     * The timing matters, because refresh() snapshots the scroll position and
     * restores it. Called while a scroll is still moving it freezes the page
     * mid-flight, which is the very failure this component exists to prevent.
     * After a forward navigation the position is settled within a frame. On
     * Back and Forward the browser restores the saved position a little later
     * and asynchronously, so we wait for the scroll to stop changing instead
     * of refreshing into the middle of it.
     */
    let timers: number[] = [];
    let done = false;

    const runRefresh = () => {
      if (done) return;
      done = true;
      for (const t of timers) clearTimeout(t);
      timers = [];
      loadedGsap()?.ScrollTrigger.refresh();
    };

    const waitForScrollToSettle = () => {
      let lastY = window.scrollY;
      let quietRuns = 0;

      const poll = () => {
        if (done) return;
        if (window.scrollY === lastY) {
          quietRuns += 1;
        } else {
          lastY = window.scrollY;
          quietRuns = 0;
        }
        if (quietRuns >= SETTLE_QUIET_RUNS) {
          runRefresh();
          return;
        }
        timers.push(window.setTimeout(poll, SETTLE_INTERVAL_MS));
      };

      timers.push(window.setTimeout(poll, SETTLE_INTERVAL_MS));
      // Never leave measurements stale because a scroll would not sit still.
      timers.push(window.setTimeout(runRefresh, SETTLE_TIMEOUT_MS));
    };

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      /* Re-assert once the frame has rendered. If the router had already
         started its own animated scroll, this ends it at the top rather than
         letting it drift; both positions are the top, so nothing is visible. */
      if (shouldReset) jumpToTop();

      if (!loadedGsap()) return;

      if (shouldReset) {
        secondFrame = requestAnimationFrame(runRefresh);
      } else {
        waitForScrollToSettle();
      }
    });

    return () => {
      done = true;
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      for (const t of timers) clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
