"use client";

import { useEffect, useRef } from "react";
import { useAllowsMovement } from "@/lib/motion";

/**
 * Reading-progress line across the top of the page.
 *
 * One of the few places the brief calls for the accent colour, and a genuinely
 * useful signal on long service and case-study pages.
 *
 * Implementation notes:
 *   - scaleX on a composited element, so it never triggers layout or paint
 *   - driven from a single passive scroll listener coalesced into rAF, so
 *     fast scrolling cannot queue up work
 *   - hidden entirely under reduced motion, where a constantly moving element
 *     is exactly what the visitor asked not to see
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const allowsMovement = useAllowsMovement();

  useEffect(() => {
    if (!allowsMovement) return;
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [allowsMovement]);

  if (!allowsMovement) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-0.5"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-accent"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
