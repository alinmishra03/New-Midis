import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/crm/db";
import { attendanceRecords, documents, files, goals, leaveRequests, leaveTypes, performanceReviews, projectMembers, projects, reviewCycles, tasks } from "@/crm/db/schema";
import { can, type Viewer } from "@/crm/auth/dal";

/*
 * History queries for the tabs of an employee profile. Callers must have
 * checked profileAccess() for the relevant tab first.
 */

export function recentAttendance(employeeId: string, limit = 31) {
  return db.select().from(attendanceRecords).where(eq(attendanceRecords.employeeId, employeeId)).orderBy(desc(attendanceRecords.workDate)).limit(limit);
}

export function leaveHistory(employeeId: string, limit = 50) {
  return db
    .select({ id: leaveRequests.id, type: leaveTypes.name, color: leaveTypes.color, startDate: leaveRequests.startDate, endDate: leaveRequests.endDate, days: leaveRequests.days, halfDay: leaveRequests.halfDay, status: leaveRequests.status, reason: leaveRequests.reason, createdAt: leaveRequests.createdAt })
    .from(leaveRequests)
    .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
    .where(eq(leaveRequests.employeeId, employeeId))
    .orderBy(desc(leaveRequests.startDate))
    .limit(limit);
}

export async function workSummary(employeeId: string) {
  const [memberships, assigned] = await Promise.all([
    db
      .select({ id: projects.id, name: projects.name, code: projects.code, status: projects.status, isLead: projectMembers.isLead, dueDate: projects.dueDate })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.employeeId, employeeId))
      .orderBy(desc(projects.createdAt)),
    db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status, priority: tasks.priority, dueDate: tasks.dueDate, progress: tasks.progress })
      .from(tasks)
      .where(eq(tasks.assigneeId, employeeId))
      .orderBy(desc(tasks.updatedAt))
      .limit(30),
  ]);
  return { projects: memberships, tasks: assigned };
}

export async function performanceSummary(employeeId: string) {
  const [reviews, goalRows] = await Promise.all([
    db
      .select({ id: performanceReviews.id, cycle: reviewCycles.name, periodEnd: reviewCycles.periodEnd, status: performanceReviews.status, selfRating: performanceReviews.selfRating, managerRating: performanceReviews.managerRating })
      .from(performanceReviews)
      .innerJoin(reviewCycles, eq(reviewCycles.id, performanceReviews.cycleId))
      .where(eq(performanceReviews.employeeId, employeeId))
      .orderBy(desc(reviewCycles.periodEnd)),
    db.select().from(goals).where(eq(goals.employeeId, employeeId)).orderBy(desc(goals.createdAt)),
  ]);
  return { reviews, goals: goalRows };
}

/** Documents of an employee that the viewer may see (HR-only ones only with documents.manage). */
export function employeeDocuments(viewer: Viewer, employeeId: string) {
  const visibility = can(viewer, "documents.manage") ? (["employee", "hr_only", "company"] as const) : (["employee", "company"] as const);
  return db
    .select({ id: documents.id, title: documents.title, category: documents.category, visibility: documents.visibility, fileId: documents.fileId, fileName: files.fileName, sizeBytes: files.sizeBytes, createdAt: documents.createdAt })
    .from(documents)
    .innerJoin(files, eq(files.id, documents.fileId))
    .where(and(eq(documents.employeeId, employeeId), inArray(documents.visibility, [...visibility])))
    .orderBy(desc(documents.createdAt));
}

