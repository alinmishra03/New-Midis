"use client";

import { useEffect, useRef } from "react";
import { useAllowsRichMotion } from "@/lib/motion";

/**
 * Layered hero showcase.
 *
 * WHY IT IS ABSTRACT RATHER THAN SCREENSHOTS
 *
 * The brief asks for real MIDIS project visuals and says to build an
 * abstract composition if none are available. None are: content/evidence.ts
 * is empty by design, and the Phase 1 audit found the old site's portfolio
 * imagery was stock photography with hash-named files rather than delivered
 * work. Mocking up a convincing "client site" here would be inventing the
 * portfolio the rest of this project refuses to fake — and it would be the
 * most prominent lie on the page.
 *
 * So the composition is unmistakably a diagram: wireframe blocks, no
 * headings, no screenshots, no numbers, no logos. It shows the shape of what
 * MIDIS builds — a responsive site, a store, measurable growth — without
 * claiming any particular one exists. The one piece of real text is the URL
 * pill, which reads midis.in because that is MIDIS's own address.
 *
 * Swap in real screenshots the moment the portfolio lands; the frames are
 * already the right shape for them.
 *
 * MOTION
 *
 * Pointer parallax runs only on the "full" profile — never on touch, small
 * or low-powered devices, and never under prefers-reduced-motion. The layers
 * move on transform alone, so nothing here can shift the layout, and the
 * whole thing is aria-hidden because it carries no information the copy
 * beside it does not already state.
 */

/** Depth per layer: how far each one travels, in px, at full deflection. */
const DEPTH = { frame: 6, mobile: 16, commerce: 22, glow: 10 } as const;

export function HeroShowcase({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rich = useAllowsRichMotion();

  useEffect(() => {
    if (!rich) return;
    const root = rootRef.current;
    if (!root) return;

    const layers = [...root.querySelectorAll<HTMLElement>("[data-depth]")];
    if (layers.length === 0) return;

    let frame = 0;
    /* Eased towards the pointer so entering and leaving are smooth rather
       than snapping to the first event. */
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let settling = false;

    const apply = () => {
      frame = 0;
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      for (const layer of layers) {
        const depth = Number(layer.dataset.depth ?? 0);
        layer.style.setProperty("--px", `${(currentX * depth).toFixed(2)}px`);
        layer.style.setProperty("--py", `${(currentY * depth).toFixed(2)}px`);
      }

      /* Keep stepping until the easing has essentially arrived, so letting
         go of the pointer still glides home instead of freezing part-way. */
      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        frame = requestAnimationFrame(apply);
      } else {
        settling = false;
      }
    };

    const schedule = () => {
      settling = true;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      /* -1..1 from the centre of the composition. */
      targetX = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
      targetY = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
      schedule();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    /* Off-screen the composition does no work at all. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return;
        cancelAnimationFrame(frame);
        frame = 0;
        settling = false;
        onLeave();
      },
      { threshold: 0 },
    );
    observer.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onLeave);
      void settling;
    };
  }, [rich]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      /*
        A fixed aspect ratio, so the column it sits in is the same height
        before and after this paints — and a max width, because the ratio on
        its own let it reach 595px tall in a 744px column at 1920 and pushed
        the CTAs off the first screen. Landscape suits the composition in any
        case: the desktop frame inside it is itself about 16:10.
      */
      className={`hero-showcase pointer-events-none relative mx-auto aspect-[16/11] w-full max-w-[34rem] select-none ${className ?? ""}`}
    >
      {/* Warm wash behind the stack, the same accent already used elsewhere
          in the hero background. */}
      <span
        data-depth={DEPTH.glow}
        className="hero-layer accent-glow absolute left-[12%] top-[8%] h-[70%] w-[70%] rounded-full opacity-[0.1] blur-3xl"
      />

      {/* ------------------------------------------------- desktop frame */}
      <div
        data-depth={DEPTH.frame}
        className="hero-layer absolute right-0 top-0 w-[85%] overflow-hidden rounded-xl border border-line bg-surface shadow-[0_30px_70px_-40px_rgba(23,25,28,0.5)]"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            <span className="h-2 w-2 rounded-full bg-ink/15" />
          </span>
          <span className="ml-1 flex h-5 flex-1 items-center rounded-full bg-paper px-2.5 text-[0.5rem] tracking-wide text-muted">
            midis.in
          </span>
        </div>

        <div className="p-4">
          {/* Site nav */}
          <div className="flex items-center justify-between">
            <span className="h-2 w-10 rounded-full bg-ink/25" />
            <span className="flex gap-1.5">
              <span className="h-1.5 w-5 rounded-full bg-ink/10" />
              <span className="h-1.5 w-5 rounded-full bg-ink/10" />
              <span className="h-1.5 w-5 rounded-full bg-ink/10" />
            </span>
          </div>

          {/* Headline and body blocks */}
          <div className="mt-5 space-y-2">
            <span className="block h-3.5 w-[72%] rounded bg-ink/80" />
            <span className="block h-3.5 w-[52%] rounded bg-accent" />
          </div>
          <div className="mt-3.5 space-y-1.5">
            <span className="block h-1.5 w-[86%] rounded-full bg-ink/12" />
            <span className="block h-1.5 w-[64%] rounded-full bg-ink/12" />
          </div>

          {/* CTA pair */}
          <div className="mt-4 flex gap-2">
            <span className="h-4 w-14 rounded-full bg-accent" />
            <span className="h-4 w-12 rounded-full border border-ink/15" />
          </div>

          {/*
            The growth motif from the MIDIS logo mark, as a static bar field
            that draws up once on entry. Decorative and unlabelled — there is
            no axis and no figure, because there is no measured result here
            to put on one.
          */}
          <div className="mt-5 flex h-14 items-end gap-[3px] border-t border-line pt-3">
            {HERO_BARS.map((height, i) => (
              <span
                key={i}
                className="hero-bar flex-1 rounded-t-[2px] bg-accent"
                style={{ height: `${height}%`, opacity: 0.25 + (i / HERO_BARS.length) * 0.6, animationDelay: `${520 + i * 45}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- phone frame */}
      <div
        data-depth={DEPTH.mobile}
        className="hero-layer hero-float absolute bottom-[3%] left-0 w-[24%] overflow-hidden rounded-[0.9rem] border border-line bg-surface p-2.5 shadow-[0_24px_50px_-30px_rgba(23,25,28,0.55)]"
      >
        <span className="mx-auto mb-2 block h-1 w-6 rounded-full bg-ink/15" />
        <span className="block h-2 w-8 rounded-full bg-ink/25" />
        <div className="mt-2.5 space-y-1.5">
          <span className="block h-2.5 w-[80%] rounded bg-ink/70" />
          <span className="block h-2.5 w-[55%] rounded bg-accent" />
        </div>
        <div className="mt-2 space-y-1">
          <span className="block h-1 w-full rounded-full bg-ink/12" />
          <span className="block h-1 w-[70%] rounded-full bg-ink/12" />
        </div>
        <span className="mt-2.5 block h-3.5 w-full rounded-full bg-accent/85" />
      </div>

      {/* ------------------------------------------------ commerce chip */}
      <div
        data-depth={DEPTH.commerce}
        className="hero-layer hero-float-slow absolute bottom-0 right-0 w-[31%] rounded-xl border border-line bg-surface p-3 shadow-[0_24px_50px_-30px_rgba(23,25,28,0.55)]"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.5L20 7H6" />
              <circle cx="10" cy="19.5" r="1.2" />
              <circle cx="17" cy="19.5" r="1.2" />
            </svg>
          </span>
          <span className="h-1.5 flex-1 rounded-full bg-ink/15" />
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <span className="block aspect-square rounded bg-ink/[0.07]" />
          <span className="block aspect-square rounded bg-ink/[0.07]" />
          <span className="block aspect-square rounded bg-ink/[0.07]" />
        </div>
        <span className="mt-2 block h-1 w-[60%] rounded-full bg-ink/12" />
      </div>
    </div>
  );
}

/* Heights as percentages: the same exponential rise the logo mark describes
   and the canvas band below lg already draws, so the two read as one idea. */
const HERO_BARS = [12, 18, 15, 26, 34, 30, 45, 58, 52, 70, 84, 100];
