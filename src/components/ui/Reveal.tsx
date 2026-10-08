"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger in ms, for sequencing siblings. */
  delay?: number;
  as?: ElementType;
}

/**
 * Scroll-triggered reveal.
 *
 * Renders in the "pending" state on the server, which only resolves to hidden
 * when `html.js` is present (see globals.css). That keeps the no-JS and
 * failed-hydration paths fully readable.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.dataset.reveal = "shown";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.style.transitionDelay = `${delay}ms`;
          target.dataset.reveal = "shown";
          observer.unobserve(target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} data-reveal="pending" className={cn(className)}>
      {children}
    </Tag>
  );
}
