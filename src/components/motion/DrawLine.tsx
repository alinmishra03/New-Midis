"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * A rule that draws itself when it comes into view.
 *
 * Used to give a sequence — a process, a story, a numbered list — a spine
 * that arrives with the content rather than sitting there fully formed. A
 * `scaleY`/`scaleX` on a one-pixel element, so it runs entirely on the
 * compositor and costs nothing to animate.
 *
 * Decorative by definition: always `aria-hidden`, never carries meaning that
 * is not also in the text beside it. It can therefore stay collapsed under
 * reduced motion with nothing lost, though for consistency with the rest of
 * the system it simply appears instead.
 */
export function DrawLine({
  className,
  orientation = "vertical",
  /** ms before the line starts drawing. */
  delay = 0,
  style,
}: {
  className?: string;
  orientation?: "vertical" | "horizontal";
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.draw = "in";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.draw = "in";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-draw=""
      data-draw-axis={orientation}
      className={cn(
        orientation === "vertical" ? "block w-px" : "block h-px",
        "bg-line",
        className,
      )}
      style={{ ...(delay ? { transitionDelay: `${delay}ms` } : {}), ...style }}
    />
  );
}
