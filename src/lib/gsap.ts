"use client";

import type { gsap as GsapType } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";

/**
 * Lazily-loaded GSAP.
 *
 * GSAP plus ScrollTrigger is roughly 45 KB gzipped — a third of this site's
 * entire JS budget — and none of it is needed for first paint, because every
 * animated element is server-rendered and readable before any script runs.
 *
 * So it is imported dynamically inside effects rather than bundled into the
 * initial payload. The visual difference is that a reveal may settle a few
 * hundred milliseconds later on a cold load; the measured difference is
 * ~45 KB off the critical path on every page.
 *
 * The promise is cached, so the chunk is fetched once per session no matter
 * how many components ask for it.
 */
type GsapBundle = {
  gsap: typeof GsapType;
  ScrollTrigger: typeof ScrollTriggerType;
};

let loader: Promise<GsapBundle> | null = null;

export function loadGsap(): Promise<GsapBundle> {
  if (loader) return loader;

  loader = (async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);

    gsap.registerPlugin(ScrollTrigger);

    /* One easing and duration language across every animation, matching the
       CSS custom properties so GSAP and CSS motion feel like one system. */
    gsap.defaults({ ease: "expo.out", duration: 1.1 });

    /* ScrollTrigger recalculates on resize; let it settle rather than
       thrashing during a drag-resize or a mobile URL-bar show/hide. */
    ScrollTrigger.config({ ignoreMobileResize: true });

    return { gsap, ScrollTrigger };
  })();

  return loader;
}

/** Shared timings so components don't invent their own. */
export const EASE = {
  out: "expo.out",
  inOut: "power3.inOut",
} as const;

export const DUR = {
  fast: 0.45,
  base: 0.9,
  slow: 1.4,
} as const;
