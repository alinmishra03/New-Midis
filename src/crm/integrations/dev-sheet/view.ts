import "server-only";
import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/crm/db";
import { departments, employees, projects, sheetSyncAliases, sheetSyncRecords, sheetSyncRuns, sheetSyncUploads, type SyncRowStatus } from "@/crm/db/schema";
import { headerIndex, TAB_ORDER, TAB_SPECS } from "./admin";
import { nameKey, splitPeople, type TabKey } from "./parse";
import { REVIEW_REASONS } from "./sync";

/*
 * Read side of the spreadsheet view (Settings → Integrations).
 *
 * The uploaded CSV is shown exactly as it was uploaded: the server's parsed
 * cells, untouched (no trimming, no renaming, blank stays blank). Everything
 * the CRM knows about a row — its import status, the reason it needs review,
 * which employee or project a name resolves to — is returned alongside the
 * cells, never instead of them.
 */

export type RowStatus = "ready" | "imported" | "review" | "decided" | "ignored" | "duplicate" | "empty" | "unchecked";

export type CellNote =
  | { kind: "person"; name: string; state: "matched" | "needs_mapping" | "ignored"; to?: string }
  | { kind: "project"; to: string };

export type ReviewEditor = { recordId: string; choices: string[]; needsProject: boolean; needsPerson: boolean; needsDate: boolean };

export type SheetRow = {
  /** Row number in the uploaded file / sheet (1 = first row). */
  n: number;
  /** The uploaded cells, exactly as parsed, for the shown columns. */
  cells: string[];
  status: RowStatus;
  /** Short reason ("Several projects in one cell") and the full explanation. */
  reason?: string;
  detail?: string;
  /** CRM values the original cells resolve to, by shown-column index. */
  notes?: Record<number, CellNote[]>;
  review?: ReviewEditor;
  /** Names in this row that need matching to an employee (fixing one fixes every row using it). */
  people?: { recordId: string; name: string; detail: string | null }[];
  /** A Daily Work Update project name that matches no project (mapping it fixes every row using it). */
  projectName?: { name: string; rows: number };
};

export type SheetView = {
  tab: TabKey;
  name: string;
  upload: { fileName: string; sizeBytes: number; encoding: string; delimiter: string; dataRows: number; uploadedAt: Date; sha256: string } | null;
  headerRow: number;
  columns: { letter: string; heading: string }[];
  hiddenEmptyColumns: number;
  rows: SheetRow[];
  /** Where the statuses came from: the latest preview/import, if it used this exact file. */
  checked: { mode: "check" | "import"; at: Date } | null;
};

export type OtherItem = { id: string; label: string; reason: string; detail: string | null; editor: ReviewEditor | null; person: { recordId: string; name: string } | null };

const PERSON_REASONS = ["unknown_person", "person_not_in_development"];
const NEEDS_PROJECT = ["multiple_projects", "unmatched_project", "project_needs_review"];
const NEEDS_PERSON = ["multiple_developers", "no_developer", "unknown_person", "person_not_in_development"];
const DECISIONS: Record<string, string> = {
  create: "create as a new project",
  link: "link to an existing project",
  separate: "import as its own task",
  attach: "add to an existing task",
  ignore: "ignore",
  use_sheet: "use the sheet's values",
  keep_crm: "keep the CRM's values",
  acknowledge: "acknowledged",
};
const norm = (h: string) => h.replace(/\s+/g, " ").trim().toLowerCase();
const letter = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : letter(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));

function editorFor(rec: { id: string; sourceTab: string; kind: string; reviewReason: string | null }, dateMissing: boolean): ReviewEditor {
  const r = rec.reviewReason ?? "";
  const choices = r === "removed_from_sheet" ? ["acknowledge"] : r === "conflict" ? ["use_sheet", "keep_crm"] : rec.kind === "project" ? ["create", "link", "ignore"] : ["separate", "attach", "ignore"];
  return { recordId: rec.id, choices, needsProject: NEEDS_PROJECT.includes(r), needsPerson: NEEDS_PERSON.includes(r), needsDate: r === "ambiguous_date" || (r === "missing_required" && dateMissing) };
}

export async function spreadsheetView() {
  const dev = await db.query.departments.findFirst({ where: or(eq(departments.code, "DEV"), eq(departments.name, "Development")) });
  const [uploads, latest, records, aliases, devEmps] = await Promise.all([
    db.select().from(sheetSyncUploads),
    db.query.sheetSyncRuns.findFirst({ where: eq(sheetSyncRuns.status, "succeeded"), orderBy: desc(sheetSyncRuns.startedAt) }),
    db
      .select({ id: sheetSyncRecords.id, sourceTab: sheetSyncRecords.sourceTab, fingerprint: sheetSyncRecords.fingerprint, kind: sheetSyncRecords.kind, rowNumber: sheetSyncRecords.rowNumber, source: sheetSyncRecords.source, state: sheetSyncRecords.state, reviewReason: sheetSyncRecords.reviewReason, reviewDetail: sheetSyncRecords.reviewDetail, decision: sheetSyncRecords.decision, resolvedAt: sheetSyncRecords.resolvedAt, projectId: sheetSyncRecords.projectId })
      .from(sheetSyncRecords),
    db.select({ kind: sheetSyncAliases.kind, alias: sheetSyncAliases.alias, employeeId: sheetSyncAliases.employeeId, projectId: sheetSyncAliases.projectId, createdAt: sheetSyncAliases.createdAt }).from(sheetSyncAliases),
    dev
      ? db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName }).from(employees).where(and(eq(employees.departmentId, dev.id), ne(employees.employmentStatus, "exited")))
      : Promise.resolve([] as { id: string; firstName: string; lastName: string }[]),
  ]);

  const rec = new Map(records.map((r) => [`${r.sourceTab}|${r.fingerprint}`, r]));
  // Names for the employees and projects that sheet values resolve to.
  const empIds = [...new Set(aliases.map((a) => a.employeeId).filter(Boolean))] as string[];
  const projIds = [...new Set([...aliases.map((a) => a.projectId), ...records.map((r) => r.projectId)].filter(Boolean))] as string[];
  const [aliasEmps, projs] = await Promise.all([
    empIds.length ? db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName }).from(employees).where(inArray(employees.id, empIds)) : [],
    projIds.length ? db.select({ id: projects.id, name: projects.name, code: projects.code }).from(projects).where(inArray(projects.id, projIds)) : [],
  ]);
  const fullName = (e: { firstName: string; lastName: string }) => `${e.firstName} ${e.lastName}`.trim();
  const empName = new Map([...devEmps, ...aliasEmps].map((e) => [e.id, fullName(e)]));
  const projName = new Map(projs.map((p) => [p.id, `${p.name} (${p.code})`]));
  const personAlias = new Map(aliases.filter((a) => a.kind === "person" && a.employeeId).map((a) => [a.alias, a.employeeId!]));
  const projectAlias = new Map(aliases.filter((a) => a.kind === "project" && a.projectId).map((a) => [a.alias, a.projectId!]));

  /** The same resolution order as the import: saved mapping, then exactly one Development employee with that full name. */
  const personNote = (name: string): (CellNote & { kind: "person" }) | null => {
    const key = nameKey(name);
    if (!key) return null;
    const pr = rec.get(`people|${key}`);
    if (pr?.state === "review") return { kind: "person", name, state: "needs_mapping" };
    if (pr?.state === "ignored") return { kind: "person", name, state: "ignored" };
    const aliasId = personAlias.get(key);
    if (aliasId) return { kind: "person", name, state: "matched", to: empName.get(aliasId) ?? "an employee" };
    const m = devEmps.filter((e) => nameKey(fullName(e)) === key);
    if (m.length === 1) return { kind: "person", name, state: "matched", to: fullName(m[0]!) };
    return null; // not checked yet
  };

  const changedSince = (at: Date | null | undefined) => !!latest?.finishedAt && !!at && at > latest.finishedAt;
  const covered = new Set<string>(); // review records shown against a row

  const sheets: SheetView[] = TAB_ORDER.map((tab) => {
    const spec = TAB_SPECS[tab];
    const u = uploads.find((x) => x.tab === tab);
    if (!u) return { tab, name: spec.name, upload: null, headerRow: 0, columns: [], hiddenEmptyColumns: 0, rows: [], checked: null };
    const h = Math.max(0, headerIndex(u.rows, spec.columns));
    const header = u.rows[h] ?? [];
    const body = u.rows.slice(h + 1);
    const width = Math.max(header.length, ...body.map((r) => r.length));
    // Columns with neither a heading nor any value (trailing commas in the export) carry nothing; they're counted, not shown.
    const shown = Array.from({ length: width }, (_, i) => i).filter((i) => (header[i] ?? "").trim() || body.some((r) => (r[i] ?? "").trim()));
    const colOf = (heading: string) => shown.findIndex((i) => norm(header[i] ?? "") === heading.toLowerCase());
    const personCols = ["frontend developer", "backend developer"].map(colOf).filter((i) => i >= 0);
    const projectCol = colOf("project name");
    const dateCol = colOf("date");
    const runFile = latest?.files?.find((f) => f.tab === tab);
    const usable = !!runFile?.rows && runFile.sha256 === u.sha256;
    const statusByRow = new Map<number, SyncRowStatus>((usable ? runFile!.rows! : []).map((s) => [s.n, s]));
    const groupRows = new Map<string, number[]>();
    for (const s of statusByRow.values()) if (s.group && (s.s === "ready" || s.s === "imported")) groupRows.set(s.group, [...(groupRows.get(s.group) ?? []), s.n]);
    // Unmatched project names, counted across the file (mapping one fixes all its rows).
    const unmatchedCount = new Map<string, number>();

    const rows: SheetRow[] = body.map((raw, i) => {
      const n = h + i + 2;
      const cells = shown.map((c) => raw[c] ?? "");
      if (cells.every((c) => !c.trim())) return { n, cells, status: "empty" as const, reason: "Empty row", detail: "Nothing in this row, so it isn't imported." };
      const row: SheetRow = { n, cells, status: "unchecked" };
      // CRM values the original names resolve to (shown under the cell; the cell itself never changes).
      const notes: Record<number, CellNote[]> = {};
      const people: NonNullable<SheetRow["people"]> = [];
      for (const c of personCols) {
        const list = splitPeople(cells[c] ?? "").map(personNote).filter((x): x is CellNote & { kind: "person" } => !!x);
        if (list.length) notes[c] = list;
        for (const p of list) {
          const pr = rec.get(`people|${nameKey(p.name)}`);
          if (p.state === "needs_mapping" && pr && !people.some((x) => x.recordId === pr.id)) {
            people.push({ recordId: pr.id, name: p.name, detail: pr.reviewDetail });
            covered.add(pr.id);
          }
        }
      }
      const s = statusByRow.get(n);
      const live = s ? rec.get(`${tab}|${s.fp}`) : undefined;
      if (projectCol >= 0 && cells[projectCol]?.trim()) {
        const aliasTo = tab === "daily_work_update" ? projectAlias.get(nameKey(cells[projectCol]!)) : undefined;
        const linked = tab !== "daily_work_update" ? live?.projectId : undefined;
        const to = aliasTo ?? linked;
        if (to && projName.has(to)) notes[projectCol] = [{ kind: "project", to: projName.get(to)! }];
      }
      if (Object.keys(notes).length) row.notes = notes;
      if (people.length) row.people = people;
      if (!s) {
        row.reason = usable ? "Not part of the last check" : "Not checked yet";
        row.detail = "Run Preview import to check this row.";
        return row;
      }
      if (s.s === "duplicate") return { ...row, status: "duplicate", reason: `Duplicate of row ${s.dupOf}`, detail: `Exactly repeats row ${s.dupOf}, so it's counted once and never imported twice.` };
      if (s.s === "review" && live?.state === "review") {
        covered.add(live.id);
        row.status = "review";
        row.reason = REVIEW_REASONS[live.reviewReason ?? ""] ?? "Needs review";
        row.detail = live.reviewDetail ?? undefined;
        row.review = editorFor(live, tab === "daily_work_update" && (dateCol < 0 || !cells[dateCol]!.trim()));
        if (live.reviewReason === "unmatched_project" && projectCol >= 0) {
          const name = cells[projectCol]!;
          unmatchedCount.set(nameKey(name), (unmatchedCount.get(nameKey(name)) ?? 0) + 1);
          row.projectName = { name, rows: 0 };
        }
        // A name was matched (or ignored) after the check: the row is decided by that, pending the next preview.
        if (PERSON_REASONS.includes(live.reviewReason ?? "") && !row.people?.length && personCols.some((c) => notes[c]?.length)) {
          return { ...row, status: "decided", reason: "Name matched", detail: "The developer's name has been matched since the last check. Preview again to apply it.", review: undefined };
        }
        return row;
      }
      if (s.s === "review" && live) {
        // Decided after the check (the decision is applied by the next preview and import).
        const reason = live.decision ? `Decision saved: ${DECISIONS[live.decision] ?? live.decision}` : "Project name mapped";
        return { ...row, status: "decided", reason, detail: "Saved since the last check. Preview again to apply it." };
      }
      if (s.s === "review") return { ...row, status: "unchecked", reason: "Not checked yet", detail: "Run Preview import to check this row." };
      if (s.s === "ignored") return { ...row, status: "ignored", reason: live?.decision === "ignore" ? "Ignored by a Super Admin" : "Ignored", detail: live?.reviewDetail ?? undefined };
      const siblings = s.group ? (groupRows.get(s.group) ?? []).filter((x) => x !== n) : [];
      const sameTask = tab === "daily_work_update" && siblings.length ? `Same task as row${siblings.length === 1 ? "" : "s"} ${siblings.join(", ")}.` : undefined;
      const ref = tab === "client_reviewed" && live?.kind === "project_ref" ? "Same project as in All Website." : undefined;
      const unmatchedNames = row.people?.length ? `${row.people.map((p) => `“${p.name}”`).join(", ")} not matched to an employee yet, so not added as ${row.people.length === 1 ? "a member" : "members"}.` : undefined;
      if (s.s === "imported") return { ...row, status: "imported", reason: "Already in the CRM", detail: [ref, sameTask, "Recognised from an earlier import; it won't be created again.", unmatchedNames].filter(Boolean).join(" ") };
      return { ...row, status: "ready", reason: tab === "daily_work_update" ? (sameTask ? "Ready (update to a task)" : "Ready (new task)") : ref ? "Ready (same project)" : "Ready (new project)", detail: [ref, sameTask, unmatchedNames].filter(Boolean).join(" ") || undefined };
    });
    for (const r of rows) if (r.projectName) r.projectName.rows = unmatchedCount.get(nameKey(r.projectName.name)) ?? 1;
    return {
      tab,
      name: spec.name,
      upload: { fileName: u.fileName, sizeBytes: u.sizeBytes, encoding: u.encoding, delimiter: u.delimiter, dataRows: u.dataRows, uploadedAt: u.uploadedAt, sha256: u.sha256 },
      headerRow: h + 1,
      columns: shown.map((i) => ({ letter: letter(i), heading: header[i] ?? "" })),
      hiddenEmptyColumns: width - shown.length,
      rows,
      checked: usable && latest ? { mode: latest.mode as "check" | "import", at: latest.finishedAt ?? latest.startedAt } : null,
    };
  });

  // Review items that aren't on any uploaded row (e.g. a row that was imported earlier and is no longer in the file).
  const others: OtherItem[] = records
    .filter((r) => r.state === "review" && !covered.has(r.id))
    .map((r) => ({
      id: r.id,
      label: r.kind === "person" ? `Name “${r.source.name ?? ""}”` : `${TAB_SPECS[r.sourceTab as TabKey]?.name ?? r.sourceTab} · previously row ${r.rowNumber} · ${r.source["Project Name"] || r.source["Daily Task / Deliverable"]?.slice(0, 80) || "—"}`,
      reason: REVIEW_REASONS[r.reviewReason ?? ""] ?? "Needs review",
      detail: r.reviewDetail,
      editor: r.kind === "person" ? null : editorFor(r, !r.source["Date"]),
      person: r.kind === "person" ? { recordId: r.id, name: r.source.name ?? "" } : null,
    }));

  // The server refuses an import if decisions or mappings changed after the preview; say so before the button is pressed.
  const changedSincePreview = !!latest?.finishedAt && (records.some((r) => changedSince(r.resolvedAt)) || aliases.some((a) => changedSince(a.createdAt)));
  return { sheets, others, changedSincePreview };
}
