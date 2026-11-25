import "server-only";
import { and, desc, eq, inArray, lt, ne, or } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { departments, employees, projectMembers, projects, sheetSyncAliases, sheetSyncRecords, sheetSyncRuns, sheetSyncUploads, taskComments, tasks, users, type SyncRowStatus, type SyncRunFile } from "@/crm/db/schema";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { formatDate, zonedToInstant } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import {
  DAILY_COLUMNS,
  PROJECT_COLUMNS,
  SheetFormatError,
  TABS,
  fingerprint,
  isMultiProject,
  looksNonProject,
  nameKey,
  parseDate,
  projectStatus,
  readTable,
  splitPeople,
  taskPriority,
  taskStatus,
  taskTitle,
  textKey,
  urlKey,
  type ProjectStatus,
  type Row,
  type TabKey,
  type TaskStatus,
} from "./parse";

/*
 * One-way import: the Development team sheet's three tabs, uploaded as CSV
 * files (Settings → Integrations), → CRM Projects and Tasks.
 *
 * - "check" (Preview) records what WOULD happen (and the review queue)
 *   without touching projects or tasks. "import" applies it, in one
 *   transaction: all or nothing.
 * - Rows are identified by a fingerprint of their content, not their position,
 *   so sorting/moving rows never duplicates anything.
 * - The sheet owns only the fields it supplies. A field edited in the CRM is
 *   left alone; if the sheet then changes it too, that's a conflict for review.
 *   Comments, attachments and anything else added in the CRM are never touched.
 * - Nothing in the CRM is ever deleted. A row that disappears is flagged.
 * - Anything uncertain goes to the review queue instead of being guessed.
 */

export type SyncMode = "check" | "import";
export type SyncTrigger = "manual";
export type SheetData = { title: string; tabs: Record<string, string[][]> };
export type SyncCounts = Record<string, number>;

export const REVIEW_REASONS: Record<string, string> = {
  unknown_person: "Person not found among Development employees",
  person_not_in_development: "Person exists in the CRM but isn't in the Development department",
  ambiguous_duplicate: "Project name appears more than once with different details",
  existing_crm_project: "A CRM project with this name already exists (not created by the sync)",
  unmatched_project: "Project name doesn't match any project in the sheet",
  project_needs_review: "This row's project is waiting for review",
  multiple_projects: "Several projects in one cell",
  multiple_developers: "Several developers on one row",
  no_developer: "No developer named",
  missing_start_date: "No start date",
  ambiguous_date: "Date can't be read with certainty",
  missing_status: "No status given for this task",
  non_project_work: "Looks like non-project work",
  uncertain_task_match: "May be a different deliverable from the task it would join",
  possible_edit: "Looks like an edited copy of a row already imported",
  task_deleted_in_crm: "The task for this work was deleted in the CRM",
  missing_required: "A required field is empty",
  edited_project_row: "Project row changed and more than one earlier row could be the same project",
  conflict: "Changed both in the sheet and in the CRM",
  removed_from_sheet: "Row no longer in the sheet",
};

const LOCK_MINUTES = 15;

type RecordRow = typeof sheetSyncRecords.$inferSelect;
type Emp = { id: string; firstName: string; lastName: string; departmentId: string | null };
type Review = { reason: keyof typeof REVIEW_REASONS; detail?: string };

/* ------------------------------------------------------------------ runner */

export async function runSheetSync(opts: { mode: SyncMode; trigger: SyncTrigger; actorUserId: string | null; data: SheetData; files?: SyncRunFile[] }) {
  // One run at a time. A run stuck for LOCK_MINUTES (e.g. a killed function) is closed as failed.
  await db
    .update(sheetSyncRuns)
    .set({ status: "failed", error: "Stopped before finishing (timed out).", finishedAt: new Date() })
    .where(and(eq(sheetSyncRuns.status, "running"), lt(sheetSyncRuns.startedAt, new Date(Date.now() - LOCK_MINUTES * 60_000))));
  const busy = await db.query.sheetSyncRuns.findFirst({ where: eq(sheetSyncRuns.status, "running"), columns: { id: true } });
  if (busy) throw new AppError("A sync is already running. Try again in a few minutes.");

  const [run] = await db.insert(sheetSyncRuns).values({ trigger: opts.trigger, mode: opts.mode, actorUserId: opts.actorUserId, files: opts.files ?? null }).returning({ id: sheetSyncRuns.id });
  const runId = run!.id;
  try {
    const data = opts.data;
    const { counts, rows } = await syncData(data, runId, opts.mode, opts.actorUserId);
    // Each file keeps the outcome of every one of its rows (shown next to the row in the spreadsheet view).
    const files = opts.files?.map((f) => ({ ...f, rows: rows[f.tab] ?? [] })) ?? null;
    await db.update(sheetSyncRuns).set({ status: "succeeded", spreadsheetTitle: data.title, counts, finishedAt: new Date(), ...(files ? { files } : {}) }).where(eq(sheetSyncRuns.id, runId));
    return { runId, ok: true as const, counts };
  } catch (e) {
    const known = e instanceof AppError || e instanceof SheetFormatError;
    const message = known ? (e as Error).message : "The import failed unexpectedly. Nothing was changed.";
    if (!known) console.error(`[sheet import] failed: ${e instanceof Error ? e.name : "error"}`);
    await db.update(sheetSyncRuns).set({ status: "failed", error: message, finishedAt: new Date() }).where(eq(sheetSyncRuns.id, runId));
    return { runId, ok: false as const, error: message };
  }
}

/* ------------------------------------------------------------------ engine */

async function syncData(data: SheetData, runId: string, mode: SyncMode, actorUserId: string | null): Promise<{ counts: SyncCounts; rows: Record<string, SyncRowStatus[]> }> {
  const aw = readTable(data.tabs[TABS.allWebsite] ?? [], PROJECT_COLUMNS, TABS.allWebsite);
  const cr = readTable(data.tabs[TABS.clientReviewed] ?? [], PROJECT_COLUMNS, TABS.clientReviewed);
  const daily = readTable(data.tabs[TABS.daily] ?? [], DAILY_COLUMNS, TABS.daily);

  const dev = await db.query.departments.findFirst({ where: or(eq(departments.code, "DEV"), eq(departments.name, "Development")) });
  if (!dev) throw new AppError("There's no Development department in the CRM (Settings → Departments). Nothing was changed.");
  const company = await getCompany();

  const [emps, aliases, existing, crmProjects] = await Promise.all([
    db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, departmentId: employees.departmentId }).from(employees).where(ne(employees.employmentStatus, "exited")),
    db.select().from(sheetSyncAliases),
    db.select().from(sheetSyncRecords),
    db.select({ id: projects.id, name: projects.name, code: projects.code, description: projects.description, status: projects.status }).from(projects),
  ]);
  const recByKey = new Map(existing.map((r) => [`${r.sourceTab}|${r.fingerprint}`, r]));
  const syncedProjectIds = new Set(existing.filter((r) => r.kind === "project" && r.projectId).map((r) => r.projectId!));
  const seen = new Set<string>();
  // Which record each source row belongs to ("tab|sheet row" → fingerprint), and exact repeats of an earlier row.
  // Used only to report each row's outcome; it doesn't affect what is imported.
  const rowLinks = new Map<string, { tab: string; n: number; fp: string; dupOf?: number }>();
  const link = (tab: string, n: number, fp: string, dupOf?: number) => rowLinks.set(`${tab}|${n}`, { tab, n, fp, ...(dupOf ? { dupOf } : {}) });
  const sameRow = (a: Row, b: Row) => JSON.stringify(a.values) === JSON.stringify(b.values);
  const counts: SyncCounts = { projectsCreated: 0, projectsUpdated: 0, projectsMatched: 0, projectsLinked: 0, membersAdded: 0, tasksCreated: 0, tasksUpdated: 0, tasksMatched: 0, updatesAdded: 0, unchanged: 0, review: 0, ignored: 0, missing: 0, duplicateRows: 0, conflicts: 0 };

  /* ---------- writes are collected, then applied in one transaction ---------- */
  type Upsert = Omit<typeof sheetSyncRecords.$inferInsert, "id">;
  const upserts = new Map<string, Upsert>();
  const ops: ((tx: Tx) => Promise<void>)[] = [];
  const importing = mode === "import";
  const put = (u: Upsert) => {
    const k = `${u.sourceTab}|${u.fingerprint}`;
    seen.add(k);
    upserts.set(k, { ...upserts.get(k), ...u, lastSeenAt: new Date(), lastRunId: runId });
  };

  /* ---------- people ---------- */
  const devEmps = emps.filter((e) => e.departmentId === dev.id);
  const personAlias = new Map(aliases.filter((a) => a.kind === "person" && a.employeeId).map((a) => [a.alias, a.employeeId!]));
  const personCache = new Map<string, { employeeId: string } | { review: Review } | { ignored: true }>();
  function person(name: string) {
    const key = nameKey(name);
    if (personCache.has(key)) return personCache.get(key)!;
    let out: { employeeId: string } | { review: Review } | { ignored: true };
    const rec = recByKey.get(`people|${key}`);
    const aliasId = personAlias.get(key);
    const full = (e: Emp) => nameKey(`${e.firstName} ${e.lastName}`);
    if (rec?.decision === "ignore") out = { ignored: true };
    else if (aliasId && emps.some((e) => e.id === aliasId)) out = { employeeId: aliasId };
    else {
      const m = devEmps.filter((e) => full(e) === key);
      if (m.length === 1) out = { employeeId: m[0]!.id };
      else if (m.length > 1) out = { review: { reason: "unknown_person", detail: `More than one Development employee is called “${name}”. Choose who it is.` } };
      else if (emps.some((e) => full(e) === key)) out = { review: { reason: "person_not_in_development", detail: `“${name}” is in the CRM but not in the Development department. Map them explicitly if this is right.` } };
      else out = { review: { reason: "unknown_person", detail: `No Development employee is called “${name}”. Map the name to an employee, or ignore it.` } };
    }
    put({ sourceTab: "people", fingerprint: key, rowNumber: 0, kind: "person", source: { name }, state: "employeeId" in out ? "linked" : "ignored" in out ? "ignored" : "review", reviewReason: "review" in out ? out.review.reason : null, reviewDetail: "review" in out ? out.review.detail ?? null : null });
    personCache.set(key, out);
    return out;
  }

  /* ---------- projects ---------- */
  type ProjectRef = { projectId: string | null; state: "ready" | "review"; ownsFields: boolean };
  const projectByKey = new Map<string, ProjectRef>(); // nameKey → project (for daily rows)
  const usedCodes = new Set(crmProjects.map((p) => p.code));
  const projectAlias = new Map(aliases.filter((a) => a.kind === "project" && a.projectId).map((a) => [a.alias, a.projectId!]));
  const newCode = (name: string) => {
    const base = `DEV-${nameKey(name).toUpperCase().slice(0, 14) || "PROJECT"}`;
    let code = base;
    for (let i = 2; usedCodes.has(code); i++) code = `${base}-${i}`;
    usedCodes.add(code);
    return code;
  };
  const describe = (tab: string, v: Record<string, string>, status: ProjectStatus | null) =>
    [
      v["Project URL"] && `Project URL: ${v["Project URL"]}`,
      v["Environment Status"] && `Environment: ${v["Environment Status"]}`,
      v["Development Status"] && `Development status: ${v["Development Status"]}`,
      !status && "Status not set in the sheet.",
      `Imported from the “${tab}” tab of the Development team sheet; keep these details up to date there.`,
    ]
      .filter(Boolean)
      .join("\n");

  async function addMembers(projectId: string | null, people: string[], tx?: Tx) {
    for (const p of people) {
      const r = person(p);
      if (!("employeeId" in r) || !projectId) continue;
      if (tx) {
        const added = await tx.insert(projectMembers).values({ projectId, employeeId: r.employeeId }).onConflictDoNothing().returning({ e: projectMembers.employeeId });
        if (added.length) counts.membersAdded!++;
      }
    }
  }

  /** Project row identity: name + URL + developers (not position). */
  const projectFp = (key: string, r: Row) => fingerprint(key, urlKey(r.values["Project URL"]!), splitPeople(r.values["Frontend Developer"]!, r.values["Backend Developer"]!).map(nameKey).sort().join(","));
  const presentProjectRows = new Set<string>();
  for (const [tab, rows] of [["all_website", aw], ["client_reviewed", cr]] as const) {
    for (const r of rows) {
      const k = nameKey(r.values["Project Name"]!);
      if (k) presentProjectRows.add(`${tab}|${projectFp(k, r)}`);
    }
  }

  function planProjectRows(rows: Row[], tab: TabKey, tabName: string, knownKeys: Set<string>) {
    const groups = new Map<string, Row[]>();
    for (const r of rows) {
      const k = nameKey(r.values["Project Name"]!);
      if (!k) {
        // A row with details but no project name can't be imported: shown for review, never guessed.
        const fp = fingerprint("noname", JSON.stringify(r.values));
        link(tab, r.rowNumber, fp, rows.find((x) => x.rowNumber < r.rowNumber && !nameKey(x.values["Project Name"]!) && sameRow(x, r))?.rowNumber);
        const ignored = recByKey.get(`${tab}|${fp}`)?.decision === "ignore";
        put({ sourceTab: tab, fingerprint: fp, rowNumber: r.rowNumber, kind: "project", source: r.values, state: ignored ? "ignored" : "review", reviewReason: ignored ? null : "missing_required", reviewDetail: ignored ? null : "Project Name is empty. Fill it in the sheet and upload again, or ignore the row." });
        if (ignored) counts.ignored!++;
        else counts.review!++;
        continue;
      }
      groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    for (const [key, group] of groups) {
      // Client Reviewed rows for a project already in All Website: just a reference.
      if (tab === "client_reviewed" && knownKeys.has(key)) {
        const target = projectByKey.get(key);
        for (const r of group) {
          link(tab, r.rowNumber, fingerprint(key), group.find((x) => x.rowNumber < r.rowNumber && sameRow(x, r))?.rowNumber);
          put({ sourceTab: tab, fingerprint: fingerprint(key), rowNumber: r.rowNumber, kind: "project_ref", source: r.values, state: "linked", projectId: target?.projectId ?? null, reviewReason: null, reviewDetail: null });
          // Developers listed in Client Reviewed are added as members too (additive; never removed).
          const people = splitPeople(r.values["Frontend Developer"]!, r.values["Backend Developer"]!);
          people.forEach(person);
          if (importing && target?.state === "ready") ops.push((tx) => addMembers(target.projectId, people, tx));
        }
        continue;
      }
      const fpOf = (r: Row) => projectFp(key, r);
      const distinct = new Map<string, Row>();
      for (const r of group) if (!distinct.has(fpOf(r))) distinct.set(fpOf(r), r);
      for (const r of group) link(tab, r.rowNumber, fpOf(r), group.find((x) => x.rowNumber < r.rowNumber && sameRow(x, r))?.rowNumber);
      const identical = distinct.size === 1 && group.every((r) => JSON.stringify(r.values) === JSON.stringify(group[0]!.values));
      const ambiguous = distinct.size > 1 || (!identical && group.length > 1);
      const refs: ProjectRef[] = [];
      for (const [fp, r] of distinct) {
        const rec = recByKey.get(`${tab}|${fp}`);
        refs.push(planProject(tab, tabName, key, fp, r, rec, ambiguous, distinct.size));
      }
      // Daily rows can use this name only if it resolves to exactly one project.
      projectByKey.set(key, refs.length === 1 ? refs[0]! : { projectId: null, state: "review", ownsFields: false });
    }
  }

  function planProject(tab: TabKey, tabName: string, key: string, fp: string, r: Row, rec: RecordRow | undefined, ambiguous: boolean, variants: number): ProjectRef {
    const v = r.values;
    const status = projectStatus(v["Development Status"]!, v["Environment Status"]!);
    const people = splitPeople(v["Frontend Developer"]!, v["Backend Developer"]!);
    people.forEach(person);
    const base = { sourceTab: tab, fingerprint: fp, rowNumber: r.rowNumber, kind: "project", source: v };
    const review = (reason: Review["reason"], detail: string, projectId: string | null = rec?.projectId ?? null): ProjectRef => {
      put({ ...base, state: "review", reviewReason: reason, reviewDetail: detail, projectId });
      counts.review!++;
      return { projectId, state: "review", ownsFields: false };
    };
    if (rec?.decision === "ignore") {
      put({ ...base, state: "ignored", reviewReason: null, reviewDetail: null });
      counts.ignored!++;
      return { projectId: null, state: "review", ownsFields: false };
    }
    // Already linked: keep the link (a project deleted in the CRM is never recreated).
    if (rec?.projectId) return updateProject(base, rec, v, status, people, tabName);
    if (rec && rec.state !== "pending" && rec.state !== "review" && !rec.projectId && (rec.applied || rec.decision === "link")) {
      put({ ...base, state: "ignored", reviewReason: null, reviewDetail: "The project was deleted in the CRM; it won't be recreated." });
      counts.ignored!++;
      return { projectId: null, state: "review", ownsFields: false };
    }
    // No earlier link for this row (a preview may have recorded it as pending): could it be an edited row?
    if ((!rec || (rec.state === "pending" && !rec.projectId && !rec.applied)) && !ambiguous) {
      const earlier = existing.filter((x) => x.kind === "project" && x.projectId && nameKey(x.source["Project Name"] ?? "") === key && !presentProjectRows.has(`${x.sourceTab}|${x.fingerprint}`) && x.state !== "ignored");
      if (earlier.length === 1) {
        // The same project with an edited URL or developers: update it, never create a second one.
        const old = earlier[0]!;
        put({ sourceTab: old.sourceTab, fingerprint: old.fingerprint, rowNumber: old.rowNumber, kind: old.kind, source: old.source, state: "ignored", reviewReason: null, reviewDetail: `Replaced by ${tabName} row ${r.rowNumber} (edited in the sheet).` });
        return updateProject(base, old, v, status, people, tabName);
      }
      if (earlier.length > 1) return review("edited_project_row", `“${v["Project Name"]}” changed in the sheet and more than one earlier row could be the same project. Link it to the right project.`);
    }
    if (ambiguous && !rec?.decision) return review("ambiguous_duplicate", `“${v["Project Name"]}” appears ${variants > 1 ? `${variants} times with different details` : "more than once"} in “${tabName}”. Decide whether this row is its own project, an existing project, or should be ignored.`);
    const linkTo = rec?.decision === "link" ? rec.decisionData?.projectId : projectAlias.get(key);
    if (linkTo) {
      // Linked by a Super Admin to an existing CRM project: only members are added; its details stay CRM-owned.
      const target = crmProjects.find((p) => p.id === linkTo);
      if (!target) return review("existing_crm_project", "The project it was linked to no longer exists. Choose again.", null);
      put({ ...base, state: importing ? "linked" : "pending", projectId: target.id, reviewReason: null, reviewDetail: null });
      counts.projectsLinked!++;
      if (importing) ops.push((tx) => addMembers(target.id, people, tx));
      return { projectId: target.id, state: "ready", ownsFields: false };
    }
    const sameName = crmProjects.filter((p) => nameKey(p.name) === key && !syncedProjectIds.has(p.id));
    if (sameName.length && rec?.decision !== "create") {
      return review("existing_crm_project", `The CRM already has ${sameName.length === 1 ? `a project called “${sameName[0]!.name}” (${sameName[0]!.code})` : `${sameName.length} projects with this name`}. Link this row to it, or create a separate project.`);
    }
    // Create.
    const values = { name: v["Project Name"]!, description: describe(tabName, v, status), status: status ?? "planning" };
    counts.projectsCreated!++;
    if (!importing) {
      put({ ...base, state: "pending", reviewReason: null, reviewDetail: null });
      return { projectId: null, state: "ready", ownsFields: true };
    }
    const ref: ProjectRef = { projectId: null, state: "ready", ownsFields: true };
    const code = newCode(values.name);
    ops.push(async (tx) => {
      const [p] = await tx.insert(projects).values({ ...values, code, departmentId: dev!.id }).returning({ id: projects.id });
      ref.projectId = p!.id;
      upserts.get(`${tab}|${fp}`)!.projectId = p!.id;
      await audit({ actorUserId, action: "project.import", entityType: "project", entityId: p!.id, summary: `Imported project “${values.name}” from the Development team sheet` }, tx);
      await addMembers(p!.id, people, tx);
    });
    put({ ...base, state: "linked", projectId: null, applied: values, reviewReason: null, reviewDetail: null });
    return ref;
  }

  function updateProject(base: Pick<Upsert, "sourceTab" | "fingerprint" | "rowNumber" | "kind" | "source">, rec: RecordRow, v: Record<string, string>, status: ProjectStatus | null, people: string[], tabName: string): ProjectRef {
    const current = crmProjects.find((p) => p.id === rec.projectId);
    const ownsFields = !!rec.applied;
    if (!current) {
      put({ ...base, state: "ignored", projectId: null, reviewReason: null, reviewDetail: "The project was deleted in the CRM; it won't be recreated." });
      counts.ignored!++;
      return { projectId: null, state: "review", ownsFields: false };
    }
    const ref: ProjectRef = { projectId: current.id, state: "ready", ownsFields };
    counts.projectsMatched!++;
    if (importing) ops.push((tx) => addMembers(current.id, people, tx));
    if (!ownsFields) {
      put({ ...base, state: importing ? "linked" : rec.state === "linked" ? "linked" : "pending", projectId: current.id, reviewReason: null, reviewDetail: null });
      counts.unchanged!++;
      return ref;
    }
    const desired: Record<string, string> = { name: v["Project Name"]!, description: describe(tabName, v, status), status: status ?? "planning" };
    const { changes, conflicts, applied } = reconcile(desired, rec.applied!, { name: current.name, description: current.description ?? "", status: current.status }, rec.decision);
    if (conflicts.length) {
      put({ ...base, state: "review", projectId: current.id, applied, reviewReason: "conflict", reviewDetail: `Changed in the sheet and edited in the CRM: ${conflicts.join(", ")}. Choose which to keep.` });
      counts.conflicts!++;
      counts.review!++;
    } else put({ ...base, state: "linked", projectId: current.id, applied, reviewReason: null, reviewDetail: null, ...(rec.decision === "use_sheet" || rec.decision === "keep_crm" ? { decision: null, decisionData: null } : {}) });
    if (Object.keys(changes).length) {
      counts.projectsUpdated!++;
      if (importing) {
        ops.push(async (tx) => {
          await tx.update(projects).set(changes as Partial<typeof projects.$inferInsert>).where(eq(projects.id, current.id));
          await audit({ actorUserId, action: "project.sync_update", entityType: "project", entityId: current.id, summary: `Updated ${Object.keys(changes).join(", ")} from the Development team sheet` }, tx);
        });
      }
    } else if (!conflicts.length) counts.unchanged!++;
    return ref;
  }

  planProjectRows(aw, "all_website", TABS.allWebsite, new Set());
  planProjectRows(cr, "client_reviewed", TABS.clientReviewed, new Set(aw.map((r) => nameKey(r.values["Project Name"]!)).filter(Boolean)));

  /* ---------- daily rows → tasks + dated updates ---------- */
  type DailyPlan = { r: Row; fp: string; rec?: RecordRow; date: string; start: string | null; end: string | null; projectRef?: ProjectRef; normalisedKey?: string; employeeId?: string; groupKey?: string; review?: Review };
  const SUFFIX = /\b(website|web site|live site|site|frontend|front end|backend|back end)\b/gi;
  const suffixFree = (name: string) => nameKey(name.replace(/[_-]+/g, " ").replace(SUFFIX, " "));
  const suffixFreeKey = (key: string) => key.replace(/(website|site|frontend|backend)$/, "");
  const plans: DailyPlan[] = [];
  const fpCount = new Map<string, number>();
  const fpFirstRow = new Map<string, number>();
  for (const r of daily) {
    const v = r.values;
    const people = splitPeople(v["Frontend Developer"]!, v["Backend Developer"]!);
    const raw = parseDate(v["Date"]!);
    const fp = fingerprint(raw.ok ? raw.date : textKey(v["Date"]!), nameKey(v["Project Name"]!), people.map(nameKey).sort().join(","), textKey(v["Daily Task / Deliverable"]!));
    fpCount.set(fp, (fpCount.get(fp) ?? 0) + 1);
    if (!fpFirstRow.has(fp)) fpFirstRow.set(fp, r.rowNumber);
    link("daily_work_update", r.rowNumber, fp, fpCount.get(fp)! > 1 ? fpFirstRow.get(fp) : undefined);
    if (fpCount.get(fp)! > 1) {
      counts.duplicateRows!++; // an exact repeat of an earlier row: the same record
      continue;
    }
    const rec = recByKey.get(`daily_work_update|${fp}`);
    // A Super Admin may supply the date of a row whose Date can't be read with certainty.
    const dateP = !raw.ok && rec?.decisionData?.date ? parseDate(rec.decisionData.date) : raw;
    const p: DailyPlan = { r, fp, rec, date: dateP.ok ? dateP.date : "", start: null, end: null };
    plans.push(p);
    if (rec?.decision === "ignore" || rec?.decision === "acknowledge") continue;
    const decided = rec?.decision === "separate" || rec?.decision === "attach";
    const startP = parseDate(v["Start Date"]!);
    const endP = parseDate(v["End Date"]!);
    p.start = startP.ok ? startP.date : null;
    p.end = endP.ok ? endP.date : null;
    // Project
    const pk = nameKey(v["Project Name"]!);
    const chosenProject = rec?.decisionData?.projectId;
    const missing = (["Date", "Project Name", "Daily Task / Deliverable"] as const).filter((c) => !v[c] && !(c === "Date" && rec?.decisionData?.date) && !(c === "Project Name" && (chosenProject || rec?.decision === "attach")));
    if (missing.length) p.review = { reason: "missing_required", detail: `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} empty. Fill ${missing.length === 1 ? "it" : "them"} in the sheet and upload again, or decide here.` };
    else if (!dateP.ok) p.review = { reason: "ambiguous_date", detail: `Date “${v["Date"]}” can't be read with certainty.` };
    else if (rec?.decision === "attach") {
      // The project is the chosen task's project.
    } else if (chosenProject) {
      const target = crmProjects.find((x) => x.id === chosenProject);
      p.projectRef = target ? { projectId: target.id, state: "ready", ownsFields: false } : undefined;
      if (!target) p.review = { reason: "unmatched_project", detail: "The project chosen for this row no longer exists." };
    } else if (isMultiProject(v["Project Name"]!)) p.review = { reason: "multiple_projects", detail: `“${v["Project Name"]}” names more than one project. Choose the project this work belongs to.` };
    else if (projectAlias.has(pk)) {
      const target = crmProjects.find((x) => x.id === projectAlias.get(pk));
      p.projectRef = target ? { projectId: target.id, state: "ready", ownsFields: false } : undefined;
      if (!target) p.review = { reason: "unmatched_project", detail: "The project this name was mapped to no longer exists." };
    } else if (projectByKey.has(pk)) {
      p.projectRef = projectByKey.get(pk)!;
      if (p.projectRef.state === "review") p.review = { reason: "project_needs_review", detail: `Project “${v["Project Name"]}” is in the review queue. Resolve it first.` };
    } else {
      // Harmless suffixes ("MTC_BACKEND", "NeoCloudz Frontend", "… Website") are dropped only when that
      // leaves exactly one project in the sheet; otherwise the name goes to review.
      const stripped = suffixFree(v["Project Name"]!);
      const candidates = stripped ? [...projectByKey.keys()].filter((k) => k === stripped || suffixFreeKey(k) === stripped) : [];
      const only = candidates.length === 1 ? projectByKey.get(candidates[0]!)! : null;
      if (only && only.state === "ready") {
        p.projectRef = only;
        p.normalisedKey = candidates[0]!;
      } else if (only) p.review = { reason: "project_needs_review", detail: `“${v["Project Name"]}” matches a project that is in the review queue. Resolve it first.` };
      else p.review = { reason: "unmatched_project", detail: candidates.length > 1 ? `“${v["Project Name"]}” could be ${candidates.length} different projects. Map it to the right one.` : `“${v["Project Name"]}” isn't in “${TABS.allWebsite}” or “${TABS.clientReviewed}”. Map it to a project, or ignore the row.` };
    }
    // Person
    if (!p.review) {
      const chosen = rec?.decisionData?.employeeId;
      if (chosen && devEmps.some((e) => e.id === chosen)) p.employeeId = chosen;
      else if (people.length === 0) p.review = { reason: "no_developer", detail: "Neither Frontend nor Backend Developer is filled in." };
      else if (people.length > 1) p.review = { reason: "multiple_developers", detail: `${people.join(", ")} are both named. Choose who the task belongs to.` };
      else {
        const who = person(people[0]!);
        if ("employeeId" in who) p.employeeId = who.employeeId;
        else p.review = "review" in who ? who.review : { reason: "unknown_person", detail: `“${people[0]}” is set to be ignored.` };
      }
    }
    // Content and dates
    if (!p.review && !decided && looksNonProject(v["Daily Task / Deliverable"]!)) p.review = { reason: "non_project_work", detail: "This looks like learning or training rather than project work." };
    if (!p.review && !decided && !startP.ok) p.review = startP.reason === "empty" ? { reason: "missing_start_date", detail: "Without a start date the deliverable can't be identified. Import it as its own task, add it to an existing task, or ignore it." } : { reason: "ambiguous_date", detail: `Start Date “${v["Start Date"]}” can't be read with certainty.` };
    if (!p.review && !decided && !endP.ok && endP.reason !== "empty") p.review = { reason: "ambiguous_date", detail: `End Date “${v["End Date"]}” can't be read with certainty.` };
    if (!p.review) {
      if (rec?.decision === "attach") p.groupKey = `task:${rec.decisionData?.taskId}`;
      else if (rec?.decision === "separate") p.groupKey = `row:${fp}`;
      // Stable across runs: the sheet's project name (or the project a Super Admin chose), developer and start date.
      else p.groupKey = `${chosenProject ? `pid:${chosenProject}` : `pk:${p.normalisedKey ?? pk}`}|${p.employeeId}|${p.start}`;
      // A row already imported stays with its task even if its start date or name is edited later.
      if (rec?.commentId && rec.groupKey) p.groupKey = rec.groupKey;
    }
  }

  // Rows that look like an edited version of an imported row that has disappeared → review, not a second copy.
  const liveFps = new Set(plans.map((p) => p.fp));
  const goneDaily = existing.filter((x) => x.sourceTab === "daily_work_update" && x.commentId && !liveFps.has(x.fingerprint));
  for (const p of plans) {
    // Until a Super Admin decides, it stays held — on every sync, not just the first.
    if (p.review || !p.groupKey || p.rec?.decision || p.rec?.commentId) continue;
    const twin = goneDaily.find((g) => g.source["Date"] === p.r.values["Date"] && nameKey(g.source["Project Name"] ?? "") === nameKey(p.r.values["Project Name"]!) && textKey(g.source["Frontend Developer"] ?? "") === textKey(p.r.values["Frontend Developer"]!));
    if (twin) p.review = { reason: "possible_edit", detail: `Row ${p.r.rowNumber} looks like an edited version of an already-imported update (previously row ${twin.rowNumber}). Import it as a new update, or ignore it.` };
  }

  // Within a group, the same day twice or different end dates mean possibly different deliverables.
  const groups = new Map<string, DailyPlan[]>();
  for (const p of plans) if (!p.review && p.groupKey) groups.set(p.groupKey, [...(groups.get(p.groupKey) ?? []), p]);
  for (const [, g] of groups) {
    g.sort((a, b) => a.date.localeCompare(b.date) || a.r.rowNumber - b.r.rowNumber);
    const days = new Set<string>();
    const firstEnd = g.find((x) => x.end)?.end;
    for (const p of g) {
      if (p.rec?.decision || p.rec?.commentId) {
        days.add(p.date); // already imported (or decided): never re-flagged
        continue;
      }
      if (days.has(p.date)) p.review = { reason: "uncertain_task_match", detail: "Another entry for the same project, developer and start date is dated the same day, so it may be a different deliverable. Import it as its own task, add it to the task, or ignore it." };
      else if (p.end && firstEnd && p.end !== firstEnd) p.review = { reason: "uncertain_task_match", detail: `Its End Date (${p.end}) differs from the task's (${firstEnd}), so it may be a different deliverable.` };
      days.add(p.date);
    }
  }

  // Existing task per group (from earlier runs).
  const linkedByGroup = new Map<string, RecordRow[]>();
  for (const x of existing) if (x.sourceTab === "daily_work_update" && x.groupKey && (x.taskId || x.applied)) linkedByGroup.set(x.groupKey, [...(linkedByGroup.get(x.groupKey) ?? []), x]);
  const taskIds = [...new Set(existing.map((x) => x.taskId).filter(Boolean))] as string[];
  const crmTasks = taskIds.length ? await db.select().from(tasks).where(inArray(tasks.id, taskIds)) : [];

  for (const p of plans) {
    if (p.rec?.decision === "ignore" || p.rec?.decision === "acknowledge") {
      put({ sourceTab: "daily_work_update", fingerprint: p.fp, rowNumber: p.r.rowNumber, kind: "task_update", source: p.r.values, state: "ignored", reviewReason: null, reviewDetail: null });
      counts.ignored!++;
    } else if (p.review) {
      put({ sourceTab: "daily_work_update", fingerprint: p.fp, rowNumber: p.r.rowNumber, kind: "task_update", source: p.r.values, groupKey: p.groupKey ?? null, state: "review", reviewReason: p.review.reason, reviewDetail: p.review.detail ?? null });
      counts.review!++;
    }
  }

  const finalGroups = new Map<string, DailyPlan[]>();
  for (const p of plans) if (!p.review && p.groupKey && p.rec?.decision !== "ignore" && p.rec?.decision !== "acknowledge") finalGroups.set(p.groupKey, [...(finalGroups.get(p.groupKey) ?? []), p]);

  const conflictHolds: Upsert[] = [];
  for (const [groupKey, g] of finalGroups) {
    g.sort((a, b) => a.date.localeCompare(b.date) || a.r.rowNumber - b.r.rowNumber);
    const prior = linkedByGroup.get(groupKey) ?? [];
    const attachTo = groupKey.startsWith("task:") ? groupKey.slice(5) : null;
    const anchor = prior.find((x) => x.applied && x.taskId) ?? prior.find((x) => x.applied);
    const taskId = attachTo ?? anchor?.taskId ?? null;
    const deleted = !attachTo && prior.length > 0 && !taskId;
    const existingTask = taskId ? crmTasks.find((t) => t.id === taskId) ?? (attachTo ? await db.query.tasks.findFirst({ where: eq(tasks.id, attachTo) }) : undefined) : undefined;
    const putRow = (p: DailyPlan, extra: Partial<Upsert> & { state: string }) => put({ sourceTab: "daily_work_update", fingerprint: p.fp, rowNumber: p.r.rowNumber, kind: "task_update", source: p.r.values, groupKey, reviewReason: null, reviewDetail: null, ...extra });
    if (existingTask && !attachTo) counts.tasksMatched!++;
    if (deleted || (taskId && !existingTask)) {
      for (const p of g) {
        if (p.rec?.commentId || p.rec?.state === "linked") putRow(p, { state: "linked", taskId: null });
        else {
          putRow(p, { state: "review", reviewReason: "task_deleted_in_crm", reviewDetail: "The task this work belonged to was deleted in the CRM, so it isn't recreated. Import it as its own task, or ignore it." });
          counts.review!++;
        }
      }
      continue;
    }
    // Resolved when the write runs: a project created earlier in the same transaction has its id by then.
    const projectIdNow = () => g[0]!.projectRef?.projectId ?? existingTask?.projectId ?? null;
    const employeeId = g[0]!.employeeId!;
    // Desired sheet-owned task values from every row of the deliverable still in the sheet.
    const allRows = g; // rows in this run (previous rows of the group are in g too, if still in the sheet)
    const first = allRows[0]!;
    // Title and description come from the row that created the task (if it's gone from the sheet, its last
    // seen values), so removing or reordering rows never retitles a task.
    const anchorLive = anchor ? g.find((x) => x.fp === anchor.fingerprint) : undefined;
    const anchorText = anchorLive?.r.values["Daily Task / Deliverable"] ?? anchor?.source["Daily Task / Deliverable"] ?? first.r.values["Daily Task / Deliverable"]!;
    const anchorStartRaw = anchorLive?.r.values["Start Date"] ?? anchor?.source["Start Date"];
    const anchorStartP = anchorStartRaw !== undefined ? parseDate(anchorStartRaw) : null;
    const anchorStart = anchorStartP ? (anchorStartP.ok ? anchorStartP.date : null) : first.start;
    const latestWith = <T,>(f: (p: DailyPlan) => T | null) => [...allRows].reverse().map(f).find((x) => x != null) ?? null;
    const status = latestWith((p) => taskStatus(p.r.values["Status"]!));
    const priority = latestWith((p) => taskPriority(p.r.values["Priority"]!));
    const due = latestWith((p) => p.end);
    if (!attachTo && !taskId && !status && !g.some((p) => p.rec?.decision === "separate")) {
      for (const p of g) {
        putRow(p, { state: "review", reviewReason: "missing_status", reviewDetail: "No row of this deliverable has a Status. Add it in the sheet, or import it as its own task (status “To do”)." });
        counts.review!++;
      }
      continue;
    }
    const desired: Record<string, string | null> = attachTo
      ? {}
      : {
          title: taskTitle(anchorText),
          description: `${anchorText}\n\nImported from the “${TABS.daily}” tab${anchorStart ? ` (started ${formatDate(anchorStart)})` : ""}. Daily updates from the sheet are listed in the comments.${priority ? "" : "\nPriority not set in the sheet."}`,
          status: status ?? "todo",
          priority: priority ?? "medium",
          dueDate: due,
          assigneeId: employeeId,
        };
    const latestDate = allRows[allRows.length - 1]!.date;
    const taskRef = { id: taskId };
    if (!taskId) {
      counts.tasksCreated!++;
      if (importing) {
        ops.push(async (tx) => {
          const [t] = await tx
            .insert(tasks)
            .values({
              projectId: projectIdNow(),
              title: desired.title!,
              description: desired.description,
              status: desired.status as TaskStatus,
              priority: desired.priority as "low" | "medium" | "high" | "urgent",
              dueDate: desired.dueDate,
              assigneeId: employeeId,
              progress: desired.status === "completed" ? 100 : 0,
              completedAt: desired.status === "completed" ? zonedToInstant(latestDate, "18:00", company.timezone) : null,
            })
            .returning({ id: tasks.id });
          taskRef.id = t!.id;
          await audit({ actorUserId, action: "task.import", entityType: "task", entityId: t!.id, summary: `Imported from the Development team sheet (${g.length} daily update${g.length === 1 ? "" : "s"})` }, tx);
        });
      }
    } else if (!attachTo && anchor && existingTask) {
      const current = { title: existingTask.title, description: existingTask.description ?? "", status: existingTask.status, priority: existingTask.priority, dueDate: existingTask.dueDate, assigneeId: existingTask.assigneeId };
      const { changes, conflicts, applied } = reconcile(desired, anchor.applied!, current, anchor.decision);
      if (conflicts.length) {
        counts.conflicts!++;
        counts.review!++;
        const held: Upsert = { sourceTab: "daily_work_update", fingerprint: anchor.fingerprint, rowNumber: anchor.rowNumber, kind: "task_update", source: anchor.source, groupKey, state: "review", applied, reviewReason: "conflict", reviewDetail: `Changed in the sheet and edited in the CRM: ${conflicts.join(", ")}. Choose which to keep.` };
        put(held);
        conflictHolds.push(held); // re-applied after the per-row pass, which would otherwise mark the row linked
      } else if (anchor.state === "review" && anchor.reviewReason === "conflict" || anchor.decision === "use_sheet" || anchor.decision === "keep_crm") {
        put({ sourceTab: "daily_work_update", fingerprint: anchor.fingerprint, rowNumber: anchor.rowNumber, kind: "task_update", source: anchor.source, groupKey, state: "linked", applied, reviewReason: null, reviewDetail: null, decision: null, decisionData: null });
      } else if (JSON.stringify(applied) !== JSON.stringify(anchor.applied)) upserts.set(`daily_work_update|${anchor.fingerprint}`, { ...(upserts.get(`daily_work_update|${anchor.fingerprint}`) ?? { sourceTab: "daily_work_update", fingerprint: anchor.fingerprint, rowNumber: anchor.rowNumber, kind: "task_update", source: anchor.source, state: anchor.state, reviewReason: anchor.reviewReason, reviewDetail: anchor.reviewDetail }), applied });
      if (Object.keys(changes).length) {
        counts.tasksUpdated!++;
        if (importing) {
          const set: Partial<typeof tasks.$inferInsert> = { ...(changes as Partial<typeof tasks.$inferInsert>) };
          if (changes.status === "completed") Object.assign(set, { progress: 100, completedAt: zonedToInstant(latestDate, "18:00", company.timezone) });
          else if (changes.status) set.completedAt = null;
          ops.push(async (tx) => {
            await tx.update(tasks).set(set).where(eq(tasks.id, existingTask.id));
            await audit({ actorUserId, action: "task.sync_update", entityType: "task", entityId: existingTask.id, summary: `Updated ${Object.keys(changes).join(", ")} from the Development team sheet` }, tx);
          });
        }
      }
    }
    if (importing) ops.push(async (tx) => {
      const projectId = projectIdNow();
      if (!projectId) return;
      const added = await tx.insert(projectMembers).values({ projectId, employeeId }).onConflictDoNothing().returning({ e: projectMembers.employeeId });
      if (added.length) counts.membersAdded!++;
    });
    // One dated comment per row; never edited afterwards.
    for (const [i, p] of g.entries()) {
      const isAnchor = !taskId && i === 0;
      if (p.rec?.commentId) {
        putRow(p, { state: "linked", taskId: p.rec.taskId, commentId: p.rec.commentId, ...(p.rec.applied ? { applied: upserts.get(`daily_work_update|${p.fp}`)?.applied ?? p.rec.applied } : {}) });
        counts.unchanged!++;
        continue;
      }
      if (p.rec?.state === "linked" && p.rec.taskId && !p.rec.commentId) {
        // The comment was deleted in the CRM: respect that.
        putRow(p, { state: "linked", taskId: p.rec.taskId });
        continue;
      }
      counts.updatesAdded!++;
      if (!importing) {
        putRow(p, { state: "pending" });
        continue;
      }
      putRow(p, { state: "linked", ...(isAnchor ? { applied: desired } : {}) });
      const v = p.r.values;
      const body = [`Daily update · ${formatDate(p.date)}`, v["Daily Task / Deliverable"], [`Status: ${v["Status"] || "not set"}`, `Priority: ${v["Priority"] || "not set"}`, p.end ? `End date: ${formatDate(p.end)}` : null].filter(Boolean).join(" · "), v["Project URL"] ? `URL: ${v["Project URL"]}` : null].filter(Boolean).join("\n");
      ops.push(async (tx) => {
        const [c] = await tx.insert(taskComments).values({ taskId: taskRef.id!, authorId: employeeId, body, createdAt: zonedToInstant(p.date, "12:00", company.timezone) }).returning({ id: taskComments.id });
        const u = upserts.get(`daily_work_update|${p.fp}`)!;
        Object.assign(u, { taskId: taskRef.id, commentId: c!.id });
      });
    }
  }

  /* ---------- rows that disappeared ---------- */
  for (const u of conflictHolds) put(u);
  for (const x of existing) {
    if (x.sourceTab === "people" || seen.has(`${x.sourceTab}|${x.fingerprint}`)) continue;
    if (x.state === "missing" || x.state === "ignored" || x.reviewReason === "removed_from_sheet") continue;
    // Rows that reached the CRM go to the review queue; rows that never did are simply marked missing.
    const imported = !!(x.projectId || x.taskId || x.commentId);
    upserts.set(`${x.sourceTab}|${x.fingerprint}`, { sourceTab: x.sourceTab, fingerprint: x.fingerprint, rowNumber: x.rowNumber, kind: x.kind, source: x.source, state: imported ? "review" : "missing", reviewReason: imported ? "removed_from_sheet" : null, reviewDetail: imported ? "This row is no longer in the sheet. Nothing was deleted in the CRM; acknowledge to clear it." : null, lastRunId: runId });
    counts.missing!++;
  }

  /* ---------- write ---------- */
  const writeRecords = async (t: Tx) => {
    for (const full of upserts.values()) {
      let u: Upsert = full;
      if (!importing) {
        // A preview records only what the review queue needs: new rows (as pending) and review flags.
        // Links, "last written" values, decisions and linked/ignored transitions are left for a real import.
        const prev = recByKey.get(`${full.sourceTab}|${full.fingerprint}`);
        const flagged = full.state === "review";
        const state = flagged ? "review" : !prev ? "pending" : prev.state === "review" || prev.state === "missing" ? "pending" : prev.state;
        u = {
          sourceTab: full.sourceTab,
          fingerprint: full.fingerprint,
          rowNumber: full.rowNumber,
          kind: full.kind,
          source: full.source,
          groupKey: prev ? undefined : full.groupKey ?? null,
          state,
          reviewReason: flagged ? full.reviewReason ?? null : state === prev?.state ? prev?.reviewReason ?? null : null,
          reviewDetail: flagged ? full.reviewDetail ?? null : state === prev?.state ? prev?.reviewDetail ?? null : null,
          lastSeenAt: full.lastSeenAt,
          lastRunId: runId,
        };
      }
      await t
        .insert(sheetSyncRecords)
        .values(u)
        .onConflictDoUpdate({
          target: [sheetSyncRecords.sourceTab, sheetSyncRecords.fingerprint],
          set: { rowNumber: u.rowNumber, kind: u.kind, source: u.source, state: u.state, reviewReason: u.reviewReason ?? null, reviewDetail: u.reviewDetail ?? null, lastSeenAt: new Date(), lastRunId: runId, ...(u.groupKey !== undefined ? { groupKey: u.groupKey } : {}), ...(u.projectId !== undefined ? { projectId: u.projectId } : {}), ...(u.taskId !== undefined ? { taskId: u.taskId } : {}), ...(u.commentId !== undefined ? { commentId: u.commentId } : {}), ...(u.applied !== undefined ? { applied: u.applied } : {}), ...(u.decision !== undefined ? { decision: u.decision, decisionData: u.decisionData ?? null } : {}) },
        });
    }
  };
  // Open reviews = everything currently awaiting a decision (incl. people), not just this run's new ones.
  await db.transaction(async (tx) => {
    for (const op of ops) await op(tx);
    await writeRecords(tx);
    if (importing) await audit({ actorUserId, action: "sheets.import", entityType: "integration", entityId: "dev_sheet", summary: `Development team sheet (CSV) imported: ${counts.projectsCreated} projects and ${counts.tasksCreated} tasks created, ${counts.updatesAdded} daily updates added`, metadata: counts }, tx);
  });
  const open = await db.select({ id: sheetSyncRecords.id }).from(sheetSyncRecords).where(eq(sheetSyncRecords.state, "review"));
  counts.review = open.length;

  // Each source row's outcome in this run, from the same decisions the import used.
  const rowsOut: Record<string, SyncRowStatus[]> = {};
  for (const l of rowLinks.values()) {
    const u = upserts.get(`${l.tab}|${l.fp}`);
    const prev = recByKey.get(`${l.tab}|${l.fp}`);
    const wasImported = !!prev && (prev.state === "linked" || !!(prev.projectId || prev.taskId || prev.commentId || prev.applied));
    const s: SyncRowStatus["s"] = l.dupOf ? "duplicate" : !u ? "review" : u.state === "review" ? "review" : u.state === "ignored" ? "ignored" : importing || wasImported ? "imported" : "ready";
    const group = u?.groupKey && !l.dupOf ? fingerprint(u.groupKey).slice(0, 12) : undefined;
    (rowsOut[l.tab] ??= []).push({ n: l.n, fp: l.fp, s, ...(s === "review" && u?.reviewReason ? { reason: u.reviewReason } : {}), ...(l.dupOf ? { dupOf: l.dupOf } : {}), ...(group ? { group } : {}) });
  }
  for (const list of Object.values(rowsOut)) list.sort((a, b) => a.n - b.n);
  return { counts, rows: rowsOut };
}

/**
 * Field-level ownership. For each sheet-owned field:
 * - sheet unchanged since last sync → leave the CRM value (CRM edits are kept);
 * - sheet changed, CRM still has what we last wrote → apply the sheet value;
 * - sheet changed AND CRM edited → conflict (unless a Super Admin chose a side).
 */
export function reconcile(desired: Record<string, string | null>, applied: Record<string, string | null>, current: Record<string, string | null>, decision: string | null) {
  const changes: Record<string, string | null> = {};
  const conflicts: string[] = [];
  const next = { ...applied };
  for (const [k, want] of Object.entries(desired)) {
    const was = applied[k] ?? null;
    const now = current[k] ?? null;
    if (want === was) continue; // sheet unchanged
    if (now === was || now === want || decision === "use_sheet") {
      if (now !== want) changes[k] = want;
      next[k] = want;
    } else if (decision === "keep_crm") next[k] = want; // accept the CRM value until the sheet changes again
    else conflicts.push(k);
  }
  return { changes, conflicts, applied: next };
}

/* ------------------------------------------------------------- read side */

export type UploadSummary = Omit<typeof sheetSyncUploads.$inferSelect, "rows"> & { uploadedBy: string | null };

export async function syncOverview() {
  const [runs, lastOk, open, aliases, uploads] = await Promise.all([
    db.select().from(sheetSyncRuns).orderBy(desc(sheetSyncRuns.startedAt)).limit(20),
    db.query.sheetSyncRuns.findFirst({ where: eq(sheetSyncRuns.status, "succeeded"), orderBy: desc(sheetSyncRuns.startedAt) }),
    db.select().from(sheetSyncRecords).where(eq(sheetSyncRecords.state, "review")).orderBy(sheetSyncRecords.sourceTab, sheetSyncRecords.rowNumber),
    db
      .select({ id: sheetSyncAliases.id, kind: sheetSyncAliases.kind, alias: sheetSyncAliases.alias, employeeId: sheetSyncAliases.employeeId, projectId: sheetSyncAliases.projectId, firstName: employees.firstName, lastName: employees.lastName, projectName: projects.name })
      .from(sheetSyncAliases)
      .leftJoin(employees, eq(employees.id, sheetSyncAliases.employeeId))
      .leftJoin(projects, eq(projects.id, sheetSyncAliases.projectId)),
    db
      .select({ tab: sheetSyncUploads.tab, fileName: sheetSyncUploads.fileName, sizeBytes: sheetSyncUploads.sizeBytes, sha256: sheetSyncUploads.sha256, encoding: sheetSyncUploads.encoding, delimiter: sheetSyncUploads.delimiter, columns: sheetSyncUploads.columns, dataRows: sheetSyncUploads.dataRows, uploadedById: sheetSyncUploads.uploadedById, uploadedAt: sheetSyncUploads.uploadedAt, uploadedBy: users.email })
      .from(sheetSyncUploads)
      .leftJoin(users, eq(users.id, sheetSyncUploads.uploadedById)),
  ]);
  const actorIds = [...new Set(runs.map((r) => r.actorUserId).filter(Boolean))] as string[];
  const actors = actorIds.length ? await db.select({ id: users.id, email: users.email, firstName: employees.firstName, lastName: employees.lastName }).from(users).leftJoin(employees, eq(employees.userId, users.id)).where(inArray(users.id, actorIds)) : [];
  const actorName = new Map(actors.map((a) => [a.id, a.firstName ? `${a.firstName} ${a.lastName}`.trim() : a.email]));
  const lastImport = await db.query.sheetSyncRuns.findFirst({ where: and(eq(sheetSyncRuns.status, "succeeded"), eq(sheetSyncRuns.mode, "import")), orderBy: desc(sheetSyncRuns.startedAt) });
  return { runs: runs.map((r) => ({ ...r, actorName: r.actorUserId ? actorName.get(r.actorUserId) ?? "—" : "—" })), lastOk: lastOk ?? null, lastImport: lastImport ?? null, open, aliases, uploads: uploads as UploadSummary[] };
}
