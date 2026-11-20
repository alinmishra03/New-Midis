import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/crm/db";
import { employees, rolePermissions, roles, users } from "@/crm/db/schema";
import { ALL_PERMISSIONS, type Permission, type RoleKey } from "./permissions";
import { getSession } from "./session";

/**
 * The Data Access Layer's view of who is signed in.
 *
 * Every page, Server Action and Route Handler in the CRM starts by calling
 * `requireViewer()` (or `getViewer()` for optional auth) and then checks
 * permissions with `can()` / ownership with the scope helpers below. The
 * navigation hides what a user cannot open, but these checks — next to the
 * data — are what actually enforce it.
 */
export type Viewer = {
  userId: string;
  sessionId: string;
  email: string;
  role: { id: string; key: RoleKey | string; name: string };
  permissions: ReadonlySet<Permission>;
  theme: "light" | "dark" | "system";
  /** The viewer's own employee record. Every account is linked to one. */
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    employeeCode: string;
    photoFileId: string | null;
    departmentId: string | null;
    managerId: string | null;
  } | null;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, email: true, status: true, roleId: true, theme: true },
  });
  if (!user || user.status !== "active") return null;

  const [role, perms, employee] = await Promise.all([
    db.query.roles.findFirst({ where: eq(roles.id, user.roleId), columns: { id: true, key: true, name: true } }),
    db.select({ key: rolePermissions.permissionKey }).from(rolePermissions).where(eq(rolePermissions.roleId, user.roleId)),
    db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        photoFileId: true,
        departmentId: true,
        managerId: true,
      },
    }),
  ]);
  if (!role) return null;

  // Super Admin always has every permission, whatever the table says.
  const permissions = new Set<Permission>(
    role.key === "super_admin" ? ALL_PERMISSIONS : (perms.map((p) => p.key) as Permission[]),
  );

  return {
    userId: user.id,
    sessionId: session.id,
    email: user.email,
    role,
    permissions,
    theme: (["light", "dark", "system"].includes(user.theme) ? user.theme : "system") as Viewer["theme"],
    employee: employee
      ? { ...employee, fullName: `${employee.firstName} ${employee.lastName}`.trim() }
      : null,
  };
});

/** For pages: the viewer, or a redirect to the login page. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/crm/login");
  return viewer;
}

export function can(viewer: Viewer, ...anyOf: Permission[]): boolean {
  return anyOf.some((p) => viewer.permissions.has(p));
}

/**
 * For pages: require at least one of the permissions. Unauthorised users get
 * the CRM's 404 rather than a 403, so the response does not confirm that a
 * restricted page or record exists.
 */
export async function requirePermission(...anyOf: Permission[]): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!can(viewer, ...anyOf)) notFound();
  return viewer;
}

/** Thrown by data-layer functions when the viewer may not perform an action. */
export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertCan(viewer: Viewer, ...anyOf: Permission[]) {
  if (!can(viewer, ...anyOf)) throw new ForbiddenError();
}

/* -------------------------------------------------------------------------- */
/* Reporting-line scope                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Everyone who reports to `managerEmployeeId`, directly or through other
 * managers. One query over (id, manager_id) and a walk in memory: a company
 * the size of MIDIS has tens of employees, and this keeps the logic portable
 * and obvious. Guarded against cycles.
 */
export const getTeamEmployeeIds = cache(async (managerEmployeeId: string): Promise<string[]> => {
  const rows = await db.select({ id: employees.id, managerId: employees.managerId }).from(employees);
  const byManager = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.managerId) continue;
    const list = byManager.get(r.managerId) ?? [];
    list.push(r.id);
    byManager.set(r.managerId, list);
  }
  const seen = new Set<string>([managerEmployeeId]);
  const queue = [managerEmployeeId];
  const team: string[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of byManager.get(current) ?? []) {
      if (seen.has(child)) continue;
      seen.add(child);
      team.push(child);
      queue.push(child);
    }
  }
  return team;
});

export type Scope = { kind: "all" } | { kind: "team"; employeeIds: string[] } | { kind: "self"; employeeIds: string[] };

/**
 * Which employees' records of a given kind the viewer may see:
 * company-wide with the "all" permission, their reporting tree (plus
 * themselves) with the "team" permission, otherwise only their own.
 */
export async function scopeFor(viewer: Viewer, allPerm: Permission, teamPerm: Permission): Promise<Scope> {
  if (can(viewer, allPerm)) return { kind: "all" };
  const self = viewer.employee ? [viewer.employee.id] : [];
  if (can(viewer, teamPerm) && viewer.employee) {
    return { kind: "team", employeeIds: [...self, ...(await getTeamEmployeeIds(viewer.employee.id))] };
  }
  return { kind: "self", employeeIds: self };
}

export function inScope(scope: Scope, employeeId: string): boolean {
  return scope.kind === "all" || scope.employeeIds.includes(employeeId);
}

/** True if `employeeId` is in the viewer's reporting tree (not including the viewer). */
export async function isInTeam(viewer: Viewer, employeeId: string): Promise<boolean> {
  if (!viewer.employee) return false;
  return (await getTeamEmployeeIds(viewer.employee.id)).includes(employeeId);
}
