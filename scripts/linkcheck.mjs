/**
 * Crawls the locally running site and reports the status of every internal link.
 * Usage: node linkcheck.mjs http://localhost:3121
 */
const base = process.argv[2] ?? "http://localhost:3121";

const seen = new Map(); // path -> status
const queue = ["/"];
const referrers = new Map(); // path -> Set(referrer)

function normalise(href, from) {
  if (!href) return null;
  if (/^(mailto:|tel:|https?:\/\/|#|javascript:)/i.test(href)) {
    // keep absolute links to our own origin
    if (href.startsWith(base)) return new URL(href).pathname;
    return null;
  }
  try {
    const u = new URL(href, base + from);
    if (u.origin !== new URL(base).origin) return null;
    return u.pathname + (u.search || "");
  } catch {
    return null;
  }
}

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;

  let res;
  try {
    res = await fetch(base + path, { redirect: "manual" });
  } catch (e) {
    seen.set(path, `ERR ${e.message}`);
    continue;
  }
  seen.set(path, res.status);

  if (res.status >= 300 && res.status < 400) continue;
  if (res.status !== 200) continue;

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) continue;

  const html = await res.text();
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    const p = normalise(h, path);
    if (!p) continue;
    if (!referrers.has(p)) referrers.set(p, new Set());
    referrers.get(p).add(path);
    if (!seen.has(p)) queue.push(p);
  }
}

const rows = [...seen.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])) || a[0].localeCompare(b[0]));
const ok = rows.filter(([, s]) => s === 200);
const redirects = rows.filter(([, s]) => typeof s === "number" && s >= 300 && s < 400);
const broken = rows.filter(([, s]) => s !== 200 && !(typeof s === "number" && s >= 300 && s < 400));

console.log(`crawled ${seen.size} internal paths`);
console.log(`  200 ok:      ${ok.length}`);
console.log(`  redirects:   ${redirects.length}`);
console.log(`  BROKEN:      ${broken.length}`);

if (redirects.length) {
  console.log("\n-- redirects --");
  for (const [p, s] of redirects) console.log(`  ${s}  ${p}`);
}

if (broken.length) {
  console.log("\n-- broken links --");
  for (const [p, s] of broken) {
    const from = [...(referrers.get(p) ?? [])].slice(0, 3).join(", ");
    console.log(`  ${s}  ${p}\n       linked from: ${from}`);
  }
}
