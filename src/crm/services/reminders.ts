import "server-only";
import { and, eq, gte, inArray, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/crm/db";
import { employees, meetingParticipants, meetings, tasks } from "@/crm/db/schema";
import type { Viewer } from "@/crm/auth/dal";
import { addDays, formatDate, formatTime, nextAnniversary, todayIn } from "@/crm/lib/time";
import { getCompany } from "./company";
import { notify } from "./notifications";

/**
 * Reminder notifications, generated when a user opens the portal (from the
 * app layout, after the response is sent). Each reminder has a dedupe key,
 * so it is created once however often the page loads. This needs no cron
 * job; a scheduled call to the same function could be added later for
 * people who don't open the portal.
 */
export async function runReminders(viewer: Viewer) {
  const emp = viewer.employee;
  if (!emp) return;
  const company = await getCompany();
  const tz = company.timezone;
  const today = todayIn(tz);
  const s = company.notifications;
  const now = new Date();

  // Meetings starting soon.
  const soon = new Date(now.getTime() + s.meetingReminderMinutes * 60000);
  const invited = db.select({ id: meetingParticipants.meetingId }).from(meetingParticipants).where(eq(meetingParticipants.employeeId, emp.id));
  const upcoming = await db
    .select({ id: meetings.id, title: meetings.title, startAt: meetings.startAt, location: meetings.location })
    .from(meetings)
    .where(and(gte(meetings.startAt, now), lte(meetings.startAt, soon), or(eq(meetings.scope, "company"), eq(meetings.organizerId, emp.id), inArray(meetings.id, invited))));
  for (const m of upcoming) {
    await notify([viewer.userId], { type: "meeting_reminder", title: `Starting at ${formatTime(m.startAt, tz)}: ${m.title}`, body: m.location, link: "/crm/calendar", dedupeKey: `meeting-${m.id}` });
  }

  // Tasks due soon or overdue.
  const due = await db
    .select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, emp.id), ne(tasks.status, "completed"), sql`${tasks.dueDate} <= ${addDays(today, s.taskDueReminderDays)}`))
    .limit(10);
  for (const t of due) {
    const overdue = t.dueDate! < today;
    await notify([viewer.userId], {
      type: "task_due",
      title: overdue ? `Overdue: ${t.title}` : t.dueDate === today ? `Due today: ${t.title}` : `Due ${formatDate(t.dueDate)}: ${t.title}`,
      link: `/crm/tasks/${t.id}`,
      dedupeKey: `task-due-${t.id}-${today}`,
    });
  }

  // Colleagues' birthdays today.
  if (s.birthdayAnnouncements) {
    const people = await db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, dateOfBirth: employees.dateOfBirth })
      .from(employees)
      .where(and(inArray(employees.employmentStatus, ["probation", "active", "notice"]), ne(employees.id, emp.id)));
    for (const p of people) {
      if (p.dateOfBirth && nextAnniversary(p.dateOfBirth, today).date === today) {
        await notify([viewer.userId], { type: "birthday", title: `It's ${p.firstName} ${p.lastName}'s birthday today 🎂`, link: `/crm/employees/${p.id}`, dedupeKey: `birthday-${p.id}-${today}` });
      }
    }
  }
}
