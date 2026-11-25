import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/crm/db";
import {
  announcements,
  attendanceCorrections,
  attendanceRecords,
  auditLogs,
  candidates,
  departments,
  designations,
  employees,
  jobOpenings,
  leaveRequests,
  leaveTypes,
  meetingParticipants,
  meetings,
  onboardingTasks,
  passwordResetRequests,
  payrollRuns,
  payslips,
  performanceReviews,
  roles,
  tasks,
  users,
  wfhRequests,
} from "@/crm/db/schema";
import { getTeamEmployeeIds, type Viewer } from "@/crm/auth/dal";
import { addDays, nextAnniversary, startOfMonth, endOfMonth, todayIn, isoWeekday, type ISODate } from "@/crm/lib/time";
import { getCompany, getDefaultSchedule, getHolidaysBetween, publicHolidaySet } from "./company";
import { attendanceExemptIds, monthSummary } from "./attendance";
import { currentLeaveYear, getBalances, onLeaveOn } from "./leave";

const ACTIVE = inArray(employees.employmentStatus, ["probation", "active", "notice"]);

/* ------------------------------------------------------------- personal */

export async function personalSummary(viewer: Viewer) {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const emp = viewer.employee;
  if (!emp) return null;

  const [profile] = await db
    .select({
      designation: designations.title,
      department: departments.name,
      joiningDate: employees.joiningDate,
      employmentStatus: employees.employmentStatus,
      workLocation: employees.workLocation,
    })
    .from(employees)
    .leftJoin(designations, eq(designations.id, employees.designationId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(eq(employees.id, emp.id));
  const manager = emp.managerId
    ? await db.query.employees.findFirst({ where: eq(employees.id, emp.managerId), columns: { firstName: true, lastName: true } })
    : undefined;

  const [month, balances, pendingLeave, myTasks, upcomingMeetings, holidays, activity] = await Promise.all([
    monthSummary(emp.id, startOfMonth(today), endOfMonth(today)),
    getBalances(emp.id),
    db
      .select({ id: leaveRequests.id, startDate: leaveRequests.startDate, endDate: leaveRequests.endDate, days: leaveRequests.days, type: leaveTypes.name })
      .from(leaveRequests)
      .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
      .where(and(eq(leaveRequests.employeeId, emp.id), eq(leaveRequests.status, "pending")))
      .orderBy(asc(leaveRequests.startDate))
      .limit(5),
    db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status, priority: tasks.priority, dueDate: tasks.dueDate, progress: tasks.progress })
      .from(tasks)
      .where(and(eq(tasks.assigneeId, emp.id), ne(tasks.status, "completed")))
      .orderBy(sql`${tasks.dueDate} asc nulls last`, desc(tasks.createdAt))
      .limit(6),
    upcomingMeetingsFor(emp.id, 5),
    getHolidaysBetween(today, addDays(today, 90)),
    db
      .select({ id: auditLogs.id, summary: auditLogs.summary, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(eq(auditLogs.actorUserId, viewer.userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(6),
  ]);

  return {
    today,
    profile: profile ? { ...profile, manager: manager ? `${manager.firstName} ${manager.lastName}`.trim() : null } : null,
    month,
    balances,
    pendingLeave,
    myTasks,
    upcomingMeetings,
    holidays: holidays.slice(0, 5),
    activity,
  };
}

export async function upcomingMeetingsFor(employeeId: string, limit: number) {
  const now = new Date();
  const mine = db.select({ id: meetingParticipants.meetingId }).from(meetingParticipants).where(eq(meetingParticipants.employeeId, employeeId));
  return db
    .select({ id: meetings.id, title: meetings.title, startAt: meetings.startAt, endAt: meetings.endAt, location: meetings.location, meetingLink: meetings.meetingLink, scope: meetings.scope })
    .from(meetings)
    .where(and(gte(meetings.endAt, now), or(eq(meetings.scope, "company"), eq(meetings.organizerId, employeeId), inArray(meetings.id, mine))))
    .orderBy(asc(meetings.startAt))
    .limit(limit);
}

export async function recentAnnouncements(viewer: Viewer, limit = 4) {
  const deptId = viewer.employee?.departmentId;
  return db
    .select({ id: announcements.id, title: announcements.title, body: announcements.body, category: announcements.category, isImportant: announcements.isImportant, isPinned: announcements.isPinned, publishedAt: announcements.publishedAt })
    .from(announcements)
    .where(and(eq(announcements.status, "published"), deptId ? or(isNull(announcements.departmentId), eq(announcements.departmentId, deptId)) : isNull(announcements.departmentId)))
    .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt))
    .limit(limit);
}

/**
 * Birthdays (day and month only — never the year or age) and work
 * anniversaries in the next `days` days, for active employees.
 */
export async function celebrations(days = 30, employeeIds?: string[]) {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const horizon = addDays(today, days);
  const conds = [ACTIVE];
  if (employeeIds) conds.push(inArray(employees.id, employeeIds.length ? employeeIds : ["00000000-0000-0000-0000-000000000000"]));
  const rows = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, dateOfBirth: employees.dateOfBirth, joiningDate: employees.joiningDate })
    .from(employees)
    .where(and(...conds));
  const out: { employeeId: string; name: string; photoFileId: string | null; kind: "birthday" | "anniversary"; date: ISODate; years?: number }[] = [];
  for (const r of rows) {
    const name = `${r.firstName} ${r.lastName}`.trim();
    if (r.dateOfBirth) {
      const n = nextAnniversary(r.dateOfBirth, today);
      if (n.date <= horizon) out.push({ employeeId: r.id, name, photoFileId: r.photoFileId, kind: "birthday", date: n.date });
    }
    const a = nextAnniversary(r.joiningDate, today);
    if (a.years >= 1 && a.date <= horizon) out.push({ employeeId: r.id, name, photoFileId: r.photoFileId, kind: "anniversary", date: a.date, years: a.years });
  }
  return out.sort((x, y) => x.date.localeCompare(y.date)).slice(0, 8);
}

/* ------------------------------------------------------- people analytics */

async function workingDaysBack(today: ISODate, n: number) {
  const schedule = await getDefaultSchedule();
  const holidays = await publicHolidaySet(addDays(today, -n * 2 - 7), today);
  const out: ISODate[] = [];
  for (let d = today; out.length < n; d = addDays(d, -1)) {
    if (schedule.workingDays.includes(isoWeekday(d)) && !holidays.has(d)) out.unshift(d);
    if (d < addDays(today, -n * 3)) break;
  }
  return out;
}

/** Headline people numbers for a set of employees (or everyone). */
export async function peopleStats(scopeIds: string[] | "all") {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const inScope = scopeIds === "all" ? undefined : inArray(employees.id, scopeIds.length ? scopeIds : ["00000000-0000-0000-0000-000000000000"]);
  const recScope = scopeIds === "all" ? undefined : inArray(attendanceRecords.employeeId, scopeIds.length ? scopeIds : ["00000000-0000-0000-0000-000000000000"]);
  const empIdsForLeave = scopeIds === "all" ? undefined : scopeIds;

  const [[total], [active], [joiners], allTodayRecs, leaveToday, wfhToday, activeIds, exempt] = await Promise.all([
    db.select({ n: count() }).from(employees).where(inScope),
    db.select({ n: count() }).from(employees).where(and(ACTIVE, inScope)),
    db.select({ n: count() }).from(employees).where(and(ACTIVE, gte(employees.joiningDate, addDays(today, -30)), inScope)),
    db.select().from(attendanceRecords).where(and(eq(attendanceRecords.workDate, today), recScope)),
    onLeaveOn(today, empIdsForLeave),
    db
      .select({ employeeId: wfhRequests.employeeId })
      .from(wfhRequests)
      .where(
        and(
          eq(wfhRequests.status, "approved"),
          lte(wfhRequests.startDate, today),
          gte(wfhRequests.endDate, today),
          scopeIds === "all" ? undefined : inArray(wfhRequests.employeeId, scopeIds.length ? scopeIds : ["00000000-0000-0000-0000-000000000000"]),
        ),
      ),
    db.select({ id: employees.id }).from(employees).where(and(ACTIVE, inScope)),
    attendanceExemptIds(),
  ]);
  // Exempt employees (CEOs) don't count towards check-in figures.
  const todayRecs = allTodayRecs.filter((r) => !exempt.has(r.employeeId));
  const leaveIds = new Set(leaveToday.map((l) => l.employeeId));
  const expectedToday = activeIds.filter((e) => !exempt.has(e.id) && !leaveIds.has(e.id)).length;

  return {
    today,
    total: total?.n ?? 0,
    active: active?.n ?? 0,
    newJoiners: joiners?.n ?? 0,
    /** Active, not on leave and not attendance-exempt: who should check in today. */
    expectedToday,
    exemptIds: exempt,
    checkedIn: todayRecs.filter((r) => r.checkInAt).length,
    lateToday: todayRecs.filter((r) => r.lateMinutes > 0).length,
    onLeaveToday: new Set(leaveToday.map((l) => l.employeeId)).size,
    wfhToday: new Set(wfhToday.map((w) => w.employeeId)).size,
    todayRecords: todayRecs,
    leaveTodayIds: new Set(leaveToday.map((l) => l.employeeId)),
    wfhTodayIds: new Set(wfhToday.map((w) => w.employeeId)),
  };
}

export async function departmentDistribution() {
  const rows = await db
    .select({ id: departments.id, name: departments.name, n: count(employees.id) })
    .from(departments)
    .leftJoin(employees, and(eq(employees.departmentId, departments.id), ACTIVE))
    .where(eq(departments.isActive, true))
    .groupBy(departments.id, departments.name);
  const [unassigned] = await db.select({ n: count() }).from(employees).where(and(ACTIVE, isNull(employees.departmentId)));
  const list = rows.map((r) => ({ label: r.name, value: r.n, href: `/crm/employees?department=${r.id}` }));
  if (unassigned?.n) list.push({ label: "No department", value: unassigned.n, href: "/crm/employees" });
  return list.sort((a, b) => b.value - a.value);
}

/** Attendance rate (checked in / active headcount) for the last n working days. */
export async function attendanceTrend(scopeIds: string[] | "all", n = 14) {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const days = await workingDaysBack(today, n);
  if (!days.length) return [];
  const recScope = scopeIds === "all" ? undefined : inArray(attendanceRecords.employeeId, scopeIds.length ? scopeIds : ["00000000-0000-0000-0000-000000000000"]);
  // Exempt employees (CEOs) are left out of both sides of the rate.
  const exempt = [...(await attendanceExemptIds())];
  const rows = await db
    .select({ date: attendanceRecords.workDate, present: sql<number>`count(*) filter (where ${attendanceRecords.checkInAt} is not null)::int`, late: sql<number>`count(*) filter (where ${attendanceRecords.lateMinutes} > 0)::int` })
    .from(attendanceRecords)
    .where(and(gte(attendanceRecords.workDate, days[0]!), lte(attendanceRecords.workDate, today), recScope, exempt.length ? notInArray(attendanceRecords.employeeId, exempt) : undefined))
    .groupBy(attendanceRecords.workDate);
  const empScope = scopeIds === "all" ? undefined : inArray(employees.id, scopeIds.length ? scopeIds : ["00000000-0000-0000-0000-000000000000"]);
  const staff = await db
    .select({ joiningDate: employees.joiningDate, exitDate: employees.exitDate })
    .from(employees)
    .where(and(empScope, exempt.length ? notInArray(employees.id, exempt) : undefined));
  return days.map((d) => {
    const r = rows.find((x) => x.date === d);
    const headcount = staff.filter((s) => s.joiningDate <= d && (!s.exitDate || s.exitDate >= d)).length;
    const present = r?.present ?? 0;
    return {
      label: `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`,
      value: headcount ? Math.round((present / headcount) * 100) : 0,
      detail: `${present} of ${headcount} checked in${r?.late ? `, ${r.late} late` : ""}`,
    };
  });
}

/** Approved leave days this leave year, by type. */
export async function leaveByType(scopeIds: string[] | "all") {
  const { from, to } = await currentLeaveYear();
  const rows = await db
    .select({ name: leaveTypes.name, days: sql<string>`coalesce(sum(${leaveRequests.days}), 0)` })
    .from(leaveTypes)
    .leftJoin(
      leaveRequests,
      and(
        eq(leaveRequests.leaveTypeId, leaveTypes.id),
        eq(leaveRequests.status, "approved"),
        gte(leaveRequests.startDate, from),
        lte(leaveRequests.startDate, to),
        scopeIds === "all" ? undefined : inArray(leaveRequests.employeeId, scopeIds.length ? scopeIds : ["00000000-0000-0000-0000-000000000000"]),
      ),
    )
    .where(eq(leaveTypes.isActive, true))
    .groupBy(leaveTypes.id, leaveTypes.name, leaveTypes.sortOrder)
    .orderBy(asc(leaveTypes.sortOrder));
  return rows.map((r) => ({ label: r.name, value: Number(r.days) }));
}

/* ----------------------------------------------------------- action items */

export async function hrActionItems() {
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const [[leave], [wfh], [corr], [resets], onboarding, [probation]] = await Promise.all([
    db.select({ n: count() }).from(leaveRequests).where(eq(leaveRequests.status, "pending")),
    db.select({ n: count() }).from(wfhRequests).where(eq(wfhRequests.status, "pending")),
    db.select({ n: count() }).from(attendanceCorrections).where(eq(attendanceCorrections.status, "pending")),
    db.select({ n: count() }).from(passwordResetRequests).where(eq(passwordResetRequests.status, "pending")),
    db.selectDistinct({ id: onboardingTasks.employeeId }).from(onboardingTasks).where(isNull(onboardingTasks.completedAt)),
    db.select({ n: count() }).from(employees).where(and(eq(employees.employmentStatus, "probation"), lte(employees.joiningDate, addDays(today, -90)))),
  ]);
  return [
    { key: "leave", label: "Leave requests awaiting approval", count: leave?.n ?? 0, href: "/crm/leave?tab=approvals" },
    { key: "wfh", label: "Work-from-home requests awaiting approval", count: wfh?.n ?? 0, href: "/crm/wfh?tab=approvals" },
    { key: "corrections", label: "Attendance corrections to review", count: corr?.n ?? 0, href: "/crm/attendance?tab=corrections" },
    { key: "resets", label: "Password reset requests", count: resets?.n ?? 0, href: "/crm/settings/users?tab=requests" },
    { key: "onboarding", label: "New joiners with onboarding in progress", count: onboarding.length, href: "/crm/recruitment?tab=onboarding" },
    { key: "probation", label: "Employees past 90 days still on probation", count: probation?.n ?? 0, href: "/crm/employees?status=probation" },
  ];
}

/** Pending approvals for a manager's team (their reporting tree). */
export async function teamPendingApprovals(teamIds: string[]) {
  if (!teamIds.length) return { leave: [], wfh: [], corrections: 0 };
  const [leave, wfh, [corr]] = await Promise.all([
    db
      .select({ id: leaveRequests.id, employeeId: leaveRequests.employeeId, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, type: leaveTypes.name, startDate: leaveRequests.startDate, endDate: leaveRequests.endDate, days: leaveRequests.days })
      .from(leaveRequests)
      .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
      .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
      .where(and(eq(leaveRequests.status, "pending"), inArray(leaveRequests.employeeId, teamIds)))
      .orderBy(asc(leaveRequests.startDate))
      .limit(6),
    db
      .select({ id: wfhRequests.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, startDate: wfhRequests.startDate, endDate: wfhRequests.endDate })
      .from(wfhRequests)
      .innerJoin(employees, eq(employees.id, wfhRequests.employeeId))
      .where(and(eq(wfhRequests.status, "pending"), inArray(wfhRequests.employeeId, teamIds)))
      .orderBy(asc(wfhRequests.startDate))
      .limit(6),
    db.select({ n: count() }).from(attendanceCorrections).where(and(eq(attendanceCorrections.status, "pending"), inArray(attendanceCorrections.employeeId, teamIds))),
  ]);
  return { leave, wfh, corrections: corr?.n ?? 0 };
}

export async function teamOverview(viewer: Viewer) {
  if (!viewer.employee) return null;
  const teamIds = await getTeamEmployeeIds(viewer.employee.id);
  const [members, stats, approvals, taskCounts, reviewCounts] = await Promise.all([
    teamIds.length
      ? db
          .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, designation: designations.title, managerId: employees.managerId })
          .from(employees)
          .leftJoin(designations, eq(designations.id, employees.designationId))
          .where(and(inArray(employees.id, teamIds), ACTIVE))
          .orderBy(asc(employees.firstName))
      : Promise.resolve([]),
    peopleStats(teamIds),
    teamPendingApprovals(teamIds),
    teamIds.length
      ? db.select({ status: tasks.status, n: count() }).from(tasks).where(inArray(tasks.assigneeId, teamIds)).groupBy(tasks.status)
      : Promise.resolve([] as { status: string; n: number }[]),
    teamIds.length
      ? db.select({ status: performanceReviews.status, n: count() }).from(performanceReviews).where(inArray(performanceReviews.employeeId, teamIds)).groupBy(performanceReviews.status)
      : Promise.resolve([] as { status: string; n: number }[]),
  ]);

  const byId = new Map(stats.todayRecords.map((r) => [r.employeeId, r]));
  const roster = members.map((m) => {
    const rec = byId.get(m.id);
    const state = stats.exemptIds.has(m.id)
      ? "not_required"
      : stats.leaveTodayIds.has(m.id)
      ? "on_leave"
      : rec?.checkOutAt
        ? "checked_out"
        : rec?.checkInAt
          ? rec.workMode === "remote" || stats.wfhTodayIds.has(m.id)
            ? "remote"
            : "in_office"
          : stats.wfhTodayIds.has(m.id)
            ? "wfh_not_in"
            : "not_in";
    return { ...m, name: `${m.firstName} ${m.lastName}`.trim(), direct: m.managerId === viewer.employee!.id, state, late: (rec?.lateMinutes ?? 0) > 0 };
  });
  const t = (s: string) => taskCounts.find((x) => x.status === s)?.n ?? 0;
  const r = (s: string) => reviewCounts.find((x) => x.status === s)?.n ?? 0;
  return {
    teamIds,
    roster,
    stats,
    approvals,
    tasks: [
      { label: "To do", value: t("todo") },
      { label: "In progress", value: t("in_progress") },
      { label: "In review", value: t("review") },
      { label: "Completed", value: t("completed") },
    ],
    reviews: { selfAssessment: r("self_assessment"), managerReview: r("manager_review"), completed: r("completed") },
  };
}

/* ------------------------------------------------------------------ admin */

export async function adminOverview() {
  const [usersByStatus, usersByRole, latestRun, [openJobs], pipeline, recentActivity] = await Promise.all([
    db.select({ status: users.status, n: count() }).from(users).groupBy(users.status),
    db.select({ role: roles.name, n: count(users.id) }).from(roles).leftJoin(users, and(eq(users.roleId, roles.id), ne(users.status, "disabled"))).groupBy(roles.name),
    db.select().from(payrollRuns).orderBy(desc(payrollRuns.year), desc(payrollRuns.month)).limit(1),
    db.select({ n: count() }).from(jobOpenings).where(eq(jobOpenings.status, "open")),
    db.select({ stage: candidates.stage, n: count() }).from(candidates).innerJoin(jobOpenings, eq(jobOpenings.id, candidates.jobId)).where(ne(jobOpenings.status, "closed")).groupBy(candidates.stage),
    db
      .select({ id: auditLogs.id, summary: auditLogs.summary, action: auditLogs.action, createdAt: auditLogs.createdAt, actorEmail: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(ne(auditLogs.action, "auth.login_failed"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  let payroll: { label: string; status: string; employees: number; net: number } | null = null;
  const run = latestRun[0];
  if (run) {
    const [agg] = await db.select({ n: count(), net: sql<string>`coalesce(sum(${payslips.netPay}), 0)` }).from(payslips).where(eq(payslips.runId, run.id));
    payroll = {
      label: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(run.year, run.month - 1, 1))),
      status: run.status,
      employees: agg?.n ?? 0,
      net: Number(agg?.net ?? 0),
    };
  }
  const stage = (s: string) => pipeline.find((p) => p.stage === s)?.n ?? 0;
  return {
    users: {
      active: usersByStatus.find((u) => u.status === "active")?.n ?? 0,
      invited: usersByStatus.find((u) => u.status === "invited")?.n ?? 0,
      disabled: usersByStatus.find((u) => u.status === "disabled")?.n ?? 0,
      byRole: usersByRole,
    },
    payroll,
    recruitment: {
      openJobs: openJobs?.n ?? 0,
      pipeline: [
        { label: "Applied / screening", value: stage("applied") + stage("screening") },
        { label: "Interview", value: stage("interview") },
        { label: "Offer", value: stage("offer") },
        { label: "Hired", value: stage("hired") },
      ],
    },
    recentActivity,
  };
}

