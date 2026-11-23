import type { Metadata } from "next";
import { Check, House, X } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { WfhDialog } from "@/components/crm/leave-forms";
import { MonthGrid } from "@/components/crm/MonthGrid";
import { Card, CardHeader, EmptyState, PageHeader, PersonCell, StatusBadge, Table, TBody, THead, Tabs } from "@/components/crm/ui";
import { can, requireViewer, scopeFor } from "@/crm/auth/dal";
import { addDays, endOfMonth, formatDate, formatDateShort, formatMinutes, formatTime, todayIn } from "@/crm/lib/time";
import { calendarScope } from "@/crm/services/calendar-scope";
import { getCompany, getDefaultSchedule, getHolidaysBetween } from "@/crm/services/company";
import { myWfh, remoteAttendance, wfhCalendar, wfhQueue } from "@/crm/services/wfh";
import { cancelWfhAction, decideWfhAction } from "../leave/actions";

export const metadata: Metadata = { title: "Work From Home" };

function Range({ s, e }: { s: string; e: string }) {
  return (
    <span className="tabular whitespace-nowrap">
      {formatDateShort(s)}
      {e !== s && ` – ${formatDateShort(e)}`}
    </span>
  );
}

export default async function WfhPage({ searchParams }: PageProps<"/crm/wfh">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const company = await getCompany();
  const tz = company.timezone;
  const today = todayIn(tz);
  const approver = can(viewer, "leave.manage", "leave.approve_team");
  const tabs = [
    { key: "mine", label: "My requests", href: "/crm/wfh" },
    ...(approver ? [{ key: "approvals", label: "Approvals", href: "/crm/wfh?tab=approvals" }] : []),
    { key: "calendar", label: "WFH calendar", href: "/crm/wfh?tab=calendar" },
    ...(approver ? [{ key: "remote", label: "Remote attendance", href: "/crm/wfh?tab=remote" }] : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : "mine";
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.slice(0, 7);

  return (
    <>
      <PageHeader title="Work From Home" description="Request remote days. Once approved, you can check in remotely from your dashboard." actions={viewer.employee ? <WfhDialog today={today} /> : undefined} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "mine" && viewer.employee && (
        <Card>
          {(async () => {
            const rows = await myWfh(viewer.employee!.id);
            const remote = await remoteAttendance([viewer.employee!.id], addDays(today, -90), today);
            return (
              <>
                <CardHeader title="Request history" />
                {rows.length ? (
                  <Table>
                    <THead>
                      <tr>
                        <th>Dates</th>
                        <th className="hidden md:table-cell">Reason</th>
                        <th>Status</th>
                        <th className="text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </THead>
                    <TBody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <Range s={r.startDate} e={r.endDate} />
                          </td>
                          <td className="hidden max-w-sm truncate text-c-muted md:table-cell">
                            {r.reason}
                            {r.decisionComment && <span className="block text-xs text-c-subtle">Reply: {r.decisionComment}</span>}
                          </td>
                          <td>
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="text-right">
                            {(r.status === "pending" || (r.status === "approved" && r.startDate > today)) && (
                              <ConfirmAction action={cancelWfhAction} fields={{ id: r.id }} label="Cancel" variant="ghost" confirmVariant="danger" title="Cancel this request?" confirmLabel="Cancel request" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                ) : (
                  <EmptyState icon={<House />} title="No work-from-home requests yet" />
                )}
                <CardHeader title="Remote days worked" description="Last 90 days" className="border-t" />
                {remote.length ? (
                  <Table>
                    <THead>
                      <tr>
                        <th>Date</th>
                        <th>In</th>
                        <th>Out</th>
                        <th>Worked</th>
                      </tr>
                    </THead>
                    <TBody>
                      {remote.map((r) => (
                        <tr key={r.id}>
                          <td className="tabular">{formatDate(r.workDate)}</td>
                          <td className="tabular">{formatTime(r.checkInAt, tz)}</td>
                          <td className="tabular">{formatTime(r.checkOutAt, tz)}</td>
                          <td className="tabular">{formatMinutes(r.workedMinutes)}</td>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                ) : (
                  <EmptyState title="No remote check-ins yet" />
                )}
              </>
            );
          })()}
        </Card>
      )}

      {tab === "approvals" && approver && <WfhApprovals />}

      {tab === "calendar" &&
        (async () => {
          const scope = await calendarScope(viewer);
          const from = `${month}-01`;
          const to = endOfMonth(from);
          const [entries, holidays, schedule] = await Promise.all([wfhCalendar(scope.ids, from, to), getHolidaysBetween(from, to), getDefaultSchedule()]);
          return (
            <Card>
              <CardHeader title="Who's working from home" description="Approved requests" />
              <MonthGrid
                month={month}
                today={today}
                people={scope.people}
                holidays={holidays.filter((h) => h.type === "public")}
                weekendDays={[1, 2, 3, 4, 5, 6, 7].filter((d) => !schedule.workingDays.includes(d))}
                hrefFor={(m) => `/crm/wfh?tab=calendar&month=${m}`}
                legend={[{ label: "Work from home", color: "var(--viz-1)" }]}
                entries={entries.map((e) => ({ employeeId: e.employeeId, name: `${e.firstName} ${e.lastName}`, photoFileId: e.photoFileId, startDate: e.startDate, endDate: e.endDate, label: "Work from home", color: "var(--viz-1)" }))}
              />
            </Card>
          );
        })()}

      {tab === "remote" &&
        approver &&
        (async () => {
          const scope = await scopeFor(viewer, "attendance.view_all", "attendance.view_team");
          const rows = await remoteAttendance(scope.kind === "all" ? "all" : scope.employeeIds, addDays(today, -30), today);
          return (
            <Card>
              <CardHeader title="Remote check-ins" description="Last 30 days" />
              {rows.length ? (
                <Table>
                  <THead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Worked</th>
                    </tr>
                  </THead>
                  <TBody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <PersonCell name={`${r.firstName} ${r.lastName}`} href={`/crm/employees/${r.employeeId}?tab=attendance`} />
                        </td>
                        <td className="tabular">{formatDate(r.workDate)}</td>
                        <td className="tabular">{formatTime(r.checkInAt, tz)}</td>
                        <td className="tabular">{formatTime(r.checkOutAt, tz)}</td>
                        <td className="tabular">{formatMinutes(r.workedMinutes)}</td>
                      </tr>
                    ))}
                  </TBody>
                </Table>
              ) : (
                <EmptyState title="No remote check-ins" />
              )}
            </Card>
          );
        })()}
    </>
  );
}

async function WfhApprovals() {
  const viewer = await requireViewer();
  const [pending, decided] = await Promise.all([wfhQueue(viewer, "pending"), wfhQueue(viewer, "decided")]);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Waiting for a decision" />
        {pending.length ? (
          <Table>
            <THead>
              <tr>
                <th>Employee</th>
                <th>Dates</th>
                <th className="hidden md:table-cell">Reason</th>
                <th className="text-right">Decision</th>
              </tr>
            </THead>
            <TBody>
              {pending.map((r) => (
                <tr key={r.id}>
                  <td>
                    <PersonCell name={`${r.firstName} ${r.lastName}`} photoFileId={r.photoFileId} />
                  </td>
                  <td>
                    <Range s={r.startDate} e={r.endDate} />
                  </td>
                  <td className="hidden max-w-sm text-c-muted md:table-cell">{r.reason}</td>
                  <td className="text-right">
                    {r.employeeId !== viewer.employee?.id || viewer.role.key === "super_admin" ? (
                      <div className="flex justify-end gap-1.5">
                        <ConfirmAction action={decideWfhAction} fields={{ id: r.id, decision: "approve" }} label="Approve" icon={<Check />} title={`Approve ${r.firstName}'s WFH?`} confirmLabel="Approve" withComment />
                        <ConfirmAction action={decideWfhAction} fields={{ id: r.id, decision: "reject" }} label="Reject" icon={<X />} variant="ghost" confirmVariant="danger" title={`Reject ${r.firstName}'s WFH?`} confirmLabel="Reject" withComment commentLabel="Reason" />
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
          <EmptyState icon={<Check />} title="Nothing waiting" />
        )}
      </Card>
      <Card>
        <CardHeader title="Recently decided" />
        {decided.length ? (
          <Table>
            <THead>
              <tr>
                <th>Employee</th>
                <th>Dates</th>
                <th>Status</th>
              </tr>
            </THead>
            <TBody>
              {decided.slice(0, 30).map((r) => (
                <tr key={r.id}>
                  <td>
                    <PersonCell name={`${r.firstName} ${r.lastName}`} photoFileId={r.photoFileId} />
                  </td>
                  <td>
                    <Range s={r.startDate} e={r.endDate} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="No decisions yet" />
        )}
      </Card>
    </div>
  );
}
