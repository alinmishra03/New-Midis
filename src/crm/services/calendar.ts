import "server-only";
import { and, asc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { db } from "@/crm/db";
import { employees, holidays, meetingParticipants, meetings } from "@/crm/db/schema";
import { can, ForbiddenError, getTeamEmployeeIds, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { addDays, formatDateTime, nextAnniversary, zonedDate, zonedToInstant, type ISODate } from "@/crm/lib/time";
import { calendarScope } from "./calendar-scope";
import { getCompany, getHolidaysBetween } from "./company";
import { leaveCalendar } from "./leave-workflow";
import { notify, userIdForEmployee } from "./notifications";
import { wfhCalendar } from "./wfh";

export type CalendarEvent = {
  id: string;
  date: ISODate;
  endDate?: ISODate;
  kind: "holiday" | "meeting" | "leave" | "wfh" | "birthday" | "anniversary";
  title: string;
  time?: string;
  href?: string;
};

/* --------------------------------------------------------------- meetings */

export type MeetingInput = { title: string; description: string | null; date: ISODate; start: string; end: string; location: string | null; meetingLink: string | null; scope: "private" | "team" | "company"; participantIds: string[] };

export async function scheduleMeeting(viewer: Viewer, input: MeetingInput) {
  const organizer = viewer.employee;
  if (!organizer) throw new AppError("Your account isn't linked to an employee record.");
  if (input.scope === "company" && !can(viewer, "calendar.manage")) throw new ForbiddenError("Only HR can create company-wide events.");
  const company = await getCompany();
  const startAt = zonedToInstant(input.date, input.start, company.timezone);
  const endAt = zonedToInstant(input.date, input.end, company.timezone);
  if (endAt <= startAt) throw new AppError("The meeting must end after it starts.");
  if (startAt < new Date(Date.now() - 60 * 60 * 1000)) throw new AppError("That time has already passed.");

  let participantIds = [...new Set(input.participantIds)];
  if (input.scope === "team") participantIds = [...new Set([...participantIds, ...(await getTeamEmployeeIds(organizer.id))])];
  participantIds = participantIds.filter((p) => p !== organizer.id);
  if (participantIds.length) {
    const valid = await db.select({ id: employees.id }).from(employees).where(and(inArray(employees.id, participantIds), inArray(employees.employmentStatus, ["probation", "active", "notice"])));
    if (valid.length !== participantIds.length) throw new AppError("Some participants aren't current employees.");
  }

  const meeting = await db.transaction(async (tx) => {
    const [m] = await tx
      .insert(meetings)
      .values({ title: input.title, description: input.description, startAt, endAt, location: input.location, meetingLink: input.meetingLink, scope: input.scope, organizerId: organizer.id })
      .returning();
    const all = [organizer.id, ...participantIds];
    await tx.insert(meetingParticipants).values(all.map((employeeId) => ({ meetingId: m!.id, employeeId })));
    await audit({ actorUserId: viewer.userId, action: "meeting.create", entityType: "meeting", entityId: m!.id, summary: `Scheduled “${input.title}” for ${formatDateTime(startAt, company.timezone)}` }, tx);
    return m!;
  });

  const recipients = input.scope === "company" ? await allActiveUserIds() : await Promise.all(participantIds.map((p) => userIdForEmployee(p)));
  await notify(
    recipients.filter((u) => u !== viewer.userId),
    { type: "meeting", title: `${organizer.fullName} invited you: ${input.title}`, body: formatDateTime(startAt, company.timezone) + (input.location ? ` · ${input.location}` : ""), link: "/crm/calendar" },
  );
  return meeting;
}

async function allActiveUserIds() {
  const rows = await db.query.users.findMany({ where: (u, { eq }) => eq(u.status, "active"), columns: { id: true } });
  return rows.map((r) => r.id);
}

export async function cancelMeeting(viewer: Viewer, id: string) {
  const m = await db.query.meetings.findFirst({ where: eq(meetings.id, id) });
  if (!m) throw new AppError("Meeting not found.");
  if (m.organizerId !== viewer.employee?.id && !can(viewer, "calendar.manage")) throw new ForbiddenError();
  const parts = await db.select({ employeeId: meetingParticipants.employeeId }).from(meetingParticipants).where(eq(meetingParticipants.meetingId, id));
  await db.delete(meetings).where(eq(meetings.id, id));
  const company = await getCompany();
  await audit({ actorUserId: viewer.userId, action: "meeting.cancel", entityType: "meeting", entityId: id, summary: `Cancelled “${m.title}”` });
  const recipients = m.scope === "company" ? await allActiveUserIds() : await Promise.all(parts.map((p) => userIdForEmployee(p.employeeId)));
  await notify(recipients.filter((u) => u !== viewer.userId), { type: "meeting", title: `Cancelled: ${m.title}`, body: formatDateTime(m.startAt, company.timezone), link: "/crm/calendar" });
}

/** Meetings the viewer can see in a range: company-wide, organised by them, or with them invited. */
export async function meetingsFor(viewer: Viewer, from: Date, to: Date) {
  const empId = viewer.employee?.id ?? "00000000-0000-0000-0000-000000000000";
  const mine = db.select({ id: meetingParticipants.meetingId }).from(meetingParticipants).where(eq(meetingParticipants.employeeId, empId));
  const rows = await db
    .select()
    .from(meetings)
    .where(and(gte(meetings.endAt, from), lte(meetings.startAt, to), or(eq(meetings.scope, "company"), eq(meetings.organizerId, empId), inArray(meetings.id, mine))))
    .orderBy(asc(meetings.startAt));
  if (!rows.length) return [];
  const parts = await db
    .select({ meetingId: meetingParticipants.meetingId, firstName: employees.firstName, lastName: employees.lastName })
    .from(meetingParticipants)
    .innerJoin(employees, eq(employees.id, meetingParticipants.employeeId))
    .where(inArray(meetingParticipants.meetingId, rows.map((r) => r.id)));
  return rows.map((r) => ({
    ...r,
    canCancel: r.organizerId === viewer.employee?.id || can(viewer, "calendar.manage"),
    participants: parts.filter((p) => p.meetingId === r.id).map((p) => `${p.firstName} ${p.lastName}`.trim()),
  }));
}

/* --------------------------------------------------------------- holidays */

export async function addHoliday(viewer: Viewer, input: { date: ISODate; name: string; type: "public" | "optional"; description: string | null }) {
  if (!can(viewer, "calendar.manage")) throw new ForbiddenError();
  const [row] = await db.insert(holidays).values(input).onConflictDoNothing().returning();
  if (!row) throw new AppError("That holiday already exists on that date.");
  await audit({ actorUserId: viewer.userId, action: "holiday.add", entityType: "holiday", entityId: row.id, summary: `Added holiday ${input.name} on ${input.date}` });
}

export async function deleteHoliday(viewer: Viewer, id: string) {
  if (!can(viewer, "calendar.manage")) throw new ForbiddenError();
  const [row] = await db.delete(holidays).where(eq(holidays.id, id)).returning();
  if (!row) throw new AppError("Holiday not found.");
  await audit({ actorUserId: viewer.userId, action: "holiday.delete", entityType: "holiday", entityId: id, summary: `Removed holiday ${row.name} (${row.date})` });
}

/* ------------------------------------------------------------- month feed */

export async function monthEvents(viewer: Viewer, from: ISODate, to: ISODate): Promise<CalendarEvent[]> {
  const company = await getCompany();
  const tz = company.timezone;
  const scope = await calendarScope(viewer);
  const [hol, mtg, leave, wfh, people] = await Promise.all([
    getHolidaysBetween(from, to),
    meetingsFor(viewer, zonedToInstant(from, "00:00", tz), zonedToInstant(addDays(to, 1), "00:00", tz)),
    leaveCalendar(scope.ids, from, to),
    wfhCalendar(scope.ids, from, to),
    db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, dateOfBirth: employees.dateOfBirth, joiningDate: employees.joiningDate }).from(employees).where(inArray(employees.employmentStatus, ["probation", "active", "notice"])),
  ]);
  const events: CalendarEvent[] = [];
  for (const h of hol) events.push({ id: `h-${h.id}`, date: h.date, kind: "holiday", title: h.type === "optional" ? `${h.name} (optional)` : h.name });
  for (const m of mtg) {
    events.push({ id: `m-${m.id}`, date: zonedDate(m.startAt, tz), kind: "meeting", title: m.title, time: new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(m.startAt) });
  }
  for (const l of leave.filter((x) => x.status === "approved")) {
    const show = scope.showType || l.employeeId === viewer.employee?.id;
    events.push({ id: `l-${l.id}`, date: l.startDate, endDate: l.endDate, kind: "leave", title: `${l.firstName} ${l.lastName} · ${show ? l.type : "Away"}` });
  }
  for (const w of wfh) events.push({ id: `w-${w.id}`, date: w.startDate, endDate: w.endDate, kind: "wfh", title: `${w.firstName} ${w.lastName} · WFH` });
  for (const p of people) {
    const name = `${p.firstName} ${p.lastName}`.trim();
    for (const [src, kind] of [[p.dateOfBirth, "birthday"], [p.joiningDate, "anniversary"]] as const) {
      if (!src) continue;
      const n = nextAnniversary(src, from);
      if (n.date <= to && (kind === "birthday" || n.years >= 1)) {
        events.push({ id: `${kind[0]}-${p.id}`, date: n.date, kind, title: kind === "birthday" ? `${name}'s birthday` : `${name} · ${n.years} yr${n.years === 1 ? "" : "s"} at MIDIS`, href: `/crm/employees/${p.id}` });
      }
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));
}

