"use client";

import { useEffect, useRef } from "react";
import { useAllowsRichMotion } from "@/lib/motion";

/**
 * A trailing ring that follows the pointer and responds to interactive
 * elements.
 *
 * Two deliberate restraints:
 *
 *  1. The native cursor is NOT hidden. Most agency sites replace it entirely,
 *     which breaks the affordances people rely on — text carets, resize
 *     handles, the pointer that tells you something is clickable — and is
 *     actively hostile to anyone with low vision or a motor impairment. This
 *     ring is purely additive.
 *  2. It renders only on "full" motion profiles, so it never appears on
 *     touch, small, low-powered, or reduced-motion devices, where it would be
 *     meaningless or expensive.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const rich = useAllowsRichMotion();

  useEffect(() => {
    if (!rich) return;
    const ring = ringRef.current;
    if (!ring) return;

    // Target position (pointer) vs rendered position (eased).
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let scale = 1;
    let targetScale = 1;
    let frame = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!visible) {
        visible = true;
        ring.style.opacity = "1";
        // Avoid a long sweep in from the corner on first movement.
        currentX = targetX;
        currentY = targetY;
      }

      const interactive = (e.target as Element | null)?.closest?.(
        "a, button, [role='button'], input, textarea, select, summary, label",
      );
      targetScale = interactive ? 2.1 : 1;
    };

    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
    };

    const render = () => {
      // Critically damped-ish easing; cheap and frame-rate independent enough.
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      scale += (targetScale - scale) * 0.16;

      ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      frame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [rich]);

  if (!rich) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] h-7 w-7 rounded-full border border-ink/25 opacity-0 transition-opacity duration-300 mix-blend-multiply"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    />
  );
}
