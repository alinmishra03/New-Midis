import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, ne } from "drizzle-orm";
import { ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { db } from "@/crm/db";
import { departments, employees, projects, sheetSyncAliases, sheetSyncRecords, sheetSyncRuns, sheetSyncUploads, tasks, type SyncRunFile } from "@/crm/db/schema";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { checkCsvFile, CsvError, parseCsv } from "./csv";
import { DAILY_COLUMNS, nameKey, PROJECT_COLUMNS, readTable, SheetFormatError, TABS, type TabKey } from "./parse";
import { runSheetSync } from "./sync";

/*
 * Super Admin decisions on the review queue. A decision is recorded here and
 * applied by the next sync ("Check" or "Import"), so the same engine and the
 * same transaction rules apply to everything that reaches the CRM.
 */

export function assertSuperAdmin(viewer: Viewer) {
  if (viewer.role.key !== "super_admin") throw new ForbiddenError("Only a Super Admin can manage the Development sheet import.");
}

async function developmentId() {
  const dev = await db.query.departments.findFirst({ where: eq(departments.code, "DEV") }) ?? (await db.query.departments.findFirst({ where: eq(departments.name, "Development") }));
  if (!dev) throw new AppError("There's no Development department in the CRM.");
  return dev.id;
}

/** Development employees and projects only: the integration never reaches other departments. */
export async function decisionOptions() {
  const devId = await developmentId();
  const [emps, projs] = await Promise.all([
    db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, code: employees.employeeCode }).from(employees).where(and(eq(employees.departmentId, devId), ne(employees.employmentStatus, "exited"))).orderBy(asc(employees.firstName)),
    db.select({ id: projects.id, name: projects.name, code: projects.code }).from(projects).where(eq(projects.departmentId, devId)).orderBy(asc(projects.name)),
  ]);
  const projectIds = projs.map((p) => p.id);
  const taskRows = projectIds.length
    ? await db.select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId }).from(tasks).where(inArray(tasks.projectId, projectIds)).orderBy(asc(tasks.title)).limit(500)
    : [];
  const projectName = new Map(projs.map((p) => [p.id, p.name]));
  return {
    employees: emps.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}`.trim() + ` (${e.code})` })),
    projects: projs.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
    tasks: taskRows.map((t) => ({ value: t.id, label: `${projectName.get(t.projectId!) ?? "—"} · ${t.title}` })),
  };
}

async function assertDevEmployee(employeeId: string) {
  const devId = await developmentId();
  const e = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { departmentId: true, employmentStatus: true } });
  if (!e || e.departmentId !== devId || e.employmentStatus === "exited") throw new AppError("Choose a current Development employee.");
}
async function assertDevProject(projectId: string) {
  const devId = await developmentId();
  const p = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { departmentId: true } });
  if (!p || p.departmentId !== devId) throw new AppError("Choose a Development project.");
}
async function assertDevTask(taskId: string) {
  const t = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId), columns: { projectId: true } });
  if (!t?.projectId) throw new AppError("Choose a task in a Development project.");
  await assertDevProject(t.projectId);
}

async function getRecord(id: string) {
  const r = await db.query.sheetSyncRecords.findFirst({ where: eq(sheetSyncRecords.id, id) });
  if (!r) throw new AppError("That review item no longer exists. Refresh the page.");
  return r;
}

const settle = (viewer: Viewer, decision: string, decisionData: Record<string, string> | null, state = "pending") => ({ decision, decisionData, state, resolvedById: viewer.userId, resolvedAt: new Date() });

/* ------------------------------------------------------------------ CSV uploads */

export const TAB_SPECS: Record<TabKey, { name: string; columns: readonly string[] }> = {
  all_website: { name: TABS.allWebsite, columns: PROJECT_COLUMNS },
  client_reviewed: { name: TABS.clientReviewed, columns: PROJECT_COLUMNS },
  daily_work_update: { name: TABS.daily, columns: DAILY_COLUMNS },
};
export const TAB_ORDER: TabKey[] = ["all_website", "client_reviewed", "daily_work_update"];
export const isTabKey = (t: string): t is TabKey => t in TAB_SPECS;

export const headerIndex = (rows: string[][], required: readonly string[]) =>
  rows.slice(0, 10).findIndex((r) => required.every((c) => r.map((h) => h.replace(/\s+/g, " ").trim().toLowerCase()).includes(c.toLowerCase())));

/**
 * Reads and validates one uploaded CSV on the server and keeps it as the
 * current file for that tab (replacing any earlier one). Nothing reaches
 * projects or tasks until a preview and an import are run.
 */
export async function stageUpload(viewer: Viewer, tab: string, file: { name: string; type: string; size: number; bytes: () => Promise<ArrayBuffer> }) {
  assertSuperAdmin(viewer);
  if (!isTabKey(tab)) throw new AppError("Unknown tab.");
  const spec = TAB_SPECS[tab];
  try {
    checkCsvFile(file.name, file.type, file.size);
    const bytes = new Uint8Array(await file.bytes());
    if (bytes.byteLength !== file.size) throw new CsvError("The upload was incomplete. Try again.");
    const parsed = parseCsv(bytes);
    let table;
    try {
      table = readTable(parsed.rows, spec.columns, spec.name);
    } catch (e) {
      if (e instanceof SheetFormatError) throw new CsvError(`“${file.name}” doesn't look like the “${spec.name}” tab: ${e.message.replace(/^The “[^”]+” tab has/, "it has")} Check you exported the right tab.`);
      throw e;
    }
    const h = headerIndex(parsed.rows, spec.columns);
    const columns = (parsed.rows[h] ?? []).map((c) => c.trim()).filter(Boolean);
    const extra = columns.filter((c) => !spec.columns.some((x) => x.toLowerCase() === c.replace(/\s+/g, " ").toLowerCase()));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const values = { tab, fileName: file.name.slice(0, 200), sizeBytes: file.size, sha256, encoding: parsed.encoding, delimiter: parsed.delimiter, columns, dataRows: table.length, rows: parsed.rows, uploadedById: viewer.userId, uploadedAt: new Date() };
    await db.insert(sheetSyncUploads).values(values).onConflictDoUpdate({ target: sheetSyncUploads.tab, set: values });
    await audit({ actorUserId: viewer.userId, action: "sheets.upload", entityType: "integration", entityId: "dev_sheet", summary: `Uploaded “${values.fileName}” for ${spec.name} (${table.length} rows)`, metadata: { tab, sha256, rows: table.length } });
    return { fileName: values.fileName, dataRows: table.length, columns, extra, encoding: parsed.encoding, delimiter: parsed.delimiter };
  } catch (e) {
    if (e instanceof CsvError) throw new AppError(e.message);
    throw e;
  }
}

export async function removeUpload(viewer: Viewer, tab: string) {
  assertSuperAdmin(viewer);
  if (!isTabKey(tab)) throw new AppError("Unknown tab.");
  await db.delete(sheetSyncUploads).where(eq(sheetSyncUploads.tab, tab));
}

/** The three uploaded files as the engine's input (cells as parsed by the server). */
async function stagedData() {
  const rows = await db.select().from(sheetSyncUploads);
  const missing = TAB_ORDER.filter((t) => !rows.some((r) => r.tab === t));
  if (missing.length) throw new AppError(`Upload all three files first. Missing: ${missing.map((t) => TAB_SPECS[t].name).join(", ")}.`);
  const files: SyncRunFile[] = TAB_ORDER.map((t) => rows.find((r) => r.tab === t)!).map((r) => ({ tab: r.tab, fileName: r.fileName, sha256: r.sha256, dataRows: r.dataRows }));
  return { data: { title: files.map((x) => x.fileName).join(", "), tabs: Object.fromEntries(rows.map((r) => [TAB_SPECS[r.tab as TabKey].name, r.rows])) }, files };
}

/** Preview: everything the import would do, plus the review queue. Projects and tasks are not touched. */
export async function previewImport(viewer: Viewer) {
  assertSuperAdmin(viewer);
  const { data, files } = await stagedData();
  return runSheetSync({ mode: "check", trigger: "manual", actorUserId: viewer.userId, data, files });
}

/**
 * Import exactly what was previewed: refused if the files, the review
 * decisions or the name mappings changed since that preview, or if another
 * preview/import ran after it.
 */
export async function runImport(viewer: Viewer, previewRunId: string) {
  assertSuperAdmin(viewer);
  const preview = await db.query.sheetSyncRuns.findFirst({ where: eq(sheetSyncRuns.id, previewRunId) });
  if (!preview || preview.mode !== "check" || preview.status !== "succeeded" || !preview.finishedAt) throw new AppError("Run a preview first.");
  const latest = await db.query.sheetSyncRuns.findFirst({ orderBy: desc(sheetSyncRuns.startedAt) });
  if (latest?.id !== preview.id) throw new AppError("Something ran after this preview. Preview again before importing.");
  const { data, files } = await stagedData();
  const same = JSON.stringify(files.map((f) => f.sha256)) === JSON.stringify((preview.files ?? []).map((f) => f.sha256));
  if (!same) throw new AppError("The uploaded files changed since the preview. Preview again before importing.");
  const [decided, mapped] = await Promise.all([
    db.query.sheetSyncRecords.findFirst({ where: gt(sheetSyncRecords.resolvedAt, preview.finishedAt), columns: { id: true } }),
    db.query.sheetSyncAliases.findFirst({ where: gt(sheetSyncAliases.createdAt, preview.finishedAt), columns: { id: true } }),
  ]);
  if (decided || mapped) throw new AppError("Review decisions changed since the preview. Preview again before importing.");
  return runSheetSync({ mode: "import", trigger: "manual", actorUserId: viewer.userId, data, files });
}

/** Map a spreadsheet person name to a Development employee (or ignore the name). */
export async function mapPerson(viewer: Viewer, recordId: string, employeeId: string | "ignore") {
  assertSuperAdmin(viewer);
  const rec = await getRecord(recordId);
  if (rec.kind !== "person") throw new AppError("That item isn't a person.");
  const name = rec.source.name ?? rec.fingerprint;
  if (employeeId === "ignore") {
    await db.update(sheetSyncRecords).set(settle(viewer, "ignore", null, "ignored")).where(eq(sheetSyncRecords.id, rec.id));
  } else {
    await assertDevEmployee(employeeId);
    await db.transaction(async (tx) => {
      await tx.insert(sheetSyncAliases).values({ kind: "person", alias: rec.fingerprint, employeeId, createdById: viewer.userId }).onConflictDoUpdate({ target: [sheetSyncAliases.kind, sheetSyncAliases.alias], set: { employeeId, projectId: null, createdById: viewer.userId } });
      await tx.update(sheetSyncRecords).set(settle(viewer, "link", { employeeId }, "linked")).where(eq(sheetSyncRecords.id, rec.id));
    });
  }
  await audit({ actorUserId: viewer.userId, action: "sheets.review", entityType: "integration", entityId: "dev_sheet", summary: employeeId === "ignore" ? `Ignored the sheet name “${name}”` : `Mapped the sheet name “${name}” to an employee`, metadata: { employeeId } });
}

/** Map a project name used in Daily Work Update to a Development project (all rows using that name), or ignore those rows. */
export async function mapProjectName(viewer: Viewer, projectName: string, projectId: string | "ignore") {
  assertSuperAdmin(viewer);
  const key = nameKey(projectName);
  if (!key) throw new AppError("Missing project name.");
  const rows = (await db.select().from(sheetSyncRecords).where(and(eq(sheetSyncRecords.sourceTab, "daily_work_update"), eq(sheetSyncRecords.state, "review")))).filter((r) => nameKey(r.source["Project Name"] ?? "") === key);
  if (projectId === "ignore") {
    for (const r of rows) await db.update(sheetSyncRecords).set(settle(viewer, "ignore", null, "ignored")).where(eq(sheetSyncRecords.id, r.id));
  } else {
    await assertDevProject(projectId);
    await db.transaction(async (tx) => {
      await tx.insert(sheetSyncAliases).values({ kind: "project", alias: key, projectId, createdById: viewer.userId }).onConflictDoUpdate({ target: [sheetSyncAliases.kind, sheetSyncAliases.alias], set: { projectId, employeeId: null, createdById: viewer.userId } });
      for (const r of rows.filter((x) => x.reviewReason === "unmatched_project")) await tx.update(sheetSyncRecords).set({ state: "pending", reviewReason: null, reviewDetail: null }).where(eq(sheetSyncRecords.id, r.id));
    });
  }
  await audit({ actorUserId: viewer.userId, action: "sheets.review", entityType: "integration", entityId: "dev_sheet", summary: projectId === "ignore" ? `Ignored ${rows.length} sheet rows for “${projectName}”` : `Mapped the sheet project name “${projectName}” to a project`, metadata: { projectId, rows: rows.length } });
}

export type RowDecision =
  | { decision: "ignore" | "create" | "use_sheet" | "keep_crm" | "acknowledge" }
  | { decision: "link"; projectId: string }
  | { decision: "separate"; projectId?: string; employeeId?: string; date?: string }
  | { decision: "attach"; taskId: string; employeeId?: string; date?: string };

/** A decision on one review item (a project row or a daily row). */
export async function decideRow(viewer: Viewer, recordId: string, d: RowDecision) {
  assertSuperAdmin(viewer);
  const rec = await getRecord(recordId);
  if (rec.kind === "person") throw new AppError("Use the people mapping for names.");
  const isProject = rec.kind === "project";
  const allowed = rec.reviewReason === "removed_from_sheet" ? ["acknowledge"] : rec.reviewReason === "conflict" ? ["use_sheet", "keep_crm"] : isProject ? ["create", "link", "ignore"] : ["separate", "attach", "ignore"];
  if (!allowed.includes(d.decision)) throw new AppError("That choice doesn't apply to this item.");
  const data: Record<string, string> = {};
  if (d.decision === "link") {
    await assertDevProject(d.projectId);
    data.projectId = d.projectId;
  }
  if (d.decision === "separate" || d.decision === "attach") {
    const needsProject = ["multiple_projects", "unmatched_project", "project_needs_review"].includes(rec.reviewReason ?? "");
    const needsPerson = ["multiple_developers", "no_developer", "unknown_person", "person_not_in_development"].includes(rec.reviewReason ?? "");
    if (d.decision === "separate") {
      if (d.projectId) await assertDevProject(d.projectId);
      else if (needsProject) throw new AppError("Choose the project this work belongs to.");
      if (d.projectId) data.projectId = d.projectId;
    } else {
      await assertDevTask(d.taskId);
      data.taskId = d.taskId;
    }
    if (d.employeeId) {
      await assertDevEmployee(d.employeeId);
      data.employeeId = d.employeeId;
    } else if (needsPerson) throw new AppError("Choose who did this work.");
    if (rec.reviewReason === "ambiguous_date") {
      if (!d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) throw new AppError("Enter the row's date.");
      data.date = d.date;
    }
  }
  const state = d.decision === "ignore" || d.decision === "acknowledge" ? "ignored" : "pending";
  await db.update(sheetSyncRecords).set({ ...settle(viewer, d.decision, Object.keys(data).length ? data : null, state), ...(state === "pending" ? { reviewReason: rec.reviewReason === "conflict" ? "conflict" : null } : {}) }).where(eq(sheetSyncRecords.id, rec.id));
  await audit({ actorUserId: viewer.userId, action: "sheets.review", entityType: "integration", entityId: "dev_sheet", summary: `Review decision “${d.decision}” for ${rec.sourceTab.replace(/_/g, " ")} row ${rec.rowNumber}`, metadata: { recordId: rec.id, reason: rec.reviewReason, ...data } });
}

export async function removeAlias(viewer: Viewer, aliasId: string) {
  assertSuperAdmin(viewer);
  const a = await db.query.sheetSyncAliases.findFirst({ where: eq(sheetSyncAliases.id, aliasId) });
  if (!a) return;
  await db.delete(sheetSyncAliases).where(eq(sheetSyncAliases.id, aliasId));
  if (a.kind === "person") await db.update(sheetSyncRecords).set({ decision: null, decisionData: null, state: "review" }).where(and(eq(sheetSyncRecords.sourceTab, "people"), eq(sheetSyncRecords.fingerprint, a.alias)));
  await audit({ actorUserId: viewer.userId, action: "sheets.review", entityType: "integration", entityId: "dev_sheet", summary: `Removed the ${a.kind} mapping for “${a.alias}” (existing CRM records are unchanged)` });
}
