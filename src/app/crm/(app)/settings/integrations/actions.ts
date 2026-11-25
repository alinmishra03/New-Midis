"use server";

import { z } from "zod";
import { decideRow, mapPerson, mapProjectName, previewImport, removeAlias, removeUpload, runImport, stageUpload, TAB_SPECS, isTabKey, type RowDecision } from "@/crm/integrations/dev-sheet/admin";
import { fail, ok, runAction, zId, type ActionState } from "@/crm/lib/actions";

/** Super Admin only (checked again in every service call). */

export async function uploadCsvAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const tab = String(fd.get("tab") ?? "");
    const file = fd.get("file");
    if (!(file instanceof File) || !file.name) return fail("Choose a CSV file.");
    const r = await stageUpload(viewer, tab, { name: file.name, type: file.type, size: file.size, bytes: () => file.arrayBuffer() });
    const name = isTabKey(tab) ? TAB_SPECS[tab].name : tab;
    return ok(`“${r.fileName}” accepted for ${name}: ${r.dataRows} rows${r.extra.length ? ` (ignored extra columns: ${r.extra.join(", ")})` : ""}. Nothing is imported until you preview and import.`);
  });
}

export async function removeUploadAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await removeUpload(viewer, String(fd.get("tab") ?? ""));
    return ok("File removed. Nothing in the CRM changed.");
  });
}

export async function previewAction(): Promise<ActionState> {
  return runAction(async (viewer) => {
    const r = await previewImport(viewer);
    if (!r.ok) return fail(`Preview failed: ${r.error}`);
    const c = r.counts;
    return ok(`Preview ready: ${c.projectsCreated} projects and ${c.tasksCreated} tasks to create, ${c.updatesAdded} daily updates to add. Nothing was imported; see the summary for rows that can't be imported.`);
  });
}

export async function importAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const r = await runImport(viewer, zId.parse(fd.get("previewRunId")));
    if (!r.ok) return fail(`Import failed — nothing was changed: ${r.error}`);
    const c = r.counts;
    return ok(`Imported: ${c.projectsCreated} projects and ${c.tasksCreated} tasks created, ${c.projectsUpdated + c.tasksUpdated} updated, ${c.updatesAdded} daily updates added. See the summary for rows that weren't imported.`);
  });
}

export async function mapPersonAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const target = String(fd.get("employeeId") ?? "");
    if (!target) return fail("Choose an employee, or Ignore.");
    await mapPerson(viewer, id, target === "ignore" ? "ignore" : zId.parse(target));
    return ok("Saved. Preview again to see the effect.");
  });
}

export async function mapProjectNameAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const name = z.string().trim().min(1).max(300).parse(fd.get("name"));
    const target = String(fd.get("projectId") ?? "");
    if (!target) return fail("Choose a project, or Ignore.");
    await mapProjectName(viewer, name, target === "ignore" ? "ignore" : zId.parse(target));
    return ok("Saved. Preview again to see the effect.");
  });
}

const opt = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v ? v : undefined;
};

export async function decideRowAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const decision = String(fd.get("decision") ?? "");
    const projectId = opt(fd, "projectId") ? zId.parse(opt(fd, "projectId")) : undefined;
    const employeeId = opt(fd, "employeeId") ? zId.parse(opt(fd, "employeeId")) : undefined;
    const taskId = opt(fd, "taskId") ? zId.parse(opt(fd, "taskId")) : undefined;
    const date = opt(fd, "date");
    let d: RowDecision;
    switch (decision) {
      case "ignore":
      case "create":
      case "use_sheet":
      case "keep_crm":
      case "acknowledge":
        d = { decision };
        break;
      case "link":
        if (!projectId) return fail("Choose the project to link to.");
        d = { decision, projectId };
        break;
      case "separate":
        d = { decision, projectId, employeeId, date };
        break;
      case "attach":
        if (!taskId) return fail("Choose the task to add this update to.");
        d = { decision, taskId, employeeId, date };
        break;
      default:
        return fail("Choose what to do.");
    }
    await decideRow(viewer, id, d);
    return ok("Saved. Preview again to see the effect.");
  });
}

export async function removeAliasAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await removeAlias(viewer, zId.parse(fd.get("id")));
    return ok("Mapping removed.");
  });
}
