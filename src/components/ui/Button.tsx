"use client";

import Link from "next/link";
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type Variant = "primary" | "dark" | "outline" | "outline-light";
type Size = "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 font-medium tracking-tight " +
  "transition-[background-color,color,border-color,transform] duration-[var(--dur-fast)] " +
  "ease-[var(--ease-out-expo)] rounded-full whitespace-nowrap select-none " +
  "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  /* #17191C on #EF8716 = 6.83:1. White on orange would be 2.55:1 and fail,
     so the accent button always carries charcoal text. */
  primary: "bg-accent text-ink hover:bg-ink hover:text-surface",
  dark: "bg-ink text-surface hover:bg-accent hover:text-ink",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-surface",
  "outline-light": "border border-surface/25 text-surface hover:bg-surface hover:text-ink",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  /** Pointer-following magnetism. Disabled on touch and reduced-motion. */
  magnetic?: boolean;
  /**
   * Labels this button as a tracked CTA. No-ops without analytics consent,
   * so it is always safe to set.
   */
  trackAs?: string;
  className?: string;
  children: ReactNode;
}

type ButtonAsLink = BaseProps & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href" | "className" | "children">;
type ButtonAsButton = BaseProps & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "md", magnetic = false, trackAs, className, children, ...rest } = props;
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !magnetic) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate3d(${x * 0.18}px, ${y * 0.3}px, 0)`;
  }

  function handleClick() {
    if (trackAs) trackEvent("cta_click", { label: trackAs });
  }

  function handleLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as ComponentPropsWithoutRef<"a">;
    const external = props.href.startsWith("http") || props.href.startsWith("mailto") || props.href.startsWith("tel");
    void href;

    if (external) {
      return (
        <a
          ref={ref}
          href={props.href}
          className={classes}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          onClick={handleClick}
          {...anchorRest}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        href={props.href}
        className={classes}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        {...anchorRest}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {children}
    </button>
  );
}

/** Small right-pointing arrow that nudges on hover of the parent `.group`. */
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn(
        "h-4 w-4 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] group-hover:translate-x-1",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}
