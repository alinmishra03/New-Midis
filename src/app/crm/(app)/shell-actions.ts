"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/crm/db";
import { users } from "@/crm/db/schema";
import { getViewer } from "@/crm/auth/dal";
import { latestNotifications, markRead, unreadCount } from "@/crm/services/notifications";
import { runReminders } from "@/crm/services/reminders";

/** Saves the user's theme preference. */
export async function setTheme(theme: string) {
  const viewer = await getViewer();
  const parsed = z.enum(["light", "dark", "system"]).safeParse(theme);
  if (!viewer || !parsed.success) return;
  await db.update(users).set({ theme: parsed.data }).where(eq(users.id, viewer.userId));
}

/** Latest notifications for the bell dropdown. Only ever the viewer's own. */
export async function loadNotifications() {
  const viewer = await getViewer();
  if (!viewer) return { unread: 0, items: [] };
  await runReminders(viewer).catch((e) => console.error("[crm reminders]", e));
  const [unread, items] = await Promise.all([unreadCount(viewer.userId), latestNotifications(viewer.userId, 10)]);
  return {
    unread,
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      link: n.link,
      read: !!n.readAt,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function markNotificationsRead(ids: string[] | "all") {
  const viewer = await getViewer();
  if (!viewer) return;
  const parsed = z.union([z.literal("all"), z.array(z.uuid()).max(100)]).safeParse(ids);
  if (!parsed.success) return;
  await markRead(viewer.userId, parsed.data);
}
