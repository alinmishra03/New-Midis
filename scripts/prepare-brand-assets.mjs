/**
 * Produces web-ready derivatives of the ORIGINAL MIDIS logo files.
 *
 * The only operations applied are: trimming blank canvas, resizing
 * proportionally, and format conversion. Colours, proportions, geometry and
 * composition are untouched — the logo itself is never redrawn or recoloured.
 *
 * Source files (kept verbatim as the masters):
 *   public/brand/midis-icon.png            circular lockup, for LIGHT surfaces
 *   public/brand/midis-logo-horizontal.png white+orange wordmark, for DARK surfaces
 *
 * Run: node scripts/prepare-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/brand";
await mkdir(OUT, { recursive: true });

const icon = sharp("public/brand/midis-icon.png").trim({ threshold: 1 });
const wordmark = sharp("public/brand/midis-logo-horizontal.png").trim({ threshold: 1 });

await icon.clone().resize({ width: 512 }).png({ compressionLevel: 9 }).toFile(`${OUT}/icon-512.png`);
await icon.clone().resize({ width: 192 }).png({ compressionLevel: 9 }).toFile(`${OUT}/icon-192.png`);
await icon.clone().resize({ width: 180 }).png({ compressionLevel: 9 }).toFile(`${OUT}/apple-touch-icon.png`);
await icon.clone().resize({ width: 96 }).png({ compressionLevel: 9 }).toFile(`${OUT}/icon-96.png`);

await wordmark.clone().resize({ width: 960 }).png({ compressionLevel: 9 }).toFile(`${OUT}/wordmark-on-dark.png`);

const meta = await Promise.all([
  sharp(`${OUT}/icon-512.png`).metadata(),
  sharp(`${OUT}/wordmark-on-dark.png`).metadata(),
]);
console.log("icon-512:", `${meta[0].width}x${meta[0].height}`);
console.log("wordmark-on-dark:", `${meta[1].width}x${meta[1].height}`);

/* ==========================================================================
   favicon.ico
   --------------------------------------------------------------------------
   Next's `app/favicon.ico` file convention wins the browser tab: it emits
   <link rel="icon" href="/favicon.ico"> and browsers request that path
   directly regardless of the other declarations. The project shipped with
   the create-next-app default there, so the tab showed the Next.js mark
   while the correct MIDIS PNGs sat unused below it.

   sharp cannot write .ico, so the container is assembled here. A modern ICO
   may hold PNG payloads directly, which every browser since IE11 and
   Windows Vista reads, and which keeps the alpha channel intact so the
   transparent area around the circular mark stays transparent.

   The artwork is untouched: the same trimmed master, resized only.
   ========================================================================== */

const ICO_SIZES = [16, 32, 48];

const pngs = await Promise.all(
  ICO_SIZES.map((size) =>
    icon
      .clone()
      .resize({ width: size, height: size, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
);

const HEADER = 6;
const ENTRY = 16;
const header = Buffer.alloc(HEADER);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // 1 = icon
header.writeUInt16LE(ICO_SIZES.length, 4);

let offset = HEADER + ENTRY * ICO_SIZES.length;
const entries = ICO_SIZES.map((size, i) => {
  const e = Buffer.alloc(ENTRY);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width  (0 means 256)
  e.writeUInt8(size === 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // palette size, 0 for true colour
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});

const { writeFile } = await import("node:fs/promises");
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
console.log("favicon.ico:", ICO_SIZES.map((s) => `${s}x${s}`).join(", "));

/* ==========================================================================
   wordmark-on-light.png
   --------------------------------------------------------------------------
   The supplied horizontal wordmark is white-on-transparent, so it only works
   on dark surfaces — which is why the header carried the circular icon alone
   and why a dark-ink version sits at item 16 of docs/02-evidence-intake.md.

   This derives that variant rather than waiting for it. Letterforms,
   proportions, spacing and the orange accents are untouched; the only change
   is the white ink becoming the brand charcoal.

   Each pixel is placed on the white-to-orange axis by its red/blue spread —
   0 for white, 217 for #EF8716 — and interpolated between charcoal and the
   accent. Pixels that are already the accent come out bit-identical, and the
   antialiased boundary between a white letter and an orange accent stays
   smooth instead of banding at a threshold.
   ========================================================================== */

const INK = { r: 0x17, g: 0x19, b: 0x1c };
const ACCENT = { r: 0xef, g: 0x87, b: 0x16 };
const SPREAD = ACCENT.r - ACCENT.b;

const { data: wmData, info: wmInfo } = await wordmark
  .clone()
  .resize({ width: 960 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

let recoloured = 0;
for (let i = 0; i < wmData.length; i += wmInfo.channels) {
  if (wmData[i + 3] === 0) continue;
  const t = Math.min(1, Math.max(0, (wmData[i] - wmData[i + 2]) / SPREAD));
  if (t < 0.999) recoloured++;
  wmData[i] = Math.round(INK.r + (ACCENT.r - INK.r) * t);
  wmData[i + 1] = Math.round(INK.g + (ACCENT.g - INK.g) * t);
  wmData[i + 2] = Math.round(INK.b + (ACCENT.b - INK.b) * t);
}

await sharp(wmData, { raw: wmInfo }).png({ compressionLevel: 9 }).toFile(`${OUT}/wordmark-on-light.png`);
console.log("wordmark-on-light:", `${wmInfo.width}x${wmInfo.height}`, `(${recoloured} px moved off white)`);
