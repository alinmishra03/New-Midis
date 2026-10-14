"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import type { Service } from "@/content/types";
import { useAllowsRichMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Editorial service rows.
 *
 * Replaces a grid of equal cards with a typographic list — the brief
 * explicitly rules out repetitive generic cards. Every piece of content is
 * the same as before: problem line, service name, summary, first three
 * deliverables, and the same link.
 *
 * The hovered row lifts while its neighbours recede, which gives the list a
 * focal point without hiding anything. Keyboard focus produces the identical
 * state, so the effect is not pointer-only.
 */
export function ServiceRows({ services }: { services: readonly Service[] }) {
  const [active, setActive] = useState<string | null>(null);
  const rich = useAllowsRichMotion();
  const listRef = useRef<HTMLUListElement>(null);

  return (
    <ul
      ref={listRef}
      className="rule mt-[var(--space-block)]"
      onMouseLeave={() => setActive(null)}
    >
      {services.map((s, i) => {
        const isActive = active === s.slug;
        const dimmed = rich && active !== null && !isActive;

        return (
          <Reveal
            key={s.slug}
            as="li"
            delay={Math.min(i, 5) * 55}
            className="border-b border-line"
          >
            <Link
              href={`/services/${s.slug}`}
              onMouseEnter={() => setActive(s.slug)}
              onFocus={() => setActive(s.slug)}
              onBlur={() => setActive(null)}
              className={cn(
                "group relative block py-8 transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] lg:py-10",
                dimmed ? "opacity-40" : "opacity-100",
              )}
            >
              {/* Accent rule that draws across as the row becomes active. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 bottom-[-1px] h-px bg-accent transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]",
                  isActive ? "scale-x-100" : "scale-x-0",
                )}
                style={{ transformOrigin: isActive ? "left" : "right" }}
              />

              {/* The 4rem column held the accent rule that stood in for the
                  former numeral, and nothing else. With the rule gone the
                  column goes too, rather than indenting every row behind an
                  empty gutter. The row still shows which one is active: the
                  full-width rule below draws across, and the others dim. */}
              <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr_3rem] lg:items-baseline lg:gap-8">
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                    {s.problem}
                  </p>
                  <h3
                    className={cn(
                      "mt-3 font-display text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                      isActive && rich ? "lg:translate-x-2" : "",
                    )}
                  >
                    {s.title}
                  </h3>
                </div>

                <div>
                  <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                    {s.summary}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
                    {s.deliverables.slice(0, 3).map((d) => (
                      <li
                        key={d}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors duration-[var(--dur-base)]",
                          isActive
                            ? "border-accent/40 bg-accent-soft text-ink"
                            : "border-line text-muted",
                        )}
                      >
                        {d}
                      </li>
                    ))}
                  </ul>

                  {/* The original card carried this label. Kept verbatim and
                      rendered exactly once — only its presentation changed. */}
                  <span
                    className={cn(
                      "mt-5 inline-flex items-center gap-2 text-sm font-medium transition-colors duration-[var(--dur-base)]",
                      isActive ? "text-ink" : "text-muted",
                    )}
                  >
                    Learn more
                    <ArrowRight className="lg:hidden" />
                  </span>
                </div>

                {/* Desktop affordance only — the label above is the real one. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "hidden h-10 w-10 items-center justify-center rounded-full border transition-colors duration-[var(--dur-base)] lg:flex",
                    isActive ? "border-accent bg-accent text-ink" : "border-line text-muted",
                  )}
                >
                  <ArrowRight />
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </ul>
  );
}
