import "server-only";
import { and, desc, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/crm/db";
import { announcements, departments, employees, users } from "@/crm/db/schema";
import { can, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { notify } from "./notifications";

export type AnnouncementCategory = "company" | "hr" | "department" | "notice" | "policy" | "event" | "celebration";
export const ANNOUNCEMENT_CATEGORIES: { value: AnnouncementCategory; label: string }[] = [
  { value: "company", label: "Company" },
  { value: "hr", label: "HR" },
  { value: "department", label: "Department" },
  { value: "notice", label: "Important notice" },
  { value: "policy", label: "Policy update" },
  { value: "event", label: "Event" },
  { value: "celebration", label: "Celebration" },
];

/** Published announcements for everyone or the viewer's department; publishers also see drafts. */
export async function listAnnouncements(viewer: Viewer, category?: string) {
  const publisher = can(viewer, "announcements.publish");
  const deptId = viewer.employee?.departmentId;
  const conds: SQL[] = [];
  if (!publisher) {
    conds.push(eq(announcements.status, "published"));
    conds.push(deptId ? or(isNull(announcements.departmentId), eq(announcements.departmentId, deptId))! : isNull(announcements.departmentId));
  }
  if (category && ANNOUNCEMENT_CATEGORIES.some((c) => c.value === category)) conds.push(eq(announcements.category, category as AnnouncementCategory));
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      status: announcements.status,
      isPinned: announcements.isPinned,
      isImportant: announcements.isImportant,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
      department: departments.name,
      departmentId: announcements.departmentId,
      authorEmail: users.email,
    })
    .from(announcements)
    .leftJoin(departments, eq(departments.id, announcements.departmentId))
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt), desc(announcements.createdAt))
    .limit(100);
}

export async function getAnnouncement(viewer: Viewer, id: string) {
  const rows = await listAnnouncements(viewer);
  return rows.find((r) => r.id === id) ?? null;
}

export type AnnouncementInput = { title: string; body: string; category: AnnouncementCategory; departmentId: string | null; isPinned: boolean; isImportant: boolean; publish: boolean };

async function audienceUserIds(departmentId: string | null) {
  const conds = [eq(users.status, "active")];
  if (departmentId) conds.push(eq(employees.departmentId, departmentId));
  const rows = await db.select({ id: users.id }).from(users).innerJoin(employees, eq(employees.userId, users.id)).where(and(...conds, inArray(employees.employmentStatus, ["probation", "active", "notice"])));
  return rows.map((r) => r.id);
}

async function announce(viewer: Viewer, a: { id: string; title: string; departmentId: string | null; isImportant: boolean }) {
  const ids = (await audienceUserIds(a.departmentId)).filter((u) => u !== viewer.userId);
  await notify(ids, { type: "announcement", title: `${a.isImportant ? "Important: " : ""}${a.title}`, link: `/crm/announcements/${a.id}`, dedupeKey: `announcement-${a.id}` });
}

export async function saveAnnouncement(viewer: Viewer, id: string | null, input: AnnouncementInput) {
  if (!can(viewer, "announcements.publish")) throw new ForbiddenError();
  if (input.category === "department" && !input.departmentId) throw new AppError("Choose the department this is for.");
  const values = {
    title: input.title,
    body: input.body,
    category: input.category,
    departmentId: input.departmentId,
    isPinned: input.isPinned,
    isImportant: input.isImportant,
  };
  let row;
  if (id) {
    const existing = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
    if (!existing) throw new AppError("Announcement not found.");
    const publishNow = input.publish && existing.status === "draft";
    [row] = await db
      .update(announcements)
      .set({ ...values, ...(publishNow ? { status: "published" as const, publishedAt: new Date() } : {}), ...(!input.publish && existing.status === "published" ? { status: "draft" as const } : {}) })
      .where(eq(announcements.id, id))
      .returning();
    await audit({ actorUserId: viewer.userId, action: publishNow ? "announcement.publish" : "announcement.update", entityType: "announcement", entityId: id, summary: `${publishNow ? "Published" : "Edited"} “${input.title}”` });
    if (publishNow) await announce(viewer, row!);
  } else {
    [row] = await db
      .insert(announcements)
      .values({ ...values, authorId: viewer.userId, status: input.publish ? "published" : "draft", publishedAt: input.publish ? new Date() : null })
      .returning();
    await audit({ actorUserId: viewer.userId, action: input.publish ? "announcement.publish" : "announcement.draft", entityType: "announcement", entityId: row!.id, summary: `${input.publish ? "Published" : "Drafted"} “${input.title}”` });
    if (input.publish) await announce(viewer, row!);
  }
  return row!;
}

export async function deleteAnnouncement(viewer: Viewer, id: string) {
  if (!can(viewer, "announcements.publish")) throw new ForbiddenError();
  const [row] = await db.delete(announcements).where(eq(announcements.id, id)).returning();
  if (!row) throw new AppError("Announcement not found.");
  await audit({ actorUserId: viewer.userId, action: "announcement.delete", entityType: "announcement", entityId: id, summary: `Deleted “${row.title}”` });
}
