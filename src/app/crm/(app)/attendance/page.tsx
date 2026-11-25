import type { Metadata } from "next";
import { and, eq, gte, lte } from "drizzle-orm";
import { Check, ChevronLeft, ChevronRight, Clock, Download, X } from "lucide-react";
import { CorrectionDialog, HrEditDialog } from "@/components/crm/attendance-forms";
import { ConfirmAction, inputClass } from "@/components/crm/forms";
import { Badge, ButtonLink, Card, CardBody, CardHeader, EmptyState, PageHeader, PersonCell, StatCard, StatusBadge, Table, TBody, THead, Tabs, buttonClass } from "@/components/crm/ui";
import { can, requireViewer, scopeFor } from "@/crm/auth/dal";
import { isIsoDate, yearMonthOr } from "@/crm/lib/params";
import { db } from "@/crm/db";
import { employees, leaveRequests, wfhRequests } from "@/crm/db/schema";
import { addDays, daysBetweenInclusive, endOfMonth, formatDate, formatMinutes, formatMonth, formatTime, isoWeekday, shiftLabel, startOfMonth, todayIn } from "@/crm/lib/time";
import { attendanceForDay, monthSummary, recordsBetween } from "@/crm/services/attendance";
import { listCorrections } from "@/crm/services/attendance-corrections";
import { getCompany, getHolidaysBetween, getScheduleForEmployee } from "@/crm/services/company";
import { reviewCorrectionAction } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({ searchParams }: PageProps<"/crm/attendance">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const company = await getCompany();
  const tz = company.timezone;
  const today = todayIn(tz);

  const teamScope = await scopeFor(viewer, "attendance.view_all", "attendance.view_team");
  const canTeam = teamScope.kind !== "self";
  const canReview = can(viewer, "attendance.manage", "attendance.approve_team");
  const tabs = [
    { key: "mine", label: "My attendance", href: "/crm/attendance" },
    ...(canTeam ? [{ key: "team", label: can(viewer, "attendance.view_all") ? "Everyone" : "My team", href: "/crm/attendance?tab=team" }] : []),
    ...(canReview ? [{ key: "corrections", label: "Corrections", href: "/crm/attendance?tab=corrections" }] : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : "mine";

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`Times are recorded by the server in ${tz.replace("_", " ")}. Ask for a correction if something's wrong — records can't be edited directly.`}
        actions={viewer.employee ? <CorrectionDialog today={today} /> : undefined}
      />
      <Tabs tabs={tabs} active={tab} />
      {tab === "mine" && <MyAttendance month={yearMonthOr(sp.month, today.slice(0, 7))} />}
      {tab === "team" && canTeam && <TeamDay date={isIsoDate(sp.date) && sp.date <= today ? sp.date : today} />}
      {tab === "corrections" && canReview && <Corrections />}
    </>
  );
}

/* ------------------------------------------------------------------ mine */

async function MyAttendance({ month }: { month: string }) {
  const viewer = await requireViewer();
  if (!viewer.employee) return <Card><EmptyState title="Your account isn't linked to an employee record" /></Card>;
  const company = await getCompany();
  const tz = company.timezone;
  const today = todayIn(tz);
  const from = `${month}-01`;
  const to = endOfMonth(from);
  const empId = viewer.employee.id;

  const [summary, recs, holidays, schedule, leaves, wfh, mine, employment] = await Promise.all([
    monthSummary(empId, from, to),
    recordsBetween([empId], from, to),
    getHolidaysBetween(from, to),
    getScheduleForEmployee(empId),
    db.select().from(leaveRequests).where(and(eq(leaveRequests.employeeId, empId), eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, to), gte(leaveRequests.endDate, from))),
    db.select().from(wfhRequests).where(and(eq(wfhRequests.employeeId, empId), eq(wfhRequests.status, "approved"), lte(wfhRequests.startDate, to), gte(wfhRequests.endDate, from))),
    listCorrections(viewer, "mine"),
    db.query.employees.findFirst({ where: eq(employees.id, empId), columns: { joiningDate: true, exitDate: true } }),
  ]);
  const byDate = new Map(recs.map((r) => [r.workDate, r]));
  const prev = startOfMonth(addDays(from, -1)).slice(0, 7);
  const next = addDays(to, 1).slice(0, 7);
  const days = daysBetweenInclusive(from, to);
  const lead = isoWeekday(from) - 1;

  const cell = (d: string) => {
    // Days outside the employment period are neither present nor absent.
    if (employment && (d < employment.joiningDate || (employment.exitDate && d > employment.exitDate))) return { label: "", tone: "muted" };
    const r = byDate.get(d);
    const hol = holidays.find((h) => h.date === d);
    const leave = leaves.find((l) => l.startDate <= d && l.endDate >= d);
    const remote = wfh.some((w) => w.startDate <= d && w.endDate >= d);
    const working = schedule.workingDays.includes(isoWeekday(d)) && !(hol && hol.type === "public");
    if (r?.checkInAt) return { label: r.status === "incomplete" ? (d === today ? "Working" : "No check-out") : r.status === "half_day" ? "Half day" : r.status === "absent" ? "Short day" : "Present", tone: r.status === "present" ? "success" : r.status === "half_day" || r.status === "incomplete" ? "warning" : "danger", r, remote: r.workMode === "remote" };
    if (leave) return { label: leave.halfDay === "none" ? "Leave" : "Half leave", tone: "info" };
    if (hol) return { label: hol.name, tone: "accent" };
    if (!working) return { label: "Off", tone: "muted" };
    if (d < today) return { label: "Absent", tone: "danger" };
    return { label: remote ? "WFH" : "", tone: "muted" };
  };
  const toneCls: Record<string, string> = {
    success: "bg-c-success-soft text-c-success",
    warning: "bg-c-warning-soft text-c-warning",
    danger: "bg-c-danger-soft text-c-danger",
    info: "bg-c-info-soft text-c-info",
    accent: "bg-c-accent-soft text-c-accent-text",
    muted: "text-c-subtle",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Working days" value={summary.workingDays} hint="So far this month" />
        <StatCard label="Present" value={summary.present} tone="success" />
        <StatCard label="Half days" value={summary.halfDays} tone="warning" />
        <StatCard label="Late arrivals" value={summary.late} tone="warning" />
        <StatCard label="Leave" value={summary.leaveDays} tone="info" />
        <StatCard label="Hours worked" value={formatMinutes(summary.workedMinutes)} />
      </div>

      <Card>
        <CardHeader
          title={formatMonth(from)}
          description={`${shiftLabel(schedule)} · late after ${schedule.lateGraceMinutes} min`}
          action={
            <div className="flex gap-1">
              <ButtonLink href={`/crm/attendance?month=${prev}`} size="icon" variant="ghost" aria-label="Previous month">
                <ChevronLeft />
              </ButtonLink>
              <ButtonLink href={`/crm/attendance?month=${today.slice(0, 7)}`} size="sm" variant="ghost">
                Today
              </ButtonLink>
              {next <= today.slice(0, 7) && (
                <ButtonLink href={`/crm/attendance?month=${next}`} size="icon" variant="ghost" aria-label="Next month">
                  <ChevronRight />
                </ButtonLink>
              )}
            </div>
          }
        />
        <CardBody className="p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1 text-center text-[0.6875rem] font-medium text-c-subtle sm:gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="pb-1">
                {d}
              </div>
            ))}
            {Array.from({ length: lead }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((d) => {
              const c = cell(d);
              return (
                <div key={d} className={cn("flex min-h-14 flex-col rounded-lg border border-c-border p-1.5 text-left sm:min-h-20 sm:p-2", d === today && "ring-2 ring-c-accent/50", d > today && "opacity-60")}>
                  <span className="tabular text-xs font-semibold text-c-fg">{Number(d.slice(8))}</span>
                  {c.label && <span className={cn("mt-auto truncate rounded px-1 py-0.5 text-[0.625rem] leading-tight font-medium sm:text-[0.6875rem]", toneCls[c.tone])}>{c.label}</span>}
                  {"r" in c && c.r && (
                    <span className="tabular mt-0.5 hidden truncate text-[0.625rem] text-c-muted sm:block">
                      {formatTime(c.r.checkInAt, tz)}–{c.r.checkOutAt ? formatTime(c.r.checkOutAt, tz) : "…"}
                      {c.remote && " · remote"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Daily log" />
          {recs.length ? (
            <Table>
              <THead>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th className="hidden sm:table-cell">Breaks</th>
                  <th>Worked</th>
                  <th>Status</th>
                </tr>
              </THead>
              <TBody>
                {[...recs].reverse().map((r) => (
                  <tr key={r.id}>
                    <td className="tabular whitespace-nowrap">
                      {formatDate(r.workDate)}
                      {r.correctedAt && <Badge className="ml-2">Corrected</Badge>}
                    </td>
                    <td className="tabular">
                      {formatTime(r.checkInAt, tz)}
                      {r.lateMinutes > 0 && <span className="ml-1 text-xs text-c-warning">+{r.lateMinutes}m</span>}
                    </td>
                    <td className="tabular">
                      {formatTime(r.checkOutAt, tz)}
                      {r.earlyLeaveMinutes > 0 && <span className="ml-1 text-xs text-c-warning">−{r.earlyLeaveMinutes}m</span>}
                    </td>
                    <td className="tabular hidden sm:table-cell">{formatMinutes(r.breakMinutes)}</td>
                    <td className="tabular">{formatMinutes(r.workedMinutes)}</td>
                    <td>
                      <StatusBadge status={r.status} label={r.status === "absent" ? "Short day" : undefined} />
                    </td>
                  </tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={<Clock />} title="No attendance this month" />
          )}
        </Card>
        <Card>
          <CardHeader title="My correction requests" />
          {mine.length ? (
            <ul className="divide-y divide-c-border">
              {mine.map((c) => (
                <li key={c.id} className="space-y-1 px-5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{formatDate(c.workDate)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-c-muted">
                    In {formatTime(c.requestedCheckInAt, tz)} · Out {formatTime(c.requestedCheckOutAt, tz)}
                  </p>
                  <p className="text-xs text-c-muted">{c.reason}</p>
                  {c.reviewComment && <p className="text-xs text-c-subtle">Reviewer: {c.reviewComment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No correction requests" />
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ team */

async function TeamDay({ date }: { date: string }) {
  const viewer = await requireViewer();
  const scope = await scopeFor(viewer, "attendance.view_all", "attendance.view_team");
  const company = await getCompany();
  const tz = company.timezone;
  const today = todayIn(tz);
  const ids = scope.kind === "all" ? "all" : scope.employeeIds;
  const rows = await attendanceForDay(ids, date);
  const hrEdit = can(viewer, "attendance.manage");
  const present = rows.filter((r) => r.record?.checkInAt).length;
  const late = rows.filter((r) => (r.record?.lateMinutes ?? 0) > 0).length;
  const leave = rows.filter((r) => r.onLeave).length;
  const remote = rows.filter((r) => r.record?.workMode === "remote" || (r.wfh && !r.record)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="flex items-end gap-2">
          <input type="hidden" name="tab" value="team" />
          <label className="text-[0.8125rem] font-medium">
            <span className="mb-1.5 block">Date</span>
            <input type="date" name="date" defaultValue={date} max={today} className={inputClass} />
          </label>
          <button type="submit" className={buttonClass("secondary")}>
            Show
          </button>
        </form>
        {can(viewer, "reports.view_all", "reports.view_team") && (
          <a href={`/crm/api/reports/attendance?from=${startOfMonth(date)}&to=${date}`} className={buttonClass("secondary")}>
            <Download /> Export month to date
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Checked in" value={`${present}/${rows.length}`} tone="success" />
        <StatCard label="Late" value={late} tone="warning" />
        <StatCard label="On leave" value={leave} tone="info" />
        <StatCard label="Remote" value={remote} />
      </div>
      <Card>
        <CardHeader title={formatDate(date)} description={`${rows.length} people`} />
        {rows.length ? (
          <Table>
            <THead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>In</th>
                <th>Out</th>
                <th className="hidden md:table-cell">Worked</th>
                {hrEdit && <th className="w-10"><span className="sr-only">Edit</span></th>}
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const rec = r.record;
                return (
                  <tr key={r.id}>
                    <td>
                      <PersonCell name={r.name} sub={`${r.employeeCode} · ${r.shift}`} photoFileId={r.photoFileId} href={`/crm/employees/${r.id}?tab=attendance`} />
                    </td>
                    <td>
                      {rec?.checkInAt ? (
                        <span className="flex flex-wrap gap-1">
                          <StatusBadge status={rec.status === "incomplete" ? (date === today ? "in_progress" : "incomplete") : rec.status} label={rec.status === "incomplete" ? (date === today ? (rec.workMode === "remote" ? "Working remotely" : "In office") : "No check-out") : rec.status === "absent" ? "Short day" : undefined} />
                          {rec.lateMinutes > 0 && <Badge tone="warning">Late {rec.lateMinutes}m</Badge>}
                        </span>
                      ) : r.onLeave ? (
                        <Badge tone="info">{r.onLeave === "none" ? "On leave" : "Half-day leave"}</Badge>
                      ) : r.wfh ? (
                        <Badge>WFH · not in</Badge>
                      ) : (
                        <Badge>Not checked in</Badge>
                      )}
                    </td>
                    <td className="tabular">{formatTime(rec?.checkInAt, tz)}</td>
                    <td className="tabular">{formatTime(rec?.checkOutAt, tz)}</td>
                    <td className="tabular hidden md:table-cell">{rec ? formatMinutes(rec.workedMinutes) : "—"}</td>
                    {hrEdit && (
                      <td>
                        {r.id !== viewer.employee?.id && (
                          <HrEditDialog employeeId={r.id} name={r.name} date={date} checkIn={rec?.checkInAt ? formatTime(rec.checkInAt, tz) : ""} checkOut={rec?.checkOutAt ? formatTime(rec.checkOutAt, tz) : ""} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="No one in scope" />
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ corrections */

async function Corrections() {
  const viewer = await requireViewer();
  const company = await getCompany();
  const tz = company.timezone;
  const rows = await listCorrections(viewer, "review");
  if (!rows.length) return <Card><EmptyState icon={<Check />} title="No correction requests" description="Requests from your team appear here." /></Card>;
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Requested</th>
            <th className="hidden lg:table-cell">Reason</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </THead>
        <TBody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <PersonCell name={`${c.firstName} ${c.lastName}`} photoFileId={c.photoFileId} href={`/crm/employees/${c.employeeId}?tab=attendance`} />
              </td>
              <td className="tabular whitespace-nowrap">{formatDate(c.workDate)}</td>
              <td className="tabular text-[0.8125rem] whitespace-nowrap">
                In {formatTime(c.requestedCheckInAt, tz)}
                <br />
                Out {formatTime(c.requestedCheckOutAt, tz)}
                {c.previousValues && (
                  <span className="block text-xs text-c-subtle">
                    was {formatTime(c.previousValues.checkInAt ? new Date(c.previousValues.checkInAt) : null, tz)}–{formatTime(c.previousValues.checkOutAt ? new Date(c.previousValues.checkOutAt) : null, tz)}
                  </span>
                )}
              </td>
              <td className="hidden max-w-xs text-[0.8125rem] text-c-muted lg:table-cell">{c.reason}</td>
              <td>
                <StatusBadge status={c.status} />
                {c.reviewerEmail && <span className="block text-xs text-c-subtle">{c.reviewerEmail}</span>}
              </td>
              <td className="text-right">
                {c.status === "pending" && c.employeeId !== viewer.employee?.id && (
                  <div className="flex justify-end gap-1.5">
                    <ConfirmAction action={reviewCorrectionAction} fields={{ id: c.id, decision: "approve" }} label="Approve" icon={<Check />} title="Approve this correction?" description="The record is updated to the requested times; the previous times are kept." confirmLabel="Approve" withComment />
                    <ConfirmAction action={reviewCorrectionAction} fields={{ id: c.id, decision: "reject" }} label="Reject" icon={<X />} variant="ghost" confirmVariant="danger" title="Reject this correction?" confirmLabel="Reject" withComment commentLabel="Reason" />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

