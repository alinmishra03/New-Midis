import "server-only";
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { attendanceBreaks, attendanceRecords, employees, leaveRequests, wfhRequests } from "@/crm/db/schema";
import type { Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { addDays, isoWeekday, minutesFromHHMM, todayIn, zonedDate, zonedMinutes, type ISODate } from "@/crm/lib/time";
import { getCompany, getScheduleForEmployee, publicHolidaySet, type Schedule } from "./company";

/**
 * Attendance rules
 *
 * - Every timestamp comes from the server clock (`new Date()` here), never
 *   from the browser, and the working day is computed in the company
 *   timezone.
 * - One record per employee per working day (unique index). A second
 *   check-in is rejected; check-out requires an open check-in; breaks must
 *   open and close inside the checked-in period (one open break at a time,
 *   enforced by a partial unique index).
 * - Employees cannot edit their records. Mistakes go through a correction
 *   request, which a manager/HR approves; approvals keep the previous
 *   values and are audit-logged.
 * - Late, early-leave, half/full-day thresholds come from the employee's
 *   work schedule, which HR configures.
 */

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type AttendanceBreak = typeof attendanceBreaks.$inferSelect;

/** Derived fields for a record, from its times, breaks and the schedule. */
export function computeMetrics(
  rec: { checkInAt: Date | null; checkOutAt: Date | null },
  breaks: { startAt: Date; endAt: Date | null }[],
  schedule: Schedule,
  timeZone: string,
) {
  const start = minutesFromHHMM(schedule.startTime);
  const end = minutesFromHHMM(schedule.endTime);
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  if (rec.checkInAt) {
    const inMin = zonedMinutes(rec.checkInAt, timeZone);
    if (inMin > start + schedule.lateGraceMinutes) lateMinutes = inMin - start;
  }
  if (rec.checkOutAt) {
    const outMin = zonedMinutes(rec.checkOutAt, timeZone);
    const sameDay = rec.checkInAt && zonedDate(rec.checkOutAt, timeZone) === zonedDate(rec.checkInAt, timeZone);
    if (sameDay && outMin < end - schedule.earlyLeaveGraceMinutes) earlyLeaveMinutes = end - outMin;
  }
  const closedUntil = rec.checkOutAt ?? new Date();
  const breakMinutes = Math.round(
    breaks.reduce((sum, b) => sum + ((b.endAt ?? closedUntil).getTime() - b.startAt.getTime()) / 60000, 0),
  );
  let workedMinutes = 0;
  let status: AttendanceRecord["status"] = "incomplete";
  if (rec.checkInAt && rec.checkOutAt) {
    workedMinutes = Math.max(0, Math.round((rec.checkOutAt.getTime() - rec.checkInAt.getTime()) / 60000) - breakMinutes);
    status = workedMinutes >= schedule.fullDayMinutes ? "present" : workedMinutes >= schedule.halfDayMinutes ? "half_day" : "absent";
  }
  return {
    lateMinutes: Math.min(lateMinutes, 32000),
    earlyLeaveMinutes: Math.min(earlyLeaveMinutes, 32000),
    breakMinutes: Math.min(breakMinutes, 32000),
    workedMinutes: Math.min(workedMinutes, 32000),
    status,
  };
}

/** What kind of day a date is for an employee. */
export async function dayContext(employeeId: string, date: ISODate) {
  const schedule = await getScheduleForEmployee(employeeId);
  const holidays = await publicHolidaySet(date, date);
  const [leave, wfh] = await Promise.all([
    db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.employeeId, employeeId),
        eq(leaveRequests.status, "approved"),
        lte(leaveRequests.startDate, date),
        gte(leaveRequests.endDate, date),
      ),
    }),
    db.query.wfhRequests.findFirst({
      where: and(eq(wfhRequests.employeeId, employeeId), eq(wfhRequests.status, "approved"), lte(wfhRequests.startDate, date), gte(wfhRequests.endDate, date)),
    }),
  ]);
  return {
    schedule,
    isWorkingDay: schedule.workingDays.includes(isoWeekday(date)) && !holidays.has(date),
    isHoliday: holidays.has(date),
    leave: leave ? { halfDay: leave.halfDay, id: leave.id } : null,
    wfh: !!wfh,
  };
}

export async function getRecord(employeeId: string, date: ISODate) {
  const record = await db.query.attendanceRecords.findFirst({
    where: and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.workDate, date)),
  });
  const breaks = record
    ? await db.select().from(attendanceBreaks).where(eq(attendanceBreaks.attendanceId, record.id)).orderBy(asc(attendanceBreaks.startAt))
    : [];
  return { record: record ?? null, breaks };
}

/** Today's state for the check-in widget. */
export async function getTodayState(employeeId: string) {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const [ctx, { record, breaks }] = await Promise.all([dayContext(employeeId, today), getRecord(employeeId, today)]);
  const openBreak = breaks.find((b) => !b.endAt) ?? null;
  const live = record?.checkInAt ? computeMetrics(record, breaks, ctx.schedule, company.timezone) : null;
  return { today, timezone: company.timezone, ctx, record, breaks, openBreak, live };
}

async function requireEmployee(viewer: Viewer) {
  if (!viewer.employee) throw new AppError("Your account isn't linked to an employee record. Ask HR.");
  return viewer.employee;
}

export async function checkIn(viewer: Viewer, mode: "office" | "remote", note?: string) {
  const emp = await requireEmployee(viewer);
  const company = await getCompany();
  const now = new Date();
  const today = zonedDate(now, company.timezone);
  const ctx = await dayContext(emp.id, today);

  if (ctx.leave && ctx.leave.halfDay === "none") {
    throw new AppError("You're on approved leave today. Cancel the leave first if you're working.");
  }
  if (mode === "remote" && !ctx.wfh && !ctx.schedule.allowUnplannedRemote) {
    throw new AppError("Remote check-in needs an approved work-from-home request for today.");
  }

  const metrics = computeMetrics({ checkInAt: now, checkOutAt: null }, [], ctx.schedule, company.timezone);
  const [created] = await db
    .insert(attendanceRecords)
    .values({ employeeId: emp.id, workDate: today, checkInAt: now, workMode: mode, lateMinutes: metrics.lateMinutes, status: "incomplete", note: note || null })
    .onConflictDoNothing()
    .returning({ id: attendanceRecords.id });

  if (!created) {
    // A record exists: either already checked in, or HR created it.
    const existing = await getRecord(emp.id, today);
    if (existing.record?.checkInAt) throw new AppError("You've already checked in today.");
    await db
      .update(attendanceRecords)
      .set({ checkInAt: now, workMode: mode, lateMinutes: metrics.lateMinutes })
      .where(and(eq(attendanceRecords.id, existing.record!.id), isNull(attendanceRecords.checkInAt)));
  }
  await audit({
    actorUserId: viewer.userId,
    action: "attendance.check_in",
    entityType: "attendance",
    entityId: emp.id,
    summary: `Checked in${mode === "remote" ? " remotely" : ""}${metrics.lateMinutes ? ` (${metrics.lateMinutes} min late)` : ""}`,
  });
  return { late: metrics.lateMinutes };
}

/** The open record to act on: today's, or yesterday's if a shift ran past midnight. */
async function openRecord(employeeId: string, timeZone: string) {
  const today = todayIn(timeZone);
  for (const date of [today, addDays(today, -1)]) {
    const r = await getRecord(employeeId, date);
    if (r.record?.checkInAt && !r.record.checkOutAt) return r;
    if (date === today && r.record?.checkOutAt) return { ...r, closed: true as const };
  }
  return null;
}

export async function checkOut(viewer: Viewer) {
  const emp = await requireEmployee(viewer);
  const company = await getCompany();
  const r = await openRecord(emp.id, company.timezone);
  if (!r || !r.record) throw new AppError("You haven't checked in today.");
  if ("closed" in r) throw new AppError("You've already checked out today.");

  const now = new Date();
  const schedule = await getScheduleForEmployee(emp.id);
  await db.transaction(async (tx) => {
    // Close any open break at check-out.
    await tx.update(attendanceBreaks).set({ endAt: now }).where(and(eq(attendanceBreaks.attendanceId, r.record!.id), isNull(attendanceBreaks.endAt)));
    const breaks = await tx.select().from(attendanceBreaks).where(eq(attendanceBreaks.attendanceId, r.record!.id));
    const m = computeMetrics({ checkInAt: r.record!.checkInAt, checkOutAt: now }, breaks, schedule, company.timezone);
    const [updated] = await tx
      .update(attendanceRecords)
      .set({ checkOutAt: now, ...m })
      .where(and(eq(attendanceRecords.id, r.record!.id), isNull(attendanceRecords.checkOutAt)))
      .returning({ id: attendanceRecords.id });
    if (!updated) throw new AppError("You've already checked out today.");
    await audit(
      { actorUserId: viewer.userId, action: "attendance.check_out", entityType: "attendance", entityId: emp.id, summary: `Checked out after ${Math.floor(m.workedMinutes / 60)}h ${m.workedMinutes % 60}m` },
      tx,
    );
  });
}

export async function startBreak(viewer: Viewer) {
  const emp = await requireEmployee(viewer);
  const company = await getCompany();
  const r = await openRecord(emp.id, company.timezone);
  if (!r || !r.record || "closed" in r) throw new AppError("Check in before starting a break.");
  if (r.breaks.some((b) => !b.endAt)) throw new AppError("You're already on a break.");
  const [created] = await db.insert(attendanceBreaks).values({ attendanceId: r.record.id, startAt: new Date() }).onConflictDoNothing().returning();
  if (!created) throw new AppError("You're already on a break.");
}

export async function endBreak(viewer: Viewer) {
  const emp = await requireEmployee(viewer);
  const company = await getCompany();
  const r = await openRecord(emp.id, company.timezone);
  if (!r || !r.record || "closed" in r) throw new AppError("You're not checked in.");
  const [closed] = await db
    .update(attendanceBreaks)
    .set({ endAt: new Date() })
    .where(and(eq(attendanceBreaks.attendanceId, r.record.id), isNull(attendanceBreaks.endAt)))
    .returning();
  if (!closed) throw new AppError("You're not on a break.");
}

/** Recomputes a record's derived fields after its times change (corrections). */
export async function recomputeRecord(tx: Tx, recordId: string) {
  const record = await tx.query.attendanceRecords.findFirst({ where: eq(attendanceRecords.id, recordId) });
  if (!record) return;
  const company = await getCompany();
  const schedule = await getScheduleForEmployee(record.employeeId);
  const breaks = await tx.select().from(attendanceBreaks).where(eq(attendanceBreaks.attendanceId, recordId));
  const m = computeMetrics(record, breaks, schedule, company.timezone);
  await tx.update(attendanceRecords).set(m).where(eq(attendanceRecords.id, recordId));
}

/** Records for employees in a date range. */
export async function recordsBetween(employeeIds: string[] | "all", from: ISODate, to: ISODate) {
  const conds = [gte(attendanceRecords.workDate, from), lte(attendanceRecords.workDate, to)];
  if (employeeIds !== "all") {
    if (!employeeIds.length) return [];
    conds.push(inArray(attendanceRecords.employeeId, employeeIds));
  }
  return db.select().from(attendanceRecords).where(and(...conds)).orderBy(asc(attendanceRecords.workDate));
}

/** Monthly summary for one employee: present/half/absent/late/leave and hours. */
export async function monthSummary(employeeId: string, from: ISODate, to: ISODate) {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const schedule = await getScheduleForEmployee(employeeId);
  const holidays = await publicHolidaySet(from, to);
  const recs = await recordsBetween([employeeId], from, to);
  const leaves = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.employeeId, employeeId), eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, to), gte(leaveRequests.endDate, from)));

  // Only days the person was employed count: nobody is "absent" before they joined.
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { joiningDate: true, exitDate: true } });
  const first = emp && emp.joiningDate > from ? emp.joiningDate : from;
  const last = emp?.exitDate && emp.exitDate < to ? emp.exitDate : to;

  let workingDays = 0;
  let leaveDays = 0;
  let absentDays = 0;
  const byDate = new Map(recs.map((r) => [r.workDate, r]));
  for (let d = first; d <= last && d <= today; d = addDays(d, 1)) {
    const working = schedule.workingDays.includes(isoWeekday(d)) && !holidays.has(d);
    if (!working) continue;
    workingDays++;
    const onLeave = leaves.find((l) => l.startDate <= d && l.endDate >= d);
    if (onLeave) {
      leaveDays += onLeave.halfDay === "none" ? 1 : 0.5;
      continue;
    }
    const r = byDate.get(d);
    if (!r && d < today) absentDays++;
  }
  return {
    workingDays,
    present: recs.filter((r) => r.status === "present").length,
    halfDays: recs.filter((r) => r.status === "half_day").length,
    late: recs.filter((r) => r.lateMinutes > 0).length,
    absent: absentDays + recs.filter((r) => r.status === "absent").length,
    leaveDays,
    workedMinutes: recs.reduce((s, r) => s + r.workedMinutes, 0),
  };
}
