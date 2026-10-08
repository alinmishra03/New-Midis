"use client";

import { useSyncExternalStore } from "react";

/**
 * Central motion policy.
 *
 * The brief asks for mobile-specific motion rather than desktop interactions
 * shrunk down, so complexity is decided here once and consumed everywhere —
 * instead of each component inventing its own breakpoint rule.
 *
 *   "minimal"  the visitor asked for reduced motion. Opacity only, no
 *              movement, no continuous animation. Non-negotiable.
 *   "reduced"  touch, small or low-powered device. Movement is kept short
 *              and cheap: no parallax, no custom cursor, no continuous
 *              canvas work, smaller travel distances.
 *   "full"     a capable pointer device. Everything is available.
 *
 * Subscriptions use useSyncExternalStore so there is a defined server
 * snapshot and no read-in-effect-then-setState pattern.
 */
export type MotionProfile = "minimal" | "reduced" | "full";

function subscribeToQuery(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

function matches(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const FINE_POINTER = "(pointer: fine)";
const WIDE = "(min-width: 1024px)";

/**
 * Device capability check. Deliberately conservative: when the browser
 * won't tell us, we assume the cheaper profile rather than the richer one.
 */
function isLowPowered(): boolean {
  if (typeof navigator === "undefined") return true;
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores <= 4) return true;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 4) return true;
  return false;
}

function getProfile(): MotionProfile {
  if (matches(REDUCED_MOTION)) return "minimal";
  if (!matches(FINE_POINTER) || !matches(WIDE) || isLowPowered()) return "reduced";
  return "full";
}

/* The server can't detect any of this. "reduced" is the safe default: it
   never starts expensive work before the client has had a say. */
const getServerProfile = (): MotionProfile => "reduced";

/* One subscription covering every input that can change the profile. */
function subscribeToProfile(onChange: () => void) {
  const unsubs = [REDUCED_MOTION, FINE_POINTER, WIDE].map((q) => subscribeToQuery(q)(onChange));
  return () => unsubs.forEach((fn) => fn());
}

export function useMotionProfile(): MotionProfile {
  return useSyncExternalStore(subscribeToProfile, getProfile, getServerProfile);
}

/** Convenience: should this component animate movement at all? */
export function useAllowsMovement(): boolean {
  return useMotionProfile() !== "minimal";
}

/** Convenience: is this a device we can ask more of? */
export function useAllowsRichMotion(): boolean {
  return useMotionProfile() === "full";
}
