import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/crm/db";
import { sheetSyncRecords, sheetSyncRuns, sheetSyncUploads } from "@/crm/db/schema";
import { headerIndex, TAB_ORDER, TAB_SPECS } from "./admin";
import type { TabKey } from "./parse";
import { REVIEW_REASONS } from "./sync";

/*
 * Read side of Settings → Integrations.
 *
 * Each uploaded CSV is shown exactly as uploaded: the server's parsed cells,
 * untouched — every column (in file order, with its own heading), every row
 * (in file order, with its row number), blank stays blank. Nothing the CRM
 * derives is mixed into the table.
 *
 * What the last preview/import did with those rows is reported separately, as
 * a read-only summary.
 */

export type SheetRow = { n: number; cells: string[] };

export type NotImported = { n: number; reason: string };

/** Outcome of the latest preview or import for one file (only if it used this exact file). */
export type FileSummary = {
  mode: "check" | "import";
  at: Date;
  /** Preview: rows that are new and would be imported. (An import reports all of its rows as `existing`.) */
  ready: number;
  /** Preview: rows already in the CRM from an earlier import (recognised, never created twice). Import: rows now in the CRM. */
  existing: number;
  /** Exact repeats of an earlier row in the file (counted once). */
  duplicates: number;
  /** Rows skipped because they were set aside in an earlier version of this import. */
  skipped: number;
  /** Rows the CRM couldn't import as they are, with the reason. They stay in the uploaded file unchanged. */
  notImported: NotImported[];
};

export type SheetView = {
  tab: TabKey;
  name: string;
  upload: { fileName: string; sizeBytes: number; encoding: string; delimiter: string; uploadedAt: Date; sha256: string } | null;
  /** Row number of the heading row (1 = first row of the file). */
  headerRow: number;
  /** Every column of the file, in order; the heading is exactly as in the heading row (may be blank). */
  columns: { letter: string; heading: string }[];
  /** Every other row of the file, in order (including blank rows and any rows above the heading). */
  rows: SheetRow[];
  /** Rows that hold at least one value (for "N rows" displays). */
  filledRows: number;
  summary: FileSummary | null;
  /**
   * Set when this one file's preview couldn't be built (e.g. its stored cells
   * are unreadable). Only this card is affected: the other files still show,
   * and this upload's record, original file and download are untouched.
   */
  error: string | null;
};

/** Stored cells must be a table of text; anything else can't be shown faithfully. */
const isTextTable = (rows: unknown): rows is string[][] => Array.isArray(rows) && rows.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string"));

const letter = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : letter(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
/** The first sentence of an engine explanation (its factual part, e.g. “No Development employee is called “X”.”). */
const firstSentence = (s: string) => (s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s).trim();

export async function spreadsheetView() {
  const [uploads, latest, records] = await Promise.all([
    db.select().from(sheetSyncUploads),
    db.query.sheetSyncRuns.findFirst({ where: eq(sheetSyncRuns.status, "succeeded"), orderBy: desc(sheetSyncRuns.startedAt) }),
    db.select({ sourceTab: sheetSyncRecords.sourceTab, fingerprint: sheetSyncRecords.fingerprint, reviewReason: sheetSyncRecords.reviewReason, reviewDetail: sheetSyncRecords.reviewDetail }).from(sheetSyncRecords).where(eq(sheetSyncRecords.state, "review")),
  ]);
  const detail = new Map(records.map((r) => [`${r.sourceTab}|${r.fingerprint}`, r]));

  const uploadInfo = (u: (typeof uploads)[number]) => ({ fileName: u.fileName, sizeBytes: u.sizeBytes, encoding: u.encoding, delimiter: u.delimiter, uploadedAt: u.uploadedAt, sha256: u.sha256 });

  const sheetFor = (tab: TabKey): SheetView => {
    const spec = TAB_SPECS[tab];
    const u = uploads.find((x) => x.tab === tab);
    if (!u) return { tab, name: spec.name, upload: null, headerRow: 0, columns: [], rows: [], filledRows: 0, summary: null, error: null };
    if (!isTextTable(u.rows)) throw new TypeError("stored rows are not a table of text cells");
    const h = Math.max(0, headerIndex(u.rows, spec.columns));
    const width = Math.max(0, ...u.rows.map((r) => r.length));
    const header = u.rows[h] ?? [];
    const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");
    const rows = u.rows.map((r, i) => ({ n: i + 1, cells: pad(r) })).filter((r) => r.n !== h + 1);

    let summary: FileSummary | null = null;
    const runFile = latest?.files?.find((f) => f.tab === tab);
    if (latest && runFile?.rows && runFile.sha256 === u.sha256) {
      const s = runFile.rows;
      summary = {
        mode: latest.mode as "check" | "import",
        at: latest.finishedAt ?? latest.startedAt,
        ready: s.filter((x) => x.s === "ready").length,
        existing: s.filter((x) => x.s === "imported").length,
        duplicates: s.filter((x) => x.s === "duplicate").length,
        skipped: s.filter((x) => x.s === "ignored").length,
        notImported: s
          .filter((x) => x.s === "review")
          .map((x) => {
            const rec = detail.get(`${tab}|${x.fp}`);
            const label = REVIEW_REASONS[rec?.reviewReason ?? x.reason ?? ""] ?? "Can't be imported as it is";
            return { n: x.n, reason: rec?.reviewDetail ? firstSentence(rec.reviewDetail) : label };
          }),
      };
    }
    return {
      tab,
      name: spec.name,
      upload: uploadInfo(u),
      headerRow: h + 1,
      columns: Array.from({ length: width }, (_, i) => ({ letter: letter(i), heading: header[i] ?? "" })),
      rows,
      filledRows: rows.filter((r) => r.cells.some((c) => c.trim())).length,
      summary,
      error: null,
    };
  };

  // Each file is built on its own: if one can't be shown, only its card says so and the others load as usual.
  const sheets: SheetView[] = TAB_ORDER.map((tab) => {
    try {
      return sheetFor(tab);
    } catch (e) {
      // Log the reason only, never the file's contents.
      console.error(`[sheet-import] couldn't build the preview for tab=${tab}: ${e instanceof Error ? `${e.name}: ${e.message}` : "unknown error"}`);
      const u = uploads.find((x) => x.tab === tab);
      return { tab, name: TAB_SPECS[tab].name, upload: u ? uploadInfo(u) : null, headerRow: 0, columns: [], rows: [], filledRows: 0, summary: null, error: "This file's stored data couldn't be read, so it can't be previewed here." };
    }
  });
  return { sheets, latest: latest ?? null };
}
