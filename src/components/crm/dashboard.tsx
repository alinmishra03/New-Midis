import { ArrowRight, Cake, CalendarDays, CircleCheck, Clock, Inbox, Megaphone, PartyPopper, Timer, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { personalSummary, teamOverview, celebrations, recentAnnouncements } from "@/crm/services/dashboard";
import { formatDate, formatDateShort, formatDateTime, formatMinutes, formatRelative, formatWeekday } from "@/crm/lib/time";
import { cn } from "@/lib/utils";
import { SegmentedBar } from "./charts";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, ProgressBar, StatusBadge, humanize } from "./ui";

type Personal = NonNullable<Awaited<ReturnType<typeof personalSummary>>>;
type Team = NonNullable<Awaited<ReturnType<typeof teamOverview>>>;

export function ViewAll({ href, children = "View all" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-c-accent-text hover:underline">
      {children} <ArrowRight className="size-3.5" />
    </Link>
  );
}

export function ListCard({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader title={title} action={action} />
      <div className="flex-1">{children}</div>
    </Card>
  );
}

export function MonthSummary({ month }: { month: Personal["month"] }) {
  const items = [
    { label: "Present", value: month.present },
    { label: "Half days", value: month.halfDays },
    { label: "Late", value: month.late },
    { label: "Leave", value: month.leaveDays },
    { label: "Absent", value: month.absent },
  ];
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg bg-c-surface-2 px-2 py-2.5 text-center">
            <p className="tabular text-lg font-semibold">{i.value}</p>
            <p className="text-[0.6875rem] text-c-muted">{i.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-c-subtle">
        {formatMinutes(month.workedMinutes)} worked over {month.workingDays} working day{month.workingDays === 1 ? "" : "s"} so far this month.
      </p>
    </div>
  );
}

export function LeaveBalances({ balances }: { balances: Personal["balances"] }) {
  const shown = balances.filter((b) => !b.unlimited);
  if (!shown.length) return <EmptyState title="No leave types configured" />;
  return (
    <ul className="space-y-3.5">
      {shown.map((b) => {
        const total = b.allocated + b.carriedForward + b.adjustment;
        return (
          <li key={b.leaveTypeId}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.8125rem]">
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full" style={{ background: b.color }} />
                {b.name}
              </span>
              <span className="tabular text-c-muted">
                <span className="font-semibold text-c-fg">{b.available}</span> of {total} left
                {b.pending > 0 && ` · ${b.pending} pending`}
              </span>
            </div>
            <ProgressBar value={total ? ((b.used + b.pending) / total) * 100 : 0} tone="accent" label={`${b.name} used`} />
          </li>
        );
      })}
    </ul>
  );
}

export function TaskList({ tasks, empty = "No open tasks assigned to you." }: { tasks: Personal["myTasks"]; empty?: string }) {
  if (!tasks.length) return <EmptyState icon={<CircleCheck />} title="Nothing on your plate" description={empty} />;
  return (
    <ul className="divide-y divide-c-border">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link href={`/crm/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-c-surface-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{t.title}</span>
              <span className="mt-1 flex items-center gap-2 text-xs text-c-muted">
                <StatusBadge status={t.status} />
                {t.priority === "urgent" || t.priority === "high" ? <Badge tone={t.priority === "urgent" ? "danger" : "warning"}>{humanize(t.priority)}</Badge> : null}
                {t.dueDate && <span>Due {formatDateShort(t.dueDate)}</span>}
              </span>
            </span>
            <span className="tabular w-10 text-right text-xs text-c-muted">{t.progress}%</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MeetingList({ meetings, timezone }: { meetings: Personal["upcomingMeetings"]; timezone: string }) {
  if (!meetings.length) return <EmptyState icon={<CalendarDays />} title="No upcoming meetings" />;
  return (
    <ul className="divide-y divide-c-border">
      {meetings.map((m) => (
        <li key={m.id} className="flex items-start gap-3 px-5 py-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-c-info-soft text-c-info">
            <Clock className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{m.title}</span>
            <span className="block text-xs text-c-muted">
              {formatDateTime(m.startAt, timezone)}
              {m.location ? ` · ${m.location}` : ""}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HolidayList({ holidays }: { holidays: Personal["holidays"] }) {
  if (!holidays.length) return <EmptyState icon={<PartyPopper />} title="No holidays in the next 90 days" />;
  return (
    <ul className="divide-y divide-c-border">
      {holidays.map((h) => (
        <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-c-border py-1 leading-none">
              <span className="text-[0.625rem] text-c-subtle uppercase">{formatWeekday(h.date)}</span>
              <span className="tabular mt-0.5 text-sm font-semibold">{Number(h.date.slice(8))}</span>
            </span>
            <span className="truncate text-sm">{h.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-c-muted">
            {h.type === "optional" && <Badge>Optional</Badge>}
            {formatDate(h.date)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CelebrationList({ items }: { items: Awaited<ReturnType<typeof celebrations>> }) {
  if (!items.length) return <EmptyState icon={<Cake />} title="No birthdays or work anniversaries in the next 30 days" />;
  return (
    <ul className="divide-y divide-c-border">
      {items.map((c) => (
        <li key={`${c.employeeId}-${c.kind}`} className="flex items-center gap-3 px-5 py-2.5">
          <Avatar name={c.name} photoFileId={c.photoFileId} size={30} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{c.name}</span>
            <span className="block text-xs text-c-muted">{c.kind === "birthday" ? "Birthday" : `${c.years} year${c.years === 1 ? "" : "s"} at MIDIS`}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-c-muted">
            {c.kind === "birthday" ? <Cake className="size-3.5 text-c-accent-text" /> : <PartyPopper className="size-3.5 text-c-accent-text" />}
            {formatDateShort(c.date)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AnnouncementList({ items }: { items: Awaited<ReturnType<typeof recentAnnouncements>> }) {
  if (!items.length) return <EmptyState icon={<Megaphone />} title="No announcements yet" />;
  return (
    <ul className="divide-y divide-c-border">
      {items.map((a) => (
        <li key={a.id}>
          <Link href={`/crm/announcements/${a.id}`} className="block px-5 py-3 hover:bg-c-surface-2">
            <span className="flex items-center gap-2">
              {a.isImportant && <Badge tone="danger">Important</Badge>}
              <Badge>{humanize(a.category)}</Badge>
              <span className="text-xs text-c-subtle">{a.publishedAt ? formatRelative(a.publishedAt) : ""}</span>
            </span>
            <span className="mt-1.5 block text-sm font-medium">{a.title}</span>
            <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] text-c-muted">{a.body}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActivityList({ items }: { items: { id: number; summary: string; createdAt: Date; actorEmail?: string | null }[] }) {
  if (!items.length) return <EmptyState icon={<Inbox />} title="No activity yet" />;
  return (
    <ul className="space-y-3 px-5 py-4">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 text-[0.8125rem]">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-c-border-strong" />
          <span className="min-w-0">
            <span className="block text-c-fg">{a.summary}</span>
            <span className="text-xs text-c-subtle">
              {a.actorEmail ? `${a.actorEmail} · ` : ""}
              {formatRelative(a.createdAt)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const ROSTER_STATE: Record<string, { label: string; tone: "success" | "info" | "neutral" | "warning" }> = {
  in_office: { label: "In office", tone: "success" },
  remote: { label: "Remote", tone: "info" },
  checked_out: { label: "Checked out", tone: "neutral" },
  on_leave: { label: "On leave", tone: "warning" },
  wfh_not_in: { label: "WFH · not in yet", tone: "neutral" },
  not_in: { label: "Not checked in", tone: "neutral" },
  not_required: { label: "Attendance not required", tone: "neutral" },
};

export function TeamRoster({ roster }: { roster: Team["roster"] }) {
  if (!roster.length) return <EmptyState icon={<Users />} title="No one reports to you yet" description="Team members appear here once HR sets you as their reporting manager." />;
  return (
    <ul className="divide-y divide-c-border">
      {roster.map((m) => {
        const s = ROSTER_STATE[m.state]!;
        return (
          <li key={m.id}>
            <Link href={`/crm/employees/${m.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-c-surface-2">
              <Avatar name={m.name} photoFileId={m.photoFileId} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{m.name}</span>
                <span className="block truncate text-xs text-c-muted">
                  {m.designation ?? "—"}
                  {!m.direct && " · indirect report"}
                </span>
              </span>
              {m.late && <Badge tone="warning">Late</Badge>}
              <Badge tone={s.tone} dot>
                {s.label}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function TeamTasks({ tasks }: { tasks: Team["tasks"] }) {
  const total = tasks.reduce((s, t) => s + t.value, 0);
  if (!total) return <EmptyState icon={<CircleCheck />} title="No tasks assigned to your team yet" />;
  return (
    <div className="p-5">
      <p className="mb-3 text-[0.8125rem] text-c-muted">
        <span className="tabular font-semibold text-c-fg">{Math.round(((tasks[3]?.value ?? 0) / total) * 100)}%</span> of {total} team tasks completed
      </p>
      <SegmentedBar segments={tasks} label="Team tasks by status" />
    </div>
  );
}

export function PendingApprovals({ approvals }: { approvals: Team["approvals"] }) {
  const empty = !approvals.leave.length && !approvals.wfh.length && !approvals.corrections;
  if (empty) return <EmptyState icon={<CircleCheck />} title="No pending approvals" description="Leave, WFH and attendance corrections from your team will appear here." />;
  return (
    <ul className="divide-y divide-c-border">
      {approvals.leave.map((l) => (
        <li key={l.id}>
          <Link href="/crm/leave?tab=approvals" className="flex items-center gap-3 px-5 py-2.5 hover:bg-c-surface-2">
            <Avatar name={`${l.firstName} ${l.lastName}`} photoFileId={l.photoFileId} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {l.firstName} {l.lastName}
              </span>
              <span className="block text-xs text-c-muted">
                {l.type} · {formatDateShort(l.startDate)}
                {l.endDate !== l.startDate && ` – ${formatDateShort(l.endDate)}`} · {Number(l.days)} day{Number(l.days) === 1 ? "" : "s"}
              </span>
            </span>
            <Badge tone="warning">Leave</Badge>
          </Link>
        </li>
      ))}
      {approvals.wfh.map((w) => (
        <li key={w.id}>
          <Link href="/crm/wfh?tab=approvals" className="flex items-center gap-3 px-5 py-2.5 hover:bg-c-surface-2">
            <Avatar name={`${w.firstName} ${w.lastName}`} photoFileId={w.photoFileId} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {w.firstName} {w.lastName}
              </span>
              <span className="block text-xs text-c-muted">
                {formatDateShort(w.startDate)}
                {w.endDate !== w.startDate && ` – ${formatDateShort(w.endDate)}`}
              </span>
            </span>
            <Badge tone="info">WFH</Badge>
          </Link>
        </li>
      ))}
      {approvals.corrections > 0 && (
        <li>
          <Link href="/crm/attendance?tab=corrections" className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-c-surface-2">
            <Timer className="size-4 text-c-subtle" />
            <span className="flex-1">
              {approvals.corrections} attendance correction{approvals.corrections === 1 ? "" : "s"} to review
            </span>
            <ArrowRight className="size-4 text-c-subtle" />
          </Link>
        </li>
      )}
    </ul>
  );
}

export function ActionItems({ items }: { items: { key: string; label: string; count: number; href: string }[] }) {
  const open = items.filter((i) => i.count > 0);
  if (!open.length) return <EmptyState icon={<CircleCheck />} title="All clear" description="Nothing needs HR's attention right now." />;
  return (
    <ul className="divide-y divide-c-border">
      {open.map((i) => (
        <li key={i.key}>
          <Link href={i.href} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-c-surface-2">
            <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-full bg-c-accent-soft px-1.5 text-xs font-semibold text-c-accent-text">{i.count}</span>
            <span className="flex-1">{i.label}</span>
            <ArrowRight className="size-4 text-c-subtle" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function QuickLinks({ links }: { links: { label: string; href: string; icon: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
      {links.map((l) => (
        <ButtonLink key={l.href} href={l.href} variant="secondary" className="h-auto justify-start py-2.5 whitespace-normal">
          {l.icon}
          {l.label}
        </ButtonLink>
      ))}
    </div>
  );
}

