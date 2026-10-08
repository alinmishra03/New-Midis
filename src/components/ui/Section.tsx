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
           than looking vertically cramped. */
        "py-[clamp(4.5rem,8vw,10rem)]",
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
    <p className="flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em]">
      <span className="h-px w-8 bg-accent" aria-hidden="true" />
      <span className={tone === "dark" ? "text-surface/55" : "text-muted"}>{children}</span>
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
        action && "lg:flex-row lg:items-end lg:justify-between lg:gap-12",
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
            "mt-5 text-[length:var(--text-display-md)]",
            tone === "dark" ? "text-surface" : "text-ink",
          )}
        >
          <MaskedLines>{title}</MaskedLines>
        </h2>
        {intro && (
          <div
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed sm:text-lg",
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
