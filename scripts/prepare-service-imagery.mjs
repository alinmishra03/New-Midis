/**
 * Downloads and optimises the service card background photography.
 *
 * Each service gets exactly one photograph, chosen to match that service's
 * actual subject — see `SERVICE_PHOTOS` below. No image is shared by two
 * services, which is the whole point of the file: the previous imagery
 * repeated one illustration across six development pages and another across
 * three e-commerce pages.
 *
 * Source: Pexels. The Pexels licence permits commercial use and modification
 * without attribution (https://www.pexels.com/license/). Photographer credit
 * is recorded in `docs/service-imagery.md` anyway, so the provenance of every
 * file on the site can be traced.
 *
 * Output: public/images/services/<slug>.webp, 1600x1000. One file per service
 * is enough because `next/image` generates the responsive srcset and
 * re-encodes to AVIF/WebP per request (see `images.formats` in next.config).
 *
 * Every file is cropped to the same 8:5 landscape frame rather than kept at
 * its source ratio. Pexels returns a mix of landscape and tall portrait
 * originals, and a 1600x2844 portrait behind a wide card is both a heavy
 * download and an unpredictable crop. Cropping here — cover, never stretch,
 * so nothing is distorted — means every card gets the same treatment and the
 * largest file on the site drops from 376KB to well under 100KB.
 *
 * Re-runnable: skips any file already present unless --force is passed.
 *
 *   node scripts/prepare-service-imagery.mjs [--force]
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "images", "services");

/** The widest a card background is ever painted is ~1200px. */
const WIDTH = 1600;
const HEIGHT = 1000;
const QUALITY = 68;
/** Per-file budget. Card backgrounds never justify more. */
const MAX_BYTES = 120 * 1024;

/**
 * slug -> { id, subject }
 *
 * `subject` is what the photograph actually shows. It is not alt text: these
 * backgrounds are decorative and render with aria-hidden, so the subject
 * exists to document the choice and to make an accidental duplicate obvious
 * in review.
 */
export const SERVICE_PHOTOS = {
  /* ------------------------------------------------ strategy & design */
  "web-design": { id: 326514, subject: "Monitor displaying a web design layout in a studio workspace" },
  "ui-ux-design": { id: 196646, subject: "Sketchpad of interface wireframes beside a phone and keyboard" },
  "website-redesign": { id: 3471423, subject: "Designer sketching a replacement layout at a desk" },
  "graphic-design": { id: 6474450, subject: "Fan of printed colour swatches held open" },

  /* ---------------------------------------------------- development */
  "web-development": { id: 1102797, subject: "Syntax-highlighted source code filling a monitor" },
  "react-development": { id: 4578665, subject: "JavaScript component code on a laptop screen" },
  "nextjs-development": { id: 16129728, subject: "Developer at a multi-monitor build workstation" },
  "wordpress-development": { id: 261662, subject: "Hands editing a published post in a browser CMS" },

  /* ------------------------------------------------------ e-commerce */
  "ecommerce-development": { id: 7190944, subject: "Laptop showing an online checkout form" },
  "shopify-development": { id: 7667442, subject: "Shopper selecting product variants in a storefront" },
  "woocommerce-development": { id: 7289725, subject: "Store owner fulfilling orders from a desk" },

  /* ---------------------------------------------------------- growth */
  seo: { id: 97080, subject: "Search performance charts and trend lines" },
  "technical-seo": { id: 139387, subject: "Site analytics and crawl data open on a laptop" },
  "ecommerce-seo": { id: 6608880, subject: "Customer browsing a product catalogue online" },
  "google-meta-ads": { id: 4048095, subject: "Paid social advertisement rendered in a feed" },
  "content-writing": { id: 8036328, subject: "Writer drafting at a laptop surrounded by reference books" },
  "video-editing": { id: 695730, subject: "Multi-track video editing timeline" },
  "youtube-management": { id: 34518967, subject: "Camera and microphone rig in a recording studio" },
  "email-marketing": { id: 5744250, subject: "Email inbox open on a handset" },

  /* -------------------------------------------------------------- AI */
  "ai-chatbot-development": { id: 30530409, subject: "Dark-themed assistant chat interface mid-conversation" },
  "chatgpt-integration": { id: 16094047, subject: "Operator working against an AI assistant on a laptop" },
  "openai-api-integration": { id: 17323801, subject: "Network equipment in a lit server hall" },
  "generative-ai-consultancy": { id: 17483873, subject: "Abstract render of a neural network" },
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Pexels serves .jpeg for most assets and .png for a few. Try both. */
async function download(id) {
  for (const ext of ["jpeg", "png"]) {
    const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&w=${WIDTH}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`could not download Pexels photo ${id}`);
}

/**
 * Crops to the shared frame and encodes, stepping quality down until the file
 * fits the budget.
 *
 * A flat quality is the wrong tool here: most of these land around 40KB at
 * q68, but the two that are mostly fine text (a code editor, pencil on graph
 * paper) came out at 349KB and 180KB, because WebP spends its bits on detail
 * that a card background renders at a third of this size and behind an
 * overlay. Stepping those two down costs nothing visible and keeps the
 * heaviest card background on the site under 120KB.
 */
async function encode(raw) {
  const base = sharp(raw).resize({
    width: WIDTH,
    height: HEIGHT,
    fit: "cover",
    // Keeps the subject in frame when a tall original is cropped to a wide
    // one, rather than slicing the middle out of a phone screen.
    position: sharp.strategy.attention,
  });

  let buf = await base.clone().webp({ quality: QUALITY, effort: 6 }).toBuffer();
  for (let q = QUALITY - 10; buf.length > MAX_BYTES && q >= 40; q -= 10) {
    buf = await base.clone().webp({ quality: q, effort: 6 }).toBuffer();
  }
  return buf;
}

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(OUT_DIR, { recursive: true });

  // A duplicate id would silently reintroduce the problem this file exists to
  // fix, so fail loudly rather than write the same photo under two names.
  const ids = Object.values(SERVICE_PHOTOS).map((p) => p.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error(`duplicate photo ids: ${[...new Set(dupes)].join(", ")}`);

  const report = [];
  for (const [slug, { id, subject }] of Object.entries(SERVICE_PHOTOS)) {
    const out = join(OUT_DIR, `${slug}.webp`);
    if (!force && (await exists(out))) {
      const { size } = await sharp(await readFile(out)).metadata();
      report.push(`  = ${slug}.webp (kept)`);
      void size;
      continue;
    }

    const raw = await download(id);
    const buf = await encode(raw);
    await writeFile(out, buf);

    const meta = await sharp(buf).metadata();
    report.push(
      `  + ${slug}.webp  ${meta.width}x${meta.height}  ${(buf.length / 1024).toFixed(0)}KB  pexels:${id}  — ${subject}`,
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`service imagery -> public/images/services (${Object.keys(SERVICE_PHOTOS).length} files)`);
  console.log(report.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
