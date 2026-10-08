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
