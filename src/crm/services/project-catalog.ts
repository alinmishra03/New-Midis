import "server-only";
import { asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/crm/db";
import { employees, projectMembers, sheetSyncRecords, sheetSyncUploads } from "@/crm/db/schema";
import type { Viewer } from "@/crm/auth/dal";
import { classify, rowKey, shopifyFromSheet, type Classified, type ProjectStatus, type SheetTab } from "@/crm/lib/project-catalog";
import { headerIndex } from "@/crm/integrations/dev-sheet/admin";
import { PROJECT_COLUMNS } from "@/crm/integrations/dev-sheet/parse";
import { listProjects } from "./tasks";

export type CatalogProject = Classified & {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  total: number;
  done: number;
  members: { id: string; name: string; photoFileId: string | null; isLead: boolean }[];
};

/**
 * Every project the viewer may see (same visibility as the Projects list:
 * listProjects), each placed in exactly one section. Read-only.
 */
export async function listProjectCatalog(viewer: Viewer): Promise<CatalogProject[]> {
  const projects = await listProjects(viewer);
  if (!projects.length) return [];
  const ids = projects.map((p) => p.id);
  const [members, records, uploads] = await Promise.all([
    db
      .select({ projectId: projectMembers.projectId, id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, isLead: projectMembers.isLead })
      .from(projectMembers)
      .innerJoin(employees, eq(employees.id, projectMembers.employeeId))
      .where(inArray(projectMembers.projectId, ids))
      .orderBy(asc(employees.firstName)),
    // The Development sheet's project tabs, for its "Shopify Websites" section. Daily updates and people aren't needed.
    db
      .select({ tab: sheetSyncRecords.sourceTab, row: sheetSyncRecords.rowNumber, projectId: sheetSyncRecords.projectId, source: sheetSyncRecords.source })
      .from(sheetSyncRecords)
      .where(ne(sheetSyncRecords.sourceTab, "daily_work_update")),
    db.select({ tab: sheetSyncUploads.tab, rows: sheetSyncUploads.rows }).from(sheetSyncUploads).where(inArray(sheetSyncUploads.tab, PROJECT_TABS)),
  ]);
  // The Client Reviewed tab's "Shopify Websites" list is the confirmed one; All Website only if that tab has none.
  const tabs = sheetTabs(records, uploads);
  const hasHeading = (t: SheetTab) => t.rows.some((r) => r.name.trim().toLowerCase() === "shopify websites" && !r.url.trim());
  const source = ["client_reviewed", "all_website"].map((k) => tabs.find((t) => t.tab === k)).find((t): t is SheetTab => !!t && hasHeading(t));
  const shopify = shopifyFromSheet(source ? [source] : [], resolver(records));
  return projects.map((p) => ({
    ...classify({ id: p.id, name: p.name, status: p.status, description: p.description }, shopify),
    id: p.id,
    name: p.name,
    code: p.code,
    status: p.status,
    total: p.total,
    done: p.done,
    members: members
      .filter((m) => m.projectId === p.id)
      .sort((a, b) => Number(b.isLead) - Number(a.isLead))
      .map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`.trim(), photoFileId: m.photoFileId, isLead: m.isLead })),
  }));
}

const PROJECT_TABS = ["all_website", "client_reviewed"];
type RecordRow = { tab: string; row: number; projectId: string | null; source: Record<string, string> };

/**
 * The project tabs in file order. The uploaded file is the source: the import
 * keeps one record per distinct row, so repeated rows (e.g. a store listed both
 * in the main list and under "Shopify Websites") have no record at their second
 * position. Falls back to the stored records if a file has been removed.
 */
function sheetTabs(records: RecordRow[], uploads: { tab: string; rows: string[][] }[]): SheetTab[] {
  return PROJECT_TABS.map((tab) => {
    const u = uploads.find((x) => x.tab === tab);
    const h = u ? headerIndex(u.rows, PROJECT_COLUMNS) : -1;
    if (u && h >= 0) {
      const head = u.rows[h]!.map((c) => c.replace(/\s+/g, " ").trim().toLowerCase());
      const ni = head.indexOf("project name"), ui = head.indexOf("project url");
      return { tab, rows: u.rows.slice(h + 1).map((r) => ({ name: r[ni] ?? "", url: r[ui] ?? "" })) };
    }
    const own = records.filter((r) => r.tab === tab).sort((a, b) => a.row - b.row);
    return { tab, rows: own.map((r) => ({ name: r.source["Project Name"] ?? "", url: r.source["Project URL"] ?? "" })) };
  });
}

/** Sheet row → the project it was imported as: same tab first, then any tab if that's unambiguous. */
function resolver(records: RecordRow[]) {
  const inTab = new Map<string, string>();
  const anyTab = new Map<string, Set<string>>();
  for (const r of records) {
    if (!r.projectId) continue;
    const k = rowKey(r.source["Project Name"] ?? "", r.source["Project URL"] ?? "");
    if (!inTab.has(`${r.tab}|${k}`)) inTab.set(`${r.tab}|${k}`, r.projectId);
    anyTab.set(k, (anyTab.get(k) ?? new Set()).add(r.projectId));
  }
  return (tab: string, name: string, url: string) => {
    const k = rowKey(name, url);
    const hit = inTab.get(`${tab}|${k}`);
    if (hit) return hit;
    const any = anyTab.get(k);
    return any?.size === 1 ? [...any][0]! : null;
  };
}
