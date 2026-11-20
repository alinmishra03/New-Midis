import "server-only";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { leaveBalances, leaveRequests, leaveTypes } from "@/crm/db/schema";
import { addDays, isoWeekday, todayIn, type ISODate } from "@/crm/lib/time";
import { ensureLeaveBalances, leaveYearFor } from "./accounts";
import { getCompany, getScheduleForEmployee, publicHolidaySet } from "./company";

/** Leave year bounds for the year containing `date`. */
export function leaveYearBounds(year: number, startMonth: number): { from: ISODate; to: ISODate } {
  const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const nextStart = `${year + 1}-${String(startMonth).padStart(2, "0")}-01`;
  return { from, to: addDays(nextStart, -1) };
}

export async function currentLeaveYear() {
  const company = await getCompany();
  const year = leaveYearFor(todayIn(company.timezone), company.leaveYearStartMonth);
  return { year, ...leaveYearBounds(year, company.leaveYearStartMonth) };
}

/**
 * Working days in a range for an employee: their schedule's working weekdays,
 * minus public holidays. A half day counts 0.5 and only on single-day requests.
 */
export async function countLeaveDays(employeeId: string, start: ISODate, end: ISODate, halfDay: "none" | "first_half" | "second_half") {
  const schedule = await getScheduleForEmployee(employeeId);
  const holidays = await publicHolidaySet(start, end);
  let days = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (schedule.workingDays.includes(isoWeekday(d)) && !holidays.has(d)) days++;
  }
  if (halfDay !== "none" && start === end && days === 1) return 0.5;
  return days;
}

export type BalanceRow = {
  leaveTypeId: string;
  code: string;
  name: string;
  color: string;
  isPaid: boolean;
  allowHalfDay: boolean;
  documentRequiredAfterDays: number | null;
  unlimited: boolean;
  allocated: number;
  carriedForward: number;
  adjustment: number;
  used: number;
  pending: number;
  available: number;
};

/** Balances for every active leave type in a leave year, including pending requests. */
export async function getBalances(employeeId: string, year?: number): Promise<BalanceRow[]> {
  const y = year ?? (await currentLeaveYear()).year;
  const company = await getCompany();
  const bounds = leaveYearBounds(y, company.leaveYearStartMonth);
  await db.transaction((tx) => ensureLeaveBalances(tx, employeeId, y));

  const [types, balances, pending] = await Promise.all([
    db.select().from(leaveTypes).where(eq(leaveTypes.isActive, true)).orderBy(asc(leaveTypes.sortOrder)),
    db.select().from(leaveBalances).where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, y))),
    db
      .select({ leaveTypeId: leaveRequests.leaveTypeId, days: sql<string>`coalesce(sum(${leaveRequests.days}), 0)` })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, employeeId),
          eq(leaveRequests.status, "pending"),
          gte(leaveRequests.startDate, bounds.from),
          lte(leaveRequests.startDate, bounds.to),
        ),
      )
      .groupBy(leaveRequests.leaveTypeId),
  ]);

  return types.map((t) => {
    const b = balances.find((x) => x.leaveTypeId === t.id);
    const p = Number(pending.find((x) => x.leaveTypeId === t.id)?.days ?? 0);
    const allocated = Number(b?.allocated ?? 0);
    const carriedForward = Number(b?.carriedForward ?? 0);
    const adjustment = Number(b?.adjustment ?? 0);
    const used = Number(b?.used ?? 0);
    const unlimited = t.annualQuota === null;
    return {
      leaveTypeId: t.id,
      code: t.code,
      name: t.name,
      color: t.color,
      isPaid: t.isPaid,
      allowHalfDay: t.allowHalfDay,
      documentRequiredAfterDays: t.documentRequiredAfterDays,
      unlimited,
      allocated,
      carriedForward,
      adjustment,
      used,
      pending: p,
      available: unlimited ? Infinity : allocated + carriedForward + adjustment - used - p,
    };
  });
}

/** Applies an approval (+days) or a cancellation of an approved request (−days) to `used`. */
export async function applyUsage(tx: Tx, employeeId: string, leaveTypeId: string, startDate: ISODate, days: number) {
  const company = await getCompany();
  const year = leaveYearFor(startDate, company.leaveYearStartMonth);
  await ensureLeaveBalances(tx, employeeId, year);
  await tx
    .update(leaveBalances)
    .set({ used: sql`${leaveBalances.used} + ${days}` })
    .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.leaveTypeId, leaveTypeId), eq(leaveBalances.year, year)));
}

/** Employees on approved leave on a given date. */
export async function onLeaveOn(date: ISODate, employeeIds?: string[]) {
  const conds = [eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, date), gte(leaveRequests.endDate, date)];
  if (employeeIds) {
    if (!employeeIds.length) return [];
    conds.push(inArray(leaveRequests.employeeId, employeeIds));
  }
  return db.select().from(leaveRequests).where(and(...conds));
}
