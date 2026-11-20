import "server-only";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/crm/db";
import { attendanceRecords, employees, wfhRequests } from "@/crm/db/schema";
import { can, ForbiddenError, getTeamEmployeeIds, isInTeam, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { addDays, formatDate, todayIn, type ISODate } from "@/crm/lib/time";
import { getCompany } from "./company";
import { managerUserId, notify, userIdForEmployee, userIdsWithPermission } from "./notifications";

/**
 * Work-from-home requests. Approval uses the same rules as leave
 * (leave.approve_team for a manager's reporting tree, leave.manage for HR,
 * never your own). An approved WFH day allows a remote check-in.
 */

export async function requestWfh(viewer: Viewer, input: { startDate: ISODate; endDate: ISODate; reason: string }) {
  const emp = viewer.employee;
  if (!emp) throw new AppError("Your account isn't linked to an employee record.");
  const company = await getCompany();
  const today = todayIn(company.timezone);
  if (input.endDate < input.startDate) throw new AppError("The end date is before the start date.");
  if (input.startDate < addDays(today, -7)) throw new AppError("WFH can be backdated by at most 7 days.");
  if (input.endDate > addDays(today, 120)) throw new AppError("WFH can be requested at most 120 days ahead.");
  if (addDays(input.startDate, 30) < input.endDate) throw new AppError("A single WFH request can cover at most 31 days.");

  const overlap = await db.query.wfhRequests.findFirst({
    where: and(eq(wfhRequests.employeeId, emp.id), inArray(wfhRequests.status, ["pending", "approved"]), lte(wfhRequests.startDate, input.endDate), gte(wfhRequests.endDate, input.startDate)),
  });
  if (overlap) throw new AppError("You already have work from home requested or approved on some of those dates.");

  const [row] = await db.insert(wfhRequests).values({ employeeId: emp.id, ...input }).returning();
  await audit({ actorUserId: viewer.userId, action: "wfh.request", entityType: "wfh", entityId: row!.id, summary: `Requested work from home ${formatDate(input.startDate)}${input.endDate !== input.startDate ? ` – ${formatDate(input.endDate)}` : ""}` });
  const approvers = [await managerUserId(emp.id), ...(await userIdsWithPermission("leave.manage"))].filter((u) => u !== viewer.userId);
  await notify(approvers, {
    type: "wfh_request",
    title: `${emp.fullName} requested work from home`,
    body: `${formatDate(input.startDate)}${input.endDate !== input.startDate ? ` – ${formatDate(input.endDate)}` : ""}`,
    link: "/crm/wfh?tab=approvals",
  });
}

async function canDecide(viewer: Viewer, employeeId: string) {
  if (viewer.employee?.id === employeeId && viewer.role.key !== "super_admin") return false;
  if (can(viewer, "leave.manage")) return true;
  return can(viewer, "leave.approve_team") && (await isInTeam(viewer, employeeId));
}

export async function decideWfh(viewer: Viewer, id: string, approve: boolean, comment: string | null) {
  const req = await db.query.wfhRequests.findFirst({ where: eq(wfhRequests.id, id) });
  if (!req) throw new AppError("Request not found.");
  if (!(await canDecide(viewer, req.employeeId))) throw new ForbiddenError(viewer.employee?.id === req.employeeId ? "You can't approve your own request." : undefined);
  const [updated] = await db
    .update(wfhRequests)
    .set({ status: approve ? "approved" : "rejected", approverId: viewer.userId, decisionComment: comment, decidedAt: new Date() })
    .where(and(eq(wfhRequests.id, id), eq(wfhRequests.status, "pending")))
    .returning();
  if (!updated) throw new AppError("This request has already been handled.");
  await audit({ actorUserId: viewer.userId, action: approve ? "wfh.approve" : "wfh.reject", entityType: "wfh", entityId: id, summary: `${approve ? "Approved" : "Rejected"} work from home from ${formatDate(req.startDate)}`, metadata: { comment } });
  await notify([await userIdForEmployee(req.employeeId)], {
    type: approve ? "wfh_approved" : "wfh_rejected",
    title: `Your work-from-home request from ${formatDate(req.startDate)} was ${approve ? "approved" : "rejected"}`,
    body: comment,
    link: "/crm/wfh",
  });
}

export async function cancelWfh(viewer: Viewer, id: string) {
  const req = await db.query.wfhRequests.findFirst({ where: eq(wfhRequests.id, id) });
  if (!req) throw new AppError("Request not found.");
  const own = viewer.employee?.id === req.employeeId;
  if (!own && !can(viewer, "leave.manage")) throw new ForbiddenError();
  const company = await getCompany();
  if (req.status === "approved" && own && req.startDate <= todayIn(company.timezone)) throw new AppError("This has already started. Ask HR to change it.");
  const [updated] = await db
    .update(wfhRequests)
    .set({ status: "cancelled" })
    .where(and(eq(wfhRequests.id, id), inArray(wfhRequests.status, ["pending", "approved"])))
    .returning();
  if (!updated) throw new AppError("Only pending or approved requests can be cancelled.");
  await audit({ actorUserId: viewer.userId, action: "wfh.cancel", entityType: "wfh", entityId: id, summary: `Cancelled work from home from ${formatDate(req.startDate)}` });
}

const rowSelect = {
  id: wfhRequests.id,
  employeeId: wfhRequests.employeeId,
  firstName: employees.firstName,
  lastName: employees.lastName,
  photoFileId: employees.photoFileId,
  startDate: wfhRequests.startDate,
  endDate: wfhRequests.endDate,
  reason: wfhRequests.reason,
  status: wfhRequests.status,
  decisionComment: wfhRequests.decisionComment,
  decidedAt: wfhRequests.decidedAt,
  createdAt: wfhRequests.createdAt,
};
const joined = () => db.select(rowSelect).from(wfhRequests).innerJoin(employees, eq(employees.id, wfhRequests.employeeId));

export function myWfh(employeeId: string) {
  return joined().where(eq(wfhRequests.employeeId, employeeId)).orderBy(desc(wfhRequests.startDate)).limit(100);
}

export async function wfhQueue(viewer: Viewer, status: "pending" | "decided") {
  const conds = [status === "pending" ? eq(wfhRequests.status, "pending") : inArray(wfhRequests.status, ["approved", "rejected", "cancelled"])];
  if (!can(viewer, "leave.manage")) {
    if (!can(viewer, "leave.approve_team") || !viewer.employee) return [];
    const team = await getTeamEmployeeIds(viewer.employee.id);
    if (!team.length) return [];
    conds.push(inArray(wfhRequests.employeeId, team));
  }
  return joined().where(and(...conds)).orderBy(status === "pending" ? asc(wfhRequests.startDate) : desc(wfhRequests.decidedAt)).limit(100);
}

export async function wfhCalendar(scopeIds: string[] | "all", from: ISODate, to: ISODate) {
  const conds = [eq(wfhRequests.status, "approved"), lte(wfhRequests.startDate, to), gte(wfhRequests.endDate, from)];
  if (scopeIds !== "all") {
    if (!scopeIds.length) return [];
    conds.push(inArray(wfhRequests.employeeId, scopeIds));
  }
  return joined().where(and(...conds)).orderBy(asc(wfhRequests.startDate));
}

/** Remote attendance records for an employee or a scope. */
export async function remoteAttendance(scopeIds: string[] | "all", from: ISODate, to: ISODate) {
  const conds = [eq(attendanceRecords.workMode, "remote"), gte(attendanceRecords.workDate, from), lte(attendanceRecords.workDate, to)];
  if (scopeIds !== "all") {
    if (!scopeIds.length) return [];
    conds.push(inArray(attendanceRecords.employeeId, scopeIds));
  }
  return db
    .select({ id: attendanceRecords.id, workDate: attendanceRecords.workDate, checkInAt: attendanceRecords.checkInAt, checkOutAt: attendanceRecords.checkOutAt, workedMinutes: attendanceRecords.workedMinutes, firstName: employees.firstName, lastName: employees.lastName, employeeId: employees.id })
    .from(attendanceRecords)
    .innerJoin(employees, eq(employees.id, attendanceRecords.employeeId))
    .where(and(...conds))
    .orderBy(desc(attendanceRecords.workDate))
    .limit(200);
}
