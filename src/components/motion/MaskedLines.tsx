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

    loadGsap().then(({ gsap }) => {
      if (cancelled || !ref.current) return;

      /* Split into lines by wrapping each word, measuring its offsetTop, then
         grouping words that share a top edge. Avoids a paid splitting plugin
         and reflows correctly because it runs after layout. */
      const original = el.innerHTML;
      const restore = () => {
        el.innerHTML = original;
      };

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim()) textNodes.push(node as Text);
      }

      /* Each word becomes an inline-block so its box can be measured. The
         whitespace between words stays as its own text node *between* those
         boxes — never inside one, where it would be collapsed away — so the
         words keep their natural spacing and their natural wrap points. */
      for (const textNode of textNodes) {
        const frag = document.createDocumentFragment();
        const parts = textNode.textContent!.split(/(\s+)/);
        for (const part of parts) {
          if (!part) continue;
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
      if (words.length === 0) {
        restore();
        return;
      }

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

      /* Wrap each line in a mask.
       *
       * The line is lifted with a Range rather than by moving the word spans
       * one at a time. That matters for two reasons: the inter-word
       * whitespace nodes travel with the words (moving only the spans leaves
       * every space behind, which is what jams a headline into one long
       * word), and `extractContents` clones any inline wrapper the range
       * only partially covers — so an accent `<span>` around part of a line
       * keeps colouring exactly the words it coloured before. */
      const maskedLines: HTMLElement[] = [];
      for (const line of lines) {
        const range = document.createRange();
        range.setStartBefore(line[0]);
        range.setEndAfter(line[line.length - 1]);
        const contents = range.extractContents();

        const mask = document.createElement("span");
        mask.style.display = "block";
        mask.style.overflow = "hidden";
        // Descenders would otherwise be clipped by the mask edge.
        mask.style.paddingBottom = "0.12em";
        mask.style.marginBottom = "-0.12em";

        const inner = document.createElement("span");
        inner.style.display = "block";
        inner.style.willChange = "transform";
        inner.appendChild(contents);

        mask.appendChild(inner);
        // The range collapsed to where the line was, so the mask lands there.
        range.insertNode(mask);
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
        /* This instance's own trigger and tween, and nothing else.
         *
         * A global ScrollTrigger.refresh() used to sit here, and it was the
         * cause of pages opening part-way down: refresh() snapshots the
         * current scroll position and restores it afterwards, so every
         * heading unmounting during a route change put the previous page's
         * scroll position back, a few milliseconds after the router had
         * correctly moved to the top. Measurements that genuinely need
         * refreshing after a route change are handled once, centrally, by
         * RouteTransition. */
        tween.scrollTrigger?.kill();
        tween.kill();
        // Restore the original markup so re-renders start from clean text.
        restore();
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
