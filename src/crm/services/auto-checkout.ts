import "server-only";
import { and, eq, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/crm/db";
import { attendanceBreaks, attendanceRecords, employees } from "@/crm/db/schema";
import { audit } from "@/crm/lib/audit";
import { formatDate, zonedDate, zonedToInstant, type ISODate } from "@/crm/lib/time";
import { computeMetrics, isAttendanceExempt } from "./attendance";
import { getCompany, getScheduleForEmployee } from "./company";
import { notify, userIdForEmployee } from "./notifications";

/**
 * Automatic check-out at 19:00 (company timezone, Asia/Kolkata).
 *
 * Run by the scheduled job (app/api/cron/auto-checkout) after 19:00. For
 * TODAY only — never retroactively — every record with a check-in at or
 * before 19:00 and no check-out gets check-out = 19:00, marked
 * `checkOutSource = "auto"`. Everything else is left alone:
 * - people who never checked in (no record is ever created),
 * - records already checked out (by the employee, HR or a correction),
 * - the attendance-exempt CEOs (existing code + name rule),
 * - records with break activity after 19:00 (the person was still working),
 * - attendance correction requests (never read or changed here).
 *
 * Idempotent: the update only applies while check-out is still empty, so a
 * second run (or a concurrent manual check-out) changes nothing. Each record
 * is its own transaction; a failure is logged and reported, never counted as
 * done.
 */

export const AUTO_CHECKOUT_TIME = "19:00";

export type AutoCheckoutResult = {
  date: ISODate;
  timeZone: string;
  /** False when called before 19:00 (nothing is done). */
  ran: boolean;
  checkedOut: number;
  skipped: { recordId: string; reason: string }[];
  failed: { recordId: string; error: string }[];
};

export async function runAutoCheckout(now = new Date()): Promise<AutoCheckoutResult> {
  const company = await getCompany();
  const tz = company.timezone;
  const date = zonedDate(now, tz);
  const cutoff = zonedToInstant(date, AUTO_CHECKOUT_TIME, tz);
  const result: AutoCheckoutResult = { date, timeZone: tz, ran: false, checkedOut: 0, skipped: [], failed: [] };
  if (now < cutoff) return result;
  result.ran = true;

  const open = await db
    .select({ id: attendanceRecords.id, employeeId: attendanceRecords.employeeId, checkInAt: attendanceRecords.checkInAt, employeeCode: employees.employeeCode, firstName: employees.firstName, lastName: employees.lastName })
    .from(attendanceRecords)
    .innerJoin(employees, eq(employees.id, attendanceRecords.employeeId))
    .where(and(eq(attendanceRecords.workDate, date), isNotNull(attendanceRecords.checkInAt), isNull(attendanceRecords.checkOutAt), lte(attendanceRecords.checkInAt, cutoff)));

  for (const rec of open) {
    if (isAttendanceExempt(rec)) {
      result.skipped.push({ recordId: rec.id, reason: "attendance-exempt" });
      continue;
    }
    try {
      const schedule = await getScheduleForEmployee(rec.employeeId);
      const done = await db.transaction(async (tx) => {
        const breaks = await tx.select().from(attendanceBreaks).where(eq(attendanceBreaks.attendanceId, rec.id));
        // Activity after 19:00 means they were still working: don't cut it short.
        if (breaks.some((b) => b.startAt > cutoff || (b.endAt && b.endAt > cutoff))) return "activity after 19:00" as const;
        // A break still open at 19:00 ends at 19:00 (as a manual check-out would close it).
        const closed = breaks.map((b) => (b.endAt ? b : { ...b, endAt: cutoff }));
        const m = computeMetrics({ checkInAt: rec.checkInAt, checkOutAt: cutoff }, closed, schedule, tz);
        const [updated] = await tx
          .update(attendanceRecords)
          .set({ checkOutAt: cutoff, checkOutSource: "auto", ...m })
          .where(and(eq(attendanceRecords.id, rec.id), isNull(attendanceRecords.checkOutAt)))
          .returning({ id: attendanceRecords.id });
        if (!updated) return "already checked out" as const;
        await tx.update(attendanceBreaks).set({ endAt: cutoff }).where(and(eq(attendanceBreaks.attendanceId, rec.id), isNull(attendanceBreaks.endAt)));
        await audit(
          {
            actorUserId: null,
            action: "attendance.auto_check_out",
            entityType: "attendance",
            entityId: rec.employeeId,
            summary: `Automatically checked out at ${AUTO_CHECKOUT_TIME} on ${formatDate(date)} (no check-out recorded)`,
            metadata: { recordId: rec.id, checkOutAt: cutoff.toISOString(), source: "system auto-checkout", workedMinutes: m.workedMinutes },
          },
          tx,
        );
        return "done" as const;
      });
      if (done !== "done") {
        result.skipped.push({ recordId: rec.id, reason: done });
        continue;
      }
      result.checkedOut++;
      console.info(`[auto-checkout] ${date} record ${rec.id}: checked out at ${AUTO_CHECKOUT_TIME}`);
      // Best effort: the check-out is already saved; a failed notification doesn't undo it.
      try {
        await notify([await userIdForEmployee(rec.employeeId)], {
          type: "attendance_auto_checkout",
          title: `You were automatically checked out at 7:00 PM`,
          body: `No check-out was recorded for ${formatDate(date)}. If you left at a different time, request an attendance correction.`,
          link: "/crm/attendance",
          dedupeKey: `auto-checkout:${rec.id}`,
        });
      } catch (e) {
        console.error(`[auto-checkout] ${date} record ${rec.id}: notification failed`, e instanceof Error ? e.message : e);
      }
    } catch (e) {
      // Drizzle wraps the driver error ("Failed query: …" + params); log the underlying reason.
      const error = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
      result.failed.push({ recordId: rec.id, error });
      console.error(`[auto-checkout] ${date} record ${rec.id}: FAILED — ${error}`);
    }
  }
  console.info(`[auto-checkout] ${date}: ${result.checkedOut} checked out, ${result.skipped.length} skipped, ${result.failed.length} failed`);
  return result;
}
