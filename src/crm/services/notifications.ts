import "server-only";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { employees, notifications, rolePermissions, roles, users } from "@/crm/db/schema";
import type { Permission } from "@/crm/auth/permissions";

export type NotificationInput = {
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  /** Idempotency key: at most one notification per user per key. */
  dedupeKey?: string | null;
};

/** Sends an in-app notification to each user id (duplicates and nulls ignored). */
export async function notify(userIds: (string | null | undefined)[], n: NotificationInput, tx?: Tx) {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))];
  if (!ids.length) return;
  await (tx ?? db)
    .insert(notifications)
    .values(ids.map((userId) => ({ userId, type: n.type, title: n.title, body: n.body ?? null, link: n.link ?? null, dedupeKey: n.dedupeKey ?? null })))
    .onConflictDoNothing();
}

/** Active users who hold a permission (Super Admins always do). */
export async function userIdsWithPermission(perm: Permission, tx?: Tx): Promise<string[]> {
  const q = tx ?? db;
  const rows = await q
    .selectDistinct({ id: users.id })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(rolePermissions, and(eq(rolePermissions.roleId, roles.id), eq(rolePermissions.permissionKey, perm)))
    .where(and(eq(users.status, "active"), or(eq(roles.key, "super_admin"), sql`${rolePermissions.permissionKey} is not null`)));
  return rows.map((r) => r.id);
}

/** The user account behind an employee record (null if none or not active). */
export async function userIdForEmployee(employeeId: string, tx?: Tx): Promise<string | null> {
  const row = await (tx ?? db).query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { userId: true } });
  return row?.userId ?? null;
}

/**
 * The user id of an employee's direct manager, if any. Approvals go to the
 * line manager; HR (leave.manage etc.) can act on everything regardless.
 */
export async function managerUserId(employeeId: string, tx?: Tx): Promise<string | null> {
  const q = tx ?? db;
  const emp = await q.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { managerId: true } });
  if (!emp?.managerId) return null;
  const mgr = await q.query.employees.findFirst({ where: eq(employees.id, emp.managerId), columns: { userId: true } });
  return mgr?.userId ?? null;
}

export async function unreadCount(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function latestNotifications(userId: string, limit = 8) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markRead(userId: string, ids: string[] | "all") {
  const base = and(eq(notifications.userId, userId), isNull(notifications.readAt));
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(ids === "all" ? base : and(base, inArray(notifications.id, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])));
}
