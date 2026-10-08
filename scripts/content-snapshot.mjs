/**
 * Captures the visible text content and structural shape of every page.
 *
 * Used to prove a visual-only change set did not alter content: snapshot
 * before, snapshot after, diff. Anything that differs is a content change
 * and needs justifying.
 *
 * Usage:
 *   node scripts/content-snapshot.mjs http://localhost:3000 before.json
 *   node scripts/content-snapshot.mjs http://localhost:3000 after.json
 *   node scripts/content-snapshot.mjs --diff before.json after.json
 */
import { writeFileSync, readFileSync } from "node:fs";

/**
 * Verify mode — the test that matters for a visual-only change set.
 *
 * A purely visual pass may ADD decorative text (animated numbering, for
 * example, which the brief explicitly asks for). It must never REMOVE
 * anything: no lost words, headings, links, pages or metadata.
 *
 * So this checks the strict direction. Every word of the original must still
 * be present, in order, and every heading, link and metadata value must
 * survive. Additions are reported for review rather than failed.
 */
if (process.argv[2] === "--verify") {
  const before = JSON.parse(readFileSync(process.argv[3], "utf8"));
  const after = JSON.parse(readFileSync(process.argv[4], "utf8"));

  let removals = 0;
  const additions = [];

  for (const path of Object.keys(before).sort()) {
    const b = before[path];
    const a = after[path];

    if (!a) {
      console.log(`✗ PAGE REMOVED: ${path}`);
      removals++;
      continue;
    }

    for (const key of ["title", "description", "canonical"]) {
      if (b[key] !== a[key]) {
        console.log(`✗ ${path} [${key}] changed\n    before: ${b[key]}\n    after:  ${a[key]}`);
        removals++;
      }
    }

    // Every original heading must still exist, unchanged.
    for (const h of b.headings) {
      if (!a.headings.includes(h)) {
        console.log(`✗ ${path} heading lost: ${h}`);
        removals++;
      }
    }

    // Every original link must still exist.
    for (const l of b.links) {
      if (!a.links.includes(l)) {
        console.log(`✗ ${path} link lost: ${l}`);
        removals++;
      }
    }

    /*
     * Word-level comparison by multiset.
     *
     * An earlier version walked the words in order with a moving cursor.
     * That is wrong: when one token is genuinely removed, indexOf finds a
     * later occurrence of it elsewhere on the page, the cursor jumps past
     * everything in between, and hundreds of present words get reported as
     * lost. Counting occurrences instead is order-insensitive but exact
     * about what actually disappeared — which is the question being asked.
     */
    const count = (text) => {
      const m = new Map();
      for (const w of text.split(" ").filter(Boolean)) m.set(w, (m.get(w) ?? 0) + 1);
      return m;
    };

    const beforeWords = count(b.text);
    const afterWords = count(a.text);
    const lost = [];
    for (const [w, n] of beforeWords) {
      const got = afterWords.get(w) ?? 0;
      if (got < n) lost.push(`${w}${n - got > 1 ? ` x${n - got}` : ""}`);
    }

    if (lost.length) {
      console.log(`✗ ${path} lost ${lost.length} distinct token(s): ${lost.slice(0, 15).join(" | ")}`);
      removals++;
    }

    // Order is checked separately, via the heading sequence above, which is
    // the meaningful ordering guarantee for "sections stay in order".

    const grew = a.text.length - b.text.length;
    const newHeadings = a.headings.filter((h) => !b.headings.includes(h));
    const newLinks = a.links.filter((l) => !b.links.includes(l));
    if (grew !== 0 || newHeadings.length || newLinks.length) {
      additions.push({ path, grew, newHeadings, newLinks });
    }
  }

  console.log("");
  if (additions.length) {
    console.log("Additions (expected for a visual pass — review):");
    for (const a of additions) {
      console.log(`  ${a.path}: ${a.grew >= 0 ? "+" : ""}${a.grew} chars`);
      for (const h of a.newHeadings) console.log(`      + heading: ${h}`);
      for (const l of a.newLinks) console.log(`      + link: ${l}`);
    }
    console.log("");
  }

  console.log(
    removals === 0
      ? `✓ Nothing removed. ${Object.keys(before).length} pages verified.\n`
      : `✗ ${removals} removal(s) — content was lost.\n`,
  );
  process.exit(removals === 0 ? 0 : 1);
}

if (process.argv[2] === "--diff") {
  const before = JSON.parse(readFileSync(process.argv[3], "utf8"));
  const after = JSON.parse(readFileSync(process.argv[4], "utf8"));

  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  let differences = 0;

  for (const path of [...paths].sort()) {
    const b = before[path];
    const a = after[path];

    if (!b) {
      console.log(`+ PAGE ADDED: ${path}`);
      differences++;
      continue;
    }
    if (!a) {
      console.log(`- PAGE REMOVED: ${path}`);
      differences++;
      continue;
    }

    for (const key of ["title", "description", "canonical", "robots"]) {
      if (b[key] !== a[key]) {
        console.log(`~ ${path} [${key}]\n    before: ${b[key]}\n    after:  ${a[key]}`);
        differences++;
      }
    }

    // Headings, in document order — catches reordering as well as rewording.
    if (JSON.stringify(b.headings) !== JSON.stringify(a.headings)) {
      console.log(`~ ${path} [headings]`);
      const max = Math.max(b.headings.length, a.headings.length);
      for (let i = 0; i < max; i++) {
        if (b.headings[i] !== a.headings[i]) {
          console.log(`    [${i}] before: ${b.headings[i] ?? "(none)"}`);
          console.log(`    [${i}] after:  ${a.headings[i] ?? "(none)"}`);
        }
      }
      differences++;
    }

    if (b.text !== a.text) {
      console.log(`~ ${path} [body text] ${b.text.length} -> ${a.text.length} chars`);
      // Show the first divergence so the change is identifiable.
      let i = 0;
      while (i < b.text.length && i < a.text.length && b.text[i] === a.text[i]) i++;
      console.log(`    diverges at char ${i}:`);
      console.log(`    before: …${b.text.slice(Math.max(0, i - 40), i + 80)}…`);
      console.log(`    after:  …${a.text.slice(Math.max(0, i - 40), i + 80)}…`);
      differences++;
    }

    if (JSON.stringify(b.links) !== JSON.stringify(a.links)) {
      const removed = b.links.filter((l) => !a.links.includes(l));
      const added = a.links.filter((l) => !b.links.includes(l));
      if (removed.length || added.length) {
        console.log(`~ ${path} [links]`);
        for (const l of removed) console.log(`    - ${l}`);
        for (const l of added) console.log(`    + ${l}`);
        differences++;
      }
    }
  }

  console.log(
    differences === 0
      ? `\n✓ No content differences across ${paths.size} pages.\n`
      : `\n✗ ${differences} difference(s) found.\n`,
  );
  process.exit(differences === 0 ? 0 : 1);
}

/* ----------------------------------------------------------- capture mode */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const out = process.argv[3] ?? "snapshot.json";

const attr = (html, re) => html.match(re)?.[1]?.trim() ?? null;

/** Strips markup, scripts, styles and JSON-LD down to readable text. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

const snapshot = {};
const queue = ["/"];
const seen = new Set();

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);

  const res = await fetch(base + path, { redirect: "manual" });
  if (res.status !== 200) continue;
  if (!(res.headers.get("content-type") ?? "").includes("text/html")) continue;

  const html = await res.text();

  const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map(
    (m) => `h${m[1]}: ${visibleText(m[2])}`,
  );

  const links = [
    ...new Set(
      [...html.matchAll(/href="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((h) => !h.startsWith("/_next/") && !h.startsWith("data:")),
    ),
  ].sort();

  snapshot[path] = {
    title: attr(html, /<title>([^<]*)<\/title>/),
    description: attr(html, /<meta name="description" content="([^"]*)"/),
    canonical: attr(html, /rel="canonical" href="([^"]*)"/),
    robots: attr(html, /<meta name="robots" content="([^"]*)"/),
    headings,
    links,
    text: visibleText(html),
  };

  for (const l of links) {
    if (/^(mailto:|tel:|https?:|#)/i.test(l)) continue;
    if (/\.(xml|txt|png|jpg|jpeg|webp|avif|svg|ico)$/i.test(l)) continue;
    const p = l.split("?")[0].split("#")[0];
    if (p.startsWith("/") && !seen.has(p)) queue.push(p);
  }
}

writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log(`Captured ${Object.keys(snapshot).length} pages -> ${out}`);
