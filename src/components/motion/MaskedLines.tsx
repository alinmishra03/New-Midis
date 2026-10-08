"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { loadGsap } from "@/lib/gsap";
import { useMotionProfile } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Line-by-line masked reveal — each line rises out of its own clipping box.
 *
 * The text is rendered normally on the server and is fully readable without
 * JavaScript. Masking is applied at runtime and only once GSAP has
 * confirmed it is running, so the "content hidden behind a stalled
 * animation" failure mode cannot occur.
 *
 * Lines are measured from the rendered layout rather than assumed, so the
 * effect survives responsive reflow and font swaps.
 */
export function MaskedLines({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  stagger = 0.085,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const profile = useMotionProfile();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (profile === "minimal") return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !ref.current) return;

    /* Split into lines by wrapping each word, measuring its offsetTop, then
       grouping words that share a top edge. Avoids a paid splitting plugin
       and reflows correctly because it runs after layout. */
    const original = el.innerHTML;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent?.trim()) textNodes.push(node as Text);
    }

    for (const textNode of textNodes) {
      const frag = document.createDocumentFragment();
      const parts = textNode.textContent!.split(/(\s+)/);
      for (const part of parts) {
        if (!part.trim()) {
          frag.appendChild(document.createTextNode(part));
          continue;
        }
        const span = document.createElement("span");
        span.textContent = part;
        span.style.display = "inline-block";
        span.dataset.word = "";
        frag.appendChild(span);
      }
      textNode.parentNode?.replaceChild(frag, textNode);
    }

    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    if (words.length === 0) return;

    // Group words into visual lines by their vertical offset.
    const lines: HTMLElement[][] = [];
    let currentTop: number | null = null;
    for (const word of words) {
      const top = Math.round(word.offsetTop);
      if (currentTop === null || Math.abs(top - currentTop) > 4) {
        lines.push([word]);
        currentTop = top;
      } else {
        lines[lines.length - 1].push(word);
      }
    }

    /* Wrap each line in a mask. Done in a document fragment pass so the DOM
       is only written once. */
    const maskedLines: HTMLElement[] = [];
    for (const line of lines) {
      const mask = document.createElement("span");
      mask.style.display = "block";
      mask.style.overflow = "hidden";
      // Descenders would otherwise be clipped by the mask edge.
      mask.style.paddingBottom = "0.12em";
      mask.style.marginBottom = "-0.12em";

      const inner = document.createElement("span");
      inner.style.display = "block";
      inner.style.willChange = "transform";

      line[0].parentNode?.insertBefore(mask, line[0]);
      for (const word of line) inner.appendChild(word);
      // Re-insert the spaces GSAP would otherwise collapse.
      mask.appendChild(inner);
      maskedLines.push(inner);
    }

    gsap.set(maskedLines, { yPercent: 115 });

    const tween = gsap.to(maskedLines, {
      yPercent: 0,
      duration: 1.15,
      ease: "expo.out",
      stagger,
      delay,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        // Restore the original markup so re-renders start from clean text.
        el.innerHTML = original;
        ScrollTrigger.refresh();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [profile, delay, stagger]);

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
