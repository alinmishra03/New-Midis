import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { FeedbackForm } from "@/components/crm/recruitment-forms";
import { Card, CardBody, CardHeader, DescriptionList, PageHeader, StatusBadge, humanize } from "@/components/crm/ui";
import { requireViewer } from "@/crm/auth/dal";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { getInterview } from "@/crm/services/recruitment";

export const metadata: Metadata = { title: "Interview" };

/** Open to the interviewer (even without recruitment access) and to recruiters. */
export default async function InterviewPage({ params }: PageProps<"/crm/recruitment/interviews/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getInterview(viewer, id);
  if (!data) notFound();
  const { iv, candidate, job, interviewer } = data;
  const company = await getCompany();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Interview — ${candidate.fullName}`} description={job?.title} actions={<StatusBadge status={iv.status} />} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Details" />
          <CardBody>
            <DescriptionList
              columns={1}
              items={[
                { label: "When", value: `${formatDateTime(iv.scheduledAt, company.timezone)} · ${iv.durationMinutes} min` },
                { label: "Mode", value: humanize(iv.mode) },
                { label: "Where", value: iv.location },
                { label: "Interviewer", value: interviewer ? `${interviewer.firstName} ${interviewer.lastName}` : "—" },
                { label: "Candidate email", value: candidate.email },
                {
                  label: "Resume",
                  value: candidate.resumeFileId ? (
                    <a href={`/crm/api/files/${candidate.resumeFileId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-c-accent-text hover:underline">
                      <FileText className="size-3.5" /> Open resume
                    </a>
                  ) : (
                    "Not provided"
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Feedback" />
          <CardBody>
            {iv.status === "completed" ? (
              <DescriptionList
                columns={1}
                items={[
                  { label: "Rating", value: `${iv.rating}/5` },
                  { label: "Recommendation", value: humanize(iv.recommendation ?? "") },
                  { label: "Notes", value: <span className="whitespace-pre-line">{iv.feedback}</span> },
                ]}
              />
            ) : iv.status === "cancelled" ? (
              <p className="text-sm text-c-muted">This interview was cancelled.</p>
            ) : (
              <FeedbackForm id={iv.id} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
