/**
 * Launch-readiness audit.
 *
 * Crawls the running site and checks the mechanical half of the brief's §20
 * QA list: status codes, metadata, canonicals, indexability, heading
 * structure, image alt text, structured-data validity, and sitemap
 * consistency.
 *
 * Usage: node scripts/qa.mjs http://localhost:3000
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const problems = [];
const warnings = [];
const pages = new Map();

function problem(page, msg) {
  problems.push({ page, msg });
}
function warn(page, msg) {
  warnings.push({ page, msg });
}

const attr = (html, re) => html.match(re)?.[1]?.trim();

/* ------------------------------------------------------------------ crawl */

const queue = ["/"];
const seen = new Set();

function internalise(href, from) {
  if (!href || /^(mailto:|tel:|#|javascript:)/i.test(href)) return null;
  try {
    const u = new URL(href, base + from);
    if (u.origin !== new URL(base).origin) return null;
    if (/\.(xml|txt|png|jpg|jpeg|webp|avif|svg|ico|js|css)$/i.test(u.pathname)) return null;
    return u.pathname;
  } catch {
    return null;
  }
}

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);

  const res = await fetch(base + path, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) continue;

  if (res.status !== 200) {
    problem(path, `returns HTTP ${res.status}`);
    continue;
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) continue;

  const html = await res.text();
  pages.set(path, html);

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const p = internalise(m[1], path);
    if (p && !seen.has(p)) queue.push(p);
  }
}

/* ----------------------------------------------------------- per-page QA */

const titles = new Map();
const descriptions = new Map();

for (const [path, html] of pages) {
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const description = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /rel="canonical" href="([^"]*)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/) ?? "";
  const noindex = /noindex/i.test(robots);

  // --- metadata presence
  if (!title) problem(path, "no <title>");
  else if (title.length > 65) warn(path, `title is ${title.length} chars (may truncate in SERPs)`);

  if (!description) problem(path, "no meta description");
  else if (description.length > 165)
    warn(path, `description is ${description.length} chars (may truncate)`);
  else if (description.length < 70)
    warn(path, `description is only ${description.length} chars`);

  // --- duplicate detection
  if (title) {
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(path);
  }
  if (description) {
    if (!descriptions.has(description)) descriptions.set(description, []);
    descriptions.get(description).push(path);
  }

  // --- canonical
  if (!canonical) problem(path, "no canonical tag");

  // --- headings
  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1s === 0) problem(path, "no <h1>");
  if (h1s > 1) problem(path, `${h1s} <h1> elements (should be exactly 1)`);

  // --- images
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)];
  const missingAlt = imgs.filter((m) => !/\salt=/.test(m[0]));
  if (missingAlt.length) problem(path, `${missingAlt.length} <img> without alt attribute`);

  // --- structured data validity
  for (const m of html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = data["@graph"] ?? [data];
      for (const node of [].concat(nodes)) {
        if (!node["@type"]) problem(path, "JSON-LD node without @type");
        // Fabricated-proof guard: these must never appear without real reviews.
        if (node["@type"] === "Review" || node.aggregateRating) {
          problem(path, `JSON-LD asserts ${node["@type"] ?? "aggregateRating"} — no verified reviews exist`);
        }
      }
    } catch {
      problem(path, "invalid JSON-LD (failed to parse)");
    }
  }

  // --- document basics
  if (!/<html[^>]+lang="/.test(html)) problem(path, "no lang attribute on <html>");
  if (!/name="viewport"/.test(html)) problem(path, "no viewport meta");

  // --- Open Graph
  if (!noindex && !/property="og:title"/.test(html)) warn(path, "no og:title");

  pages.set(path, html);
}

/* ------------------------------------------------------------ duplicates */

for (const [title, paths] of titles) {
  if (paths.length > 1) {
    // Identical titles are only acceptable when all but one are noindexed.
    const indexed = paths.filter((p) => !/noindex/i.test(pages.get(p) ?? ""));
    if (indexed.length > 1) {
      problem(indexed.join(", "), `duplicate <title>: "${title}"`);
    }
  }
}
for (const [desc, paths] of descriptions) {
  if (paths.length > 1) {
    const indexed = paths.filter((p) => !/noindex/i.test(pages.get(p) ?? ""));
    if (indexed.length > 1) {
      problem(indexed.join(", "), `duplicate meta description`);
    }
  }
}

/* --------------------------------------------------------------- sitemap */

const sitemapRes = await fetch(`${base}/sitemap.xml`);
if (!sitemapRes.ok) {
  problem("/sitemap.xml", `returns HTTP ${sitemapRes.status}`);
} else {
  const xml = await sitemapRes.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  if (locs.length === 0) problem("/sitemap.xml", "contains no URLs");

  for (const loc of locs) {
    const path = new URL(loc).pathname || "/";
    const html = pages.get(path);

    if (html === undefined) {
      const res = await fetch(base + path, { redirect: "manual" });
      if (res.status !== 200) {
        problem("/sitemap.xml", `lists ${path} which returns HTTP ${res.status}`);
      }
      continue;
    }
    // A sitemap entry that is also noindexed sends contradictory signals.
    if (/noindex/i.test(html)) {
      problem("/sitemap.xml", `lists ${path}, but that page is noindex`);
    }
  }

  // Indexable pages missing from the sitemap.
  const sitemapPaths = new Set(locs.map((l) => new URL(l).pathname || "/"));
  for (const [path, html] of pages) {
    if (/noindex/i.test(html)) continue;
    if (!sitemapPaths.has(path)) warn(path, "indexable but not listed in sitemap.xml");
  }
}

/* ---------------------------------------------------------------- robots */

const robotsRes = await fetch(`${base}/robots.txt`);
if (!robotsRes.ok) problem("/robots.txt", `returns HTTP ${robotsRes.status}`);
else {
  const txt = await robotsRes.text();
  if (!/Sitemap:/i.test(txt)) problem("/robots.txt", "does not reference the sitemap");
  if (/^Disallow:\s*\/\s*$/im.test(txt)) problem("/robots.txt", "disallows the whole site");
}

/* ----------------------------------------------------------------- 404s */

const notFound = await fetch(`${base}/this-page-should-not-exist-${Date.now()}`);
if (notFound.status !== 404) problem("404 handling", `unknown URL returns ${notFound.status}, expected 404`);

/* ---------------------------------------------------------------- report */

console.log(`\nQA audit — ${pages.size} HTML pages crawled\n`);

if (problems.length === 0) {
  console.log("✓ No blocking problems found.\n");
} else {
  console.log(`✗ ${problems.length} problem(s):\n`);
  for (const p of problems) console.log(`  [${p.page}]\n    ${p.msg}`);
  console.log("");
}

if (warnings.length) {
  console.log(`! ${warnings.length} warning(s):\n`);
  for (const w of warnings) console.log(`  [${w.page}] ${w.msg}`);
  console.log("");
}

process.exit(problems.length ? 1 : 0);
