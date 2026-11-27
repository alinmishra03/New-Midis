import type { Metadata } from "next";
import { Briefcase, CalendarOff, Clock, FileText, History, House, KeyRound, ListChecks, Settings, ShieldCheck, TriangleAlert, UserCheck, UserPlus, Users, Wallet } from "lucide-react";
import { BarList, ColumnChart, SegmentedBar } from "@/components/crm/charts";
import { CheckInCard, type CheckInState } from "@/components/crm/CheckInCard";
import {
  ActionItems,
  ActivityList,
  AnnouncementList,
  CelebrationList,
  HolidayList,
  LeaveBalances,
  ListCard,
  MeetingList,
  MonthSummary,
  PendingApprovals,
  QuickLinks,
  TaskList,
  TeamRoster,
  TeamTasks,
  ViewAll,
} from "@/components/crm/dashboard";
import { Badge, ButtonLink, Card, CardBody, CardHeader, EmptyState, StatCard, StatusBadge } from "@/components/crm/ui";
import { can, getTeamEmployeeIds, requireViewer } from "@/crm/auth/dal";
import { formatClock, formatDate, formatDateShort, shiftLabel, zonedMinutes } from "@/crm/lib/time";
import { getTodayState } from "@/crm/services/attendance";
import { getCompany } from "@/crm/services/company";
import {
  adminOverview,
  attendanceTrend,
  celebrations,
  departmentDistribution,
  hrActionItems,
  leaveByType,
  peopleStats,
  personalSummary,
  recentAnnouncements,
  teamOverview,
} from "@/crm/services/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const company = await getCompany();
  const tz = company.timezone;

  const isAdmin = viewer.role.key === "super_admin";
  const isHR = !isAdmin && can(viewer, "employees.manage");
  const isFinance = can(viewer, "payroll.approve");
  const teamIds = viewer.employee ? await getTeamEmployeeIds(viewer.employee.id) : [];
  const isManager = teamIds.length > 0 || viewer.role.key === "manager";

  const [personal, today, announcements, company30] = await Promise.all([
    personalSummary(viewer),
    viewer.employee ? getTodayState(viewer.employee.id) : null,
    recentAnnouncements(viewer, 4),
    celebrations(30),
  ]);

  const hour = Math.floor(zonedMinutes(new Date(), tz) / 60);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const checkIn: CheckInState | null = today && {
    timezone: tz,
    isWorkingDay: today.ctx.isWorkingDay,
    isHoliday: today.ctx.isHoliday,
    onLeave: today.ctx.leave ? (today.ctx.leave.halfDay === "none" ? "full" : "half") : "none",
    wfhApproved: today.ctx.wfh,
    allowUnplannedRemote: today.ctx.schedule.allowUnplannedRemote,
    scheduleLabel: shiftLabel(today.ctx.schedule),
    scheduleStart: formatClock(today.ctx.schedule.startTime),
    checkInAt: today.record?.checkInAt?.toISOString() ?? null,
    checkOutAt: today.record?.checkOutAt?.toISOString() ?? null,
    checkOutAuto: today.record?.checkOutSource === "auto",
    workMode: today.record?.workMode ?? null,
    lateMinutes: today.record?.lateMinutes ?? 0,
    breakMinutes: today.record?.breakMinutes ?? 0,
    workedMinutes: today.record?.workedMinutes ?? 0,
    openBreakStartedAt: today.openBreak?.startAt.toISOString() ?? null,
    closedBreakMinutes: Math.round(
      today.breaks.filter((b) => b.endAt).reduce((s, b) => s + (b.endAt!.getTime() - b.startAt.getTime()) / 60000, 0),
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.8125rem] text-c-muted">{formatDate(personal?.today ?? null)}</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
            {greeting}, {viewer.employee?.firstName ?? "there"}
          </h1>
          {personal?.profile && (
            <p className="mt-1 text-sm text-c-muted">
              {[personal.profile.designation, personal.profile.department].filter(Boolean).join(" · ") || "No designation set"}
              {personal.profile.manager && ` · Reports to ${personal.profile.manager}`}
            </p>
          )}
        </div>
        <Badge tone="accent">{viewer.role.name}</Badge>
      </div>

      {/* ------------------------------------------------ my day (everyone) */}
      {personal && checkIn && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Today's attendance" action={<ViewAll href="/crm/attendance">History</ViewAll>} />
            <CardBody>
              {today?.exempt ? (
                <p className="text-sm text-c-muted">You don&apos;t need to check in or out — attendance isn&apos;t recorded for your role.</p>
              ) : (
                <CheckInCard state={checkIn} />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="This month" description="Your attendance so far" action={<ViewAll href="/crm/attendance">Calendar</ViewAll>} />
            <CardBody>
              <MonthSummary month={personal.month} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Leave balance" action={<ButtonLink href="/crm/leave?apply=1" size="sm" variant="secondary">Apply</ButtonLink>} />
            <CardBody>
              <LeaveBalances balances={personal.balances} />
            </CardBody>
          </Card>
        </div>
      )}

      {!viewer.employee && (
        <Card>
          <EmptyState icon={<TriangleAlert />} title="Your account isn't linked to an employee record" description="Personal features (attendance, leave, payslips) need an employee record. Ask HR or a Super Admin to link it." />
        </Card>
      )}

      {/* ------------------------------------------------------- role views */}
      {(isAdmin || isHR) && <CompanySection admin={isAdmin} />}
      {isManager && <TeamSection />}
      {isFinance && !isAdmin && <PayrollSection />}

      {/* -------------------------------------------------- personal lists */}
      {personal && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ListCard title="My tasks" action={<ViewAll href="/crm/tasks" />} className="lg:col-span-2">
            <TaskList tasks={personal.myTasks} />
          </ListCard>
          <ListCard title="Upcoming meetings" action={<ViewAll href="/crm/calendar" />}>
            <MeetingList meetings={personal.upcomingMeetings} timezone={tz} />
          </ListCard>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Announcements" action={<ViewAll href="/crm/announcements" />} className="lg:col-span-2">
          <AnnouncementList items={announcements} />
        </ListCard>
        <ListCard title="Birthdays & anniversaries" action={<ViewAll href="/crm/calendar" />}>
          <CelebrationList items={company30} />
        </ListCard>
      </div>

      {personal && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ListCard title="Pending leave requests" action={<ViewAll href="/crm/leave" />}>
            {personal.pendingLeave.length ? (
              <ul className="divide-y divide-c-border">
                {personal.pendingLeave.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{l.type}</span>
                      <span className="text-xs text-c-muted">
                        {formatDateShort(l.startDate)}
                        {l.endDate !== l.startDate && ` – ${formatDateShort(l.endDate)}`} · {Number(l.days)} day{Number(l.days) === 1 ? "" : "s"}
                      </span>
                    </span>
                    <StatusBadge status="pending" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarOff />} title="No pending requests" />
            )}
          </ListCard>
          <ListCard title="Upcoming holidays" action={<ViewAll href="/crm/calendar" />}>
            <HolidayList holidays={personal.holidays} />
          </ListCard>
          <ListCard title="My recent activity">
            <ActivityList items={personal.activity} />
          </ListCard>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- HR + admin */

async function CompanySection({ admin }: { admin: boolean }) {
  const [stats, depts, trend, leave, actions, overview] = await Promise.all([
    peopleStats("all"),
    departmentDistribution(),
    attendanceTrend("all", 14),
    leaveByType("all"),
    hrActionItems(),
    admin ? adminOverview() : null,
  ]);
  const expected = stats.expectedToday;

  return (
    <section aria-labelledby="company-h" className="space-y-4">
      <h2 id="company-h" className="text-base font-semibold">
        {admin ? "Company overview" : "HR overview"}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total employees" value={stats.total} icon={<Users />} href="/crm/employees" />
        <StatCard label="Active employees" value={stats.active} icon={<UserCheck />} tone="success" href="/crm/employees?status=active" />
        <StatCard label="Checked in today" value={`${stats.checkedIn}/${expected}`} icon={<Clock />} tone="info" href="/crm/attendance?tab=team" />
        <StatCard label="Late arrivals" value={stats.lateToday} icon={<TriangleAlert />} tone="warning" href="/crm/attendance?tab=team" />
        <StatCard label="On leave today" value={stats.onLeaveToday} hint={stats.wfhToday ? `${stats.wfhToday} working from home` : undefined} icon={<CalendarOff />} tone="accent" href="/crm/leave?tab=calendar" />
        <StatCard label="New joiners" value={stats.newJoiners} hint="Last 30 days" icon={<UserPlus />} href="/crm/employees?sort=joined" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance rate" description="Share of staff checked in, last 14 working days" />
          <CardBody>
            <ColumnChart data={trend} max={100} suffix="%" label="Attendance rate by day" valueLabel="Checked in" />
          </CardBody>
        </Card>
        <ListCard title="HR action items">
          <ActionItems items={actions} />
        </ListCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Employees by department" action={<ViewAll href="/crm/employees" />} />
          <CardBody>
            <BarList items={depts} empty="No employees yet." />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Leave taken this year" description="Approved days by type" action={<ViewAll href="/crm/reports?r=leave" />} />
          <CardBody>
            <BarList items={leave} suffix=" d" empty="No approved leave yet this year." />
          </CardBody>
        </Card>
        {overview ? (
          <Card>
            <CardHeader title="Payroll" action={<ViewAll href="/crm/payroll" />} />
            <CardBody>
              {overview.payroll ? (
                <div>
                  <p className="text-[0.8125rem] text-c-muted">{overview.payroll.label}</p>
                  <p className="tabular mt-1 text-2xl font-semibold">{inr.format(overview.payroll.net)}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-c-muted">
                    <StatusBadge status={overview.payroll.status} /> {overview.payroll.employees} payslips
                  </p>
                </div>
              ) : (
                <EmptyState icon={<Wallet />} title="No payroll runs yet" action={<ButtonLink href="/crm/payroll" size="sm">Open payroll</ButtonLink>} />
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Quick actions" />
            <QuickLinks
              links={[
                { label: "Add employee", href: "/crm/employees/new", icon: <UserPlus /> },
                { label: "Approvals", href: "/crm/leave?tab=approvals", icon: <CalendarOff /> },
                { label: "Attendance", href: "/crm/attendance?tab=team", icon: <Clock /> },
                { label: "Documents", href: "/crm/documents", icon: <FileText /> },
                { label: "Recruitment", href: "/crm/recruitment", icon: <Briefcase /> },
                { label: "Reports", href: "/crm/reports", icon: <ListChecks /> },
              ]}
            />
          </Card>
        )}
      </div>

      {overview && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Recruitment" description={`${overview.recruitment.openJobs} open position${overview.recruitment.openJobs === 1 ? "" : "s"}`} action={<ViewAll href="/crm/recruitment" />} />
            <CardBody>
              <SegmentedBar segments={overview.recruitment.pipeline} label="Candidates by stage" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="User accounts" action={<ViewAll href="/crm/settings/users">Manage</ViewAll>} />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Active", overview.users.active],
                  ["Invited", overview.users.invited],
                  ["Disabled", overview.users.disabled],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-c-surface-2 py-2.5">
                    <p className="tabular text-lg font-semibold">{v}</p>
                    <p className="text-[0.6875rem] text-c-muted">{l}</p>
                  </div>
                ))}
              </div>
              <BarList items={overview.users.byRole.map((r) => ({ label: r.role, value: r.n }))} />
            </CardBody>
          </Card>
          <ListCard title="System activity" action={<ViewAll href="/crm/settings/audit" />}>
            <ActivityList items={overview.recentActivity} />
          </ListCard>
        </div>
      )}

      {admin && (
        <Card>
          <CardHeader title="Administration" />
          <QuickLinks
            links={[
              { label: "Users & invites", href: "/crm/settings/users", icon: <KeyRound /> },
              { label: "Roles & permissions", href: "/crm/settings/roles", icon: <ShieldCheck /> },
              { label: "Company settings", href: "/crm/settings", icon: <Settings /> },
              { label: "Leave & attendance policy", href: "/crm/settings/policies", icon: <CalendarOff /> },
              { label: "Work from home", href: "/crm/wfh?tab=approvals", icon: <House /> },
              { label: "Audit log", href: "/crm/settings/audit", icon: <History /> },
            ]}
          />
        </Card>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- managers */

async function TeamSection() {
  const viewer = await requireViewer();
  const team = await teamOverview(viewer);
  if (!team) return null;
  const s = team.stats;
  const inOffice = team.roster.filter((r) => r.state === "in_office").length;
  const remote = team.roster.filter((r) => r.state === "remote").length;
  const trend = await attendanceTrend(team.teamIds, 10);

  return (
    <section aria-labelledby="team-h" className="space-y-4">
      <h2 id="team-h" className="text-base font-semibold">
        My team
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Team members" value={team.roster.length} icon={<Users />} />
        <StatCard label="Available today" value={`${inOffice + remote}`} hint={`${inOffice} in office · ${remote} remote`} icon={<UserCheck />} tone="success" />
        <StatCard label="On leave today" value={s.onLeaveToday} icon={<CalendarOff />} tone="accent" />
        <StatCard label="Pending approvals" value={team.approvals.leave.length + team.approvals.wfh.length + team.approvals.corrections} icon={<ListChecks />} tone="warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Team availability today" action={<ViewAll href="/crm/attendance?tab=team" />} className="lg:col-span-2">
          <TeamRoster roster={team.roster} />
        </ListCard>
        <ListCard title="Pending approvals" action={<ViewAll href="/crm/leave?tab=approvals" />}>
          <PendingApprovals approvals={team.approvals} />
        </ListCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Team task progress" action={<ViewAll href="/crm/tasks?view=team" />} />
          <TeamTasks tasks={team.tasks} />
        </Card>
        <Card>
          <CardHeader title="Performance reviews" action={<ViewAll href="/crm/performance" />} />
          <CardBody>
            <SegmentedBar
              label="Team reviews by status"
              segments={[
                { label: "Self-assessment", value: team.reviews.selfAssessment },
                { label: "Awaiting you", value: team.reviews.managerReview },
                { label: "Completed", value: team.reviews.completed },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Team attendance" description="Last 10 working days" />
          <CardBody>
            <ColumnChart data={trend} max={100} height={150} suffix="%" label="Team attendance rate" />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- finance */

async function PayrollSection() {
  const overview = await adminOverview();
  return (
    <section aria-labelledby="payroll-h" className="space-y-4">
      <h2 id="payroll-h" className="text-base font-semibold">
        Payroll
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Latest run" value={overview.payroll?.label ?? "None yet"} icon={<Wallet />} href="/crm/payroll" />
        <StatCard label="Net pay" value={overview.payroll ? inr.format(overview.payroll.net) : "—"} hint={overview.payroll ? `${overview.payroll.employees} payslips` : undefined} />
        <StatCard label="Status" value={overview.payroll ? <StatusBadge status={overview.payroll.status} /> : "—"} />
      </div>
    </section>
  );
}

