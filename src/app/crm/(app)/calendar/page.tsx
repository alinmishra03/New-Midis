import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, PartyPopper, Trash2, Video, X } from "lucide-react";
import { HolidayDialog, MeetingDialog } from "@/components/crm/calendar-forms";
import { ConfirmAction } from "@/components/crm/forms";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Table, TBody, THead, Tabs, buttonClass } from "@/components/crm/ui";
import { can, getTeamEmployeeIds, requireViewer } from "@/crm/auth/dal";
import { yearMonthOr } from "@/crm/lib/params";
import { addDays, daysBetweenInclusive, endOfMonth, formatDate, formatDateTime, formatMonth, formatTime, isoWeekday, todayIn, zonedToInstant } from "@/crm/lib/time";
import { meetingsFor, monthEvents, type CalendarEvent } from "@/crm/services/calendar";
import { getCompany, getHolidaysBetween } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { cn } from "@/lib/utils";
import { cancelMeetingAction, deleteHolidayAction } from "./actions";

export const metadata: Metadata = { title: "Calendar" };

const KIND: Record<CalendarEvent["kind"], { cls: string; label: string }> = {
  holiday: { cls: "bg-c-accent-soft text-c-accent-text", label: "Holiday" },
  meeting: { cls: "bg-c-info-soft text-c-info", label: "Meeting / event" },
  leave: { cls: "bg-c-warning-soft text-c-warning", label: "Leave" },
  wfh: { cls: "bg-c-hover text-c-muted", label: "Work from home" },
  birthday: { cls: "bg-c-success-soft text-c-success", label: "Birthday" },
  anniversary: { cls: "bg-c-success-soft text-c-success", label: "Work anniversary" },
};

export default async function CalendarPage({ searchParams }: PageProps<"/crm/calendar">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const company = await getCompany();
  const tz = company.timezone;
  const today = todayIn(tz);
  const month = yearMonthOr(sp.month, today.slice(0, 7));
  const tab = sp.tab === "holidays" ? "holidays" : "month";
  const from = `${month}-01`;
  const to = endOfMonth(from);
  const [options, hasTeam] = await Promise.all([employeeFormOptions(), viewer.employee ? getTeamEmployeeIds(viewer.employee.id).then((t) => t.length > 0) : false]);
  const people = options.managers.filter((m) => m.value !== viewer.employee?.id);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Meetings, company events, holidays, leave and celebrations."
        actions={
          <>
            {can(viewer, "calendar.manage") && <HolidayDialog />}
            {viewer.employee && <MeetingDialog people={people} today={today} canCompany={can(viewer, "calendar.manage")} hasTeam={hasTeam} />}
          </>
        }
      />
      <Tabs
        active={tab}
        tabs={[
          { key: "month", label: "Month", href: `/crm/calendar?month=${month}` },
          { key: "holidays", label: "Holidays", href: "/crm/calendar?tab=holidays" },
        ]}
      />
      {tab === "month" ? <MonthView from={from} to={to} today={today} /> : <HolidaysTab today={today} />}
    </>
  );
}

async function MonthView({ from, to, today }: { from: string; to: string; today: string }) {
  const viewer = await requireViewer();
  const company = await getCompany();
  const tz = company.timezone;
  const [events, upcoming] = await Promise.all([monthEvents(viewer, from, to), meetingsFor(viewer, new Date(), zonedToInstant(addDays(today, 30), "23:59", tz))]);
  const days = daysBetweenInclusive(from, to);
  const lead = isoWeekday(from) - 1;
  const prev = addDays(from, -1).slice(0, 7);
  const next = addDays(to, 1).slice(0, 7);
  const on = (d: string) => events.filter((e) => e.date === d || (e.endDate && e.date <= d && e.endDate >= d));

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-c-border px-5 py-3">
          <div className="flex items-center gap-1">
            <Link href={`/crm/calendar?month=${prev}`} className={buttonClass("ghost", "icon")} aria-label="Previous month">
              <ChevronLeft />
            </Link>
            <h2 className="min-w-36 text-center text-sm font-semibold">{formatMonth(from)}</h2>
            <Link href={`/crm/calendar?month=${next}`} className={buttonClass("ghost", "icon")} aria-label="Next month">
              <ChevronRight />
            </Link>
            <Link href="/crm/calendar" className={buttonClass("ghost", "sm")}>
              Today
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-c-muted">
            {(["meeting", "holiday", "leave", "wfh", "birthday"] as const).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-2.5 rounded-sm ring-1 ring-current ring-inset", KIND[k].cls)} />
                {KIND[k].label}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-7 gap-px bg-c-border text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-c-surface-2 px-2 py-1.5 text-center font-medium text-c-subtle">
              {d}
            </div>
          ))}
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-c-surface" />
          ))}
          {days.map((d) => {
            const list = on(d);
            return (
              <div key={d} className={cn("min-h-20 bg-c-surface p-1 sm:min-h-28 sm:p-1.5", d === today && "bg-c-accent-soft/40")}>
                <span className={cn("tabular inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold", d === today && "bg-c-accent text-c-on-accent")}>{Number(d.slice(8))}</span>
                <ul className="mt-0.5 space-y-0.5">
                  {list.slice(0, 3).map((e) => (
                    <li key={e.id} title={`${e.time ? `${e.time} ` : ""}${e.title}`} className={cn("truncate rounded px-1 py-0.5 text-[0.625rem] leading-tight sm:text-[0.6875rem]", KIND[e.kind].cls)}>
                      {e.time && <span className="tabular font-semibold">{e.time} </span>}
                      {e.title}
                    </li>
                  ))}
                  {list.length > 3 && <li className="px-1 text-[0.625rem] text-c-subtle">+{list.length - 3} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Upcoming meetings" description="Next 30 days" />
        {upcoming.length ? (
          <ul className="divide-y divide-c-border">
            {upcoming.map((m) => (
              <li key={m.id} className="space-y-1 px-5 py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{m.title}</p>
                  {m.canCancel && <ConfirmAction action={cancelMeetingAction} fields={{ id: m.id }} label="" ariaLabel={`Cancel ${m.title}`} icon={<X />} variant="ghost" size="icon" confirmVariant="danger" title={`Cancel “${m.title}”?`} description="Participants are notified." confirmLabel="Cancel meeting" />}
                </div>
                <p className="text-xs text-c-muted">
                  {formatDateTime(m.startAt, tz)}–{formatTime(m.endAt, tz)}
                </p>
                {m.scope === "company" && <Badge tone="info">Company event</Badge>}
                {m.location && (
                  <p className="flex items-center gap-1 text-xs text-c-muted">
                    <MapPin className="size-3" /> {m.location}
                  </p>
                )}
                {m.meetingLink && (
                  <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-c-accent-text hover:underline">
                    <Video className="size-3" /> Join link
                  </a>
                )}
                {m.participants.length > 0 && m.scope !== "company" && <p className="text-xs text-c-subtle">{m.participants.join(", ")}</p>}
                {m.description && <p className="text-xs whitespace-pre-line text-c-muted">{m.description}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<CalendarDays />} title="No upcoming meetings" />
        )}
      </Card>
    </div>
  );
}

async function HolidaysTab({ today }: { today: string }) {
  const viewer = await requireViewer();
  const year = Number(today.slice(0, 4));
  const rows = await getHolidaysBetween(`${year}-01-01`, `${year + 1}-12-31`);
  const manage = can(viewer, "calendar.manage");
  return (
    <Card>
      <CardHeader title={`Holidays ${year}–${year + 1}`} description={manage ? "Public holidays are excluded from leave and attendance automatically." : undefined} />
      {rows.length ? (
        <Table>
          <THead>
            <tr>
              <th>Date</th>
              <th>Holiday</th>
              <th>Type</th>
              {manage && (
                <th className="text-right">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </THead>
          <TBody>
            {rows.map((h) => (
              <tr key={h.id} className={h.date < today ? "opacity-60" : undefined}>
                <td className="tabular whitespace-nowrap">{formatDate(h.date)}</td>
                <td>
                  {h.name}
                  {h.description && <span className="block text-xs text-c-muted">{h.description}</span>}
                </td>
                <td>
                  <Badge tone={h.type === "public" ? "accent" : "neutral"}>{h.type === "public" ? "Public" : "Optional"}</Badge>
                </td>
                {manage && <td className="text-right"><ConfirmAction action={deleteHolidayAction} fields={{ id: h.id }} label="" ariaLabel={`Remove ${h.name}`} icon={<Trash2 />} variant="ghost" size="icon" confirmVariant="danger" title={`Remove ${h.name}?`} confirmLabel="Remove" /></td>}
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon={<PartyPopper />} title="No holidays configured" />
      )}
    </Card>
  );
}
