"use client";

import { useEffect, useRef } from "react";
import { useMotionProfile } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Cinematic generated hero background.
 *
 * Original artwork rather than licensed photography or video: a slow aurora
 * of soft gradient fields drifting behind the content, seeded per page so
 * every hero is distinct while obviously belonging to one system.
 *
 * Why generated rather than stock media:
 *   - no licensing exposure on a client's production site
 *   - a few KB of canvas instead of multi-megabyte video, so it costs
 *     essentially nothing on mobile data
 *   - it cannot compete with the headline, because its contrast is
 *     controlled rather than inherited from a photograph
 *
 * Behaviour by motion profile:
 *   minimal  one static frame, no loop, no pointer response
 *   reduced  slow drift, fewer fields, no pointer response
 *   full     full drift plus mouse-responsive parallax
 */

export type HeroVariant =
  | "signal" /* homepage, services — ascending energy */
  | "weave" /* industries, work — interlocking fields */
  | "depth" /* about, team, process — layered calm */
  | "focus"; /* contact, tools — converging on a point */

interface Field {
  x: number;
  y: number;
  r: number;
  hue: "accent" | "ink" | "warm";
  driftX: number;
  driftY: number;
  phase: number;
  alpha: number;
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

const PALETTE: Record<Field["hue"], string> = {
  // Kept deliberately desaturated — the interface stays minimal.
  accent: "239, 135, 22",
  ink: "23, 25, 28",
  warm: "170, 90, 10",
};

function buildFields(seed: string, variant: HeroVariant, count: number): Field[] {
  const rand = seeded(`${seed}:${variant}`);
  const fields: Field[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);

    // Each variant lays its fields out differently, so pages read distinctly.
    let x: number;
    let y: number;
    switch (variant) {
      case "signal":
        x = 0.12 + t * 0.85 + (rand() - 0.5) * 0.12;
        y = 0.9 - Math.pow(t, 1.6) * 0.72 + (rand() - 0.5) * 0.12;
        break;
      case "weave":
        x = rand();
        y = 0.25 + Math.sin(t * Math.PI * 1.5) * 0.3 + (rand() - 0.5) * 0.2;
        break;
      case "depth":
        x = 0.2 + rand() * 0.6;
        y = 0.15 + t * 0.7;
        break;
      case "focus":
      default:
        // Converging towards a point right of centre.
        x = 0.7 + (rand() - 0.5) * (1 - t) * 1.1;
        y = 0.5 + (rand() - 0.5) * (1 - t) * 1.1;
        break;
    }

    // Accent appears on roughly one field in three, never dominant.
    const roll = rand();
    const hue: Field["hue"] = roll > 0.72 ? "accent" : roll > 0.52 ? "warm" : "ink";

    fields.push({
      x,
      y,
      r: 0.25 + rand() * 0.42,
      hue,
      driftX: (rand() - 0.5) * 0.06,
      driftY: (rand() - 0.5) * 0.045,
      phase: rand() * Math.PI * 2,
      alpha: hue === "ink" ? 0.1 + rand() * 0.1 : 0.07 + rand() * 0.08,
    });
  }

  return fields;
}

export function HeroBackground({
  seed,
  variant = "signal",
  className,
}: {
  seed: string;
  variant?: HeroVariant;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profile = useMotionProfile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const minimal = profile === "minimal";
    const rich = profile === "full";

    const fields = buildFields(seed, variant, rich ? 7 : 4);

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    const start = performance.now();

    let pointerX = 0.5;
    let pointerY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;

    function resize() {
      if (!canvas || !ctx) return;
      /* Gradient fields are soft, so they survive a low backing store. Capping
         DPR at 1.5 roughly halves fill cost versus a retina-native canvas
         with no visible difference. */
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!ctx || width === 0 || height === 0) return;
      const t = (now - start) / 1000;

      pointerX += (targetX - pointerX) * 0.045;
      pointerY += (targetY - pointerY) * 0.045;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      const diagonal = Math.hypot(width, height);

      for (const f of fields) {
        const wobble = minimal ? 0 : Math.sin(t * 0.14 + f.phase);
        const wobble2 = minimal ? 0 : Math.cos(t * 0.1 + f.phase * 1.3);

        // Pointer parallax: nearer fields move further, giving depth.
        const parallax = rich ? (f.r - 0.25) * 0.5 : 0;
        const px = (pointerX - 0.5) * parallax;
        const py = (pointerY - 0.5) * parallax;

        const cx = (f.x + wobble * f.driftX + px) * width;
        const cy = (f.y + wobble2 * f.driftY + py) * height;
        const radius = f.r * diagonal * 0.55;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${PALETTE[f.hue]}, ${f.alpha})`);
        grad.addColorStop(0.55, `rgba(${PALETTE[f.hue]}, ${(f.alpha * 0.35).toFixed(4)})`);
        grad.addColorStop(1, `rgba(${PALETTE[f.hue]}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(now: number) {
      draw(now);
      if (visible && !minimal) raf = requestAnimationFrame(loop);
    }

    resize();
    draw(performance.now());

    const cleanups: (() => void)[] = [];

    if (!minimal) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && !document.hidden;
          cancelAnimationFrame(raf);
          if (visible) raf = requestAnimationFrame(loop);
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
        const onMove = (e: PointerEvent) => {
          targetX = e.clientX / window.innerWidth;
          targetY = e.clientY / window.innerHeight;
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        cleanups.push(() => window.removeEventListener("pointermove", onMove));
      }
    }

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resize();
        draw(performance.now());
      });
    };
    window.addEventListener("resize", onResize);
    cleanups.push(() => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", onResize);
    });

    return () => {
      cancelAnimationFrame(raf);
      for (const fn of cleanups) fn();
    };
  }, [seed, variant, profile]);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {/* Readability guard: keeps headline contrast constant regardless of
          where the fields happen to drift. */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/40 to-paper/85" />
    </div>
  );
}
