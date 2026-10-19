/**
 * Measures the worst-case text contrast on every image-backed card.
 *
 * `CardMedia` claims specific WCAG figures in its doc comment. This recomputes
 * them from the actual photographs rather than from the theoretical
 * "what if the photo were pure black" case, so a photo that is brighter or
 * darker than expected cannot quietly push a card under 4.5:1.
 *
 * It reproduces the rendered stack in software:
 *
 *   card background colour
 *     -> photograph, object-cover, CSS filter, at the component's opacity
 *       -> the three-stop diagonal scrim
 *
 * then walks every pixel, converts to WCAG relative luminance, and takes the
 * single worst pixel on the card — the darkest ground under dark type, the
 * lightest under light type. Text rarely sits on that exact pixel, so every
 * figure printed here is pessimistic by design.
 *
 * Both the resting and the hover opacity are checked, and both the mobile and
 * the desktop scrim, because the mobile card is a third of the width and its
 * type crosses far more of the picture.
 *
 *   node scripts/check-card-contrast.mjs
 *
 * Exits non-zero if any combination falls below its WCAG floor.
 */
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public", "images", "services");

/* ------------------------------------------------------------- colour */

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** WCAG 2.2 relative luminance from 0-255 channels. */
function luminance(r, g, b) {
  return (
    0.2126 * srgbToLinear(r / 255) +
    0.7152 * srgbToLinear(g / 255) +
    0.0722 * srgbToLinear(b / 255)
  );
}

const contrast = (l1, l2) =>
  (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/* ------------------------------------------------- the rendered stack */

/**
 * `bg-gradient-to-br` with three stops. CSS resolves a corner keyword to an
 * angle whose perpendicular passes through the other two corners; projecting
 * onto the box diagonal matches it at the corners and midpoint, which is
 * where the stops are, so it is accurate enough for a bound.
 */
function scrimAlpha(stops, x, y, w, h) {
  const t = (x / (w - 1) + y / (h - 1)) / 2;
  const [a0, a1, a2] = stops;
  return t <= 0.5 ? a0 + (a1 - a0) * (t / 0.5) : a1 + (a2 - a1) * ((t - 0.5) / 0.5);
}

/**
 * CSS `contrast(c) brightness(b)`, per channel, exactly as the browser does
 * it: contrast pivots on mid-grey, brightness scales, then the result clamps.
 *
 * `saturate()` is left out on purpose. It redistributes a pixel between its
 * channels without changing how light or dark it is in the direction that
 * matters here, and modelling it would only add a way for this check to
 * disagree with the browser.
 */
const applyFilter = (v, { contrast: c, brightness: b }) =>
  Math.min(255, Math.max(0, ((v - 127.5) * c + 127.5) * b));

/**
 * Worst ground luminance on a card, and where it is.
 * `dir` is "min" for dark type on a light card, "max" for the reverse.
 */
async function worstGround({ file, base, scrim, imageOpacity, filter, dir, w, h }) {
  const { data } = await sharp(file)
    .resize(w, h, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let worst = dir === "min" ? Infinity : -Infinity;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const a = scrimAlpha(scrim, x, y, w, h);
      const px = [0, 1, 2].map((k) => {
        const img = applyFilter(data[i + k], filter);
        const overBase = imageOpacity * img + (1 - imageOpacity) * base[k];
        return a * scrim[3][k] + (1 - a) * overBase;
      });
      const l = luminance(...px);
      if (dir === "min" ? l < worst : l > worst) worst = l;
    }
  }
  return worst;
}

/* ------------------------------------------------------------ the spec */

const WHITE = [255, 255, 255];
const INK = hex("#17191c");

/* The two CSS filter chains CardMedia applies, as numbers. */
const LIGHT_FILTER = { contrast: 0.26, brightness: 1.59 };
const DARK_FILTER = { contrast: 0.846, brightness: 0.51 };

/**
 * Each case mirrors one set of classes CardMedia emits. These must be kept in
 * step with the component by hand — a check that silently drifts from what
 * ships is worse than no check, so if you change a number there, change it
 * here and re-run.
 */
const CASES = [
  {
    name: "light card, mobile scrim, resting",
    base: WHITE,
    scrim: [0.9, 0.76, 0.54, WHITE],
    filter: LIGHT_FILTER,
    imageOpacity: 0.62,
    dir: "min",
    w: 360,
    h: 320,
  },
  {
    name: "light card, mobile scrim, hover",
    base: WHITE,
    scrim: [0.9, 0.76, 0.54, WHITE],
    filter: LIGHT_FILTER,
    imageOpacity: 0.7,
    dir: "min",
    w: 360,
    h: 320,
  },
  {
    name: "light card, desktop scrim, resting",
    base: WHITE,
    scrim: [0.85, 0.66, 0.4, WHITE],
    filter: LIGHT_FILTER,
    imageOpacity: 0.62,
    dir: "min",
    w: 400,
    h: 300,
  },
  {
    name: "light card, desktop scrim, hover",
    base: WHITE,
    scrim: [0.85, 0.66, 0.4, WHITE],
    filter: LIGHT_FILTER,
    imageOpacity: 0.7,
    dir: "min",
    w: 400,
    h: 300,
  },
  {
    name: "dark lead card, desktop scrim, resting",
    base: INK,
    scrim: [0.83, 0.67, 0.44, INK],
    filter: DARK_FILTER,
    imageOpacity: 0.76,
    dir: "max",
    w: 760,
    h: 460,
    dark: true,
  },
  {
    name: "dark lead card, desktop scrim, hover",
    base: INK,
    scrim: [0.83, 0.67, 0.44, INK],
    filter: DARK_FILTER,
    imageOpacity: 0.88,
    dir: "max",
    w: 760,
    h: 460,
    dark: true,
  },
];

/** Text that actually appears on these cards, with its WCAG floor. */
const LIGHT_TEXT = [
  { label: "body  #595B60 (muted-strong)", colour: hex("#595b60"), floor: 4.5 },
  { label: "head   #17191C (ink)", colour: INK, floor: 4.5 },
  { label: "label  #8A4A08 (accent-ink-strong, 11px)", colour: hex("#8a4a08"), floor: 4.5 },
];

/** White at an alpha, composited over whatever ground the card produced. */
const DARK_TEXT = [
  { label: "body  #FFFFFF @ 60%", alpha: 0.6, floor: 4.5 },
  { label: "body  #FFFFFF @ 65%", alpha: 0.65, floor: 4.5 },
  { label: "head  #FFFFFF", alpha: 1, floor: 4.5 },
];

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".webp")).sort();
  let failures = 0;

  for (const c of CASES) {
    // Worst photograph in the set for this case, not the average.
    let worstL = c.dir === "min" ? Infinity : -Infinity;
    let worstFile = "";
    for (const f of files) {
      const l = await worstGround({ ...c, file: join(DIR, f) });
      if (c.dir === "min" ? l < worstL : l > worstL) {
        worstL = l;
        worstFile = f;
      }
    }

    console.log(`\n${c.name}`);
    console.log(`  worst ground: L=${worstL.toFixed(4)}  (${worstFile})`);

    for (const t of c.dark ? DARK_TEXT : LIGHT_TEXT) {
      let ratio;
      if (c.dark) {
        /*
          Translucent white text takes its colour partly from whatever is
          behind it, so the text moves with the ground. Only the ground's
          luminance matters to the result and compositing is monotonic in it,
          so stand in the neutral grey of equal luminance.
        */
        const grey = greyOfLuminance(worstL);
        const px = grey.map((g) => t.alpha * 255 + (1 - t.alpha) * g);
        ratio = contrast(luminance(...px), worstL);
      } else {
        ratio = contrast(luminance(...t.colour), worstL);
      }
      const ok = ratio >= t.floor;
      if (!ok) failures++;
      console.log(
        `    ${ok ? "PASS" : "FAIL"}  ${t.label.padEnd(34)} ${ratio.toFixed(2)}:1  (needs ${t.floor})`,
      );
    }
  }

  console.log(
    failures === 0
      ? "\nAll image-backed card text clears its WCAG floor against every photograph.\n"
      : `\n${failures} contrast check(s) failed.\n`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

/** The neutral grey with a given relative luminance. */
function greyOfLuminance(target) {
  let lo = 0;
  let hi = 255;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (luminance(mid, mid, mid) < target) lo = mid;
    else hi = mid;
  }
  const v = (lo + hi) / 2;
  return [v, v, v];
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
