import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/crm/db";
import { authTokens, departments, designations, employees, roles, salaryStructures, users, workSchedules } from "@/crm/db/schema";
import { can, ForbiddenError, isInTeam, type Viewer } from "@/crm/auth/dal";
import { deleteAllSessionsForUser } from "@/crm/auth/session";
import { AppError, ValidationError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { isUuid } from "@/crm/lib/params";
import { IMAGE_TYPES, storeUpload, type UploadInput } from "@/crm/lib/storage";
import { shiftLabel, todayIn } from "@/crm/lib/time";
import { getCompany, getDefaultSchedule } from "./company";
import { notify } from "./notifications";

/* =============================================================== listing */

export const ACTIVE_STATUSES = ["probation", "active", "notice"] as const;

export type DirectoryFilters = { q?: string; department?: string; role?: string; status?: string; page?: number; sort?: string };
export const PAGE_SIZE = 25;

/**
 * The company directory. Every employee can browse active colleagues' work
 * details (name, designation, department, work email, manager). Former
 * employees and role filters are for people who can view all records.
 */
export async function listEmployees(viewer: Viewer, f: DirectoryFilters) {
  const seeAll = can(viewer, "employees.view_all");
  const conds: SQL[] = [];
  // Unknown status / malformed department values from the address bar are ignored, not sent to the database.
  const status = f.status === "all" || (employees.employmentStatus.enumValues as readonly string[]).includes(f.status ?? "") ? f.status! : "current";
  if (!seeAll || status === "current") conds.push(inArray(employees.employmentStatus, [...ACTIVE_STATUSES]));
  else if (status !== "all") conds.push(eq(employees.employmentStatus, status as (typeof employees.employmentStatus.enumValues)[number]));
  if (isUuid(f.department)) conds.push(eq(employees.departmentId, f.department));
  if (f.role && seeAll) conds.push(eq(roles.key, f.role));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(
      or(
        ilike(sql`${employees.firstName} || ' ' || ${employees.lastName}`, like),
        ilike(employees.officialEmail, like),
        ilike(employees.employeeCode, like),
        ilike(designations.title, like),
      )!,
    );
  }
  const where = conds.length ? and(...conds) : undefined;
  const page = Math.max(1, f.page ?? 1);

  const manager = db
    .select({ id: employees.id, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as("manager_name") })
    .from(employees)
    .as("mgr");

  const base = db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      firstName: employees.firstName,
      lastName: employees.lastName,
      officialEmail: employees.officialEmail,
      photoFileId: employees.photoFileId,
      employmentStatus: employees.employmentStatus,
      employmentType: employees.employmentType,
      joiningDate: employees.joiningDate,
      department: departments.name,
      designation: designations.title,
      managerName: manager.name,
      role: roles.name,
      roleKey: roles.key,
      userStatus: users.status,
    })
    .from(employees)
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(designations, eq(designations.id, employees.designationId))
    .leftJoin(manager, eq(manager.id, employees.managerId))
    .leftJoin(users, eq(users.id, employees.userId))
    .leftJoin(roles, eq(roles.id, users.roleId))
    .where(where);

  const [rows, [total]] = await Promise.all([
    base
      .orderBy(f.sort === "joined" ? desc(employees.joiningDate) : asc(employees.firstName), asc(employees.lastName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(employees)
      .leftJoin(designations, eq(designations.id, employees.designationId))
      .leftJoin(users, eq(users.id, employees.userId))
      .leftJoin(roles, eq(roles.id, users.roleId))
      .where(where),
  ]);
  return { rows, total: total?.n ?? 0, page };
}

/** Rows for CSV export (HR / view_all only). */
export async function exportEmployees(viewer: Viewer, f: DirectoryFilters) {
  if (!can(viewer, "employees.view_all")) throw new ForbiddenError();
  const out: Awaited<ReturnType<typeof listEmployees>>["rows"] = [];
  for (let page = 1; ; page++) {
    const r = await listEmployees(viewer, { ...f, page });
    out.push(...r.rows);
    if (out.length >= r.total || !r.rows.length) break;
  }
  return out;
}

/* ================================================================ detail */

export type ProfileAccess = {
  isSelf: boolean;
  /** Employment details, history tabs. */
  full: boolean;
  personal: boolean;
  salary: boolean;
  manage: boolean;
  attendance: boolean;
  leave: boolean;
};

export async function profileAccess(viewer: Viewer, employeeId: string): Promise<ProfileAccess> {
  const isSelf = viewer.employee?.id === employeeId;
  const team = !isSelf && (await isInTeam(viewer, employeeId));
  return {
    isSelf,
    full: isSelf || can(viewer, "employees.view_all") || (team && can(viewer, "employees.view_team")),
    personal: isSelf || can(viewer, "employees.view_personal"),
    salary: isSelf || can(viewer, "payroll.view"),
    manage: await canManageEmployee(viewer, employeeId),
    attendance: isSelf || can(viewer, "attendance.view_all") || (team && can(viewer, "attendance.view_team")),
    leave: isSelf || can(viewer, "leave.manage") || (team && can(viewer, "leave.approve_team")),
  };
}

/**
 * One employee's profile as a DTO: personal and salary fields are only
 * selected when the viewer may see them, so they never reach the page
 * otherwise. Returns null when the viewer may not see the person at all
 * (former employees are visible only with view_all).
 */
export async function getEmployeeProfile(viewer: Viewer, employeeId: string) {
  if (!z.uuid().safeParse(employeeId).success) return null;
  const access = await profileAccess(viewer, employeeId);
  const row = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
  if (!row) return null;
  if (row.employmentStatus === "exited" && !can(viewer, "employees.view_all") && !access.isSelf) return null;

  const [dept, desig, mgr, user, schedule] = await Promise.all([
    row.departmentId ? db.query.departments.findFirst({ where: eq(departments.id, row.departmentId) }) : null,
    row.designationId ? db.query.designations.findFirst({ where: eq(designations.id, row.designationId) }) : null,
    row.managerId ? db.query.employees.findFirst({ where: eq(employees.id, row.managerId), columns: { id: true, firstName: true, lastName: true, photoFileId: true } }) : null,
    row.userId ? db.query.users.findFirst({ where: eq(users.id, row.userId), columns: { id: true, status: true, roleId: true, lastLoginAt: true } }) : null,
    row.workScheduleId ? db.query.workSchedules.findFirst({ where: eq(workSchedules.id, row.workScheduleId) }) : null,
  ]);
  const role = user ? await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) }) : null;
  const reports = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId })
    .from(employees)
    .where(and(eq(employees.managerId, employeeId), inArray(employees.employmentStatus, [...ACTIVE_STATUSES])));

  const salary = access.salary
    ? await db.select().from(salaryStructures).where(eq(salaryStructures.employeeId, employeeId)).orderBy(desc(salaryStructures.effectiveFrom))
    : null;

  return {
    access,
    basic: {
      id: row.id,
      employeeCode: row.employeeCode,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: `${row.firstName} ${row.lastName}`.trim(),
      officialEmail: row.officialEmail,
      phone: row.phone,
      photoFileId: row.photoFileId,
      department: dept ? { id: dept.id, name: dept.name } : null,
      designation: desig ? { id: desig.id, title: desig.title } : null,
      manager: mgr ? { id: mgr.id, name: `${mgr.firstName} ${mgr.lastName}`.trim(), photoFileId: mgr.photoFileId } : null,
      employmentStatus: row.employmentStatus,
      skills: row.skills,
      bio: row.bio,
      workLocation: row.workLocation,
      reports: reports.map((r) => ({ id: r.id, name: `${r.firstName} ${r.lastName}`.trim(), photoFileId: r.photoFileId })),
    },
    employment: access.full
      ? {
          joiningDate: row.joiningDate,
          exitDate: row.exitDate,
          employmentType: row.employmentType,
          schedule: schedule ? shiftLabel(schedule) : `${shiftLabel(await getDefaultSchedule())} · company default`,
          workScheduleId: row.workScheduleId,
          account: user ? { status: user.status, role: role?.name ?? "—", roleKey: role?.key ?? "", lastLoginAt: user.lastLoginAt, userId: user.id } : null,
        }
      : null,
    personal: access.personal
      ? {
          dateOfBirth: row.dateOfBirth,
          gender: row.gender,
          maritalStatus: row.maritalStatus,
          personalEmail: row.personalEmail,
          addressLine: row.addressLine,
          city: row.city,
          state: row.state,
          postalCode: row.postalCode,
          country: row.country,
          emergencyContactName: row.emergencyContactName,
          emergencyContactRelation: row.emergencyContactRelation,
          emergencyContactPhone: row.emergencyContactPhone,
        }
      : null,
    salary,
  };
}

/* ============================================================ mutations */

const optional = (max = 200) => z.string().trim().max(max).optional().transform((v) => v || null);
const optionalId = z.uuid().optional().transform((v) => v || null);
const optionalDate = z.iso.date().optional().transform((v) => v || null);

export const employeeSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  phone: optional(30),
  departmentId: optionalId,
  designationId: optionalId,
  managerId: optionalId,
  workScheduleId: optionalId,
  joiningDate: z.iso.date({ error: "Enter the joining date." }),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  employmentStatus: z.enum(["probation", "active", "notice"]),
  workLocation: optional(120),
  skills: z.string().max(500).optional().transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30) : [])),
  bio: optional(1000),
});

export const personalSchema = z.object({
  phone: optional(30),
  personalEmail: z.union([z.literal(""), z.email("Enter a valid email.")]).optional().transform((v) => v || null),
  dateOfBirth: optionalDate,
  gender: optional(40),
  maritalStatus: optional(40),
  addressLine: optional(300),
  city: optional(80),
  state: optional(80),
  postalCode: optional(20),
  country: optional(80),
  emergencyContactName: optional(120),
  emergencyContactRelation: optional(60),
  emergencyContactPhone: optional(30),
  skills: z.string().max(500).optional().transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30) : [])),
  bio: optional(1000),
});

/** Roles HR may assign without roles.manage. Elevated roles need a Super Admin. */
const ORDINARY_ROLES = ["employee", "manager"];

export function assertCanAssignRole(viewer: Viewer, roleKey: string) {
  if (!ORDINARY_ROLES.includes(roleKey) && !can(viewer, "roles.manage")) {
    throw new ForbiddenError("Only a Super Admin can give someone an HR, Finance or Super Admin role.");
  }
}

/**
 * Who may change an employee's record (employment details, personal details
 * on their behalf, photo):
 * - needs employees.manage;
 * - a Super Admin may change any record, including their own;
 * - otherwise not your own employment record (ask a colleague), and HR, Finance
 *   or Super Admin records need roles.manage, the same rule as deactivating.
 * Used both to enforce (assertCanManageEmployee) and to show the controls (profileAccess).
 */
async function manageBlocker(viewer: Viewer, employeeId: string): Promise<string | null> {
  if (!can(viewer, "employees.manage")) return "You don't have permission to do that.";
  if (viewer.role.key === "super_admin") return null;
  if (viewer.employee?.id === employeeId) return "Ask another HR colleague or a Super Admin to change your own employment record.";
  if (can(viewer, "roles.manage")) return null;
  const [target] = await db
    .select({ roleKey: roles.key })
    .from(employees)
    .innerJoin(users, eq(users.id, employees.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(eq(employees.id, employeeId))
    .limit(1);
  if (target && !ORDINARY_ROLES.includes(target.roleKey)) return "Only a Super Admin can change the record of an HR, Finance or Super Admin account.";
  return null;
}

export async function canManageEmployee(viewer: Viewer, employeeId: string) {
  return (await manageBlocker(viewer, employeeId)) === null;
}

async function assertCanManageEmployee(viewer: Viewer, employeeId: string) {
  const blocked = await manageBlocker(viewer, employeeId);
  if (blocked) throw new ForbiddenError(blocked);
}

async function assertValidManager(employeeId: string | null, managerId: string | null) {
  if (!managerId) return;
  if (employeeId && managerId === employeeId) throw new AppError("Someone can't report to themselves.");
  const mgr = await db.query.employees.findFirst({ where: eq(employees.id, managerId), columns: { id: true, managerId: true, employmentStatus: true } });
  if (!mgr || mgr.employmentStatus === "exited") throw new AppError("Choose a current employee as the reporting manager.");
  // Walk up from the new manager: reaching the employee would create a loop.
  let cursor: string | null = mgr.managerId;
  const seen = new Set<string>();
  while (cursor && employeeId && !seen.has(cursor)) {
    if (cursor === employeeId) throw new AppError("That would create a reporting loop.");
    seen.add(cursor);
    const next = await db.query.employees.findFirst({ where: eq(employees.id, cursor), columns: { managerId: true } });
    cursor = next?.managerId ?? null;
  }
}

/** Letters/digits in up to four dash-separated groups, e.g. MID-0007, CEO-01, MD-01. */
export const employeeCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{1,10}(-[A-Z0-9]{1,10}){0,3}$/, "Use letters, digits and dashes, e.g. CEO-01.")
  .max(24, "At most 24 characters.");

export async function updateEmployee(viewer: Viewer, employeeId: string, input: z.infer<typeof employeeSchema>, roleKey?: string, employeeCode?: string) {
  await assertCanManageEmployee(viewer, employeeId);
  const existing = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
  if (!existing) throw new AppError("Employee not found.");
  await assertValidManager(employeeId, input.managerId);

  // Employee code: Super Admin only. Unchanged or absent → left alone.
  let newCode: string | null = null;
  if (employeeCode !== undefined && employeeCode.trim().toUpperCase() !== existing.employeeCode) {
    if (viewer.role.key !== "super_admin") throw new ForbiddenError("Only a Super Admin can change an employee code.");
    const parsed = employeeCodeSchema.safeParse(employeeCode);
    if (!parsed.success) throw new ValidationError({ employeeCode: [parsed.error.issues[0]!.message] });
    const [clash] = await db.select({ id: employees.id }).from(employees).where(and(sql`upper(${employees.employeeCode}) = ${parsed.data}`, ne(employees.id, employeeId))).limit(1);
    if (clash) throw new ValidationError({ employeeCode: ["Another employee already has this code."] });
    newCode = parsed.data;
  }

  // Editing a former employee never reactivates them; that's an explicit action.
  const values = existing.employmentStatus === "exited" ? { ...input, employmentStatus: undefined } : input;

  // Resolve and authorise any role change before the transaction (checks read via `db`).
  let roleChange: { userId: string; roleId: string; from: string; to: string } | null = null;
  if (roleKey && existing.userId) {
    const user = await db.query.users.findFirst({ where: eq(users.id, existing.userId) });
    const role = await db.query.roles.findFirst({ where: eq(roles.key, roleKey) });
    if (!role) throw new AppError("Unknown role.");
    if (user && user.roleId !== role.id) {
      const current = await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) });
      assertCanAssignRole(viewer, roleKey);
      if (current) assertCanAssignRole(viewer, current.key);
      if (current?.key === "super_admin") await assertNotLastSuperAdmin(user.id);
      roleChange = { userId: user.id, roleId: role.id, from: current?.name ?? "?", to: role.name };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set(newCode ? { ...values, employeeCode: newCode } : values)
      .where(eq(employees.id, employeeId))
      .catch((e) => {
        // Two Super Admins choosing the same code at once: the unique index decides.
        if (newCode && isUniqueViolation(e)) throw new ValidationError({ employeeCode: ["Another employee already has this code."] });
        throw e;
      });
    const changed: string[] = (Object.keys(input) as (keyof typeof input)[]).filter((k) => JSON.stringify(input[k]) !== JSON.stringify(existing[k as keyof typeof existing]));
    if (newCode) {
      changed.push("employeeCode");
      await audit({ actorUserId: viewer.userId, action: "employee.code_change", entityType: "employee", entityId: employeeId, summary: `Changed the employee code of ${existing.firstName} ${existing.lastName} from ${existing.employeeCode} to ${newCode}`.trim(), metadata: { from: existing.employeeCode, to: newCode } }, tx);
    }
    if (roleChange) {
      await tx.update(users).set({ roleId: roleChange.roleId }).where(eq(users.id, roleChange.userId));
      changed.push("role");
      await audit({ actorUserId: viewer.userId, action: "user.role_change", entityType: "user", entityId: roleChange.userId, summary: `Changed role of ${existing.firstName} ${existing.lastName} from ${roleChange.from} to ${roleChange.to}` }, tx);
    }
    await audit(
      { actorUserId: viewer.userId, action: "employee.update", entityType: "employee", entityId: employeeId, summary: `Updated ${existing.firstName} ${existing.lastName}`, metadata: { fields: changed } },
      tx,
    );
  });
  // A role change takes effect on the user's next request (permissions are read per request).
}

/** Self-service: the fields an employee may change on their own profile. */
export async function updateOwnPersonal(viewer: Viewer, input: z.infer<typeof personalSchema>) {
  const emp = viewer.employee;
  if (!emp) throw new AppError("Your account isn't linked to an employee record.");
  await db.update(employees).set(input).where(eq(employees.id, emp.id));
  await audit({ actorUserId: viewer.userId, action: "employee.self_update", entityType: "employee", entityId: emp.id, summary: "Updated their personal details", metadata: { fields: Object.keys(input) } });
}

/** HR editing someone's personal details. */
export async function updatePersonal(viewer: Viewer, employeeId: string, input: z.infer<typeof personalSchema>) {
  if (viewer.employee?.id === employeeId) return updateOwnPersonal(viewer, input);
  if (!can(viewer, "employees.manage") || !can(viewer, "employees.view_personal")) throw new ForbiddenError();
  await assertCanManageEmployee(viewer, employeeId);
  await db.update(employees).set(input).where(eq(employees.id, employeeId));
  await audit({ actorUserId: viewer.userId, action: "employee.personal_update", entityType: "employee", entityId: employeeId, summary: "Updated personal details", metadata: { fields: Object.keys(input) } });
  const target = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { userId: true } });
  await notify([target?.userId], { type: "profile_updated", title: "HR updated your personal details", link: "/crm/profile" });
}

export const accountEmailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")).pipe(z.string().max(254)),
});

const isUniqueViolation = (e: unknown): boolean => {
  const err = e as { code?: string; cause?: unknown } | null;
  return !!err && (err.code === "23505" || isUniqueViolation(err.cause));
};

/**
 * Changes the address an employee signs in with and receives email at.
 * `users.email` (sign-in + every outgoing email) and `employees.official_email`
 * (shown in the directory) always change together, in one transaction.
 *
 * - Same rules as editing the record (manageBlocker): HR/Finance/Super Admin
 *   accounts need a Super Admin. Also needs users.invite, as for access links.
 * - Refuses an address already used by another account or employee.
 * - Revokes every unused activation/reset link: they were sent to the old address.
 * - Passwords, sessions, roles and personal details are not touched.
 */
export async function changeAccountEmail(viewer: Viewer, employeeId: string, newEmail: string) {
  if (!can(viewer, "users.invite")) throw new ForbiddenError();
  await assertCanManageEmployee(viewer, employeeId);
  const email = accountEmailSchema.parse({ email: newEmail }).email;
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { id: true, userId: true, firstName: true, lastName: true, officialEmail: true } });
  if (!emp) throw new AppError("Employee not found.");
  if (!emp.userId) throw new AppError("This employee has no portal account.");
  const user = await db.query.users.findFirst({ where: eq(users.id, emp.userId), columns: { id: true, email: true, status: true } });
  if (!user) throw new AppError("This employee has no portal account.");
  if (user.status === "disabled") throw new AppError("This account is deactivated. Reactivate the employee first.");
  if (user.email === email && emp.officialEmail.toLowerCase() === email) throw new AppError("That's already their email address.");

  const [clashUser] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.id, user.id))).limit(1);
  const [clashEmp] = await db.select({ id: employees.id }).from(employees).where(and(sql`lower(${employees.officialEmail}) = ${email}`, ne(employees.id, emp.id))).limit(1);
  if (clashUser || clashEmp) throw new AppError("Another account already uses this email address.");

  try {
    const revoked = await db.transaction(async (tx) => {
      await tx.update(users).set({ email }).where(eq(users.id, user.id));
      await tx.update(employees).set({ officialEmail: email }).where(eq(employees.id, emp.id));
      const links = await tx
        .update(authTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(authTokens.userId, user.id), isNull(authTokens.usedAt)))
        .returning({ id: authTokens.id });
      await audit(
        {
          actorUserId: viewer.userId,
          action: "user.email_change",
          entityType: "user",
          entityId: user.id,
          summary: `Changed the account email of ${emp.firstName} ${emp.lastName}`.trim(),
          metadata: { employeeId: emp.id, from: user.email, to: email, linksRevoked: links.length },
        },
        tx,
      );
      return links.length;
    });
    await notify([user.id], { type: "profile_updated", title: "Your sign-in email address was changed", body: `You now sign in with ${email}.`, link: "/crm/profile" });
    return { userId: user.id, status: user.status, linksRevoked: revoked };
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("Another account already uses this email address.");
    throw e;
  }
}

export async function setPhoto(viewer: Viewer, employeeId: string, file: UploadInput) {
  const self = viewer.employee?.id === employeeId;
  // Your own photo is always yours to change; anyone else's follows the record-management rule.
  if (!self) await assertCanManageEmployee(viewer, employeeId);
  const stored = await storeUpload(file, viewer.userId, { allowed: IMAGE_TYPES });
  await db.update(employees).set({ photoFileId: stored.id }).where(eq(employees.id, employeeId));
  await audit({ actorUserId: viewer.userId, action: "employee.photo", entityType: "employee", entityId: employeeId, summary: self ? "Updated their profile photo" : "Updated a profile photo" });
}

async function assertNotLastSuperAdmin(userId: string) {
  const sa = await db.query.roles.findFirst({ where: eq(roles.key, "super_admin") });
  if (!sa) return;
  const [others] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.roleId, sa.id), eq(users.status, "active"), ne(users.id, userId)));
  if (!others?.n) throw new AppError("This is the only active Super Admin. Make someone else a Super Admin first.");
}

/** Marks an employee as exited and disables their account (signs them out everywhere). */
export async function deactivateEmployee(viewer: Viewer, employeeId: string, exitDate: string | null, reason: string | null) {
  if (!can(viewer, "employees.manage")) throw new ForbiddenError();
  if (viewer.employee?.id === employeeId) throw new AppError("You can't deactivate your own account.");
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
  if (!emp) throw new AppError("Employee not found.");
  if (emp.userId) {
    const u = await db.query.users.findFirst({ where: eq(users.id, emp.userId) });
    const r = u ? await db.query.roles.findFirst({ where: eq(roles.id, u.roleId) }) : null;
    if (r && !ORDINARY_ROLES.includes(r.key) && !can(viewer, "roles.manage")) {
      throw new ForbiddenError("Only a Super Admin can deactivate an HR, Finance or Super Admin account.");
    }
    if (r?.key === "super_admin") await assertNotLastSuperAdmin(emp.userId);
  }
  const company = await getCompany();
  await db.transaction(async (tx) => {
    await tx.update(employees).set({ employmentStatus: "exited", exitDate: exitDate ?? todayIn(company.timezone) }).where(eq(employees.id, employeeId));
    if (emp.userId) await tx.update(users).set({ status: "disabled" }).where(eq(users.id, emp.userId));
    // Reports move up to the departing person's own manager.
    await tx.update(employees).set({ managerId: emp.managerId }).where(eq(employees.managerId, employeeId));
    await audit({ actorUserId: viewer.userId, action: "employee.deactivate", entityType: "employee", entityId: employeeId, summary: `Deactivated ${emp.firstName} ${emp.lastName}`, metadata: { exitDate, reason } }, tx);
  });
  if (emp.userId) await deleteAllSessionsForUser(emp.userId);
}

export async function reactivateEmployee(viewer: Viewer, employeeId: string) {
  if (!can(viewer, "employees.manage")) throw new ForbiddenError();
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
  if (!emp) throw new AppError("Employee not found.");
  if (emp.employmentStatus !== "exited") throw new AppError("Only a deactivated employee can be reactivated.");
  // Same rule as deactivation: restoring an HR, Finance or Super Admin account needs roles.manage.
  if (emp.userId) {
    const u = await db.query.users.findFirst({ where: eq(users.id, emp.userId), columns: { roleId: true } });
    const r = u ? await db.query.roles.findFirst({ where: eq(roles.id, u.roleId), columns: { key: true } }) : null;
    if (r && !ORDINARY_ROLES.includes(r.key) && !can(viewer, "roles.manage")) {
      throw new ForbiddenError("Only a Super Admin can reactivate an HR, Finance or Super Admin account.");
    }
  }
  await db.transaction(async (tx) => {
    await tx.update(employees).set({ employmentStatus: "active", exitDate: null }).where(eq(employees.id, employeeId));
    if (emp.userId) {
      const u = await tx.query.users.findFirst({ where: eq(users.id, emp.userId) });
      // Accounts that never set a password go back to "invited".
      await tx.update(users).set({ status: u?.passwordHash ? "active" : "invited" }).where(eq(users.id, emp.userId));
    }
    await audit({ actorUserId: viewer.userId, action: "employee.reactivate", entityType: "employee", entityId: employeeId, summary: `Reactivated ${emp.firstName} ${emp.lastName}` }, tx);
  });
}

/* ========================================================= form options */

export async function employeeFormOptions() {
  const [depts, desigs, mgrs, rolesList, schedules] = await Promise.all([
    db.select({ id: departments.id, name: departments.name }).from(departments).where(eq(departments.isActive, true)).orderBy(asc(departments.name)),
    db.select({ id: designations.id, title: designations.title, departmentId: designations.departmentId }).from(designations).where(eq(designations.isActive, true)).orderBy(asc(designations.title)),
    db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, code: employees.employeeCode })
      .from(employees)
      .where(inArray(employees.employmentStatus, [...ACTIVE_STATUSES]))
      .orderBy(asc(employees.firstName)),
    db.select({ key: roles.key, name: roles.name }).from(roles).orderBy(asc(roles.name)),
    db.select({ id: workSchedules.id, name: workSchedules.name, startTime: workSchedules.startTime, endTime: workSchedules.endTime, isDefault: workSchedules.isDefault }).from(workSchedules).orderBy(asc(workSchedules.startTime), asc(workSchedules.name)),
  ]);
  return {
    departments: depts.map((d) => ({ value: d.id, label: d.name })),
    designations: desigs.map((d) => ({ value: d.id, label: d.title })),
    managers: mgrs.map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}`.trim() + ` (${m.code})` })),
    roles: rolesList.map((r) => ({ value: r.key, label: r.name })),
    schedules: schedules.map((s) => ({ value: s.id, label: shiftLabel(s) + (s.isDefault ? " · default" : "") })),
  };
}
