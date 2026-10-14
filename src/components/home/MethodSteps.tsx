"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import type { ProcessStep } from "@/content/types";
import { useAllowsMovement } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The six-stage method, with scroll-linked emphasis.
 *
 * The report (§7) asks for the methodology to read as a system rather than a
 * list, and the brief asks for "elegant scroll-based storytelling". The
 * restraint here is deliberate: no pinning, no scrubbed timeline, no
 * hijacking the scroll. Those techniques fight the reader on a page that is
 * mostly text, and behave badly on touch.
 *
 * Instead the step nearest the middle of the viewport simply becomes the
 * emphasised one. Every step is fully legible at all times — the emphasis
 * adds a sense of progression without any content depending on it.
 */
export function MethodSteps({ steps }: { steps: readonly ProcessStep[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  /* The observed node is the inner wrapper, not the <li> — Reveal owns the
     list item element itself. */
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const allowsMovement = useAllowsMovement();

  useEffect(() => {
    if (!allowsMovement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the viewport centre rather than the first
        // intersecting one, so the emphasis tracks reading position.
        let best: { index: number; distance: number } | null = null;
        const centre = window.innerHeight / 2;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = itemRefs.current.indexOf(entry.target as HTMLElement);
          if (index === -1) continue;
          const rect = entry.boundingClientRect;
          const distance = Math.abs(rect.top + rect.height / 2 - centre);
          if (!best || distance < best.distance) best = { index, distance };
        }

        if (best) setActiveIndex(best.index);
      },
      { rootMargin: "-25% 0px -25% 0px", threshold: [0, 0.5, 1] },
    );

    for (const el of itemRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [allowsMovement]);

  return (
    <>
      {/* Scroll-linked progress through the six stages. Decorative: the step
          content below is complete and readable on its own, so this adds
          orientation without carrying information of its own. */}
      {allowsMovement && (
        <div aria-hidden="true" className="mt-[var(--space-block)] flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.number} className="flex flex-1 items-center gap-2">
              <span className="relative h-px flex-1 overflow-hidden bg-line-dark">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 bg-accent transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]",
                    i < activeIndex ? "w-full" : i === activeIndex ? "w-1/2" : "w-0",
                  )}
                />
              </span>
            </div>
          ))}
        </div>
      )}

    <ol className="mt-8 grid gap-px overflow-hidden rounded-xl bg-line-dark md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, i) => {
        const isActive = allowsMovement && i === activeIndex;

        return (
          <Reveal
            key={step.number}
            as="li"
            delay={(i % 3) * 80}
            className={cn(
              "group relative bg-ink p-5 transition-colors duration-[var(--dur-base)] sm:p-6 lg:p-8",
              isActive ? "bg-ink-soft" : "hover:bg-ink-soft",
            )}
          >
            <div ref={(el) => void (itemRefs.current[i] = el)}>
              {/* Accent rule fills as the step becomes the active one. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-0 h-px bg-accent transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]",
                  isActive ? "w-full" : "w-0 group-hover:w-full",
                )}
              />

              {/* The small accent rule that sat here is gone. Which step is
                  active is still shown by the rule above, which fills the
                  full width of the card, and by the card's own background. */}
              <h3 className="text-2xl tracking-tight text-surface">{step.title}</h3>
              <p className="mt-2 text-sm font-medium text-surface/70">{step.summary}</p>
              <p className="mt-5 text-sm leading-relaxed text-surface/55">{step.detail}</p>

              <ul className="mt-6 space-y-1.5">
                {step.outputs.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-xs text-surface/60">
                    <span
                      aria-hidden="true"
                      className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-accent"
                    />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        );
      })}
    </ol>
    </>
  );
}
