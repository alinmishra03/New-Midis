/**
 * Produces web-ready derivatives of the team photographs.
 *
 * The only operations applied are trimming blank/transparent canvas and
 * format conversion. No crop of the subject, no scaling of features, no
 * retouching — the photographs themselves are untouched, and the originals
 * are kept as masters alongside the derivatives.
 *
 * PASS 1 — trim transparent canvas.
 *
 * gaurav-sharma.png is 739x1600, but 677px of that (42% of the file) is
 * transparent padding above and below the subject. The browser sees a 0.46
 * aspect ratio, so any object-cover container crops the subject severely
 * while still showing large empty bands. Trimming to the real content gives
 * 739x923 (0.80), which sits naturally in a 4:5 frame.
 *
 * PASS 2 — encode the 2026-10-14 portraits.
 *
 * MIDIS supplied nine JPEGs named after the people in them, at 1600x2000 and
 * 560KB-1.1MB each. They are re-encoded to WebP at 1200x1500 and named by
 * slug, which is what content/company.ts points at. 1200 is 3x the widest
 * box any of them renders in (the /team grid caps at 25vw), so the cap costs
 * nothing visible and takes the set from 7.2MB to roughly a tenth of that.
 * The JPEGs stay in place as masters.
 *
 * Both passes are idempotent — nothing is overwritten in place.
 *
 * Run: node scripts/prepare-team-photos.mjs
 */
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const DIR = "public/team";
const files = (await readdir(DIR)).filter((f) => /\.(png|webp|jpe?g)$/i.test(f));

/* ---------------------------------------------------- pass 1: trim canvas */

for (const file of files) {
  if (file.includes("-trimmed")) continue;
  /* Pass 2 owns these; they are opaque anyway. */
  if (/^[A-Z]/.test(file) && file.endsWith(".jpg")) continue;

  const src = `${DIR}/${file}`;
  const before = await sharp(src).metadata();

  /*
   * Only images with an alpha channel are candidates.
   *
   * sharp's trim() on an OPAQUE image removes border pixels matching the
   * corner colour — which on a photograph means cropping real content, not
   * padding. An earlier version of this script did exactly that to the eight
   * opaque team portraits. Transparency is the only safe signal that the
   * border is canvas rather than photograph.
   */
  if (!before.hasAlpha) {
    console.log(`${file}: ${before.width}x${before.height} — opaque, not a trim candidate`);
    continue;
  }

  const { data, info } = await sharp(src)
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });

  const trimmedPct = Math.round((1 - (info.height * info.width) / (before.height * before.width)) * 100);

  // Only emit a derivative where trimming actually recovers meaningful area.
  if (trimmedPct < 2) {
    console.log(`${file}: ${before.width}x${before.height} — no meaningful padding, left as is`);
    continue;
  }

  const ext = file.endsWith(".png") ? "png" : "webp";
  const out = `${DIR}/${file.replace(/\.(png|webp|jpe?g)$/i, "")}-trimmed.${ext}`;

  await sharp(data)
    [ext === "png" ? "png" : "webp"]({ quality: 92, compressionLevel: 9 })
    .toFile(out);

  console.log(
    `${file}: ${before.width}x${before.height} (${(before.width / before.height).toFixed(2)}) ` +
      `-> ${info.width}x${info.height} (${(info.width / info.height).toFixed(2)}), ${trimmedPct}% padding removed`,
  );
  console.log(`   written: ${out}`);
}

/* ------------------------------------------- pass 2: the supplied portraits */

/**
 * Master file -> published slug.
 *
 * The names are MIDIS's own, read from the filenames they supplied. No
 * identification is made from the photographs themselves.
 */
const PORTRAITS = {
  "Alin Mishra.jpg": "alin-mishra",
  "Chanda Angral.jpg": "chanda-angral",
  "Mritunjai Upadhyay.jpg": "mritunjai-upadhyay",
  "Navkirat Bhogal.jpg": "navkirat-bhogal",
  "Ojasvinny Saini.jpg": "ojasvinny-saini",
  "Rahul Gehlot.jpg": "rahul-gehlot",
  "Shivani Dixit.jpg": "shivani-dixit",
  "Simar.jpg": "simar",
  "Swayam Gandhi.jpg": "swayam-gandhi",
};

const MAX_W = 1200;
const MAX_H = 1500;

console.log("\n--- supplied portraits");
for (const [file, slug] of Object.entries(PORTRAITS)) {
  const src = `${DIR}/${file}`;
  if (!existsSync(src)) {
    console.log(`MISS  ${file} — not found`);
    continue;
  }
  const before = await sharp(src).metadata();
  const out = `${DIR}/${slug}.webp`;

  /* toFile resolves to the output info directly, not to { info }. */
  const info = await sharp(src)
    .resize({ width: MAX_W, height: MAX_H, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(out);

  console.log(
    `${file.padEnd(26)} ${before.width}x${before.height} -> ${info.width}x${info.height}  ` +
      `${(info.size / 1024).toFixed(0)} KB  -> ${out}`,
  );
}
