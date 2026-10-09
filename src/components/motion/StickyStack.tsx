"use client";

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cards that pin in turn and slide over one another as the page scrolls.
 *
 * Entirely `position: sticky` — no scroll listener, no ScrollTrigger, no
 * scrub. That matters: the obvious way to build this is a pinned timeline
 * driven by scroll progress, which means main-thread work on every frame for
 * the whole length of the section. Sticky positioning gets the same effect
 * from the compositor for free, and it degrades honestly — a browser that
 * ignores it renders a plain stacked list, which is what the markup already
 * is.
 *
 * Each child is offset slightly further down than the last, so the pinned
 * cards leave a visible edge of the ones beneath rather than covering them
 * completely.
 *
 * Not a client component for any interactive reason; it is marked so only
 * because it sets per-child custom properties through cloning, which keeps
 * the call sites plain.
 */
export function StickyStack({
  children,
  className,
  /** Distance from the top of the viewport the first card pins at. */
  top = "6rem",
  /** Extra offset added per card, so each one pins slightly lower. */
  offset = "2.25rem",
  style,
}: {
  children: ReactNode[];
  className?: string;
  top?: string;
  offset?: string;
  style?: CSSProperties;
}) {
  return (
    <ol
      data-sticky-stack=""
      className={cn("space-y-6", className)}
      style={
        {
          "--stack-top": top,
          "--stack-offset": offset,
          ...style,
        } as CSSProperties
      }
    >
      {children.map((child, i) => (
        <li
          key={i}
          className="sticky"
          style={
            {
              "--stack-index": i,
              top: `calc(var(--stack-top) + ${i} * var(--stack-offset))`,
            } as CSSProperties
          }
        >
          {child}
        </li>
      ))}
    </ol>
  );
}
