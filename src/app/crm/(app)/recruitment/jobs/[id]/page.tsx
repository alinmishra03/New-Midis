import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Users, X } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { CandidateDialog, HireDialog, InterviewDialog, JobDialog, StageSelect } from "@/components/crm/recruitment-forms";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatusBadge, humanize } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { formatDateTime, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { getJob } from "@/crm/services/recruitment";
import { cancelInterviewAction } from "../../actions";

export const metadata: Metadata = { title: "Job opening" };

export default async function JobPage({ params }: PageProps<"/crm/recruitment/jobs/[id]">) {
  const viewer = await requirePermission("recruitment.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getJob(viewer, id);
  if (!data) notFound();
  const { job, candidates } = data;
  const [options, company] = await Promise.all([employeeFormOptions(), getCompany()]);
  const today = todayIn(company.timezone);
  const canHire = can(viewer, "employees.manage") && can(viewer, "users.invite");

  return (
    <>
      <PageHeader
        title={job.title}
        breadcrumb={[{ label: "Recruitment", href: "/crm/recruitment" }]}
        description={[data.department, humanize(job.employmentType), job.location, `${job.positions} position${job.positions === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
        actions={
          <>
            <JobDialog departments={options.departments} people={options.managers} values={{ id: job.id, title: job.title, departmentId: job.departmentId, location: job.location, employmentType: job.employmentType, description: job.description, positions: job.positions, status: job.status, hiringManagerId: job.hiringManagerId }} />
            <CandidateDialog jobId={job.id} />
          </>
        }
      />
      <div className="mb-4">
        <StatusBadge status={job.status} />
      </div>
      {job.description && (
        <Card className="mb-4">
          <CardBody>
            <p className="text-sm whitespace-pre-line text-c-muted">{job.description}</p>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader title={`Candidates (${candidates.length})`} />
        {candidates.length ? (
          <ul className="divide-y divide-c-border">
            {candidates.map((c) => (
              <li key={c.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{c.fullName}</p>
                    <p className="text-xs text-c-muted">
                      {c.email}
                      {c.phone && ` · ${c.phone}`}
                      {c.source && ` · via ${c.source}`}
                    </p>
                    {c.resumeFileId && (
                      <a href={`/crm/api/files/${c.resumeFileId}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-c-accent-text hover:underline">
                        <FileText className="size-3" /> {c.resumeName ?? "Resume"}
                      </a>
                    )}
                    {c.notes && <p className="mt-1 text-xs whitespace-pre-line text-c-muted">{c.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.stage === "hired" ? (
                      <>
                        <Badge tone="success">Hired</Badge>
                        {c.employeeId && (
                          <Link href={`/crm/employees/${c.employeeId}`} className="text-xs font-medium text-c-accent-text hover:underline">
                            View employee
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        <StageSelect id={c.id} stage={c.stage} />
                        <InterviewDialog candidateId={c.id} candidateName={c.fullName} people={options.managers} today={today} />
                        {canHire && c.stage !== "rejected" && <HireDialog candidateId={c.id} candidateName={c.fullName} designations={options.designations} people={options.managers} today={today} />}
                      </>
                    )}
                  </div>
                </div>
                {c.interviews.length > 0 && (
                  <ul className="space-y-2 rounded-lg bg-c-surface-2 p-3">
                    {c.interviews.map((i) => (
                      <li key={i.id} className="flex flex-col gap-1 text-[0.8125rem] sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          <Link href={`/crm/recruitment/interviews/${i.id}`} className="font-medium hover:underline">
                            {formatDateTime(i.scheduledAt, company.timezone)}
                          </Link>{" "}
                          · {i.interviewerFirst ? `${i.interviewerFirst} ${i.interviewerLast}` : "—"} · {humanize(i.mode)}
                          {i.rating && (
                            <span className="text-c-muted">
                              {" "}
                              · {i.rating}/5, {humanize(i.recommendation ?? "")}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <StatusBadge status={i.status} />
                          {i.status === "scheduled" && <ConfirmAction action={cancelInterviewAction} fields={{ id: i.id }} label="" ariaLabel="Cancel interview" icon={<X />} variant="ghost" size="icon" confirmVariant="danger" title="Cancel this interview?" confirmLabel="Cancel interview" />}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Users />} title="No candidates yet" description="Add candidates as applications come in." />
        )}
      </Card>
    </>
  );
}
