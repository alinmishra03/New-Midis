"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type WipeFrom = "bottom" | "left" | "right" | "top";

/**
 * Uncovers its content with a directional clip-path wipe.
 *
 * Distinct from `Reveal` (which fades and lifts) and from `MaskedLines`
 * (which rises line by line out of a clipping box): nothing here moves. The
 * content is already in its final position and the clip edge travels across
 * it, which reads as a reveal rather than an entrance — useful where a block
 * should feel uncovered rather than arrived.
 *
 * Pure CSS behind an IntersectionObserver, so it costs no main-thread work
 * while it plays and `clip-path` stays on the compositor. Hidden state is
 * scoped to `html.js` and released by the `reveal-all` failsafe, so the
 * content can never be stranded invisible; reduced motion skips the wipe.
 */
export function ClipWipe({
  children,
  as: Tag = "div",
  className,
  from = "bottom",
  /** Delay before the edge starts moving, in ms. */
  delay = 0,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  from?: WipeFrom;
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.wipe = "in";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.wipe = "in";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-wipe=""
      data-wipe-from={from}
      className={cn(className)}
      style={{ ...(delay ? { transitionDelay: `${delay}ms` } : {}), ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
