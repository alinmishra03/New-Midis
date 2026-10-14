import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { Reveal } from "./Reveal";

export function Section({
  children,
  className,
  tone = "paper",
  id,
  "aria-labelledby": ariaLabelledby,
}: {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "surface" | "ink";
  id?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cn(
        /* Fluid vertical rhythm: scales with the viewport so the wider
           full-width layout keeps its proportions on large screens rather
           than looking vertically cramped. The scale itself lives in
           globals.css as --space-section, so every section moves together. */
        "py-[var(--space-section)]",
        tone === "paper" && "bg-paper text-ink",
        tone === "surface" && "bg-surface text-ink",
        tone === "ink" && "bg-ink text-surface",
        className,
      )}
    >
      <div className="container-site">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={cn(
        "text-[0.6875rem] font-semibold uppercase tracking-[0.2em]",
        tone === "dark" ? "text-surface/55" : "text-muted",
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  intro,
  tone = "light",
  align = "left",
  action,
  id,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  action?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "items-start",
        action && "lg:flex-row lg:items-end lg:justify-between lg:gap-8",
        className,
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
        {/* Section titles reveal line-by-line out of clipping masks. The
            text is server-rendered and readable without JS; masking is
            applied at runtime only. */}
        <h2
          id={id}
          className={cn(
            "mt-3 text-[length:var(--text-display-md)] sm:mt-4",
            tone === "dark" ? "text-surface" : "text-ink",
          )}
        >
          <MaskedLines>{title}</MaskedLines>
        </h2>
        {intro && (
          <div
            className={cn(
              "mt-4 max-w-2xl text-base leading-relaxed sm:mt-5 sm:text-lg",
              tone === "dark" ? "text-surface/65" : "text-muted",
              align === "center" && "mx-auto",
            )}
          >
            {intro}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
