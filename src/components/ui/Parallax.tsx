"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAllowsRichMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Subtle parallax for imagery.
 *
 * Constraints that keep it from becoming the usual problem:
 *   - transform only, so it can never cause layout shift (the brief forbids
 *     animations that do)
 *   - the child is scaled slightly so the translate never reveals an edge
 *   - a single shared IntersectionObserver gate means off-screen elements do
 *     no work at all
 *   - rich-motion profiles only: never on touch, small, low-powered or
 *     reduced-motion devices
 */
export function Parallax({
  children,
  className,
  /** Maximum travel in pixels across the full scroll pass. */
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rich = useAllowsRichMotion();

  useEffect(() => {
    if (!rich) return;
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    let frame = 0;
    let active = false;

    const update = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight;

      // -1 when the element is just below the fold, 1 when just above it.
      const centre = rect.top + rect.height / 2;
      const progress = (centre - viewport / 2) / (viewport / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));

      inner.style.transform = `translate3d(0, ${(clamped * distance).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!active || frame) return;
      frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) update();
      },
      { rootMargin: "100px 0px" },
    );

    observer.observe(container);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [rich, distance]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      <div
        ref={innerRef}
        className="h-full w-full will-change-transform"
        /* Scaled so the translate never exposes an edge. Only when active. */
        style={rich ? { scale: `${1 + (distance * 2) / 1000 + 0.04}` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
