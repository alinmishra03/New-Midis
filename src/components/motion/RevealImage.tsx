"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadGsap } from "@/lib/gsap";
import { useMotionProfile } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Editorial image reveal: a clip-path wipe with the image easing back from a
 * slight scale, so the frame uncovers the picture rather than the picture
 * fading in.
 *
 * Also supports an optional scroll-scrubbed drift, which is where GSAP's
 * ScrollTrigger genuinely beats a hand-rolled listener — it handles the
 * refresh, direction and cleanup correctly.
 *
 * The image is always present in the DOM and in the server HTML. Under
 * `minimal` motion nothing is applied at all.
 */
export function RevealImage({
  children,
  className,
  /** Adds a gentle scroll-linked drift on capable devices. */
  drift = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  drift?: boolean;
  delay?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const profile = useMotionProfile();

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    if (profile === "minimal") return;

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;

    loadGsap().then(({ gsap }) => {
      if (cancelled || !frameRef.current) return;
      ctx = gsap.context(() => {
      gsap.set(frame, { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(inner, { scale: 1.18 });

      const tl = gsap.timeline({
        delay,
        scrollTrigger: { trigger: frame, start: "top 88%", once: true },
      });

      tl.to(frame, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.3,
        ease: "expo.out",
      }).to(inner, { scale: 1, duration: 1.6, ease: "expo.out" }, 0);

      /* Scrubbed drift only where there is headroom for it. */
      if (drift && profile === "full") {
        gsap.fromTo(
          inner,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
      }, frame);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [profile, drift, delay]);

  return (
    <div ref={frameRef} className={cn("overflow-hidden", className)}>
      <div ref={innerRef} className="h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
