"use server";

import { z } from "zod";
import { decideRow, mapPerson, mapProjectName, removeAlias, setAutoImport, assertSuperAdmin, type RowDecision } from "@/crm/integrations/google-sheets/admin";
import { runSheetSync } from "@/crm/integrations/google-sheets/sync";
import { fail, ok, runAction, zId, type ActionState } from "@/crm/lib/actions";

/** Super Admin only (checked again in every service call). */

export async function syncNowAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    assertSuperAdmin(viewer);
    const mode = fd.get("mode") === "import" ? "import" : "check";
    const r = await runSheetSync({ mode, trigger: "manual", actorUserId: viewer.userId });
    if (!r.ok) return fail(`Sync failed: ${r.error}`);
    const c = r.counts;
    return ok(
      mode === "import"
        ? `Imported: ${c.projectsCreated} projects and ${c.tasksCreated} tasks created, ${c.projectsUpdated + c.tasksUpdated} updated, ${c.updatesAdded} daily updates added. ${c.review} items need review.`
        : `Checked: would create ${c.projectsCreated} projects and ${c.tasksCreated} tasks, update ${c.projectsUpdated + c.tasksUpdated}, add ${c.updatesAdded} daily updates. ${c.review} items need review. Nothing was imported.`,
    );
  });
}

export async function autoImportAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const on = fd.get("on") === "1";
    await setAutoImport(viewer, on);
    return ok(on ? "The daily sync will now import changes." : "The daily sync will only check the sheet (no import).");
  });
}

export async function mapPersonAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const target = String(fd.get("employeeId") ?? "");
    if (!target) return fail("Choose an employee, or Ignore.");
    await mapPerson(viewer, id, target === "ignore" ? "ignore" : zId.parse(target));
    return ok("Saved. It's applied on the next sync.");
  });
}

export async function mapProjectNameAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const name = z.string().trim().min(1).max(300).parse(fd.get("name"));
    const target = String(fd.get("projectId") ?? "");
    if (!target) return fail("Choose a project, or Ignore.");
    await mapProjectName(viewer, name, target === "ignore" ? "ignore" : zId.parse(target));
    return ok("Saved. It's applied on the next sync.");
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
    return ok("Saved. It's applied on the next sync.");
  });
}

export async function removeAliasAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await removeAlias(viewer, zId.parse(fd.get("id")));
    return ok("Mapping removed.");
  });
}
