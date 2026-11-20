import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ClipboardList, Play } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { JobDialog } from "@/components/crm/recruitment-forms";
import { Card, CardHeader, EmptyState, PageHeader, PersonCell, ProgressBar, StatusBadge, Table, TBody, THead, Tabs, humanize } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { formatDate } from "@/crm/lib/time";
import { employeeFormOptions } from "@/crm/services/employees";
import { listJobs, onboardingOverview } from "@/crm/services/recruitment";
import { startOnboardingAction } from "./actions";

export const metadata: Metadata = { title: "Recruitment" };

export default async function RecruitmentPage({ searchParams }: PageProps<"/crm/recruitment">) {
  const viewer = await requirePermission("recruitment.manage", "onboarding.manage");
  const sp = await searchParams;
  const tabs = [
    ...(can(viewer, "recruitment.manage") ? [{ key: "jobs", label: "Job openings", href: "/crm/recruitment" }] : []),
    ...(can(viewer, "onboarding.manage") ? [{ key: "onboarding", label: "Onboarding", href: "/crm/recruitment?tab=onboarding" }] : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : tabs[0]!.key;
  const options = await employeeFormOptions();

  return (
    <>
      <PageHeader title="Recruitment & onboarding" description="Openings, candidates, interviews and new-joiner checklists." actions={tab === "jobs" ? <JobDialog departments={options.departments} people={options.managers} /> : undefined} />
      <Tabs tabs={tabs} active={tab} />
      {tab === "jobs" && <Jobs />}
      {tab === "onboarding" && <Onboarding />}
    </>
  );
}

async function Jobs() {
  const viewer = await requirePermission("recruitment.manage");
  const jobs = await listJobs(viewer);
  if (!jobs.length) return <Card><EmptyState icon={<Briefcase />} title="No job openings yet" description="Create an opening to start tracking candidates." /></Card>;
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <th>Role</th>
            <th className="hidden md:table-cell">Department</th>
            <th>Status</th>
            <th>Candidates</th>
            <th className="hidden sm:table-cell">Hired</th>
          </tr>
        </THead>
        <TBody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td>
                <Link href={`/crm/recruitment/jobs/${j.id}`} className="font-medium hover:text-c-accent-text">
                  {j.title}
                </Link>
                <span className="block text-xs text-c-muted">
                  {humanize(j.employmentType)}
                  {j.location && ` · ${j.location}`}
                </span>
              </td>
              <td className="hidden md:table-cell">{j.department ?? "—"}</td>
              <td>
                <StatusBadge status={j.status} />
              </td>
              <td className="tabular">
                {j.candidates}
                {j.interviewing > 0 && <span className="text-xs text-c-muted"> · {j.interviewing} interviewing</span>}
              </td>
              <td className="tabular hidden sm:table-cell">
                {j.hired}/{j.positions}
              </td>
            </tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

async function Onboarding() {
  const viewer = await requirePermission("onboarding.manage");
  const { rows, notStarted } = await onboardingOverview(viewer);
  return (
    <div className="space-y-4">
      {notStarted.length > 0 && (
        <Card>
          <CardHeader title="Recent joiners without a checklist" />
          <ul className="divide-y divide-c-border">
            {notStarted.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <PersonCell name={`${n.firstName} ${n.lastName}`} href={`/crm/employees/${n.id}`} />
                <ConfirmAction action={startOnboardingAction} fields={{ employeeId: n.id }} label="Start onboarding" icon={<Play />} title={`Start onboarding for ${n.firstName}?`} description="Creates the standard new-joiner checklist with due dates from their joining date." confirmLabel="Start" />
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardHeader title="Onboarding in progress" />
        {rows.length ? (
          <ul className="divide-y divide-c-border">
            {rows.map((r) => (
              <li key={r.employeeId}>
                <Link href={`/crm/recruitment/onboarding/${r.employeeId}`} className="flex flex-col gap-2 px-5 py-3 hover:bg-c-surface-2 sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1">
                    <PersonCell name={`${r.firstName} ${r.lastName}`} sub={`Joined ${formatDate(r.joiningDate)}`} photoFileId={r.photoFileId} />
                  </span>
                  <span className="w-full sm:w-56">
                    <span className="tabular mb-1 block text-xs text-c-muted">
                      {r.total - r.remaining}/{r.total} done
                    </span>
                    <ProgressBar value={((r.total - r.remaining) / r.total) * 100} tone={r.remaining ? "accent" : "success"} label="Onboarding progress" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<ClipboardList />} title="No onboarding checklists yet" description="Hiring a candidate starts one automatically." />
        )}
      </Card>
    </div>
  );
}
