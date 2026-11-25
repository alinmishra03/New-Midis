import { createHash } from "node:crypto";

/*
 * Pure parsing and matching rules for the Development team sheet. No database
 * access here, so every rule can be tested on its own.
 */

export const TABS = { allWebsite: "All Website", clientReviewed: "Client Reviewed website", daily: "Daily Work Update" } as const;
export type TabKey = "all_website" | "client_reviewed" | "daily_work_update";

export const PROJECT_COLUMNS = ["Project Name", "Project URL", "Frontend Developer", "Backend Developer", "Environment Status", "Development Status"] as const;
export const DAILY_COLUMNS = ["Date", "Project Name", "Start Date", "End Date", "Project URL", "Frontend Developer", "Backend Developer", "Daily Task / Deliverable", "Priority", "Status"] as const;

export type Row = { rowNumber: number; values: Record<string, string> };

/** The sheet's layout isn't what the sync expects (message is safe to show). */
export class SheetFormatError extends Error {}

/**
 * Columns are found by their heading, not their position. The heading row is
 * the first of the top 10 rows that contains every required heading (a tab may
 * start with blank rows). Missing headings fail loudly — nothing is guessed.
 */
export function readTable(rows: string[][], required: readonly string[], tab: string): Row[] {
  const norm = (r: string[] | undefined) => (r ?? []).map((h) => h.replace(/\s+/g, " ").trim().toLowerCase());
  const headerAt = rows.slice(0, 10).findIndex((r) => required.every((c) => norm(r).includes(c.toLowerCase())));
  if (headerAt < 0) {
    const best = rows.slice(0, 10).map(norm).sort((a, b) => required.filter((c) => b.includes(c.toLowerCase())).length - required.filter((c) => a.includes(c.toLowerCase())).length)[0] ?? [];
    const missing = required.filter((c) => !best.includes(c.toLowerCase()));
    throw new SheetFormatError(`The “${tab}” tab has no column ${missing.map((m) => `“${m}”`).join(", ")}.`);
  }
  const header = norm(rows[headerAt]);
  const index: Record<string, number> = Object.fromEntries(required.map((c) => [c, header.indexOf(c.toLowerCase())]));
  const out: Row[] = [];
  rows.slice(headerAt + 1).forEach((r, i) => {
    const values = Object.fromEntries(required.map((c) => [c, (r[index[c]!] ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim()]));
    if (Object.values(values).some(Boolean)) out.push({ rowNumber: headerAt + i + 2, values });
  });
  return out;
}

/** Whitespace, case and punctuation-insensitive key: "Silver-One" = "silverone". Nothing else is merged. */
export const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
/** For free text (task descriptions): collapse whitespace and case only. */
export const textKey = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
export const urlKey = (s: string) => s.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "").trim();

export function fingerprint(...parts: string[]) {
  return createHash("sha256").update(parts.join("␟")).digest("hex").slice(0, 32);
}

/** "Shivani Dixit, Swayam Gandhi" → two people. Case-insensitive de-duplication. */
export function splitPeople(...cells: string[]): string[] {
  const seen = new Map<string, string>();
  for (const cell of cells) for (const p of cell.split(/,|&|\/|\band\b/i)) {
    const name = p.replace(/\s+/g, " ").trim();
    if (name && !seen.has(nameKey(name))) seen.set(nameKey(name), name);
  }
  return [...seen.values()];
}

/** A cell naming several projects ("Sofisam, Midis Landing Page", "MTC Landing Page & MTC Website"). */
export const isMultiProject = (cell: string) => /,|&|\band\b|\+/i.test(cell);

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const valid = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export type ParsedDate = { ok: true; date: string } | { ok: false; reason: "empty" | "ambiguous" | "invalid" | "multiple" };

/**
 * Accepts "13-Oct-2026", "13 Oct 2026", "13/Oct/2026", ISO "2026-10-13", and
 * numeric day-month-year only when the day can't be a month ("23-11-2026").
 * Two-digit years and numeric dates that read both ways ("05-11-2026",
 * "23-11-12") are ambiguous: they go to review, never guessed.
 */
export function parseDate(raw: string): ParsedDate {
  const s = raw.trim();
  if (!s) return { ok: false, reason: "empty" };
  if (/[,;]/.test(s)) return { ok: false, reason: "multiple" };
  let m = s.match(/^(\d{1,2})[-\s/]([A-Za-z]{3,9})[-\s/,]+(\d{4})$/);
  if (m) {
    const mon = MONTHS.indexOf(m[2]!.slice(0, 3).toLowerCase()) + 1;
    const [d, y] = [Number(m[1]), Number(m[3])];
    return mon && valid(y, mon, d) ? { ok: true, date: iso(y, mon, d) } : { ok: false, reason: "invalid" };
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return valid(+m[1]!, +m[2]!, +m[3]!) ? { ok: true, date: iso(+m[1]!, +m[2]!, +m[3]!) } : { ok: false, reason: "invalid" };
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (m) {
    const [a, b, y] = [Number(m[1]), Number(m[2]), m[3]!];
    if (y.length !== 4) return { ok: false, reason: "ambiguous" };
    if (a > 12 && b <= 12 && valid(+y, b, a)) return { ok: true, date: iso(+y, b, a) };
    return { ok: false, reason: a <= 12 && b <= 12 ? "ambiguous" : "invalid" };
  }
  return { ok: false, reason: "invalid" };
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

/** Development Status (and Environment Status for "On Hold") → CRM project status. null = not stated. */
export function projectStatus(devStatus: string, envStatus: string): ProjectStatus | null {
  const d = textKey(devStatus);
  if (d === "completed") return "completed";
  if (d === "ongoing") return "active";
  if (d === "close site" || d === "store closed" || d === "closed") return "archived";
  if (!d && textKey(envStatus) === "on hold") return "on_hold";
  return null;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export function taskStatus(s: string): TaskStatus | null {
  const k = textKey(s);
  if (k === "completed" || k === "done") return "completed";
  if (k === "ongoing" || k === "in progress") return "in_progress";
  return null;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export function taskPriority(s: string): Priority | null {
  const k = textKey(s);
  return k === "low" || k === "medium" || k === "high" || k === "urgent" ? k : null;
}

/** Rows that describe personal learning rather than project work. Flagged for review, not dropped. */
export const looksNonProject = (text: string) => /^\s*(learning|learnt|learned|training|self[- ]?study|studying|course)\b/i.test(text);

/** First line of a deliverable, trimmed to a task-title length. */
export function taskTitle(text: string) {
  const first = text.split(/\n|(?<=\.)\s+(?=\d+\.)/)[0]!.replace(/^\s*\d+[.)]\s*/, "").trim();
  return first.length > 140 ? `${first.slice(0, 137).trimEnd()}…` : first || "Untitled task";
}
