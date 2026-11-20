import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/crm/db";
import { employees, leaveBalances, leaveRequests, leaveTypes } from "@/crm/db/schema";
import { can, ForbiddenError, getTeamEmployeeIds, isInTeam, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { storeUpload } from "@/crm/lib/storage";
import { addDays, formatDate, todayIn, type ISODate } from "@/crm/lib/time";
import { ensureLeaveBalances, leaveYearFor } from "./accounts";
import { getCompany } from "./company";
import { applyUsage, countLeaveDays, currentLeaveYear, getBalances } from "./leave";
import { managerUserId, notify, userIdForEmployee, userIdsWithPermission } from "./notifications";

/**
 * Leave requests: apply → approve/reject → (cancel).
 *
 * - Working days are counted against the employee's schedule and public
 *   holidays; a half day is 0.5 and single-date only.
 * - Limited leave types can't exceed the available balance, which already
 *   subtracts pending requests, so two pending requests can't overspend.
 * - The direct manager and HR are notified; managers decide for their
 *   reporting tree, HR for everyone; nobody approves their own leave.
 * - Approving adds to `used`; cancelling approved leave gives it back.
 */

export type LeaveInput = {
  leaveTypeId: string;
  startDate: ISODate;
  endDate: ISODate;
  halfDay: "none" | "first_half" | "second_half";
  reason: string;
  document: File | null;
};

const BACKDATE_DAYS = 30;

export async function applyLeave(viewer: Viewer, input: LeaveInput) {
  const emp = viewer.employee;
  if (!emp) throw new AppError("Your account isn't linked to an employee record.");
  const company = await getCompany();
  const today = todayIn(company.timezone);
  if (input.endDate < input.startDate) throw new AppError("The end date is before the start date.");
  if (input.startDate < addDays(today, -BACKDATE_DAYS)) throw new AppError(`Leave can be backdated by at most ${BACKDATE_DAYS} days. Ask HR for older changes.`);
  if (input.endDate > addDays(today, 366)) throw new AppError("Leave can be requested at most a year ahead.");

  const type = await db.query.leaveTypes.findFirst({ where: and(eq(leaveTypes.id, input.leaveTypeId), eq(leaveTypes.isActive, true)) });
  if (!type) throw new AppError("Choose a leave type.");
  if (input.halfDay !== "none" && (input.startDate !== input.endDate || !type.allowHalfDay)) {
    throw new AppError(type.allowHalfDay ? "A half day must start and end on the same date." : `${type.name} can't be taken as a half day.`);
  }

  const days = await countLeaveDays(emp.id, input.startDate, input.endDate, input.halfDay);
  if (days <= 0) throw new AppError("Those dates are all weekends or holidays — no leave is needed.");

  const overlap = await db.query.leaveRequests.findFirst({
    where: and(eq(leaveRequests.employeeId, emp.id), inArray(leaveRequests.status, ["pending", "approved"]), lte(leaveRequests.startDate, input.endDate), gte(leaveRequests.endDate, input.startDate)),
  });
  if (overlap) throw new AppError("You already have leave requested or approved on some of those dates.");

  if (type.annualQuota !== null) {
    const year = leaveYearFor(input.startDate, company.leaveYearStartMonth);
    const bal = (await getBalances(emp.id, year)).find((b) => b.leaveTypeId === type.id);
    if (!bal || bal.available < days) {
      throw new AppError(`Not enough ${type.name} left: ${bal?.available ?? 0} day(s) available after pending requests, ${days} requested.`);
    }
  }
  if (type.documentRequiredAfterDays !== null && days > type.documentRequiredAfterDays && !input.document) {
    throw new AppError(`${type.name} longer than ${type.documentRequiredAfterDays} day(s) needs a supporting document.`);
  }

  const created = await db.transaction(async (tx) => {
    const file = input.document ? await storeUpload(input.document, viewer.userId, { tx }) : null;
    const [row] = await tx
      .insert(leaveRequests)
      .values({ employeeId: emp.id, leaveTypeId: type.id, startDate: input.startDate, endDate: input.endDate, halfDay: input.halfDay, days: String(days), reason: input.reason, documentFileId: file?.id ?? null })
      .returning();
    await audit({ actorUserId: viewer.userId, action: "leave.apply", entityType: "leave", entityId: row!.id, summary: `Applied for ${days} day(s) of ${type.name} from ${formatDate(input.startDate)}` }, tx);
    return row!;
  });

  const approvers = [await managerUserId(emp.id), ...(await userIdsWithPermission("leave.manage"))].filter((u) => u !== viewer.userId);
  await notify(approvers, {
    type: "leave_request",
    title: `${emp.fullName} requested ${type.name}`,
    body: `${formatDate(input.startDate)}${input.endDate !== input.startDate ? ` – ${formatDate(input.endDate)}` : ""} · ${days} day(s)`,
    link: "/crm/leave?tab=approvals",
  });
  return { days, id: created.id };
}

export async function canDecideFor(viewer: Viewer, employeeId: string) {
  if (viewer.employee?.id === employeeId && viewer.role.key !== "super_admin") return false;
  if (can(viewer, "leave.manage")) return true;
  return can(viewer, "leave.approve_team") && (await isInTeam(viewer, employeeId));
}

export async function decideLeave(viewer: Viewer, id: string, approve: boolean, comment: string | null) {
  const req = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, id) });
  if (!req) throw new AppError("Request not found.");
  if (!(await canDecideFor(viewer, req.employeeId))) throw new ForbiddenError(viewer.employee?.id === req.employeeId ? "You can't approve your own leave." : undefined);
  if (req.status !== "pending") throw new AppError("This request has already been handled.");
  const type = (await db.query.leaveTypes.findFirst({ where: eq(leaveTypes.id, req.leaveTypeId) }))!;

  if (approve && type.annualQuota !== null) {
    const company = await getCompany();
    const bal = (await getBalances(req.employeeId, leaveYearFor(req.startDate, company.leaveYearStartMonth))).find((b) => b.leaveTypeId === type.id);
    // This request is already counted in `pending`, so it still fits if available ≥ 0.
    if (!bal || bal.available < 0) throw new AppError(`The employee no longer has enough ${type.name} for this request.`);
  }

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(leaveRequests)
      .set({ status: approve ? "approved" : "rejected", approverId: viewer.userId, decisionComment: comment, decidedAt: new Date() })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.status, "pending")))
      .returning();
    if (!updated) throw new AppError("This request has already been handled.");
    if (approve) await applyUsage(tx, req.employeeId, req.leaveTypeId, req.startDate, Number(req.days));
    await audit(
      { actorUserId: viewer.userId, action: approve ? "leave.approve" : "leave.reject", entityType: "leave", entityId: id, summary: `${approve ? "Approved" : "Rejected"} ${type.name} (${Number(req.days)} day(s) from ${formatDate(req.startDate)})`, metadata: { comment } },
      tx,
    );
  });
  await notify([await userIdForEmployee(req.employeeId)], {
    type: approve ? "leave_approved" : "leave_rejected",
    title: `Your ${type.name} from ${formatDate(req.startDate)} was ${approve ? "approved" : "rejected"}`,
    body: comment,
    link: "/crm/leave",
  });
}

/**
 * Employees cancel their own pending requests, or approved ones that haven't
 * started. HR (leave.manage) can cancel any approved leave. Cancelling
 * approved leave returns the days to the balance.
 */
export async function cancelLeave(viewer: Viewer, id: string) {
  const req = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, id) });
  if (!req) throw new AppError("Request not found.");
  const own = viewer.employee?.id === req.employeeId;
  const hr = can(viewer, "leave.manage");
  if (!own && !hr) throw new ForbiddenError();
  if (!["pending", "approved"].includes(req.status)) throw new AppError("Only pending or approved requests can be cancelled.");
  const company = await getCompany();
  if (req.status === "approved" && own && !hr && req.startDate <= todayIn(company.timezone)) {
    throw new AppError("This leave has already started. Ask HR to change it.");
  }
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(leaveRequests)
      .set({ status: "cancelled", ...(own ? {} : { approverId: viewer.userId, decidedAt: new Date() }) })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.status, req.status)))
      .returning();
    if (!updated) throw new AppError("This request has changed. Refresh and try again.");
    if (req.status === "approved") await applyUsage(tx, req.employeeId, req.leaveTypeId, req.startDate, -Number(req.days));
    await audit({ actorUserId: viewer.userId, action: "leave.cancel", entityType: "leave", entityId: id, summary: `Cancelled ${req.status} leave from ${formatDate(req.startDate)}` }, tx);
  });
  if (!own) await notify([await userIdForEmployee(req.employeeId)], { type: "leave_updated", title: `HR cancelled your leave from ${formatDate(req.startDate)}`, link: "/crm/leave" });
  else if (req.status === "approved") await notify([await managerUserId(req.employeeId)], { type: "leave_updated", title: `${viewer.employee!.fullName} cancelled approved leave from ${formatDate(req.startDate)}`, link: "/crm/leave?tab=calendar" });
}

/** HR adjusts a balance (+/-) with a reason. */
export async function adjustBalance(viewer: Viewer, employeeId: string, leaveTypeId: string, delta: number, reason: string) {
  if (!can(viewer, "leave.manage")) throw new ForbiddenError();
  if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 365 || Math.round(delta * 2) !== delta * 2) throw new AppError("Enter a non-zero adjustment in steps of 0.5 days.");
  const { year } = await currentLeaveYear();
  await db.transaction(async (tx) => {
    await ensureLeaveBalances(tx, employeeId, year);
    const [row] = await tx
      .update(leaveBalances)
      .set({ adjustment: sql`${leaveBalances.adjustment} + ${delta}` })
      .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.leaveTypeId, leaveTypeId), eq(leaveBalances.year, year)))
      .returning();
    if (!row) throw new AppError("That leave type has no balance (it may be unlimited).");
    await audit({ actorUserId: viewer.userId, action: "leave.adjust", entityType: "leave_balance", entityId: row.id, summary: `Adjusted a leave balance by ${delta > 0 ? "+" : ""}${delta} day(s)`, metadata: { employeeId, leaveTypeId, delta, reason } }, tx);
  });
  await notify([await userIdForEmployee(employeeId)], { type: "leave_updated", title: `HR adjusted your leave balance by ${delta > 0 ? "+" : ""}${delta} day(s)`, body: reason, link: "/crm/leave" });
}

/* ================================================================== lists */

const rowSelect = {
  id: leaveRequests.id,
  employeeId: leaveRequests.employeeId,
  firstName: employees.firstName,
  lastName: employees.lastName,
  photoFileId: employees.photoFileId,
  type: leaveTypes.name,
  color: leaveTypes.color,
  startDate: leaveRequests.startDate,
  endDate: leaveRequests.endDate,
  halfDay: leaveRequests.halfDay,
  days: leaveRequests.days,
  reason: leaveRequests.reason,
  status: leaveRequests.status,
  documentFileId: leaveRequests.documentFileId,
  decisionComment: leaveRequests.decisionComment,
  decidedAt: leaveRequests.decidedAt,
  createdAt: leaveRequests.createdAt,
};

const joined = () =>
  db.select(rowSelect).from(leaveRequests).innerJoin(employees, eq(employees.id, leaveRequests.employeeId)).innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId));

export function myLeaveRequests(employeeId: string) {
  return joined().where(eq(leaveRequests.employeeId, employeeId)).orderBy(desc(leaveRequests.startDate)).limit(100);
}

/** Requests the viewer can act on: everyone's with leave.manage, otherwise their team's. */
export async function approvalQueue(viewer: Viewer, status: "pending" | "decided") {
  const conds = [status === "pending" ? eq(leaveRequests.status, "pending") : inArray(leaveRequests.status, ["approved", "rejected", "cancelled"])];
  if (!can(viewer, "leave.manage")) {
    if (!can(viewer, "leave.approve_team") || !viewer.employee) return [];
    const team = await getTeamEmployeeIds(viewer.employee.id);
    if (!team.length) return [];
    conds.push(inArray(leaveRequests.employeeId, team));
  }
  return joined()
    .where(and(...conds))
    .orderBy(status === "pending" ? asc(leaveRequests.startDate) : desc(leaveRequests.decidedAt))
    .limit(100);
}

/** Approved and pending leave overlapping a range, for the people in scope. */
export async function leaveCalendar(scopeIds: string[] | "all", from: ISODate, to: ISODate) {
  const conds = [inArray(leaveRequests.status, ["approved", "pending"]), lte(leaveRequests.startDate, to), gte(leaveRequests.endDate, from)];
  if (scopeIds !== "all") {
    if (!scopeIds.length) return [];
    conds.push(inArray(leaveRequests.employeeId, scopeIds));
  }
  return joined().where(and(...conds)).orderBy(asc(leaveRequests.startDate));
}

export function activeLeaveTypes() {
  return db.select().from(leaveTypes).where(eq(leaveTypes.isActive, true)).orderBy(asc(leaveTypes.sortOrder));
}
