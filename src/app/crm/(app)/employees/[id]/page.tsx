import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Mail, MapPin, Pencil, Phone, UserX } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { AccessLinkButton, PersonalForm, PhotoUpload } from "@/components/crm/employee-forms";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  EmptyState,
  PersonCell,
  ProgressBar,
  StatusBadge,
  Table,
  TBody,
  THead,
  Tabs,
  humanize,
} from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { formatDate, formatDateShort, formatMinutes, formatTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { getEmployeeProfile } from "@/crm/services/employees";
import { getBalances } from "@/crm/services/leave";
import { employeeDocuments, leaveHistory, performanceSummary, recentAttendance, workSummary } from "@/crm/services/profile-tabs";
import { deactivateAction, reactivateAction } from "../actions";

export const metadata: Metadata = { title: "Employee profile" };

const inr = (v: string | number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v));
const TYPE_LABEL: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", contract: "Contract", intern: "Intern" };

export default async function EmployeeProfilePage({ params, searchParams }: PageProps<"/crm/employees/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  const sp = await searchParams;
  const profile = await getEmployeeProfile(viewer, id);
  if (!profile) notFound();
  const { access, basic, employment, personal, salary } = profile;
  const company = await getCompany();

  const tabs = [
    { key: "overview", label: "Overview", show: true },
    { key: "personal", label: "Personal", show: access.personal },
    { key: "attendance", label: "Attendance", show: access.attendance },
    { key: "leave", label: "Leave", show: access.leave },
    { key: "work", label: "Projects & tasks", show: access.full },
    { key: "performance", label: "Performance", show: access.isSelf || can(viewer, "performance.manage") || (access.full && can(viewer, "performance.review_team")) },
    { key: "documents", label: "Documents", show: access.isSelf || can(viewer, "documents.manage") },
    { key: "salary", label: "Salary", show: access.salary },
  ].filter((t) => t.show);
  const requested = typeof sp.tab === "string" ? sp.tab : "overview";
  const tab = tabs.some((t) => t.key === requested) ? requested : "overview";
  const exited = basic.employmentStatus === "exited";

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[0.8125rem] text-c-subtle">
        <Link href="/crm/employees" className="hover:text-c-fg">
          Employees
        </Link>{" "}
        / <span className="text-c-muted">{basic.fullName}</span>
      </nav>

      <Card className="mb-6">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar name={basic.fullName} photoFileId={basic.photoFileId} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{basic.fullName}</h1>
              <StatusBadge status={basic.employmentStatus} />
              {employment?.account?.status === "invited" && <Badge tone="warning">Invite not yet accepted</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-c-muted">
              {[basic.designation?.title, basic.department?.name].filter(Boolean).join(" · ") || "No designation"} · {basic.employeeCode}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-c-muted">
              <a href={`mailto:${basic.officialEmail}`} className="flex items-center gap-1.5 hover:text-c-fg">
                <Mail className="size-3.5" /> {basic.officialEmail}
              </a>
              {basic.phone && (
                <a href={`tel:${basic.phone}`} className="flex items-center gap-1.5 hover:text-c-fg">
                  <Phone className="size-3.5" /> {basic.phone}
                </a>
              )}
              {basic.workLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {basic.workLocation}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(access.isSelf || access.manage) && <PhotoUpload employeeId={basic.id} />}
            {access.manage && (
              <ButtonLink href={`/crm/employees/${basic.id}/edit`} size="sm">
                <Pencil /> Edit
              </ButtonLink>
            )}
            {can(viewer, "users.invite") && employment?.account && !access.isSelf && employment.account.status !== "disabled" && (
              <AccessLinkButton userId={employment.account.userId} invited={employment.account.status === "invited"} autoOpen={sp.invite === "1"} />
            )}
            {access.manage && !access.isSelf && !exited && (
              <ConfirmAction
                action={deactivateAction}
                fields={{ id: basic.id }}
                label="Deactivate"
                icon={<UserX />}
                variant="danger"
                confirmVariant="danger"
                title={`Deactivate ${basic.firstName}?`}
                description="Marks them as a former employee, disables their account and signs them out everywhere. Their records are kept. Anyone reporting to them moves to their manager."
                confirmLabel="Deactivate"
                withComment
                commentLabel="Reason (kept in the audit log)"
              />
            )}
            {access.manage && exited && (
              <ConfirmAction action={reactivateAction} fields={{ id: basic.id }} label="Reactivate" title={`Reactivate ${basic.firstName}?`} description="Restores their employment and account access." confirmLabel="Reactivate" />
            )}
          </div>
        </div>
      </Card>

      <Tabs active={tab} tabs={tabs.map((t) => ({ key: t.key, label: t.label, href: `/crm/employees/${basic.id}${t.key === "overview" ? "" : `?tab=${t.key}`}` }))} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {employment && (
              <Card>
                <CardHeader title="Employment" />
                <CardBody>
                  <DescriptionList
                    items={[
                      { label: "Employee ID", value: basic.employeeCode },
                      { label: "Department", value: basic.department?.name },
                      { label: "Designation", value: basic.designation?.title },
                      { label: "Reporting manager", value: basic.manager ? <Link className="hover:underline" href={`/crm/employees/${basic.manager.id}`}>{basic.manager.name}</Link> : "—" },
                      { label: "Joining date", value: formatDate(employment.joiningDate) },
                      { label: "Employment type", value: TYPE_LABEL[employment.employmentType] },
                      { label: "Status", value: humanize(basic.employmentStatus) },
                      { label: "Work schedule", value: employment.schedule },
                      { label: "Work location", value: basic.workLocation },
                      ...(employment.exitDate ? [{ label: "Exit date", value: formatDate(employment.exitDate) }] : []),
                      ...(employment.account ? [{ label: "Portal role", value: employment.account.role }, { label: "Last sign-in", value: employment.account.lastLoginAt ? formatDate(employment.account.lastLoginAt.toISOString().slice(0, 10)) : "Never" }] : []),
                    ]}
                  />
                </CardBody>
              </Card>
            )}
            <Card>
              <CardHeader title="About" />
              <CardBody className="space-y-4">
                <p className="text-sm text-c-muted">{basic.bio || "No bio yet."}</p>
                {basic.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {basic.skills.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader title="Reports to" />
              <CardBody>{basic.manager ? <PersonCell name={basic.manager.name} photoFileId={basic.manager.photoFileId} href={`/crm/employees/${basic.manager.id}`} /> : <p className="text-sm text-c-muted">No reporting manager.</p>}</CardBody>
            </Card>
            <Card>
              <CardHeader title={`Direct reports (${basic.reports.length})`} />
              <CardBody className="space-y-3">
                {basic.reports.length ? basic.reports.map((r) => <PersonCell key={r.id} name={r.name} photoFileId={r.photoFileId} href={`/crm/employees/${r.id}`} />) : <p className="text-sm text-c-muted">No one reports to {basic.firstName}.</p>}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {tab === "personal" && personal && (
        <Card className="max-w-3xl">
          <CardHeader title="Personal details" description={access.isSelf ? "Only you and HR can see these." : "Visible to the employee and HR only."} />
          <CardBody>
            {access.isSelf || (access.manage && can(viewer, "employees.view_personal")) ? (
              <PersonalForm employeeId={basic.id} values={{ ...personal, phone: basic.phone, skills: basic.skills, bio: basic.bio }} />
            ) : (
              <DescriptionList
                items={[
                  { label: "Date of birth", value: formatDate(personal.dateOfBirth) },
                  { label: "Personal email", value: personal.personalEmail },
                  { label: "Address", value: [personal.addressLine, personal.city, personal.state, personal.postalCode, personal.country].filter(Boolean).join(", ") || "—" },
                  { label: "Emergency contact", value: personal.emergencyContactName ? `${personal.emergencyContactName} (${personal.emergencyContactRelation ?? "—"}) · ${personal.emergencyContactPhone ?? ""}` : "—" },
                ]}
              />
            )}
          </CardBody>
        </Card>
      )}

      {tab === "attendance" && access.attendance && <AttendanceTab employeeId={basic.id} timezone={company.timezone} />}
      {tab === "leave" && access.leave && <LeaveTab employeeId={basic.id} />}
      {tab === "work" && access.full && <WorkTab employeeId={basic.id} />}
      {tab === "performance" && <PerformanceTab employeeId={basic.id} />}
      {tab === "documents" && <DocumentsTab employeeId={basic.id} />}
      {tab === "salary" && salary && (
        <Card>
          <CardHeader title="Salary structure history" description="Monthly amounts. Managed in Payroll." action={can(viewer, "payroll.manage") ? <ButtonLink href={`/crm/payroll?tab=salaries&employee=${basic.id}`} size="sm">Manage</ButtonLink> : undefined} />
          {salary.length ? (
            <Table>
              <THead>
                <tr>
                  <th>Effective from</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Gross</th>
                </tr>
              </THead>
              <TBody>
                {salary.map((s) => {
                  const allow = s.allowances.reduce((t, a) => t + Number(a.amount), 0);
                  const ded = s.deductions.reduce((t, a) => t + Number(a.amount), 0);
                  return (
                    <tr key={s.id}>
                      <td className="tabular">{formatDate(s.effectiveFrom)}</td>
                      <td className="tabular">{inr(s.basic)}</td>
                      <td className="tabular">{inr(s.hra)}</td>
                      <td className="tabular">{inr(allow)}</td>
                      <td className="tabular">{inr(ded)}</td>
                      <td className="tabular font-medium">{inr(Number(s.basic) + Number(s.hra) + allow)}</td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <EmptyState title="No salary structure recorded" />
          )}
        </Card>
      )}
    </>
  );
}

async function AttendanceTab({ employeeId, timezone }: { employeeId: string; timezone: string }) {
  const rows = await recentAttendance(employeeId);
  return (
    <Card>
      <CardHeader title="Recent attendance" description="Last 31 records" />
      {rows.length ? (
        <Table>
          <THead>
            <tr>
              <th>Date</th>
              <th>In</th>
              <th>Out</th>
              <th className="hidden sm:table-cell">Mode</th>
              <th>Worked</th>
              <th>Status</th>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="tabular">{formatDate(r.workDate)}</td>
                <td className="tabular">
                  {formatTime(r.checkInAt, timezone)}
                  {r.lateMinutes > 0 && <span className="ml-1.5 text-xs text-c-warning">+{r.lateMinutes}m</span>}
                </td>
                <td className="tabular">{formatTime(r.checkOutAt, timezone)}</td>
                <td className="hidden capitalize sm:table-cell">{r.workMode}</td>
                <td className="tabular">{formatMinutes(r.workedMinutes)}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState title="No attendance recorded yet" />
      )}
    </Card>
  );
}

async function LeaveTab({ employeeId }: { employeeId: string }) {
  const [balances, history] = await Promise.all([getBalances(employeeId), leaveHistory(employeeId)]);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Balances this year" />
        <CardBody className="space-y-3">
          {balances.map((b) => (
            <div key={b.leaveTypeId} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: b.color }} />
                {b.name}
              </span>
              <span className="tabular text-c-muted">{b.unlimited ? `${b.used} used` : `${b.available} left · ${b.used} used`}</span>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Leave history" />
        {history.length ? (
          <Table>
            <THead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </THead>
            <TBody>
              {history.map((l) => (
                <tr key={l.id}>
                  <td>{l.type}</td>
                  <td className="tabular">
                    {formatDateShort(l.startDate)}
                    {l.endDate !== l.startDate && ` – ${formatDateShort(l.endDate)}`}
                    {l.halfDay !== "none" && <span className="text-xs text-c-muted"> ({humanize(l.halfDay)})</span>}
                  </td>
                  <td className="tabular">{Number(l.days)}</td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="No leave requests" />
        )}
      </Card>
    </div>
  );
}

async function WorkTab({ employeeId }: { employeeId: string }) {
  const { projects, tasks } = await workSummary(employeeId);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Projects" />
        {projects.length ? (
          <ul className="divide-y divide-c-border">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/crm/tasks/projects/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-c-surface-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-c-muted">
                      {p.code}
                      {p.isLead && " · Lead"}
                    </span>
                  </span>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Not on any projects" />
        )}
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Assigned tasks" />
        {tasks.length ? (
          <ul className="divide-y divide-c-border">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link href={`/crm/tasks/${t.id}`} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-c-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className="text-xs text-c-muted">{t.dueDate ? `Due ${formatDateShort(t.dueDate)}` : "No due date"}</span>
                  </span>
                  <ProgressBar value={t.progress} className="hidden w-24 sm:block" />
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No tasks assigned" />
        )}
      </Card>
    </div>
  );
}

async function PerformanceTab({ employeeId }: { employeeId: string }) {
  const { reviews, goals } = await performanceSummary(employeeId);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Reviews" action={<ButtonLink href="/crm/performance" size="sm">Open</ButtonLink>} />
        {reviews.length ? (
          <ul className="divide-y divide-c-border">
            {reviews.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  <span className="block font-medium">{r.cycle}</span>
                  <span className="text-xs text-c-muted">
                    Self {r.selfRating ?? "—"}/5 · Manager {r.managerRating ?? "—"}/5
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews yet" />
        )}
      </Card>
      <Card>
        <CardHeader title="Goals" />
        {goals.length ? (
          <ul className="divide-y divide-c-border">
            {goals.map((g) => (
              <li key={g.id} className="space-y-2 px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{g.title}</span>
                  <StatusBadge status={g.status} />
                </div>
                <ProgressBar value={g.progress} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No goals set" />
        )}
      </Card>
    </div>
  );
}

async function DocumentsTab({ employeeId }: { employeeId: string }) {
  const viewer = await requireViewer();
  const docs = await employeeDocuments(viewer, employeeId);
  return (
    <Card>
      <CardHeader title="Documents" action={can(viewer, "documents.manage") ? <ButtonLink href={`/crm/documents?employee=${employeeId}`} size="sm">Manage</ButtonLink> : undefined} />
      {docs.length ? (
        <ul className="divide-y divide-c-border">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <FileText className="size-4 shrink-0 text-c-subtle" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{d.title}</span>
                <span className="text-xs text-c-muted">
                  {humanize(d.category)} · {formatDate(d.createdAt.toISOString().slice(0, 10))}
                  {d.visibility === "hr_only" && " · HR only"}
                </span>
              </span>
              <a href={`/crm/api/files/${d.fileId}?download=1`} className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-c-accent-text hover:underline">
                <Download className="size-3.5" /> Download
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<FileText />} title="No documents" />
      )}
    </Card>
  );
}
