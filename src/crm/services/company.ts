import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/crm/db";
import { companySettings, employees, holidays, workSchedules } from "@/crm/db/schema";
import type { ISODate } from "@/crm/lib/time";

/** Company settings, memoised per request. */
export const getCompany = cache(async () => {
  const row = await db.query.companySettings.findFirst({ where: eq(companySettings.id, 1) });
  if (!row) throw new Error("Company settings are missing. Run `npm run db:seed`.");
  return row;
});

export type Schedule = typeof workSchedules.$inferSelect;

export const getDefaultSchedule = cache(async (): Promise<Schedule> => {
  const row =
    (await db.query.workSchedules.findFirst({ where: eq(workSchedules.isDefault, true) })) ??
    (await db.query.workSchedules.findFirst());
  if (!row) throw new Error("No work schedule is configured. Run `npm run db:seed`.");
  return row;
});

/** The schedule that applies to an employee: their own, else the company default. */
export const getScheduleForEmployee = cache(async (employeeId: string): Promise<Schedule> => {
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { workScheduleId: true } });
  if (emp?.workScheduleId) {
    const s = await db.query.workSchedules.findFirst({ where: eq(workSchedules.id, emp.workScheduleId) });
    if (s) return s;
  }
  return getDefaultSchedule();
});

export const getHolidaysBetween = cache(async (from: ISODate, to: ISODate) => {
  return db
    .select()
    .from(holidays)
    .where(and(gte(holidays.date, from), lte(holidays.date, to)))
    .orderBy(holidays.date);
});

/** Public (non-optional) holiday dates in a range, as a Set for quick lookup. */
export async function publicHolidaySet(from: ISODate, to: ISODate): Promise<Set<string>> {
  const rows = await getHolidaysBetween(from, to);
  return new Set(rows.filter((h) => h.type === "public").map((h) => h.date));
}
