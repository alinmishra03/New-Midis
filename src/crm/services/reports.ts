import "server-only";
import { and, asc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/crm/db";
import {
  attendanceRecords,
  departments,
  designations,
  employees,
  leaveRequests,
  leaveTypes,
  payrollRuns,
  payslips,
  performanceReviews,
  reviewCycles,
  tasks,
} from "@/crm/db/schema";
import { can, ForbiddenError, getTeamEmployeeIds, type Viewer } from "@/crm/auth/dal";
import { uuidOrUndefined } from "@/crm/lib/params";
import { addDays, formatDate, formatMinutes, isoWeekday, type ISODate } from "@/crm/lib/time";
import { getDefaultSchedule, publicHolidaySet } from "./company";

/**
 * Reports. Every report returns the same generic shape, so the page, CSV
 * and PDF render any of them. Scope: reports.view_all → company,
 * reports.view_team → the viewer's reporting tree; payroll needs
 * payroll.view.
 */

export const REPORTS = [
  { key: "headcount", label: "Headcount", description: "Current employees by department, status and type." },
  { key: "attendance", label: "Attendance", description: "Days present, late, half days, absences and hours per employee." },
  { key: "late", label: "Late arrivals", description: "Every late check-in in the period." },
  { key: "leave", label: "Leave", description: "Approved leave per employee and type." },
  { key: "movement", label: "Joining & exits", description: "Employees who joined or left in the period." },
  { key: "tasks", label: "Task completion", description: "Tasks per assignee: completed, open and overdue." },
  { key: "performance", label: "Performance", description: "Review ratings by cycle." },
  { key: "payroll", label: "Payroll", description: "Approved payroll totals per month (restricted)." },
] as const;
export type ReportKey = (typeof REPORTS)[number]["key"];

export type ReportFilters = { from: ISODate; to: ISODate; departmentId?: string; employeeId?: string };
export type Report = {
  key: ReportKey;
  title: string;
  subtitle: string;
  columns: string[];
  rows: (string | number)[][];
  chart?: { label: string; value: number }[];
  chartLabel?: string;
  summary: { label: string; value: string | number }[];
};

export function availableReports(viewer: Viewer) {
  const people = can(viewer, "reports.view_all", "reports.view_team");
  return REPORTS.filter((r) => (r.key === "payroll" ? can(viewer, "payroll.view") : people));
}

/** Employee ids the viewer may report on, narrowed by filters. */
async function scopeIds(viewer: Viewer, f: ReportFilters): Promise<string[]> {
  let ids: string[] | "all";
  if (can(viewer, "reports.view_all")) ids = "all";
  else if (can(viewer, "reports.view_team") && viewer.employee) ids = await getTeamEmployeeIds(viewer.employee.id);
  else throw new ForbiddenError();
  const conds = [];
  if (ids !== "all") conds.push(inArray(employees.id, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]));
  if (f.departmentId) conds.push(eq(employees.departmentId, f.departmentId));
  if (f.employeeId) conds.push(eq(employees.id, f.employeeId));
  const rows = await db.select({ id: employees.id }).from(employees).where(conds.length ? and(...conds) : undefined);
  return rows.map((r) => r.id);
}

async function people(ids: string[]) {
  if (!ids.length) return [];
  return db
    .select({ id: employees.id, code: employees.employeeCode, firstName: employees.firstName, lastName: employees.lastName, department: departments.name, designation: designations.title, joiningDate: employees.joiningDate, exitDate: employees.exitDate, status: employees.employmentStatus, type: employees.employmentType })
    .from(employees)
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(designations, eq(designations.id, employees.designationId))
    .where(inArray(employees.id, ids))
    .orderBy(asc(employees.firstName));
}
const name = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
const period = (f: ReportFilters) => `${formatDate(f.from)} – ${formatDate(f.to)}`;

export async function buildReport(viewer: Viewer, key: ReportKey, f: ReportFilters): Promise<Report> {
  if (!availableReports(viewer).some((r) => r.key === key)) throw new ForbiddenError();
  if (f.to < f.from) throw new ForbiddenError("The end date is before the start date.");
  // Ids that aren't well-formed are dropped rather than sent to the database.
  f = { ...f, departmentId: uuidOrUndefined(f.departmentId), employeeId: uuidOrUndefined(f.employeeId) };
  const def = REPORTS.find((r) => r.key === key)!;

  switch (key) {
    case "headcount": {
      const list = (await people(await scopeIds(viewer, f))).filter((p) => p.status !== "exited");
      const byDept = new Map<string, number>();
      for (const p of list) byDept.set(p.department ?? "No department", (byDept.get(p.department ?? "No department") ?? 0) + 1);
      return {
        key,
        title: def.label,
        subtitle: `As of today · ${list.length} current employees`,
        columns: ["Employee code", "Name", "Department", "Designation", "Status", "Type", "Joined"],
        rows: list.map((p) => [p.code, name(p), p.department ?? "—", p.designation ?? "—", p.status, p.type.replace("_", "-"), p.joiningDate]),
        chart: [...byDept].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
        chartLabel: "Employees by department",
        summary: [
          { label: "Current employees", value: list.length },
          { label: "On probation", value: list.filter((p) => p.status === "probation").length },
          { label: "Confirmed", value: list.filter((p) => p.status === "active").length },
          { label: "Notice period", value: list.filter((p) => p.status === "notice").length },
        ],
      };
    }

    case "attendance":
    case "late": {
      const ids = await scopeIds(viewer, f);
      const list = await people(ids);
      const recs = ids.length
        ? await db.select().from(attendanceRecords).where(and(inArray(attendanceRecords.employeeId, ids), gte(attendanceRecords.workDate, f.from), lte(attendanceRecords.workDate, f.to))).orderBy(asc(attendanceRecords.workDate))
        : [];
      if (key === "late") {
        const late = recs.filter((r) => r.lateMinutes > 0);
        const byName = new Map(list.map((p) => [p.id, p]));
        const counts = new Map<string, number>();
        for (const r of late) counts.set(r.employeeId, (counts.get(r.employeeId) ?? 0) + 1);
        return {
          key,
          title: def.label,
          subtitle: period(f),
          columns: ["Date", "Employee code", "Name", "Department", "Minutes late", "Mode"],
          rows: late.map((r) => {
            const p = byName.get(r.employeeId)!;
            return [r.workDate, p.code, name(p), p.department ?? "—", r.lateMinutes, r.workMode];
          }),
          chart: [...counts].map(([id, value]) => ({ label: name(byName.get(id)!), value })).sort((a, b) => b.value - a.value).slice(0, 12),
          chartLabel: "Late arrivals per person",
          summary: [
            { label: "Late check-ins", value: late.length },
            { label: "People late at least once", value: counts.size },
            { label: "Average minutes late", value: late.length ? Math.round(late.reduce((s, r) => s + r.lateMinutes, 0) / late.length) : 0 },
          ],
        };
      }
      const schedule = await getDefaultSchedule();
      const holidays = await publicHolidaySet(f.from, f.to);
      const leaves = ids.length
        ? await db.select().from(leaveRequests).where(and(inArray(leaveRequests.employeeId, ids), eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, f.to), gte(leaveRequests.endDate, f.from)))
        : [];
      const rows = list.map((p) => {
        const mine = recs.filter((r) => r.employeeId === p.id);
        const byDate = new Set(mine.map((r) => r.workDate));
        let working = 0;
        let absent = 0;
        let leave = 0;
        const start = p.joiningDate > f.from ? p.joiningDate : f.from;
        const end = p.exitDate && p.exitDate < f.to ? p.exitDate : f.to;
        for (let d = start; d <= end; d = addDays(d, 1)) {
          if (!schedule.workingDays.includes(isoWeekday(d)) || holidays.has(d)) continue;
          working++;
          const l = leaves.find((x) => x.employeeId === p.id && x.startDate <= d && x.endDate >= d);
          if (l) leave += l.halfDay === "none" ? 1 : 0.5;
          else if (!byDate.has(d)) absent++;
        }
        const worked = mine.reduce((s, r) => s + r.workedMinutes, 0);
        return [p.code, name(p), p.department ?? "—", working, mine.filter((r) => r.status === "present").length, mine.filter((r) => r.status === "half_day").length, mine.filter((r) => r.lateMinutes > 0).length, leave, absent, formatMinutes(worked)];
      });
      const totalWorking = rows.reduce((s, r) => s + Number(r[3]), 0);
      const totalPresent = rows.reduce((s, r) => s + Number(r[4]) + Number(r[5]) * 0.5, 0);
      return {
        key,
        title: def.label,
        subtitle: period(f),
        columns: ["Employee code", "Name", "Department", "Working days", "Present", "Half days", "Late", "Leave", "No record", "Hours worked"],
        rows,
        chart: rows.map((r) => ({ label: String(r[1]), value: Number(r[3]) ? Math.round(((Number(r[4]) + Number(r[5]) * 0.5) / Number(r[3])) * 100) : 0 })),
        chartLabel: "Attendance rate % (present ÷ working days)",
        summary: [
          { label: "People", value: rows.length },
          { label: "Attendance rate", value: totalWorking ? `${Math.round((totalPresent / totalWorking) * 100)}%` : "—" },
          { label: "Late check-ins", value: rows.reduce((s, r) => s + Number(r[6]), 0) },
          { label: "Leave days", value: rows.reduce((s, r) => s + Number(r[7]), 0) },
        ],
      };
    }

    case "leave": {
      const ids = await scopeIds(viewer, f);
      const list = await people(ids);
      const rows = ids.length
        ? await db
            .select({ employeeId: leaveRequests.employeeId, type: leaveTypes.name, startDate: leaveRequests.startDate, endDate: leaveRequests.endDate, days: leaveRequests.days, halfDay: leaveRequests.halfDay })
            .from(leaveRequests)
            .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
            .where(and(inArray(leaveRequests.employeeId, ids), eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, f.to), gte(leaveRequests.endDate, f.from)))
            .orderBy(asc(leaveRequests.startDate))
        : [];
      const byName = new Map(list.map((p) => [p.id, p]));
      const byType = new Map<string, number>();
      for (const r of rows) byType.set(r.type, (byType.get(r.type) ?? 0) + Number(r.days));
      return {
        key,
        title: def.label,
        subtitle: period(f),
        columns: ["Employee code", "Name", "Department", "Type", "From", "To", "Days"],
        rows: rows.map((r) => {
          const p = byName.get(r.employeeId)!;
          return [p.code, name(p), p.department ?? "—", r.type, r.startDate, r.endDate, Number(r.days)];
        }),
        chart: [...byType].map(([label, value]) => ({ label, value })),
        chartLabel: "Approved days by type",
        summary: [
          { label: "Approved requests", value: rows.length },
          { label: "Days taken", value: rows.reduce((s, r) => s + Number(r.days), 0) },
          { label: "People on leave", value: new Set(rows.map((r) => r.employeeId)).size },
        ],
      };
    }

    case "movement": {
      const list = await people(await scopeIds(viewer, f));
      const joined = list.filter((p) => p.joiningDate >= f.from && p.joiningDate <= f.to);
      const left = list.filter((p) => p.exitDate && p.exitDate >= f.from && p.exitDate <= f.to);
      return {
        key,
        title: def.label,
        subtitle: period(f),
        columns: ["Movement", "Date", "Employee code", "Name", "Department", "Designation"],
        rows: [...joined.map((p) => ["Joined", p.joiningDate, p.code, name(p), p.department ?? "—", p.designation ?? "—"]), ...left.map((p) => ["Exited", p.exitDate!, p.code, name(p), p.department ?? "—", p.designation ?? "—"])].sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
        chart: [
          { label: "Joined", value: joined.length },
          { label: "Exited", value: left.length },
        ],
        chartLabel: "Joiners and exits",
        summary: [
          { label: "Joined", value: joined.length },
          { label: "Exited", value: left.length },
          { label: "Net change", value: joined.length - left.length },
        ],
      };
    }

    case "tasks": {
      const ids = await scopeIds(viewer, f);
      const list = await people(ids);
      const rows = ids.length
        ? await db
            .select({ assigneeId: tasks.assigneeId, status: tasks.status, dueDate: tasks.dueDate, completedAt: tasks.completedAt })
            .from(tasks)
            .where(and(inArray(tasks.assigneeId, ids), sql`${tasks.createdAt} <= ${addDays(f.to, 1)}`))
        : [];
      const out = list
        .map((p) => {
          const mine = rows.filter((r) => r.assigneeId === p.id);
          const done = mine.filter((r) => r.status === "completed" && r.completedAt && r.completedAt.toISOString().slice(0, 10) >= f.from && r.completedAt.toISOString().slice(0, 10) <= f.to).length;
          const open = mine.filter((r) => r.status !== "completed").length;
          const overdue = mine.filter((r) => r.status !== "completed" && r.dueDate && r.dueDate < f.to).length;
          return [p.code, name(p), p.department ?? "—", done, open, overdue];
        })
        .filter((r) => Number(r[3]) + Number(r[4]) > 0);
      return {
        key,
        title: def.label,
        subtitle: `Completed within ${period(f)}; open and overdue as of the end date`,
        columns: ["Employee code", "Name", "Department", "Completed", "Open", "Overdue"],
        rows: out,
        chart: out.map((r) => ({ label: String(r[1]), value: Number(r[3]) })),
        chartLabel: "Tasks completed in the period",
        summary: [
          { label: "Completed", value: out.reduce((s, r) => s + Number(r[3]), 0) },
          { label: "Open", value: out.reduce((s, r) => s + Number(r[4]), 0) },
          { label: "Overdue", value: out.reduce((s, r) => s + Number(r[5]), 0) },
        ],
      };
    }

    case "performance": {
      const ids = await scopeIds(viewer, f);
      const list = await people(ids);
      const rows = ids.length
        ? await db
            .select({ employeeId: performanceReviews.employeeId, cycle: reviewCycles.name, status: performanceReviews.status, self: performanceReviews.selfRating, manager: performanceReviews.managerRating })
            .from(performanceReviews)
            .innerJoin(reviewCycles, eq(reviewCycles.id, performanceReviews.cycleId))
            .where(and(inArray(performanceReviews.employeeId, ids), lte(reviewCycles.periodStart, f.to), gte(reviewCycles.periodEnd, f.from)))
        : [];
      const byName = new Map(list.map((p) => [p.id, p]));
      const done = rows.filter((r) => r.manager);
      const dist = [1, 2, 3, 4, 5].map((n) => ({ label: `${n} / 5`, value: done.filter((r) => r.manager === n).length }));
      return {
        key,
        title: def.label,
        subtitle: period(f),
        columns: ["Employee code", "Name", "Department", "Cycle", "Status", "Self rating", "Manager rating"],
        rows: rows.map((r) => {
          const p = byName.get(r.employeeId)!;
          return [p.code, name(p), p.department ?? "—", r.cycle, r.status.replace("_", " "), r.self ?? "—", r.manager ?? "—"];
        }),
        chart: dist,
        chartLabel: "Manager ratings",
        summary: [
          { label: "Reviews", value: rows.length },
          { label: "Completed", value: done.length },
          { label: "Average manager rating", value: done.length ? (done.reduce((s, r) => s + (r.manager ?? 0), 0) / done.length).toFixed(1) : "—" },
        ],
      };
    }

    case "payroll": {
      if (!can(viewer, "payroll.view")) throw new ForbiddenError();
      const runs = await db
        .select({ id: payrollRuns.id, year: payrollRuns.year, month: payrollRuns.month, status: payrollRuns.status, n: sql<number>`count(${payslips.id})::int`, gross: sql<string>`coalesce(sum(${payslips.grossEarnings}),0)`, ded: sql<string>`coalesce(sum(${payslips.totalDeductions}),0)`, net: sql<string>`coalesce(sum(${payslips.netPay}),0)` })
        .from(payrollRuns)
        .leftJoin(payslips, eq(payslips.runId, payrollRuns.id))
        .where(and(ne(payrollRuns.status, "draft"), sql`make_date(${payrollRuns.year}, ${payrollRuns.month}, 1) between date_trunc('month', ${f.from}::date) and ${f.to}::date`))
        .groupBy(payrollRuns.id)
        .orderBy(asc(payrollRuns.year), asc(payrollRuns.month));
      const label = (y: number, m: number) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
      return {
        key,
        title: def.label,
        subtitle: `${period(f)} · approved and paid runs`,
        columns: ["Month", "Status", "Payslips", "Gross", "Deductions", "Net pay"],
        rows: runs.map((r) => [label(r.year, r.month), r.status, r.n, Number(r.gross).toFixed(2), Number(r.ded).toFixed(2), Number(r.net).toFixed(2)]),
        chart: runs.map((r) => ({ label: label(r.year, r.month), value: Math.round(Number(r.net)) })),
        chartLabel: "Net pay per month (INR)",
        summary: [
          { label: "Runs", value: runs.length },
          { label: "Total net pay", value: `INR ${runs.reduce((s, r) => s + Number(r.net), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { label: "Total deductions", value: `INR ${runs.reduce((s, r) => s + Number(r.ded), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
        ],
      };
    }
  }
}
