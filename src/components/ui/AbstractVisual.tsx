import { cn } from "@/lib/utils";

/**
 * Original, generated section artwork.
 *
 * Deliberately NOT stock photography. Two reasons:
 *
 *  1. The audit that started this project found the previous site using
 *     stock photos and hash-named files in place of project work. Generic
 *     "business collaboration" imagery is precisely what undermined its
 *     credibility, and adding more would work against the positioning the
 *     rest of the site is built on.
 *  2. Licensing third-party photography into a client's production site is
 *     not something that can be done responsibly without the rights being
 *     established first.
 *
 * So each page gets an original composition instead: an abstract field drawn
 * from the ascending-bar growth motif inside the MIDIS logo mark, seeded
 * from the page slug so every page is visually distinct but unmistakably
 * part of one system.
 *
 * Rendered as inline SVG — a few hundred bytes, no network request, crisp at
 * any size, and no layout shift. Purely decorative, so it is hidden from
 * assistive technology.
 */

/** Small deterministic PRNG so a slug always produces the same artwork. */
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
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function AbstractVisual({
  seed,
  className,
  tone = "light",
}: {
  seed: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const rand = seeded(seed);

  const COLUMNS = 26;
  const WIDTH = 520;
  const HEIGHT = 320;
  const gap = WIDTH / COLUMNS;
  const barWidth = gap * 0.36;

  const line = tone === "dark" ? "rgba(255,255,255,0.10)" : "rgba(23,25,28,0.07)";

  // Which column the accent lands on — varies per page, always in the
  // upper half of the rise so it reads as a peak rather than noise.
  const accentIndex = Math.floor(COLUMNS * (0.55 + rand() * 0.4));

  const bars = Array.from({ length: COLUMNS }, (_, i) => {
    const progress = i / (COLUMNS - 1);
    const curve = Math.pow(progress, 1.75);
    const jitter = (rand() - 0.5) * 0.09;
    const h = Math.max(4, (curve + jitter) * HEIGHT * 0.86);
    return {
      x: i * gap + (gap - barWidth) / 2,
      y: HEIGHT - h,
      h,
      accent: i === accentIndex,
      opacity: 0.18 + curve * 0.8,
    };
  });

  // A single arc tracing the rise, echoing the curve in the logo mark.
  const arc = bars
    .filter((_, i) => i % 3 === 0)
    .map((b, i) => `${i === 0 ? "M" : "L"} ${(b.x + barWidth / 2).toFixed(1)} ${b.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax slice"
      className={cn("pointer-events-none select-none", className)}
    >
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x.toFixed(1)}
          y={b.y.toFixed(1)}
          width={barWidth.toFixed(1)}
          height={b.h.toFixed(1)}
          rx={Math.min(barWidth / 2, 3).toFixed(1)}
          fill={b.accent ? "#EF8716" : line}
          opacity={b.accent ? 0.85 : b.opacity.toFixed(2)}
        />
      ))}
      <path
        d={arc}
        fill="none"
        stroke="#EF8716"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  );
}
