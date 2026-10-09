"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A group whose direct children settle in sequence rather than together.
 *
 * Deliberately not GSAP. The movement is a CSS transition and the delays come
 * from `:nth-child` rules in globals.css, so a grid of twelve cards costs one
 * IntersectionObserver and no JavaScript on the main thread while it runs —
 * which is what keeps this affordable on the pages that use it most, where
 * every card would otherwise need its own `Reveal` and its own hand-written
 * delay.
 *
 * The hidden state is scoped to `html.js`, so without JavaScript every child
 * is simply visible, and the `reveal-all` failsafe in the head script releases
 * them if the bundle never arrives. `prefers-reduced-motion` skips straight to
 * the settled state.
 */
export function StaggerGroup({
  children,
  as: Tag = "div",
  className,
  /** Gap between consecutive children, in ms. */
  step,
  /** How far each child travels, as a CSS length. */
  shift,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  step?: number;
  shift?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.stagger = "in";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.stagger = "in";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-stagger=""
      className={cn(className)}
      style={
        {
          ...(step !== undefined ? { "--stagger-step": `${step}ms` } : {}),
          ...(shift !== undefined ? { "--stagger-shift": shift } : {}),
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
