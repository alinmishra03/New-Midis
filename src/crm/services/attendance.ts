import "server-only";
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { cache } from "react";
import { db, type Tx } from "@/crm/db";
import { attendanceBreaks, attendanceRecords, companySettings, employees, leaveRequests, wfhRequests, workSchedules } from "@/crm/db/schema";
import type { Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { addDays, isoWeekday, minutesFromHHMM, shiftLabel, todayIn, zonedDate, zonedMinutes, type ISODate } from "@/crm/lib/time";
import { getCompany, getDefaultSchedule, getScheduleForEmployee, publicHolidaySet, type Schedule } from "./company";

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

/* ------------------------------------------------- attendance exemption */

/**
 * The CEOs don't check in or out. They're never asked to, can't (enforced in
 * the check-in/out/break actions), and are left out of every attendance
 * compliance figure: absences, late counts, "not checked in", check-in rates
 * and the attendance report. Their profiles, logins and permissions are
 * unaffected, and any past attendance records are kept as they are.
 *
 * Matched by employee code AND full name — both must match — so a reused code
 * or a namesake is never exempted by accident. Each person lists their current
 * code and their leadership code (set by a Super Admin on the Edit page), so
 * the exemption holds before and after the code is changed.
 */
export const ATTENDANCE_EXEMPT: readonly { codes: readonly string[]; name: string }[] = [
  { codes: ["CEO-01", "MID-0010"], name: "Gaurav Sharma" }, // CEO & Director
  { codes: ["MD-01", "MID-0008"], name: "Sagar Bakshi" }, // Managing Director
];

const normName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export function isAttendanceExempt(e: { employeeCode: string; firstName: string; lastName: string }): boolean {
  const code = e.employeeCode.trim().toUpperCase();
  const name = normName(`${e.firstName} ${e.lastName}`);
  return ATTENDANCE_EXEMPT.some((x) => x.codes.includes(code) && normName(x.name) === name);
}

/** Ids of the employees exempt from attendance (per request). */
export const attendanceExemptIds = cache(async (): Promise<Set<string>> => {
  const rows = await db
    .select({ id: employees.id, employeeCode: employees.employeeCode, firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(inArray(employees.employeeCode, ATTENDANCE_EXEMPT.flatMap((x) => x.codes)));
  return new Set(rows.filter(isAttendanceExempt).map((r) => r.id));
});

export async function isEmployeeAttendanceExempt(employeeId: string) {
  return (await attendanceExemptIds()).has(employeeId);
}

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
  return { today, timezone: company.timezone, ctx, record, breaks, openBreak, live, exempt: await isEmployeeAttendanceExempt(employeeId) };
}

/** The viewer's employee record, for the check-in/out/break actions. Exempt employees are refused. */
async function requireEmployee(viewer: Viewer) {
  if (!viewer.employee) throw new AppError("Your account isn't linked to an employee record. Ask HR.");
  if (await isEmployeeAttendanceExempt(viewer.employee.id)) throw new AppError("You don't need to check in or out — attendance isn't recorded for your role.");
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

/**
 * Recomputes a record's derived fields after its times change (corrections).
 * Uses only `tx` — see applyUsage in leave.ts for why.
 */
export async function recomputeRecord(tx: Tx, recordId: string) {
  const record = await tx.query.attendanceRecords.findFirst({ where: eq(attendanceRecords.id, recordId) });
  if (!record) return;
  const company = (await tx.query.companySettings.findFirst({ where: eq(companySettings.id, 1) }))!;
  const emp = await tx.query.employees.findFirst({ where: eq(employees.id, record.employeeId), columns: { workScheduleId: true } });
  const schedule =
    (emp?.workScheduleId ? await tx.query.workSchedules.findFirst({ where: eq(workSchedules.id, emp.workScheduleId) }) : undefined) ??
    (await tx.query.workSchedules.findFirst({ where: eq(workSchedules.isDefault, true) }))!;
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
  // Exempt (CEOs): never absent or late; any records they have are still listed.
  const exempt = await isEmployeeAttendanceExempt(employeeId);
  return {
    exempt,
    workingDays,
    present: recs.filter((r) => r.status === "present").length,
    halfDays: recs.filter((r) => r.status === "half_day").length,
    late: exempt ? 0 : recs.filter((r) => r.lateMinutes > 0).length,
    absent: exempt ? 0 : absentDays + recs.filter((r) => r.status === "absent").length,
    leaveDays,
    workedMinutes: recs.reduce((s, r) => s + r.workedMinutes, 0),
  };
}

/**
 * Everyone the viewer may see on a given day, with their attendance state.
 * Scope: all (attendance.view_all) or their reporting tree (view_team).
 */
export async function attendanceForDay(employeeIds: string[] | "all", date: ISODate) {
  const empConds = [inArray(employees.employmentStatus, ["probation", "active", "notice"]), lte(employees.joiningDate, date)];
  if (employeeIds !== "all") {
    if (!employeeIds.length) return [];
    empConds.push(inArray(employees.id, employeeIds));
  }
  const people = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, employeeCode: employees.employeeCode, workScheduleId: employees.workScheduleId })
    .from(employees)
    .where(and(...empConds))
    .orderBy(asc(employees.firstName))
    // Exempt employees (CEOs) aren't tracked, so they're not listed as "not checked in".
    .then(async (rows) => {
      const exempt = await attendanceExemptIds();
      return rows.filter((p) => !exempt.has(p.id));
    });
  const ids = people.map((p) => p.id);
  if (!ids.length) return [];
  const [recs, leaves, wfh, schedules, fallback] = await Promise.all([
    db.select().from(attendanceRecords).where(and(eq(attendanceRecords.workDate, date), inArray(attendanceRecords.employeeId, ids))),
    db.select().from(leaveRequests).where(and(eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, date), gte(leaveRequests.endDate, date), inArray(leaveRequests.employeeId, ids))),
    db.select().from(wfhRequests).where(and(eq(wfhRequests.status, "approved"), lte(wfhRequests.startDate, date), gte(wfhRequests.endDate, date), inArray(wfhRequests.employeeId, ids))),
    db.select().from(workSchedules),
    getDefaultSchedule(),
  ]);
  return people.map((p) => {
    const record = recs.find((r) => r.employeeId === p.id) ?? null;
    const leave = leaves.find((l) => l.employeeId === p.id) ?? null;
    // The employee's own shift, else the company default (same rule as attendance calculations).
    const shift = schedules.find((s) => s.id === p.workScheduleId) ?? fallback;
    return { ...p, name: `${p.firstName} ${p.lastName}`.trim(), record, onLeave: leave ? leave.halfDay : null, wfh: wfh.some((w) => w.employeeId === p.id), shift: shiftLabel(shift) };
  });
}
