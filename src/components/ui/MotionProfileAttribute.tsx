"use client";

import { useEffect } from "react";
import { useMotionProfile } from "@/lib/motion";

/**
 * Publishes the motion profile to the document as `data-motion`, so stylesheets
 * can adapt without every component re-deriving the same media queries in JS.
 *
 * This is what lets reveal travel distances shorten on phones rather than
 * simply replaying the desktop animation at a smaller size — the brief's
 * requirement for mobile-specific motion.
 */
export function MotionProfileAttribute() {
  const profile = useMotionProfile();

  useEffect(() => {
    document.documentElement.dataset.motion = profile;
  }, [profile]);

  return null;
}
