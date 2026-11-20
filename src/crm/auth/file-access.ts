import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/crm/db";
import { candidates, documents, employees, files, leaveRequests, projectMembers, taskAttachments, tasks } from "@/crm/db/schema";
import { can, isInTeam, type Viewer } from "./dal";

/**
 * Whether the viewer may open a stored file. A file is reachable only
 * through whatever record references it, so access follows that record's
 * rules:
 *
 * - profile photo → any signed-in employee (photos appear in the directory);
 * - document → per its visibility (company / employee + HR / HR only);
 * - leave supporting document → the employee, their managers, and HR;
 * - task attachment → whoever can see the task;
 * - candidate resume → recruitment managers;
 * - anything else → only the person who uploaded it.
 */
export async function canViewFile(viewer: Viewer, fileId: string): Promise<typeof files.$inferSelect | null> {
  const file = await db.query.files.findFirst({ where: eq(files.id, fileId) });
  if (!file) return null;
  const allow = () => file;
  const selfEmp = viewer.employee?.id;

  const photo = await db.query.employees.findFirst({ where: eq(employees.photoFileId, fileId), columns: { id: true } });
  if (photo) return allow();

  const docs = await db.select().from(documents).where(eq(documents.fileId, fileId));
  for (const d of docs) {
    if (can(viewer, "documents.manage")) return allow();
    if (d.visibility === "company") return allow();
    if (d.visibility === "employee" && d.employeeId && d.employeeId === selfEmp) return allow();
  }

  const leaves = await db.select().from(leaveRequests).where(eq(leaveRequests.documentFileId, fileId));
  for (const l of leaves) {
    if (l.employeeId === selfEmp || can(viewer, "leave.manage")) return allow();
    if (can(viewer, "leave.approve_team") && (await isInTeam(viewer, l.employeeId))) return allow();
  }

  const att = await db.select({ taskId: taskAttachments.taskId }).from(taskAttachments).where(eq(taskAttachments.fileId, fileId));
  if (att.length && (await canViewAnyTask(viewer, att.map((a) => a.taskId)))) return allow();

  const cand = await db.query.candidates.findFirst({ where: eq(candidates.resumeFileId, fileId), columns: { id: true } });
  if (cand && can(viewer, "recruitment.manage")) return allow();

  if (file.uploadedById === viewer.userId) return allow();
  return null;
}

/** Task visibility: all with tasks.view_all; otherwise assignee, creator, project member, or the assignee's manager. */
export async function canViewAnyTask(viewer: Viewer, taskIds: string[]): Promise<boolean> {
  if (!taskIds.length) return false;
  if (can(viewer, "tasks.view_all")) return true;
  const me = viewer.employee?.id;
  if (!me) return false;
  const rows = await db.select().from(tasks).where(inArray(tasks.id, taskIds));
  for (const t of rows) {
    if (t.assigneeId === me || t.createdById === me) return true;
    if (t.projectId) {
      const m = await db.query.projectMembers.findFirst({ where: and(eq(projectMembers.projectId, t.projectId), eq(projectMembers.employeeId, me)) });
      if (m) return true;
    }
    if (t.assigneeId && (await isInTeam(viewer, t.assigneeId))) return true;
  }
  return false;
}

