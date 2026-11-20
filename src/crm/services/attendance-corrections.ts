import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { attendanceCorrections, attendanceRecords, employees, users } from "@/crm/db/schema";
import { can, getTeamEmployeeIds, isInTeam, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { addDays, formatDate, todayIn, zonedToInstant, type ISODate } from "@/crm/lib/time";
import { recomputeRecord } from "./attendance";
import { getCompany } from "./company";
import { managerUserId, notify, userIdForEmployee, userIdsWithPermission } from "./notifications";

const MAX_DAYS_BACK = 45;

function toInstants(date: ISODate, inTime: string | null, outTime: string | null, tz: string) {
  const checkIn = inTime ? zonedToInstant(date, inTime, tz) : null;
  let checkOut = outTime ? zonedToInstant(date, outTime, tz) : null;
  // An out-time earlier than the in-time means the shift ran past midnight.
  if (checkIn && checkOut && checkOut <= checkIn) checkOut = zonedToInstant(addDays(date, 1), outTime!, tz);
  if (checkIn && checkOut && checkOut.getTime() - checkIn.getTime() > 20 * 3600 * 1000) throw new AppError("A shift can't be longer than 20 hours.");
  return { checkIn, checkOut };
}

async function assertEmployedOn(employeeId: string, date: ISODate) {
  const e = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { joiningDate: true, exitDate: true } });
  if (!e || date < e.joiningDate || (e.exitDate && date > e.exitDate)) throw new AppError("That date is outside the employment period.");
}

/** An employee asks for their attendance on a day to be corrected. */
export async function requestCorrection(viewer: Viewer, input: { date: ISODate; checkIn: string | null; checkOut: string | null; reason: string }) {
  const emp = viewer.employee;
  if (!emp) throw new AppError("Your account isn't linked to an employee record.");
  const company = await getCompany();
  const today = todayIn(company.timezone);
  if (input.date > today) throw new AppError("You can't correct a future date.");
  if (input.date < addDays(today, -MAX_DAYS_BACK)) throw new AppError(`Corrections can go back at most ${MAX_DAYS_BACK} days. Ask HR for older changes.`);
  if (!input.checkIn && !input.checkOut) throw new AppError("Enter the correct check-in and/or check-out time.");
  await assertEmployedOn(emp.id, input.date);
  const { checkIn, checkOut } = toInstants(input.date, input.checkIn, input.checkOut, company.timezone);
  if ((checkIn && checkIn > new Date()) || (checkOut && checkOut > new Date())) throw new AppError("Times can't be in the future.");

  const pending = await db.query.attendanceCorrections.findFirst({
    where: and(eq(attendanceCorrections.employeeId, emp.id), eq(attendanceCorrections.workDate, input.date), eq(attendanceCorrections.status, "pending")),
  });
  if (pending) throw new AppError("You already have a pending correction for that day.");

  await db.insert(attendanceCorrections).values({
    employeeId: emp.id,
    workDate: input.date,
    requestedCheckInAt: checkIn,
    requestedCheckOutAt: checkOut,
    reason: input.reason,
  });
  const reviewers = [await managerUserId(emp.id), ...(await userIdsWithPermission("attendance.manage"))].filter((u) => u !== viewer.userId);
  await notify(reviewers, {
    type: "attendance_correction",
    title: `${emp.fullName} requested an attendance correction`,
    body: `For ${formatDate(input.date)}: ${input.reason.slice(0, 120)}`,
    link: "/crm/attendance?tab=corrections",
  });
  await audit({ actorUserId: viewer.userId, action: "attendance.correction_request", entityType: "attendance", entityId: emp.id, summary: `Requested an attendance correction for ${formatDate(input.date)}` });
}

/** Writes corrected times to the record (creating it if the day had none), keeping the previous values. */
async function applyTimes(tx: Tx, employeeId: string, date: ISODate, checkIn: Date | null, checkOut: Date | null) {
  const existing = await tx.query.attendanceRecords.findFirst({ where: and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.workDate, date)) });
  const previous = existing ? { checkInAt: existing.checkInAt?.toISOString() ?? null, checkOutAt: existing.checkOutAt?.toISOString() ?? null } : null;
  const newIn = checkIn ?? existing?.checkInAt ?? null;
  const newOut = checkOut ?? existing?.checkOutAt ?? null;
  if (!newIn) throw new AppError("A check-in time is needed for a day with no record.");
  if (newOut && newOut < newIn) throw new AppError("Check-out must be after check-in.");
  let id = existing?.id;
  if (existing) {
    await tx.update(attendanceRecords).set({ checkInAt: newIn, checkOutAt: newOut, correctedAt: new Date() }).where(eq(attendanceRecords.id, existing.id));
  } else {
    const [row] = await tx.insert(attendanceRecords).values({ employeeId, workDate: date, checkInAt: newIn, checkOutAt: newOut, correctedAt: new Date() }).returning({ id: attendanceRecords.id });
    id = row!.id;
  }
  await recomputeRecord(tx, id!);
  return previous;
}

async function assertCanReview(viewer: Viewer, employeeId: string) {
  if (viewer.employee?.id === employeeId && viewer.role.key !== "super_admin") throw new ForbiddenError("You can't approve your own correction.");
  if (can(viewer, "attendance.manage")) return;
  if (can(viewer, "attendance.approve_team") && (await isInTeam(viewer, employeeId))) return;
  throw new ForbiddenError();
}

export async function reviewCorrection(viewer: Viewer, id: string, approve: boolean, comment: string | null) {
  const c = await db.query.attendanceCorrections.findFirst({ where: eq(attendanceCorrections.id, id) });
  if (!c) throw new AppError("Request not found.");
  await assertCanReview(viewer, c.employeeId);
  if (c.status !== "pending") throw new AppError("This request has already been handled.");

  await db.transaction(async (tx) => {
    let previousValues = null;
    if (approve) previousValues = await applyTimes(tx, c.employeeId, c.workDate, c.requestedCheckInAt, c.requestedCheckOutAt);
    const [updated] = await tx
      .update(attendanceCorrections)
      .set({ status: approve ? "approved" : "rejected", reviewerId: viewer.userId, reviewComment: comment, reviewedAt: new Date(), previousValues })
      .where(and(eq(attendanceCorrections.id, id), eq(attendanceCorrections.status, "pending")))
      .returning({ id: attendanceCorrections.id });
    if (!updated) throw new AppError("This request has already been handled.");
    await audit(
      {
        actorUserId: viewer.userId,
        action: approve ? "attendance.correction_approve" : "attendance.correction_reject",
        entityType: "attendance",
        entityId: c.employeeId,
        summary: `${approve ? "Approved" : "Rejected"} an attendance correction for ${formatDate(c.workDate)}`,
        metadata: { correctionId: id, previous: previousValues, requested: { in: c.requestedCheckInAt, out: c.requestedCheckOutAt } },
      },
      tx,
    );
  });
  await notify([await userIdForEmployee(c.employeeId)], {
    type: "attendance_correction",
    title: `Your attendance correction for ${formatDate(c.workDate)} was ${approve ? "approved" : "rejected"}`,
    body: comment,
    link: "/crm/attendance",
  });
}

/** HR sets a day's times directly (attendance.manage). Recorded as an approved correction. */
export async function hrSetAttendance(viewer: Viewer, input: { employeeId: string; date: ISODate; checkIn: string | null; checkOut: string | null; reason: string }) {
  if (!can(viewer, "attendance.manage")) throw new ForbiddenError();
  if (viewer.employee?.id === input.employeeId && viewer.role.key !== "super_admin") throw new ForbiddenError("Ask another HR colleague to change your own attendance.");
  const company = await getCompany();
  if (input.date > todayIn(company.timezone)) throw new AppError("You can't set attendance for a future date.");
  await assertEmployedOn(input.employeeId, input.date);
  const { checkIn, checkOut } = toInstants(input.date, input.checkIn, input.checkOut, company.timezone);
  await db.transaction(async (tx) => {
    const previous = await applyTimes(tx, input.employeeId, input.date, checkIn, checkOut);
    await tx.insert(attendanceCorrections).values({
      employeeId: input.employeeId,
      workDate: input.date,
      requestedCheckInAt: checkIn,
      requestedCheckOutAt: checkOut,
      reason: input.reason,
      status: "approved",
      reviewerId: viewer.userId,
      reviewComment: "Changed by HR",
      reviewedAt: new Date(),
      previousValues: previous,
    });
    await audit({ actorUserId: viewer.userId, action: "attendance.hr_edit", entityType: "attendance", entityId: input.employeeId, summary: `Edited attendance for ${formatDate(input.date)}`, metadata: { previous, reason: input.reason } }, tx);
  });
  await notify([await userIdForEmployee(input.employeeId)], { type: "attendance_correction", title: `HR updated your attendance for ${formatDate(input.date)}`, body: input.reason, link: "/crm/attendance" });
}

/** Corrections the viewer can review (pending first), or their own. */
export async function listCorrections(viewer: Viewer, mode: "mine" | "review") {
  const base = db
    .select({
      id: attendanceCorrections.id,
      employeeId: attendanceCorrections.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      photoFileId: employees.photoFileId,
      workDate: attendanceCorrections.workDate,
      requestedCheckInAt: attendanceCorrections.requestedCheckInAt,
      requestedCheckOutAt: attendanceCorrections.requestedCheckOutAt,
      reason: attendanceCorrections.reason,
      status: attendanceCorrections.status,
      reviewComment: attendanceCorrections.reviewComment,
      reviewedAt: attendanceCorrections.reviewedAt,
      reviewerEmail: users.email,
      previousValues: attendanceCorrections.previousValues,
      createdAt: attendanceCorrections.createdAt,
    })
    .from(attendanceCorrections)
    .innerJoin(employees, eq(employees.id, attendanceCorrections.employeeId))
    .leftJoin(users, eq(users.id, attendanceCorrections.reviewerId));

  if (mode === "mine") {
    if (!viewer.employee) return [];
    return base.where(eq(attendanceCorrections.employeeId, viewer.employee.id)).orderBy(desc(attendanceCorrections.createdAt)).limit(50);
  }
  if (can(viewer, "attendance.manage")) return base.orderBy(asc(attendanceCorrections.status), desc(attendanceCorrections.createdAt)).limit(100);
  if (!can(viewer, "attendance.approve_team") || !viewer.employee) return [];
  const team = await getTeamEmployeeIds(viewer.employee.id);
  if (!team.length) return [];
  return base.where(inArray(attendanceCorrections.employeeId, team)).orderBy(asc(attendanceCorrections.status), desc(attendanceCorrections.createdAt)).limit(100);
}
