/**
 * Optimises client logos into public/images/clients/ and writes the manifest
 * the section reads.
 *
 * TWO BATCHES.
 *
 * Batch 1 was downloaded from each client's own website on 2026-10-12. Those
 * originals are not in the repository, so the rows are carried here verbatim
 * rather than re-derived — re-running this script must not drop them. Two of
 * that batch's downloads were discarded on inspection: a Maxxis tyre-brand
 * logo lifted from a supplier strip, and a photograph of the Burj Khalifa.
 * Both clients now have a real mark in batch 2.
 *
 * Batch 2 was supplied by MIDIS on 2026-10-14 and staged in public/logos/.
 * Those files stay where they are; this script only derives WebP copies, so
 * the originals are preserved.
 *
 * Colours are never touched. Where a mark turns out to be light-on-
 * transparent — drawn for a dark header — it is flagged so the card can give
 * it a dark panel to sit on, rather than recolouring someone's logo.
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const STAGE = "public/logos";
const OUT_DIR = "public/images/clients";
const MANIFEST = "src/content/client-logos.ts";

/**
 * Batch 2: the staged file for each client slug.
 *
 * Mapped by reading each file, not by guessing from its name — "hbq.png"
 * carries the HQB Pro Solutions mark and "GCC (1).png" the Gulf Connect
 * Consultancy one. Every slug below exists in content/clients.ts.
 */
const BATCH_2 = {
  "cozy-and-comfy": "cozy n comfy.png",
  "gulf-connect-consultancy": "GCC (1).png",
  "hqb-pro-solutions": "hbq.png",
  "mars-home-centre": "MArs home centre (3).png",
  "mounting-backend-service": "mbs.png",
  "menopause-relief-store": "menopause.png",
  "mobile-tyre-champions": "mtc.png",
  "the-thali-tales": "thali tales.png",
  tiv: "tiv.png",
  yogshala: "yogshala.png",
};

/** Batch 1, already installed. Menopause is re-cut from batch 2 and drops out. */
const BATCH_1 = [
  { slug: "alinkriti", src: "/images/clients/alinkriti.webp", width: 520, height: 180, onDark: true, source: "https://alinkriti.com/cdn/shop/files/A_8.png" },
  { slug: "aureus-hospitality", src: "/images/clients/aureus-hospitality.webp", width: 236, height: 240, onDark: true, source: "https://www.aureus-hospitality.com/logo.png" },
  { slug: "high-spirits", src: "/images/clients/high-spirits.webp", width: 139, height: 240, onDark: false, source: "https://www.highspirits.au/logo.png" },
  { slug: "nexus-fundings", src: "/images/clients/nexus-fundings.webp", width: 155, height: 240, onDark: false, source: "https://nexusfundings.com.au/wp-content/uploads/2025/04/logo-2.svg" },
  { slug: "sofisam", src: "/images/clients/sofisam.webp", width: 520, height: 86, onDark: true, source: "https://sofisam.com/logo.png" },
  { slug: "solar-spectrum", src: "/images/clients/solar-spectrum.webp", width: 520, height: 178, onDark: false, source: "https://www.solarspectrum.com.au/Asset%207.png" },
];

/* Display box is about 190x72 CSS px, so this is comfortably past 2x.
   withoutEnlargement means a small original is never upscaled — a soft mark
   is worse than a small one, and the card centres whatever it is given. */
const MAX_W = 520;
const MAX_H = 240;

mkdirSync(OUT_DIR, { recursive: true });

/**
 * How much of the mark would actually read against a white card.
 *
 * Mean luminance is the wrong question: the MRS mark is a pale disc with dark
 * lettering inside it, so its average is light while the mark itself is
 * perfectly legible on paper. What matters is whether ANY meaningful part of
 * it is dark enough to see — so this returns the share of opaque pixels with
 * enough contrast against white.
 */
async function readableShare(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let dark = 0;
  let opaque = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 160) continue;
    opaque++;
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    /* Roughly 3:1 against white, the non-text contrast floor. */
    if (luma < 150) dark++;
  }
  return opaque === 0 ? 0 : dark / opaque;
}

const rows = [...BATCH_1];

for (const [slug, file] of Object.entries(BATCH_2)) {
  const input = join(STAGE, file);
  if (!existsSync(input)) {
    console.log(`MISS  ${slug.padEnd(26)} ${file} not found`);
    continue;
  }

  const meta = await sharp(input).metadata();
  const { data, info } = await sharp(input)
    .resize({ width: MAX_W, height: MAX_H, fit: "inside", withoutEnlargement: true })
    /* Trims the transparent margin so the mark fills its box rather than
       floating in whitespace the card then pads again. */
    .trim({ threshold: 2 })
    .webp({ quality: 92, effort: 6 })
    .toBuffer({ resolveWithObject: true });

  writeFileSync(join(OUT_DIR, `${slug}.webp`), data);

  const readable = await readableShare(data);
  /*
   * Under a twelfth of the mark carrying real contrast means it was drawn for
   * a dark header. The figure is set from what the rendered grid actually
   * looked like: Alinkriti measures 5.7% and is barely visible on a white
   * card, while the MRS mark at 16% reads perfectly well.
   */
  const onDark = readable < 0.08;

  rows.push({
    slug,
    src: `/images/clients/${slug}.webp`,
    width: info.width,
    height: info.height,
    onDark,
    source: `public/logos/${file} (supplied by MIDIS, 2026-10-14)`,
  });

  console.log(
    `ok    ${slug.padEnd(26)} ${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)} -> ` +
      `${String(info.width).padStart(3)}x${String(info.height).padEnd(3)}  ${(data.length / 1024).toFixed(1)} KB  ` +
      `readable=${(readable * 100).toFixed(1)}%${onDark ? "  (light mark: needs a dark panel)" : ""}`,
  );
}

rows.sort((a, b) => a.slug.localeCompare(b.slug));

const file = `/**
 * Generated by scripts/prepare-client-logos.mjs — do not edit by hand.
 *
 * Authentic client marks. The 2026-10-12 batch was downloaded from each
 * client's own website; the 2026-10-14 batch was supplied by MIDIS and is
 * staged in public/logos/. Colours are untouched; only size and surrounding
 * whitespace changed.
 *
 * \`onDark\` means the mark is light-on-transparent — drawn for a dark header.
 * Those sit on a dark panel rather than being recoloured, because recolouring
 * someone's logo is not ours to do.
 *
 * Clients absent from this map have no authentic asset yet and render as a
 * text treatment. See content/clients.ts.
 */

export interface ClientLogoAsset {
  src: string;
  width: number;
  height: number;
  /** Light mark: give it a dark panel so it is visible on paper. */
  onDark: boolean;
  /** Where the original was obtained. */
  source: string;
}

export const clientLogos: Readonly<Record<string, ClientLogoAsset>> = {
${rows
  .map(
    (r) =>
      `  ${JSON.stringify(r.slug)}: { src: ${JSON.stringify(r.src)}, width: ${r.width}, height: ${r.height}, onDark: ${r.onDark}, source: ${JSON.stringify(r.source)} },`,
  )
  .join("\n")}
};
`;

writeFileSync(MANIFEST, file);
console.log(`\n${rows.length} logos in the manifest -> ${MANIFEST}`);
