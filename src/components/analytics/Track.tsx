"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type TrackedEvent } from "@/lib/analytics";

/**
 * Fires a single event when the page it is mounted on is viewed.
 *
 * Used for things that are meaningful as a view rather than a click — an
 * audit result being produced, a case study being read. Guarded against
 * double-firing in React Strict Mode.
 */
export function TrackView({
  event,
  params,
}: {
  event: TrackedEvent;
  params?: Record<string, string | number>;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, params);
  }, [event, params]);

  return null;
}

/**
 * Wraps an outbound contact link so the click is measurable.
 * Renders a plain anchor — the link works identically without consent.
 */
export function TrackedLink({
  event,
  href,
  params,
  className,
  children,
  ...rest
}: {
  event: TrackedEvent;
  href: string;
  params?: Record<string, string | number>;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href" | "className" | "children">) {
  return (
    <a href={href} className={className} onClick={() => trackEvent(event, params)} {...rest}>
      {children}
    </a>
  );
}
