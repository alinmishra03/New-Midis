import "server-only";
import { and, asc, count, desc, eq, gte, ilike, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/crm/db";
import { auditLogs, companySettings, departments, designations, employees, leaveTypes, permissions, rolePermissions, roles, users, workSchedules } from "@/crm/db/schema";
import { can, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { ALL_PERMISSIONS, LOCKED_ROLE, PERMISSIONS, type Permission } from "@/crm/auth/permissions";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";

/*
 * Administration: company profile, departments, designations, work
 * schedules (attendance rules), leave policy, payroll policy, notification
 * settings (settings.manage); roles and permissions (roles.manage); audit
 * log (audit.view). Every change is audit-logged.
 */

function requireSettings(viewer: Viewer) {
  if (!can(viewer, "settings.manage")) throw new ForbiddenError();
}

/* ---------------------------------------------------------------- company */

export type CompanyInput = { name: string; legalName: string | null; timezone: string; currency: string; address: string | null; phone: string | null; email: string | null; website: string | null; employeeCodePrefix: string; leaveYearStartMonth: number };

export async function updateCompany(viewer: Viewer, input: CompanyInput) {
  requireSettings(viewer);
  try {
    new Intl.DateTimeFormat("en", { timeZone: input.timezone });
  } catch {
    throw new AppError("That isn't a valid timezone (use an IANA name like Asia/Kolkata).");
  }
  await db.update(companySettings).set(input).where(eq(companySettings.id, 1));
  await audit({ actorUserId: viewer.userId, action: "settings.company", entityType: "settings", entityId: "company", summary: "Updated company information", metadata: { fields: Object.keys(input) } });
}

export async function updatePayrollPolicy(viewer: Viewer, input: { lossOfPayEnabled: boolean; payDay: number; standardDeductions: { label: string; percentOfBasic: number }[] }) {
  requireSettings(viewer);
  if (!can(viewer, "payroll.approve")) throw new ForbiddenError("Payroll policy changes need payroll approval rights (Finance or Super Admin).");
  await db.update(companySettings).set({ payroll: input }).where(eq(companySettings.id, 1));
  await audit({ actorUserId: viewer.userId, action: "settings.payroll", entityType: "settings", entityId: "payroll", summary: `Updated payroll policy (loss-of-pay ${input.lossOfPayEnabled ? "on" : "off"}, ${input.standardDeductions.length} standard deduction(s))`, metadata: input });
}

export async function updateNotificationSettings(viewer: Viewer, input: { meetingReminderMinutes: number; taskDueReminderDays: number; birthdayAnnouncements: boolean }) {
  requireSettings(viewer);
  await db.update(companySettings).set({ notifications: input }).where(eq(companySettings.id, 1));
  await audit({ actorUserId: viewer.userId, action: "settings.notifications", entityType: "settings", entityId: "notifications", summary: "Updated notification settings", metadata: input });
}

/* ----------------------------------------------------------- departments */

export async function listDepartments() {
  const rows = await db.select().from(departments).orderBy(asc(departments.name));
  const counts = await db.select({ id: employees.departmentId, n: count() }).from(employees).where(ne(employees.employmentStatus, "exited")).groupBy(employees.departmentId);
  return rows.map((d) => ({ ...d, employees: counts.find((c) => c.id === d.id)?.n ?? 0 }));
}

export async function saveDepartment(viewer: Viewer, id: string | null, input: { name: string; code: string; description: string | null; isActive: boolean }) {
  requireSettings(viewer);
  const clash = await db.query.departments.findFirst({ where: and(or(eq(departments.name, input.name), eq(departments.code, input.code)), id ? ne(departments.id, id) : undefined) });
  if (clash) throw new AppError("A department with that name or code already exists.");
  if (id) await db.update(departments).set(input).where(eq(departments.id, id));
  else await db.insert(departments).values(input);
  await audit({ actorUserId: viewer.userId, action: id ? "settings.department_update" : "settings.department_create", entityType: "department", entityId: id, summary: `${id ? "Updated" : "Created"} department ${input.name}` });
}

/* ----------------------------------------------------------- designations */

export async function listDesignations() {
  return db
    .select({ id: designations.id, title: designations.title, level: designations.level, isActive: designations.isActive, departmentId: designations.departmentId, department: departments.name })
    .from(designations)
    .leftJoin(departments, eq(departments.id, designations.departmentId))
    .orderBy(asc(departments.name), asc(designations.title));
}

export async function saveDesignation(viewer: Viewer, id: string | null, input: { title: string; departmentId: string | null; level: number; isActive: boolean }) {
  requireSettings(viewer);
  try {
    if (id) await db.update(designations).set(input).where(eq(designations.id, id));
    else await db.insert(designations).values(input);
  } catch {
    throw new AppError("That designation already exists in that department.");
  }
  await audit({ actorUserId: viewer.userId, action: id ? "settings.designation_update" : "settings.designation_create", entityType: "designation", entityId: id, summary: `${id ? "Updated" : "Created"} designation ${input.title}` });
}

/* ------------------------------------------------------- work schedules */

export type ScheduleInput = { name: string; startTime: string; endTime: string; workingDays: number[]; lateGraceMinutes: number; earlyLeaveGraceMinutes: number; fullDayMinutes: number; halfDayMinutes: number; breakAllowanceMinutes: number; allowUnplannedRemote: boolean; isDefault: boolean };

export function listSchedules() {
  return db.select().from(workSchedules).orderBy(desc(workSchedules.isDefault), asc(workSchedules.name));
}

export async function saveSchedule(viewer: Viewer, id: string | null, input: ScheduleInput) {
  requireSettings(viewer);
  if (input.halfDayMinutes > input.fullDayMinutes) throw new AppError("The half-day threshold can't exceed the full-day threshold.");
  if (!input.workingDays.length) throw new AppError("Choose at least one working day.");
  await db.transaction(async (tx) => {
    if (input.isDefault) await tx.update(workSchedules).set({ isDefault: false }).where(id ? ne(workSchedules.id, id) : undefined);
    if (id) {
      const current = await tx.query.workSchedules.findFirst({ where: eq(workSchedules.id, id) });
      if (current?.isDefault && !input.isDefault) throw new AppError("Make another schedule the default first.");
      await tx.update(workSchedules).set(input).where(eq(workSchedules.id, id));
    } else {
      await tx.insert(workSchedules).values(input);
    }
    await audit({ actorUserId: viewer.userId, action: "settings.schedule", entityType: "work_schedule", entityId: id, summary: `${id ? "Updated" : "Created"} work schedule ${input.name} (${input.startTime}–${input.endTime})`, metadata: input }, tx);
  });
}

/* ---------------------------------------------------------- leave policy */

export function listLeaveTypes() {
  return db.select().from(leaveTypes).orderBy(asc(leaveTypes.sortOrder));
}

export type LeaveTypeInput = { code: string; name: string; description: string | null; annualQuota: string | null; isPaid: boolean; allowHalfDay: boolean; documentRequiredAfterDays: number | null; maxCarryForward: string; color: string; isActive: boolean; sortOrder: number };

export async function saveLeaveType(viewer: Viewer, id: string | null, input: LeaveTypeInput) {
  requireSettings(viewer);
  const clash = await db.query.leaveTypes.findFirst({ where: and(eq(leaveTypes.code, input.code), id ? ne(leaveTypes.id, id) : undefined) });
  if (clash) throw new AppError("That code is already used.");
  if (id) await db.update(leaveTypes).set(input).where(eq(leaveTypes.id, id));
  else await db.insert(leaveTypes).values(input);
  await audit({ actorUserId: viewer.userId, action: "settings.leave_type", entityType: "leave_type", entityId: id, summary: `${id ? "Updated" : "Created"} leave type ${input.name} (${input.annualQuota ?? "unlimited"} days/year)`, metadata: input });
}

/* --------------------------------------------------------------- roles */

export async function listRolesWithPermissions() {
  const [rs, rp, us] = await Promise.all([
    db.select().from(roles).orderBy(asc(roles.name)),
    db.select().from(rolePermissions),
    db.select({ roleId: users.roleId, n: count() }).from(users).where(ne(users.status, "disabled")).groupBy(users.roleId),
  ]);
  return rs.map((r) => ({ ...r, users: us.find((u) => u.roleId === r.id)?.n ?? 0, permissions: new Set(r.key === LOCKED_ROLE ? ALL_PERMISSIONS : rp.filter((x) => x.roleId === r.id).map((x) => x.permissionKey)) }));
}

export async function setRolePermissions(viewer: Viewer, roleId: string, keys: string[]) {
  if (!can(viewer, "roles.manage")) throw new ForbiddenError();
  const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) });
  if (!role) throw new AppError("Role not found.");
  if (role.key === LOCKED_ROLE) throw new AppError("The Super Admin role always has every permission.");
  const valid = keys.filter((k): k is Permission => k in PERMISSIONS);
  const before = (await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId))).map((r) => r.permissionKey);
  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (valid.length) await tx.insert(rolePermissions).values(valid.map((permissionKey) => ({ roleId, permissionKey })));
    await audit(
      {
        actorUserId: viewer.userId,
        action: "roles.permissions",
        entityType: "role",
        entityId: roleId,
        summary: `Changed ${role.name} permissions`,
        metadata: { added: valid.filter((k) => !before.includes(k)), removed: before.filter((k) => !valid.includes(k as Permission)) },
      },
      tx,
    );
  });
}

export async function createRole(viewer: Viewer, input: { name: string; description: string | null }) {
  if (!can(viewer, "roles.manage")) throw new ForbiddenError();
  const key = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  if (!key) throw new AppError("Give the role a name.");
  const clash = await db.query.roles.findFirst({ where: eq(roles.key, key) });
  if (clash) throw new AppError("A role with that name already exists.");
  const [row] = await db.insert(roles).values({ key, name: input.name, description: input.description, isSystem: false }).returning();
  await audit({ actorUserId: viewer.userId, action: "roles.create", entityType: "role", entityId: row!.id, summary: `Created role ${input.name}` });
  return row!;
}

export async function permissionCatalogue() {
  return db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.key));
}

/* ----------------------------------------------------------------- audit */

export async function listAudit(viewer: Viewer, f: { q?: string; action?: string; from?: string; to?: string; page: number }) {
  if (!can(viewer, "audit.view")) throw new ForbiddenError();
  const conds: SQL[] = [];
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(auditLogs.summary, like), ilike(users.email, like))!);
  }
  if (f.action) conds.push(ilike(auditLogs.action, `${f.action.replace(/[%_\\]/g, "")}%`));
  if (f.from) conds.push(gte(auditLogs.createdAt, new Date(`${f.from}T00:00:00Z`)));
  if (f.to) conds.push(lte(auditLogs.createdAt, new Date(`${f.to}T23:59:59Z`)));
  const where = conds.length ? and(...conds) : undefined;
  const PAGE = 50;
  const [rows, [total]] = await Promise.all([
    db
      .select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, summary: auditLogs.summary, metadata: auditLogs.metadata, ipAddress: auditLogs.ipAddress, createdAt: auditLogs.createdAt, actorEmail: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(where)
      .orderBy(desc(auditLogs.id))
      .limit(PAGE)
      .offset((f.page - 1) * PAGE),
    db.select({ n: sql<number>`count(*)::int` }).from(auditLogs).leftJoin(users, eq(users.id, auditLogs.actorUserId)).where(where),
  ]);
  return { rows, total: total?.n ?? 0, pageSize: PAGE };
}
