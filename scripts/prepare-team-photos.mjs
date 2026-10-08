/**
 * Produces web-ready derivatives of the team photographs.
 *
 * The only operation applied is trimming blank/transparent canvas, plus
 * format conversion. No crop of the subject, no scaling of features, no
 * retouching — the photographs themselves are untouched, and the originals
 * are kept as masters alongside the derivatives.
 *
 * Why this exists: gaurav-sharma.png is 739x1600, but 677px of that (42% of
 * the file) is transparent padding above and below the subject. The browser
 * sees a 0.46 aspect ratio, so any object-cover container crops the subject
 * severely while still showing large empty bands. Trimming to the real
 * content gives 739x923 (0.80), which sits naturally in a 4:5 frame.
 *
 * Run: node scripts/prepare-team-photos.mjs
 */
import sharp from "sharp";
import { readdir } from "node:fs/promises";

const DIR = "public/team";
const files = (await readdir(DIR)).filter((f) => /\.(png|webp|jpe?g)$/i.test(f));

for (const file of files) {
  if (file.includes("-trimmed")) continue;

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
