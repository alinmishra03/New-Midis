import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A photograph used as the background of an existing card.
 *
 * Not an image block. It paints *behind* the card's own content — no height
 * is added, no column is introduced, nothing above the heading moves. Drop it
 * in as the first child of a card that is `relative isolate overflow-hidden`
 * and rounded, and the card looks the same shape as before with a photographic
 * ground under the type.
 *
 * `isolate` on the card is load-bearing. This sits at `-z-10` so the card's
 * own in-flow content paints over it without every heading and paragraph
 * needing its own `relative z-10`; without a stacking context on the card,
 * that negative layer would escape behind the section background instead.
 *
 * Layering, bottom to top:
 *
 *   1. the photograph, `object-cover` so it fills without distorting
 *   2. a scrim: a diagonal gradient, opaque where the type starts and
 *      thinning toward the far corner
 *   3. (the card's own content, which is not this component's concern)
 *
 * Readability
 * -----------
 * The opacity and scrim values are not taste, they are measured.
 * `scripts/check-card-contrast.mjs` recreates this exact stack in software
 * for all 23 photographs, finds the single worst pixel on each card, and
 * computes WCAG 2.2 contrast against every text colour that appears on it.
 * Worst case across the whole set, on the thinnest scrim, at hover opacity:
 *
 *   light cards ... worst ground L 0.654 (nextjs-development)
 *     body     #595B60 ........ 4.56:1   PASS  (normal text, needs 4.5)
 *     heading  #17191C ....... 11.81:1   PASS
 *     label    #8A4A08 ........ 4.60:1   PASS  (11px, so held to 4.5 not 3.0)
 *   dark cards .... worst ground L 0.064 (seo)
 *     body     #FFFFFF/60 ..... 4.51:1   PASS
 *     body     #FFFFFF/65 ..... 4.99:1   PASS
 *     heading  #FFFFFF ........ 9.18:1   PASS
 *
 * Two of the site's text colours could not be re-used here, and the reason is
 * the same for both: they were already at the edge before a photograph was
 * involved. `--color-muted` (#777777) is 4.48:1 on plain white and
 * `--color-accent-ink` (#AA5A0A) is 5.03:1, so any ground at all pushes them
 * under. Image-backed cards use `--color-muted-strong` and
 * `--color-accent-ink-strong` instead. Nothing else on the site changes, and
 * no text was made more transparent to let the picture through — the picture
 * gives way to the text, never the other way round.
 *
 * Mobile uses a heavier scrim than desktop: the same card is a third of the
 * width, so the type crosses far more of the photograph.
 *
 * Changing any number here invalidates the table above. Re-run the script.
 */
export function CardMedia({
  src,
  tone = "light",
  sizes,
  priority = false,
  className,
  /** Lifts the photograph a little on hover. Card must be `group`. */
  intensifyOnHover = false,
}: {
  src: string;
  /** `light` for cards with dark type; `dark` for cards with light type. */
  tone?: "light" | "dark";
  /** Rendered width at each breakpoint, so Next serves a right-sized file. */
  sizes: string;
  priority?: boolean;
  className?: string;
  intensifyOnHover?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      /*
        `rounded-[inherit]` rather than a fixed radius: every card this sits
        in has its own corner (2xl on the hub and related cards, xl on the
        homepage rows), and the background must be clipped to whichever one
        it finds itself inside.
      */
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]",
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        /*
          Decorative, so it never blocks first paint: everything except an
          explicitly prioritised card lazy-loads. `fill` inside a positioned
          parent reserves the box, so none of this can shift layout.

          The filter is doing the heavy lifting, and it is why the photographs
          are visible here at all.

          A straight photograph behind type forces a choice between a scrim
          thick enough for the darkest pixel in the picture and a picture you
          can actually see — and the darkest pixel sets the scrim for the
          whole card, so one shadowed corner washes out all 23. Compressing
          the tonal range first removes that: `contrast(0.26) brightness(1.59)`
          maps the photograph into roughly #969696-to-white, so no pixel can
          ever be dark, and the scrim then only has to manage a known floor
          instead of a worst case. The photograph ends up carrying about 37%
          of the card at its strongest corner rather than 8%, while the ground
          under the type gets *lighter* than it was. The dark variant is the
          same trick inverted, compressing into black-to-#787878.

          The desaturation on the front is what makes 23 photographs from 23
          photographers read as one set rather than a collage.
        */
        className={cn(
          "object-cover",
          tone === "light"
            ? "[filter:saturate(0.82)_contrast(0.26)_brightness(1.59)]"
            : "[filter:saturate(0.8)_contrast(0.846)_brightness(0.51)]",
          tone === "light" ? "opacity-[0.62]" : "opacity-[0.76]",
          intensifyOnHover &&
            "transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] motion-reduce:transition-none",
          intensifyOnHover && (tone === "light" ? "group-hover:opacity-70" : "group-hover:opacity-[0.88]"),
        )}
      />

      {/*
        The scrim. Three stops rather than two so the opaque end holds across
        the whole corner the heading sits in, instead of starting to thin
        immediately.
      */}
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          tone === "light"
            ? "from-surface/90 via-surface/[0.76] to-surface/[0.54] sm:from-surface/85 sm:via-surface/[0.66] sm:to-surface/40"
            : "from-ink/[0.88] via-ink/[0.76] to-ink/[0.56] sm:from-ink/[0.83] sm:via-ink/[0.67] sm:to-ink/[0.44]",
        )}
      />
    </span>
  );
}
