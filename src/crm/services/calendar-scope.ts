import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/crm/db";
import { employees } from "@/crm/db/schema";
import { can, getTeamEmployeeIds, type Viewer } from "@/crm/auth/dal";

/**
 * Who appears on a viewer's leave/WFH calendar, and whether leave types are
 * shown. HR sees everyone; managers their reporting tree; everyone else
 * their department colleagues — as "away", without the leave type, since a
 * type like sick leave is personal.
 */
export async function calendarScope(viewer: Viewer) {
  const me = viewer.employee;
  let ids: string[] | "all";
  let showType = true;
  if (can(viewer, "leave.manage")) ids = "all";
  else if (can(viewer, "leave.approve_team") && me) ids = [me.id, ...(await getTeamEmployeeIds(me.id))];
  else if (me?.departmentId) {
    const rows = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.departmentId, me.departmentId), inArray(employees.employmentStatus, ["probation", "active", "notice"])));
    ids = rows.map((r) => r.id);
    showType = false;
  } else {
    ids = me ? [me.id] : [];
  }
  const conds = [inArray(employees.employmentStatus, ["probation", "active", "notice"])];
  if (ids !== "all") conds.push(inArray(employees.id, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]));
  const people = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId })
    .from(employees)
    .where(and(...conds))
    .orderBy(asc(employees.firstName));
  return {
    ids,
    showType,
    people: people.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`.trim(), photoFileId: p.photoFileId })),
  };
}
