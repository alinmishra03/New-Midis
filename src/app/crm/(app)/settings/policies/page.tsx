import type { Metadata } from "next";
import { LeaveTypeDialog, NotificationSettingsForm, PayrollPolicyForm, ScheduleDialog } from "@/components/crm/settings-forms";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, PageHeader, Table, TBody, THead } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { formatMinutes } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { listLeaveTypes, listSchedules } from "@/crm/services/settings";

export const metadata: Metadata = { title: "Policies & schedules" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function PoliciesPage() {
  const viewer = await requirePermission("settings.manage");
  const [schedules, leaveTypes, company] = await Promise.all([listSchedules(), listLeaveTypes(), getCompany()]);
  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="policies" perms={{ settings: true, users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view"), email: viewer.role.key === "super_admin" }} />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Work schedules & attendance rules" description="Each employee follows their own schedule or the default. Late, early-leave, half-day and full-day are judged against it." action={<ScheduleDialog />} />
          <Table>
            <THead>
              <tr>
                <th>Schedule</th>
                <th>Hours</th>
                <th className="hidden md:table-cell">Working days</th>
                <th className="hidden lg:table-cell">Rules</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.name} {s.isDefault && <Badge tone="accent">Default</Badge>}
                  </td>
                  <td className="tabular">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="hidden md:table-cell">{s.workingDays.map((d) => DAYS[d - 1]).join(", ")}</td>
                  <td className="hidden text-xs text-c-muted lg:table-cell">
                    Late after {s.lateGraceMinutes} min · full day {formatMinutes(s.fullDayMinutes)} · half day {formatMinutes(s.halfDayMinutes)}
                    {s.allowUnplannedRemote && " · remote allowed"}
                  </td>
                  <td className="text-right">
                    <ScheduleDialog values={s} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Leave policy" description="Quotas apply to balances created for a new leave year or new employee; change an individual's balance from Leave → Balances." action={<LeaveTypeDialog />} />
          <Table>
            <THead>
              <tr>
                <th>Leave type</th>
                <th>Days / year</th>
                <th className="hidden sm:table-cell">Carry forward</th>
                <th className="hidden md:table-cell">Rules</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {leaveTypes.map((t) => (
                <tr key={t.id} className={t.isActive ? undefined : "opacity-60"}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-2.5 rounded-full" style={{ background: t.color }} />
                      {t.name} <span className="font-mono text-xs text-c-subtle">{t.code}</span>
                      {!t.isActive && <Badge>Inactive</Badge>}
                    </span>
                  </td>
                  <td className="tabular">{t.annualQuota === null ? "Unlimited" : Number(t.annualQuota)}</td>
                  <td className="tabular hidden sm:table-cell">{Number(t.maxCarryForward)}</td>
                  <td className="hidden text-xs text-c-muted md:table-cell">
                    {t.isPaid ? "Paid" : "Unpaid"}
                    {t.allowHalfDay ? " · half days" : ""}
                    {t.documentRequiredAfterDays !== null ? ` · document after ${t.documentRequiredAfterDays} day(s)` : ""}
                  </td>
                  <td className="text-right">
                    <LeaveTypeDialog values={t} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Payroll policy" />
            <CardBody>
              <PayrollPolicyForm values={company.payroll} canEdit={can(viewer, "payroll.approve")} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Notifications & reminders" />
            <CardBody>
              <NotificationSettingsForm values={company.notifications} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
