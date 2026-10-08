"use client";

import { useEffect, useRef } from "react";
import { useMotionProfile } from "@/lib/motion";

/**
 * Hero visual: an ascending bar field echoing the growth motif inside the
 * MIDIS logo mark, now responsive to the pointer.
 *
 * Bars near the cursor lift and warm towards the accent colour, so the
 * composition reacts to the visitor without becoming a toy. It stays
 * deliberately low-contrast — the headline is the subject, this is the
 * surface it sits on.
 *
 * Guards:
 *   - reduced motion paints one static frame, no loop, no pointer response
 *   - "reduced" profile keeps the animation but drops pointer tracking and
 *     halves the column count
 *   - pauses entirely off-screen or when the tab is hidden
 *   - DPR capped at 2
 */
export function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profile = useMotionProfile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = profile === "minimal";
    const rich = profile === "full";

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    let start = performance.now();

    // Pointer influence, eased towards the real position.
    let pointerX = -1;
    let targetPointerX = -1;
    let pointerStrength = 0;
    let targetStrength = 0;

    const COLUMNS = rich ? 56 : 26;
    const ACCENT = "239, 135, 22";

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!ctx) return;
      const t = (now - start) / 1000;

      // Ease pointer state so entering and leaving are smooth.
      if (pointerX < 0) pointerX = targetPointerX;
      pointerX += (targetPointerX - pointerX) * 0.1;
      pointerStrength += (targetStrength - pointerStrength) * 0.07;

      ctx.clearRect(0, 0, width, height);

      const gap = width / COLUMNS;
      const barWidth = Math.max(1.5, gap * 0.34);
      const baseline = height * 0.96;

      for (let i = 0; i < COLUMNS; i++) {
        const progress = i / (COLUMNS - 1);

        // The exponential rise the logo mark describes.
        const curve = Math.pow(progress, 1.9);

        const wave = reduced
          ? 0
          : Math.sin(t * 0.5 + progress * 5.2) * 0.05 +
            Math.sin(t * 0.27 + progress * 2.4) * 0.035;

        // Gaussian falloff around the pointer.
        let lift = 0;
        if (pointerStrength > 0.001 && pointerX >= 0) {
          const x = i * gap + gap / 2;
          const d = (x - pointerX) / (width * 0.16);
          lift = Math.exp(-d * d) * 0.16 * pointerStrength;
        }

        const h = Math.max(2, (curve + wave + lift) * height * 0.82);
        const x = i * gap + (gap - barWidth) / 2;

        const alpha = 0.05 + curve * 0.5 + lift * 1.6;
        ctx.fillStyle = `rgba(${ACCENT}, ${Math.min(0.85, alpha).toFixed(3)})`;

        const r = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        ctx.roundRect(x, baseline - h, barWidth, h, [r, r, 0, 0]);
        ctx.fill();
      }
    }

    function loop(now: number) {
      draw(now);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    }

    resize();
    draw(performance.now());

    const cleanups: (() => void)[] = [];

    if (!reduced) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && !document.hidden;
          cancelAnimationFrame(raf);
          if (visible) {
            start = performance.now() - 1000;
            raf = requestAnimationFrame(loop);
          }
        },
        { threshold: 0 },
      );
      observer.observe(canvas);
      cleanups.push(() => observer.disconnect());

      const onVisibility = () => {
        if (document.hidden) cancelAnimationFrame(raf);
        else if (visible) raf = requestAnimationFrame(loop);
      };
      document.addEventListener("visibilitychange", onVisibility);
      cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

      if (rich) {
        const onPointerMove = (e: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          targetPointerX = e.clientX - rect.left;
          targetStrength = 1;
        };
        const onPointerLeave = () => {
          targetStrength = 0;
        };
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.addEventListener("pointerleave", onPointerLeave);
        cleanups.push(() => {
          window.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("pointerleave", onPointerLeave);
        });
      }
    }

    const onResize = () => {
      resize();
      draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    return () => {
      cancelAnimationFrame(raf);
      for (const fn of cleanups) fn();
    };
  }, [profile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] w-full select-none sm:h-[46vh]"
    />
  );
}
