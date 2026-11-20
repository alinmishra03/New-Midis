import "server-only";
import { and, eq, isNotNull, like, sql } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
export { getCompany } from "./company";
import { companySettings, employees, leaveBalances, leaveTypes, roles, users } from "@/crm/db/schema";
import { issueToken } from "@/crm/auth/tokens";
import { audit } from "@/crm/lib/audit";
import { todayIn, type ISODate } from "@/crm/lib/time";

/** The leave year (named by the calendar year it starts in) that contains `date`. */
export function leaveYearFor(date: ISODate, startMonth: number): number {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return m >= startMonth ? y : y - 1;
}

async function nextEmployeeCode(tx: Tx, prefix: string): Promise<string> {
  const rows = await tx
    .select({ code: employees.employeeCode })
    .from(employees)
    .where(like(employees.employeeCode, `${prefix}-%`));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.code.split("-").pop()) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

/** Creates this leave year's balance rows for an employee (idempotent). */
export async function ensureLeaveBalances(tx: Tx, employeeId: string, year: number) {
  const types = await tx.select().from(leaveTypes).where(and(eq(leaveTypes.isActive, true), isNotNull(leaveTypes.annualQuota)));
  for (const t of types) {
    await tx
      .insert(leaveBalances)
      .values({ employeeId, leaveTypeId: t.id, year, allocated: t.annualQuota! })
      .onConflictDoNothing();
  }
}

export type NewEmployeeInput = {
  email: string;
  firstName: string;
  lastName: string;
  roleKey: string;
  joiningDate?: ISODate;
  departmentId?: string | null;
  designationId?: string | null;
  managerId?: string | null;
  workScheduleId?: string | null;
  employmentType?: "full_time" | "part_time" | "contract" | "intern";
  employmentStatus?: "probation" | "active";
  phone?: string | null;
  workLocation?: string | null;
};

export class AccountError extends Error {}

/**
 * Creates an employee record and its (invited) user account in one
 * transaction, sets up leave balances, writes the audit log, and returns a
 * one-time activation link token. No password is ever chosen for the
 * employee: they set their own through the link.
 */
export async function createEmployeeWithAccount(input: NewEmployeeInput, actorUserId: string | null, tx?: Tx) {
  const run = async (t: Tx) => {
    const email = input.email.trim().toLowerCase();
    const company = (await t.query.companySettings.findFirst({ where: eq(companySettings.id, 1) }))!;
    const role = await t.query.roles.findFirst({ where: eq(roles.key, input.roleKey) });
    if (!role) throw new AccountError(`Unknown role "${input.roleKey}".`);

    const clash = await t
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.email, email));
    const clashEmp = await t.select({ id: employees.id }).from(employees).where(eq(employees.officialEmail, email));
    if ((clash[0]?.n ?? 0) > 0 || clashEmp.length) throw new AccountError("An account with this email already exists.");

    const [user] = await t.insert(users).values({ email, roleId: role.id, status: "invited" }).returning({ id: users.id });
    const joiningDate = input.joiningDate ?? todayIn(company.timezone);
    const [employee] = await t
      .insert(employees)
      .values({
        userId: user!.id,
        employeeCode: await nextEmployeeCode(t, company.employeeCodePrefix),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        officialEmail: email,
        phone: input.phone ?? null,
        joiningDate,
        departmentId: input.departmentId ?? null,
        designationId: input.designationId ?? null,
        managerId: input.managerId ?? null,
        workScheduleId: input.workScheduleId ?? null,
        employmentType: input.employmentType ?? "full_time",
        employmentStatus: input.employmentStatus ?? "probation",
        workLocation: input.workLocation ?? null,
      })
      .returning({ id: employees.id, employeeCode: employees.employeeCode });

    await ensureLeaveBalances(t, employee!.id, leaveYearFor(joiningDate, company.leaveYearStartMonth));
    const invite = await issueToken(user!.id, "invite", actorUserId, t);
    await audit(
      {
        actorUserId,
        action: "employee.create",
        entityType: "employee",
        entityId: employee!.id,
        summary: `Created ${input.firstName} ${input.lastName} (${employee!.employeeCode}) with role ${role.name}`,
        metadata: { role: role.key, email },
      },
      t,
    );
    return { userId: user!.id, employeeId: employee!.id, employeeCode: employee!.employeeCode, invite };
  };
  return tx ? run(tx) : db.transaction(run);
}
