import type { Metadata } from "next";
import { CalendarOff, Check, History, Paperclip, Users, X } from "lucide-react";
import { ConfirmAction, inputClass } from "@/components/crm/forms";
import { AdjustBalanceDialog, ApplyLeaveDialog } from "@/components/crm/leave-forms";
import { MonthGrid } from "@/components/crm/MonthGrid";
import { Badge, Card, CardHeader, EmptyState, FilterBar, PageHeader, PersonCell, ProgressBar, StatusBadge, Table, TBody, THead, Tabs, buttonClass, humanize } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { yearMonthOr } from "@/crm/lib/params";
import { endOfMonth, formatDateShort, todayIn } from "@/crm/lib/time";
import { calendarScope } from "@/crm/services/calendar-scope";
import { getCompany, getDefaultSchedule, getHolidaysBetween } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { getBalances } from "@/crm/services/leave";
import { activeLeaveTypes, approvalQueue, canDecideFor, leaveCalendar, myLeaveRequests } from "@/crm/services/leave-workflow";
import { cancelLeaveAction, decideLeaveAction } from "./actions";

export const metadata: Metadata = { title: "Leave" };

type Row = Awaited<ReturnType<typeof myLeaveRequests>>[number];

function Dates({ r }: { r: Pick<Row, "startDate" | "endDate" | "halfDay"> }) {
  return (
    <span className="tabular whitespace-nowrap">
      {formatDateShort(r.startDate)}
      {r.endDate !== r.startDate && ` – ${formatDateShort(r.endDate)}`}
      {r.halfDay !== "none" && <span className="text-xs text-c-muted"> · {humanize(r.halfDay)}</span>}
    </span>
  );
}

export default async function LeavePage({ searchParams }: PageProps<"/crm/leave">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const approver = can(viewer, "leave.manage", "leave.approve_team");
  const tabs = [
    { key: "mine", label: "My leave", href: "/crm/leave" },
    ...(approver ? [{ key: "approvals", label: "Approvals", href: "/crm/leave?tab=approvals" }] : []),
    { key: "calendar", label: "Leave calendar", href: "/crm/leave?tab=calendar" },
    ...(can(viewer, "leave.manage") ? [{ key: "balances", label: "Balances", href: "/crm/leave?tab=balances" }] : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : "mine";

  const balances = viewer.employee ? await getBalances(viewer.employee.id) : [];
  const typeOptions = balances.map((b) => ({ id: b.leaveTypeId, name: b.name, allowHalfDay: b.allowHalfDay, documentRequiredAfterDays: b.documentRequiredAfterDays, available: b.unlimited ? "no limit" : `${b.available} left` }));

  return (
    <>
      <PageHeader
        title="Leave Management"
        description="Apply for leave, track your balance, and see who's away."
        actions={viewer.employee ? <ApplyLeaveDialog types={typeOptions} today={today} autoOpen={sp.apply === "1"} /> : undefined}
      />
      <Tabs tabs={tabs} active={tab} />
      {tab === "mine" && <MyLeave balances={balances} />}
      {tab === "approvals" && approver && <Approvals />}
      {tab === "calendar" && <LeaveCalendarTab month={yearMonthOr(sp.month, today.slice(0, 7))} today={today} />}
      {tab === "balances" && can(viewer, "leave.manage") && <BalancesTab employeeId={typeof sp.employee === "string" ? sp.employee : undefined} />}
    </>
  );
}

async function MyLeave({ balances }: { balances: Awaited<ReturnType<typeof getBalances>> }) {
  const viewer = await requireViewer();
  if (!viewer.employee) return <Card><EmptyState title="Your account isn't linked to an employee record" /></Card>;
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const requests = await myLeaveRequests(viewer.employee.id);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {balances.map((b) => {
          const total = b.allocated + b.carriedForward + b.adjustment;
          return (
            <Card key={b.leaveTypeId} className="p-4">
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-c-muted">
                <span aria-hidden className="size-2 rounded-full" style={{ background: b.color }} /> {b.name}
              </p>
              <p className="tabular mt-2 text-2xl leading-none font-semibold tracking-[-0.02em]">{b.unlimited ? "—" : b.available}</p>
              <p className="mt-2 text-xs text-c-subtle">{b.unlimited ? `No limit · ${b.used} used` : `of ${total} · ${b.used} used${b.pending ? ` · ${b.pending} pending` : ""}`}</p>
              {!b.unlimited && <ProgressBar className="mt-3" value={total ? ((b.used + b.pending) / total) * 100 : 0} label={`${b.name} used`} />}
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader title="My requests" />
        {requests.length ? (
          <Table>
            <THead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th className="hidden md:table-cell">Reason</th>
                <th>Status</th>
                <th className="text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} />
                      {r.type}
                    </span>
                  </td>
                  <td>
                    <Dates r={r} />
                  </td>
                  <td className="tabular">{Number(r.days)}</td>
                  <td className="hidden max-w-xs truncate text-c-muted md:table-cell">
                    {r.reason}
                    {r.decisionComment && <span className="block text-xs text-c-subtle">Reply: {r.decisionComment}</span>}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-right">
                    {(r.status === "pending" || (r.status === "approved" && r.startDate > today)) && (
                      <ConfirmAction action={cancelLeaveAction} fields={{ id: r.id }} label="Cancel" variant="ghost" confirmVariant="danger" title="Cancel this leave request?" description={r.status === "approved" ? "The days go back to your balance and your manager is told." : undefined} confirmLabel="Cancel request" />
                    )}
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<CalendarOff />} title="No leave requests yet" description="Use “Apply for leave” to request time off." />
        )}
      </Card>
    </div>
  );
}

async function Approvals() {
  const viewer = await requireViewer();
  const [pending, decided] = await Promise.all([approvalQueue(viewer, "pending"), approvalQueue(viewer, "decided")]);
  const can2 = await Promise.all(pending.map((r) => canDecideFor(viewer, r.employeeId)));
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Waiting for a decision"
          description={`${pending.length} request${pending.length === 1 ? "" : "s"}`}
          action={pending.length ? <Badge tone="warning" dot>{pending.length} pending</Badge> : undefined}
        />
        {pending.length ? (
          <Table>
            <THead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th className="hidden lg:table-cell">Reason</th>
                <th className="text-right">Decision</th>
              </tr>
            </THead>
            <TBody>
              {pending.map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <PersonCell name={`${r.firstName} ${r.lastName}`} photoFileId={r.photoFileId} href={`/crm/employees/${r.employeeId}?tab=leave`} />
                  </td>
                  <td>{r.type}</td>
                  <td>
                    <Dates r={r} />
                  </td>
                  <td className="tabular">{Number(r.days)}</td>
                  <td className="hidden max-w-xs text-[0.8125rem] text-c-muted lg:table-cell">
                    {r.reason}
                    {r.documentFileId && (
                      <a href={`/crm/api/files/${r.documentFileId}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs font-medium text-c-accent-text hover:underline">
                        <Paperclip className="size-3" /> Document
                      </a>
                    )}
                  </td>
                  <td className="text-right">
                    {can2[i] ? (
                      <div className="flex justify-end gap-1.5">
                        <ConfirmAction action={decideLeaveAction} fields={{ id: r.id, decision: "approve" }} label="Approve" icon={<Check />} title={`Approve ${r.firstName}'s ${r.type}?`} confirmLabel="Approve" withComment />
                        <ConfirmAction action={decideLeaveAction} fields={{ id: r.id, decision: "reject" }} label="Reject" icon={<X />} variant="ghost" confirmVariant="danger" title={`Reject ${r.firstName}'s ${r.type}?`} confirmLabel="Reject" withComment commentLabel="Reason" />
                      </div>
                    ) : (
                      <span className="text-xs text-c-subtle">Another approver decides</span>
                    )}
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<Check />} title="Nothing waiting" description="New leave requests from your team appear here." />
        )}
      </Card>
      <Card>
        <CardHeader title="Recently decided" />
        {decided.length ? (
          <Table>
            <THead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Comment</th>
              </tr>
            </THead>
            <TBody>
              {decided.slice(0, 30).map((r) => (
                <tr key={r.id}>
                  <td>
                    <PersonCell name={`${r.firstName} ${r.lastName}`} photoFileId={r.photoFileId} />
                  </td>
                  <td>{r.type}</td>
                  <td>
                    <Dates r={r} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="hidden text-c-muted md:table-cell">{r.decisionComment ?? "—"}</td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<History />} title="No decisions yet" />
        )}
      </Card>
    </div>
  );
}

async function LeaveCalendarTab({ month, today }: { month: string; today: string }) {
  const viewer = await requireViewer();
  const from = `${month}-01`;
  const to = endOfMonth(from);
  const scope = await calendarScope(viewer);
  const [entries, holidays, schedule] = await Promise.all([leaveCalendar(scope.ids, from, to), getHolidaysBetween(from, to), getDefaultSchedule()]);
  const away = "#8a8c90";
  return (
    <Card>
      <CardHeader title="Who's away" description={scope.showType ? "Approved and pending leave" : "Your department's approved and pending leave. Leave types are private."} />
      <MonthGrid
        month={month}
        today={today}
        people={scope.people}
        holidays={holidays.filter((h) => h.type === "public")}
        weekendDays={[1, 2, 3, 4, 5, 6, 7].filter((d) => !schedule.workingDays.includes(d))}
        hrefFor={(m) => `/crm/leave?tab=calendar&month=${m}`}
        legend={scope.showType ? [...new Map(entries.map((e) => [e.type, { label: e.type, color: e.color }])).values()] : [{ label: "Away", color: away }]}
        entries={entries.map((e) => {
          const show = scope.showType || e.employeeId === viewer.employee?.id;
          return { employeeId: e.employeeId, name: `${e.firstName} ${e.lastName}`, photoFileId: e.photoFileId, startDate: e.startDate, endDate: e.endDate, label: show ? e.type : "Away", color: show ? e.color : away, pending: e.status === "pending", half: e.halfDay !== "none" };
        })}
      />
    </Card>
  );
}

async function BalancesTab({ employeeId }: { employeeId?: string }) {
  const options = await employeeFormOptions();
  const selected = employeeId && options.managers.some((m) => m.value === employeeId) ? employeeId : options.managers[0]?.value;
  const balances = selected ? await getBalances(selected) : [];
  const types = await activeLeaveTypes();
  const name = options.managers.find((m) => m.value === selected)?.label ?? "";
  return (
    <Card>
      <CardHeader
        title="Leave balances"
        description="Current leave year. Adjustments are audit-logged and the employee is notified."
        action={selected ? <AdjustBalanceDialog employeeId={selected} employeeName={name} types={types.filter((t) => t.annualQuota !== null).map((t) => ({ id: t.id, name: t.name }))} /> : undefined}
      />
      <FilterBar>
        <input type="hidden" name="tab" value="balances" />
        <select name="employee" defaultValue={selected} className={`${inputClass} sm:max-w-sm`} aria-label="Employee">
          {options.managers.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button className={buttonClass("secondary")} type="submit">
          Show
        </button>
      </FilterBar>
      {balances.length ? (
        <Table>
          <THead>
            <tr>
              <th>Type</th>
              <th>Allocated</th>
              <th>Carried forward</th>
              <th>Adjustment</th>
              <th>Used</th>
              <th>Pending</th>
              <th>Available</th>
            </tr>
          </THead>
          <TBody>
            {balances.map((b) => (
              <tr key={b.leaveTypeId}>
                <td>{b.name}</td>
                <td className="tabular">{b.unlimited ? "—" : b.allocated}</td>
                <td className="tabular">{b.carriedForward}</td>
                <td className="tabular">{b.adjustment > 0 ? `+${b.adjustment}` : b.adjustment}</td>
                <td className="tabular">{b.used}</td>
                <td className="tabular">{b.pending}</td>
                <td className="tabular font-medium">{b.unlimited ? "No limit" : b.available}</td>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon={<Users />} title="No employees" />
      )}
    </Card>
  );
}

