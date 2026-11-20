import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/crm/db";
import { departments, designations, employees, leaveRequests, leaveTypes, payrollAdjustments, payrollRuns, payslips, salaryStructures, users } from "@/crm/db/schema";
import { can, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { addDays, endOfMonth, isoWeekday, type ISODate } from "@/crm/lib/time";
import { getCompany, getDefaultSchedule, publicHolidaySet } from "./company";
import { notify, userIdsWithPermission } from "./notifications";

/*
 * Payroll.
 *
 * - Salary structures are per employee and dated; the one in force on the
 *   last day of the month is used.
 * - A payslip's deductions come ONLY from (a) deductions HR/Finance
 *   configured on that employee's structure, (b) company-wide standard
 *   deductions configured in Settings → Payroll (none by default), and
 *   (c) one-off deduction adjustments approved by someone with
 *   payroll.approve. Nothing else is ever deducted.
 * - Loss-of-pay (approved unpaid leave) and part-month proration apply only
 *   when the company has enabled that policy (off by default).
 * - Runs are generated as drafts and must be approved (payroll.approve) —
 *   by someone other than whoever generated them, unless a Super Admin —
 *   before employees can see their payslips.
 * - Money is decimal strings in the database; arithmetic is done in paise
 *   (integers) here to avoid floating-point error.
 */

const toPaise = (v: string | number) => Math.round(Number(v) * 100);
const fromPaise = (p: number) => (p / 100).toFixed(2);

function requireView(viewer: Viewer) {
  if (!can(viewer, "payroll.view")) throw new ForbiddenError();
}
function requireManage(viewer: Viewer) {
  if (!can(viewer, "payroll.manage")) throw new ForbiddenError();
}

/* ----------------------------------------------------- salary structures */

export type Line = { label: string; amount: string };
export type StructureInput = { employeeId: string; effectiveFrom: ISODate; basic: string; hra: string; allowances: Line[]; deductions: Line[]; notes: string | null };

export async function addSalaryStructure(viewer: Viewer, input: StructureInput) {
  requireManage(viewer);
  if (viewer.employee?.id === input.employeeId && viewer.role.key !== "super_admin") throw new ForbiddenError("You can't set your own salary.");
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, input.employeeId), columns: { firstName: true, lastName: true } });
  if (!emp) throw new AppError("Employee not found.");
  const company = await getCompany();
  const [row] = await db
    .insert(salaryStructures)
    .values({ ...input, currency: company.currency, createdById: viewer.userId })
    .onConflictDoNothing()
    .returning();
  if (!row) throw new AppError("A structure already starts on that date. Pick another effective date.");
  // Record that it changed, not the figures.
  await audit({ actorUserId: viewer.userId, action: "payroll.structure", entityType: "salary_structure", entityId: row.id, summary: `Set salary structure for ${emp.firstName} ${emp.lastName} effective ${input.effectiveFrom}` });
}

export async function salaryHistory(viewer: Viewer, employeeId: string) {
  if (!can(viewer, "payroll.view") && viewer.employee?.id !== employeeId) throw new ForbiddenError();
  return db.select().from(salaryStructures).where(eq(salaryStructures.employeeId, employeeId)).orderBy(desc(salaryStructures.effectiveFrom));
}

/** Everyone with their structure in force today (payroll.view). */
export async function salaryOverview(viewer: Viewer) {
  requireView(viewer);
  const company = await getCompany();
  const today = new Date().toISOString().slice(0, 10);
  const people = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, code: employees.employeeCode, photoFileId: employees.photoFileId, department: departments.name, designation: designations.title })
    .from(employees)
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(designations, eq(designations.id, employees.designationId))
    .where(inArray(employees.employmentStatus, ["probation", "active", "notice"]))
    .orderBy(asc(employees.firstName));
  const structures = await db.select().from(salaryStructures).where(lte(salaryStructures.effectiveFrom, today)).orderBy(desc(salaryStructures.effectiveFrom));
  return {
    currency: company.currency,
    rows: people.map((p) => {
      const s = structures.find((x) => x.employeeId === p.id);
      const gross = s ? toPaise(s.basic) + toPaise(s.hra) + s.allowances.reduce((t, a) => t + toPaise(a.amount), 0) : null;
      const ded = s ? s.deductions.reduce((t, a) => t + toPaise(a.amount), 0) : null;
      return { ...p, structure: s ?? null, gross: gross === null ? null : fromPaise(gross), deductions: ded === null ? null : fromPaise(ded) };
    }),
  };
}

/* ------------------------------------------------------------ adjustments */

export async function addAdjustment(viewer: Viewer, input: { employeeId: string; year: number; month: number; type: "bonus" | "allowance" | "deduction"; label: string; amount: string }) {
  requireManage(viewer);
  if (viewer.employee?.id === input.employeeId && viewer.role.key !== "super_admin") throw new ForbiddenError("You can't add adjustments to your own pay.");
  const run = await db.query.payrollRuns.findFirst({ where: and(eq(payrollRuns.year, input.year), eq(payrollRuns.month, input.month)) });
  if (run && run.status !== "draft") throw new AppError("That month's payroll is already approved.");
  const [row] = await db.insert(payrollAdjustments).values({ ...input, createdById: viewer.userId }).returning();
  await audit({ actorUserId: viewer.userId, action: "payroll.adjustment_add", entityType: "payroll_adjustment", entityId: row!.id, summary: `Added a ${input.type} “${input.label}” for ${input.month}/${input.year} (needs approval)` });
  await notify((await userIdsWithPermission("payroll.approve")).filter((u) => u !== viewer.userId), { type: "payroll", title: `A payroll ${input.type} needs approval`, body: input.label, link: "/crm/payroll?tab=adjustments" });
}

export async function decideAdjustment(viewer: Viewer, id: string, approve: boolean) {
  if (!can(viewer, "payroll.approve")) throw new ForbiddenError();
  const adj = await db.query.payrollAdjustments.findFirst({ where: eq(payrollAdjustments.id, id) });
  if (!adj) throw new AppError("Adjustment not found.");
  if (adj.createdById === viewer.userId && viewer.role.key !== "super_admin") throw new ForbiddenError("Someone other than its creator must approve an adjustment.");
  if (viewer.employee?.id === adj.employeeId && viewer.role.key !== "super_admin") throw new ForbiddenError("You can't approve your own pay adjustment.");
  const [row] = await db
    .update(payrollAdjustments)
    .set({ status: approve ? "approved" : "rejected", approvedById: viewer.userId })
    .where(and(eq(payrollAdjustments.id, id), eq(payrollAdjustments.status, "pending")))
    .returning();
  if (!row) throw new AppError("This adjustment has already been decided.");
  await audit({ actorUserId: viewer.userId, action: approve ? "payroll.adjustment_approve" : "payroll.adjustment_reject", entityType: "payroll_adjustment", entityId: id, summary: `${approve ? "Approved" : "Rejected"} ${adj.type} “${adj.label}”` });
}

export async function listAdjustments(viewer: Viewer) {
  requireView(viewer);
  return db
    .select({ id: payrollAdjustments.id, employeeId: payrollAdjustments.employeeId, firstName: employees.firstName, lastName: employees.lastName, year: payrollAdjustments.year, month: payrollAdjustments.month, type: payrollAdjustments.type, label: payrollAdjustments.label, amount: payrollAdjustments.amount, status: payrollAdjustments.status, createdById: payrollAdjustments.createdById, creatorEmail: users.email, createdAt: payrollAdjustments.createdAt })
    .from(payrollAdjustments)
    .innerJoin(employees, eq(employees.id, payrollAdjustments.employeeId))
    .leftJoin(users, eq(users.id, payrollAdjustments.createdById))
    .orderBy(asc(payrollAdjustments.status), desc(payrollAdjustments.year), desc(payrollAdjustments.month), desc(payrollAdjustments.createdAt))
    .limit(200);
}

/* ------------------------------------------------------------------- runs */

export async function listRuns(viewer: Viewer) {
  requireView(viewer);
  const runs = await db.select().from(payrollRuns).orderBy(desc(payrollRuns.year), desc(payrollRuns.month));
  if (!runs.length) return [];
  const totals = await db
    .select({ runId: payslips.runId, n: sql<number>`count(*)::int`, gross: sql<string>`coalesce(sum(${payslips.grossEarnings}),0)`, net: sql<string>`coalesce(sum(${payslips.netPay}),0)` })
    .from(payslips)
    .where(inArray(payslips.runId, runs.map((r) => r.id)))
    .groupBy(payslips.runId);
  return runs.map((r) => ({ ...r, ...(totals.find((t) => t.runId === r.id) ?? { n: 0, gross: "0", net: "0" }) }));
}

export async function createRun(viewer: Viewer, year: number, month: number) {
  requireManage(viewer);
  const [row] = await db.insert(payrollRuns).values({ year, month, createdById: viewer.userId }).onConflictDoNothing().returning();
  if (!row) throw new AppError("A payroll run for that month already exists.");
  await audit({ actorUserId: viewer.userId, action: "payroll.run_create", entityType: "payroll_run", entityId: row.id, summary: `Created payroll run for ${month}/${year}` });
  return row;
}

/** Working days in a month for the default schedule, minus public holidays, within [from, to]. */
async function workingDaysIn(from: ISODate, to: ISODate) {
  const schedule = await getDefaultSchedule();
  const holidays = await publicHolidaySet(from, to);
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (schedule.workingDays.includes(isoWeekday(d)) && !holidays.has(d)) n++;
  return n;
}

/**
 * (Re)generates the payslips of a draft run from current structures and
 * approved adjustments. Employees without a salary structure are skipped
 * and reported.
 */
export async function generateRun(viewer: Viewer, runId: string) {
  requireManage(viewer);
  const run = await db.query.payrollRuns.findFirst({ where: eq(payrollRuns.id, runId) });
  if (!run) throw new AppError("Payroll run not found.");
  if (run.status !== "draft") throw new AppError("Only draft runs can be regenerated.");
  const company = await getCompany();
  const policy = company.payroll;
  const from = `${run.year}-${String(run.month).padStart(2, "0")}-01`;
  const to = endOfMonth(from);
  const monthDays = await workingDaysIn(from, to);

  const people = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, joiningDate: employees.joiningDate, exitDate: employees.exitDate })
    .from(employees)
    .where(and(lte(employees.joiningDate, to), sql`(${employees.exitDate} is null or ${employees.exitDate} >= ${from})`));
  const [structures, adjustments, unpaid] = await Promise.all([
    db.select().from(salaryStructures).where(lte(salaryStructures.effectiveFrom, to)).orderBy(desc(salaryStructures.effectiveFrom)),
    db.select().from(payrollAdjustments).where(and(eq(payrollAdjustments.year, run.year), eq(payrollAdjustments.month, run.month), eq(payrollAdjustments.status, "approved"))),
    policy.lossOfPayEnabled
      ? db
          .select({ employeeId: leaveRequests.employeeId, startDate: leaveRequests.startDate, endDate: leaveRequests.endDate, days: leaveRequests.days, halfDay: leaveRequests.halfDay })
          .from(leaveRequests)
          .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
          .where(and(eq(leaveRequests.status, "approved"), eq(leaveTypes.isPaid, false), lte(leaveRequests.startDate, to), gte(leaveRequests.endDate, from)))
      : Promise.resolve([]),
  ]);

  const skipped: string[] = [];
  const slips: (typeof payslips.$inferInsert)[] = [];
  for (const p of people) {
    const s = structures.find((x) => x.employeeId === p.id);
    if (!s) {
      skipped.push(`${p.firstName} ${p.lastName}`.trim());
      continue;
    }
    let factor = 1;
    let paidDays = monthDays;
    if (policy.lossOfPayEnabled) {
      const empFrom = p.joiningDate > from ? p.joiningDate : from;
      const empTo = p.exitDate && p.exitDate < to ? p.exitDate : to;
      const employedDays = await workingDaysIn(empFrom, empTo);
      let lop = 0;
      for (const l of unpaid.filter((u) => u.employeeId === p.id)) {
        if (l.halfDay !== "none") lop += 0.5;
        else lop += await workingDaysIn(l.startDate > empFrom ? l.startDate : empFrom, l.endDate < empTo ? l.endDate : empTo);
      }
      paidDays = Math.max(0, employedDays - lop);
      factor = monthDays ? paidDays / monthDays : 0;
    }
    const scaled = (v: string) => Math.round(toPaise(v) * factor);
    const earnings: Line[] = [
      { label: "Basic", amount: fromPaise(scaled(s.basic)) },
      ...(toPaise(s.hra) ? [{ label: "HRA", amount: fromPaise(scaled(s.hra)) }] : []),
      ...s.allowances.map((a) => ({ label: a.label, amount: fromPaise(scaled(a.amount)) })),
      ...adjustments.filter((a) => a.employeeId === p.id && a.type !== "deduction").map((a) => ({ label: a.label, amount: fromPaise(toPaise(a.amount)) })),
    ];
    const deductions: Line[] = [
      ...s.deductions.map((d) => ({ label: d.label, amount: fromPaise(toPaise(d.amount)) })),
      ...policy.standardDeductions.map((d) => ({ label: d.label, amount: fromPaise(Math.round((scaled(s.basic) * d.percentOfBasic) / 100)) })),
      ...adjustments.filter((a) => a.employeeId === p.id && a.type === "deduction").map((a) => ({ label: a.label, amount: fromPaise(toPaise(a.amount)) })),
    ];
    const gross = earnings.reduce((t, e) => t + toPaise(e.amount), 0);
    const ded = deductions.reduce((t, d) => t + toPaise(d.amount), 0);
    slips.push({
      runId,
      employeeId: p.id,
      currency: s.currency,
      workingDays: monthDays,
      paidDays: String(paidDays),
      earnings,
      deductions,
      grossEarnings: fromPaise(gross),
      totalDeductions: fromPaise(ded),
      netPay: fromPaise(Math.max(0, gross - ded)),
    });
  }

  await db.transaction(async (tx) => {
    await tx.delete(payslips).where(eq(payslips.runId, runId));
    if (slips.length) await tx.insert(payslips).values(slips);
    await tx.update(payrollRuns).set({ createdById: viewer.userId }).where(eq(payrollRuns.id, runId));
    await audit({ actorUserId: viewer.userId, action: "payroll.run_generate", entityType: "payroll_run", entityId: runId, summary: `Generated ${slips.length} payslips for ${run.month}/${run.year}`, metadata: { skipped: skipped.length } }, tx);
  });
  return { generated: slips.length, skipped };
}

export async function approveRun(viewer: Viewer, runId: string) {
  if (!can(viewer, "payroll.approve")) throw new ForbiddenError();
  const run = await db.query.payrollRuns.findFirst({ where: eq(payrollRuns.id, runId) });
  if (!run) throw new AppError("Payroll run not found.");
  if (run.createdById === viewer.userId && viewer.role.key !== "super_admin") throw new ForbiddenError("Someone other than whoever generated the run must approve it.");
  const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(payslips).where(eq(payslips.runId, runId));
  if (!n) throw new AppError("Generate the payslips before approving.");
  const [row] = await db.update(payrollRuns).set({ status: "approved", approvedById: viewer.userId, approvedAt: new Date() }).where(and(eq(payrollRuns.id, runId), eq(payrollRuns.status, "draft"))).returning();
  if (!row) throw new AppError("Only draft runs can be approved.");
  await audit({ actorUserId: viewer.userId, action: "payroll.run_approve", entityType: "payroll_run", entityId: runId, summary: `Approved payroll for ${run.month}/${run.year} (${n} payslips)` });
  const recipients = await db
    .select({ userId: employees.userId })
    .from(payslips)
    .innerJoin(employees, eq(employees.id, payslips.employeeId))
    .where(eq(payslips.runId, runId));
  const label = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(run.year, run.month - 1, 1)));
  await notify(recipients.map((r) => r.userId), { type: "payslip", title: `Your payslip for ${label} is ready`, link: "/crm/payroll" });
}

export async function markRunPaid(viewer: Viewer, runId: string) {
  if (!can(viewer, "payroll.approve")) throw new ForbiddenError();
  const [row] = await db.update(payrollRuns).set({ status: "paid", paidAt: new Date() }).where(and(eq(payrollRuns.id, runId), eq(payrollRuns.status, "approved"))).returning();
  if (!row) throw new AppError("Only approved runs can be marked paid.");
  await audit({ actorUserId: viewer.userId, action: "payroll.run_paid", entityType: "payroll_run", entityId: runId, summary: `Marked payroll for ${row.month}/${row.year} as paid` });
}

export async function getRun(viewer: Viewer, runId: string) {
  requireView(viewer);
  const run = await db.query.payrollRuns.findFirst({ where: eq(payrollRuns.id, runId) });
  if (!run) return null;
  const slips = await db
    .select({ id: payslips.id, employeeId: payslips.employeeId, firstName: employees.firstName, lastName: employees.lastName, code: employees.employeeCode, photoFileId: employees.photoFileId, paidDays: payslips.paidDays, workingDays: payslips.workingDays, gross: payslips.grossEarnings, deductions: payslips.totalDeductions, net: payslips.netPay })
    .from(payslips)
    .innerJoin(employees, eq(employees.id, payslips.employeeId))
    .where(eq(payslips.runId, runId))
    .orderBy(asc(employees.firstName));
  const [creator, approver] = await Promise.all([
    run.createdById ? db.query.users.findFirst({ where: eq(users.id, run.createdById), columns: { email: true } }) : null,
    run.approvedById ? db.query.users.findFirst({ where: eq(users.id, run.approvedById), columns: { email: true } }) : null,
  ]);
  return { run, slips, creatorEmail: creator?.email ?? null, approverEmail: approver?.email ?? null };
}

/* ---------------------------------------------------------------- payslips */

/** The viewer's own payslips from approved or paid runs. */
export async function myPayslips(viewer: Viewer) {
  if (!viewer.employee) return [];
  return db
    .select({ id: payslips.id, year: payrollRuns.year, month: payrollRuns.month, status: payrollRuns.status, gross: payslips.grossEarnings, deductions: payslips.totalDeductions, net: payslips.netPay, currency: payslips.currency })
    .from(payslips)
    .innerJoin(payrollRuns, eq(payrollRuns.id, payslips.runId))
    .where(and(eq(payslips.employeeId, viewer.employee.id), inArray(payrollRuns.status, ["approved", "paid"])))
    .orderBy(desc(payrollRuns.year), desc(payrollRuns.month));
}

/** A payslip with everything needed for the PDF, if the viewer may see it. */
export async function getPayslipForViewer(viewer: Viewer, id: string) {
  const [row] = await db
    .select({ slip: payslips, run: payrollRuns, firstName: employees.firstName, lastName: employees.lastName, code: employees.employeeCode, joiningDate: employees.joiningDate, department: departments.name, designation: designations.title })
    .from(payslips)
    .innerJoin(payrollRuns, eq(payrollRuns.id, payslips.runId))
    .innerJoin(employees, eq(employees.id, payslips.employeeId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(designations, eq(designations.id, employees.designationId))
    .where(eq(payslips.id, id));
  if (!row) return null;
  const own = viewer.employee?.id === row.slip.employeeId && row.run.status !== "draft";
  if (!own && !can(viewer, "payroll.view")) return null;
  return row;
}
