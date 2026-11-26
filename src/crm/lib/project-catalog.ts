/*
 * Projects & Websites: sorts every project the viewer can see into exactly one
 * of five sections, using only what's already stored. Nothing here writes.
 *
 * Where the details come from:
 * - Project URL, environment and development status: the lines the
 *   Development-sheet import writes into the project description
 *   ("Project URL: …", "Environment: …", "Development status: …").
 * - Shopify: the "Shopify Websites" section of the Client Reviewed tab (the
 *   stores listed under that heading row), or a *.myshopify.com URL. Never
 *   guessed from a name. The All Website tab's section is used only when the
 *   Client Reviewed tab has none.
 *
 * Rules, in order:
 * 1. Shopify → Shopify, whether the store is open or closed (closed ones are
 *    marked "Not live"). The "Shopify Websites" heading itself is shown there
 *    as a category, not a store.
 * 2. Archived status → Archived.
 * 3. Planning / Active / On hold → Ongoing.
 * 4. Completed + Production + a custom-domain URL → Live (a Vercel link, if any,
 *    is shown beside it).
 * 5. Completed + a Vercel URL → Completed (Vercel).
 * 6. Completed with a custom domain that isn't on Production → Completed.
 * 7. Completed with no usable URL → Completed, flagged for review.
 */

export type SectionKey = "live" | "completed" | "ongoing" | "shopify" | "archived";

export const SECTIONS: { key: SectionKey; label: string; title: string }[] = [
  { key: "live", label: "Live Websites", title: "Live Websites" },
  { key: "completed", label: "Completed (Vercel)", title: "Completed Websites (Vercel Links)" },
  { key: "ongoing", label: "Ongoing Projects", title: "Created / Ongoing Websites" },
  { key: "shopify", label: "Shopify", title: "Shopify Websites" },
  { key: "archived", label: "Archived", title: "Archived Websites" },
];

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

export type SiteLink = { url: string; host: string; kind: "custom" | "vercel" | "shopify" | "other_preview" };

export type CatalogInput = { id: string; name: string; status: ProjectStatus; description: string | null };

export type Classified = {
  section: SectionKey;
  links: SiteLink[];
  environment: string | null;
  devStatus: string | null;
  isShopify: boolean;
  /** The "Shopify Websites" heading row: a category, not a store. */
  isCategory: boolean;
  /** Why the placement needs a human look; null when the data is clear. */
  review: string | null;
};

/** One tab of the Development sheet: its data rows in file order (blank rows included). */
export type SheetTab = { tab: string; rows: { name: string; url: string }[] };
/** Finds the project a sheet row was imported as (null if it wasn't). */
export type ResolveRow = (tab: string, name: string, url: string) => string | null;

/** "Field: value" lines written by the sheet import. */
export function readDetail(description: string | null, label: string): string | null {
  if (!description) return null;
  const prefix = `${label}:`;
  for (const line of description.split("\n")) {
    if (line.toLowerCase().startsWith(prefix.toLowerCase())) {
      const v = line.slice(prefix.length).trim();
      return v || null;
    }
  }
  return null;
}

export function hostOf(url: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function linkKind(host: string): SiteLink["kind"] {
  if (host === "vercel.app" || host.endsWith(".vercel.app")) return "vercel";
  if (host.endsWith(".myshopify.com")) return "shopify";
  if (host.endsWith(".pages.dev") || host.endsWith(".netlify.app")) return "other_preview";
  return "custom";
}

/** A "Project URL" cell may hold several URLs separated by commas or spaces. */
export function parseLinks(raw: string | null): SiteLink[] {
  if (!raw) return [];
  const out: SiteLink[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const s = part.trim();
    if (!s || !/[a-z0-9-]+\.[a-z]{2,}/i.test(s)) continue;
    const url = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const host = hostOf(url);
    if (!host || out.some((l) => l.url === url)) continue;
    out.push({ url, host: host.replace(/^www\./, ""), kind: linkKind(host) });
  }
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SHOPIFY_HEADING = "shopify websites";

/**
 * Project ids listed in a sheet's "Shopify Websites" section: the rows straight
 * after that heading, up to the first blank row or the first Vercel-hosted row
 * (Shopify stores aren't hosted on Vercel; in the All Website tab, ordinary
 * staging sites were later appended under the store list).
 */
export function shopifyFromSheet(tabs: SheetTab[], resolve: ResolveRow): { stores: Set<string>; categories: Set<string> } {
  const stores = new Set<string>();
  const categories = new Set<string>();
  for (const { tab, rows } of tabs) {
    for (let i = 0; i < rows.length; i++) {
      const h = rows[i]!;
      if (norm(h.name) !== SHOPIFY_HEADING || h.url.trim()) continue;
      const cat = resolve(tab, h.name, h.url);
      if (cat) categories.add(cat);
      for (let j = i + 1; j < rows.length; j++) {
        const r = rows[j]!;
        if (!r.name.trim()) break; // a blank row ends the section
        if (parseLinks(r.url).some((l) => l.kind === "vercel" || l.kind === "other_preview")) break;
        const id = resolve(tab, r.name, r.url);
        if (id) stores.add(id);
      }
    }
  }
  for (const c of categories) stores.delete(c);
  return { stores, categories };
}

/** Name + URL key for matching a sheet row to the project it was imported as. */
export const rowKey = (name: string, url: string) => `${norm(name)}|${url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "").trim()}`;

export function classify(p: CatalogInput, shopify: { stores: Set<string>; categories: Set<string> }): Classified {
  const links = parseLinks(readDetail(p.description, "Project URL"));
  const environment = readDetail(p.description, "Environment");
  const devStatus = readDetail(p.description, "Development status");
  const isCategory = shopify.categories.has(p.id);
  const isShopify = isCategory || shopify.stores.has(p.id) || links.some((l) => l.kind === "shopify");
  const statusNotSet = /status not set in the sheet/i.test(p.description ?? "");
  const base = { links, environment, devStatus, isShopify, isCategory };

  if (isShopify) return { ...base, section: "shopify", review: null };
  if (p.status === "archived") return { ...base, section: "archived", review: null };
  if (p.status !== "completed") return { ...base, section: "ongoing", review: statusNotSet ? "No development status in the sheet; shown as Planning." : null };

  const env = norm(environment ?? "");
  const custom = links.some((l) => l.kind === "custom");
  const vercel = links.some((l) => l.kind === "vercel");
  if (env === "production" && custom) return { ...base, section: "live", review: null };
  if (vercel || custom) return { ...base, section: "completed", review: null };
  return { ...base, section: "completed", review: links.length ? "Completed, but its URL is neither a custom domain nor a Vercel link." : "Completed, but no project URL is recorded." };
}

/* ------------------------------------------------------- display helpers */

export type Tone = "neutral" | "accent" | "success" | "danger" | "warning" | "info";

/** Environment / status words used in badges, with consistent tones. */
export function stageTone(value: string): Tone {
  switch (norm(value)) {
    case "production":
    case "completed":
    case "active":
      return "success";
    case "staging":
    case "ongoing":
    case "planning":
      return "info";
    case "pre production":
      return "accent";
    case "development":
    case "on hold":
      return "warning";
    default:
      return "neutral";
  }
}

/** A store or site the sheet marks as closed. */
export const isClosed = (devStatus: string | null) => /^(close site|store closed|closed)$/.test(norm(devStatus ?? ""));

export const PAGE_SIZE = 15;
