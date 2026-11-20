import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoalDialog, GoalProgress, ManagerReviewForm, SelfReviewForm } from "@/components/crm/performance-forms";
import { Card, CardBody, CardHeader, EmptyState, ProgressBar, StatusBadge } from "@/components/crm/ui";
import { requireViewer } from "@/crm/auth/dal";
import { formatDate, formatDateShort } from "@/crm/lib/time";
import { getReview, goalsFor } from "@/crm/services/performance";

export const metadata: Metadata = { title: "Performance review" };

const LABELS = ["", "Needs improvement", "Below expectations", "Meets expectations", "Exceeds expectations", "Outstanding"];

function Rating({ value }: { value: number | null }) {
  if (!value) return <span className="text-c-subtle">Not rated</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="tabular rounded-md bg-c-accent-soft px-2 py-0.5 text-sm font-semibold text-c-accent-text">{value}/5</span>
      <span className="text-sm text-c-muted">{LABELS[value]}</span>
    </span>
  );
}

export default async function ReviewPage({ params }: PageProps<"/crm/performance/reviews/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const r = await getReview(viewer, id);
  if (!r) notFound();
  const goals = await goalsFor(viewer, r.employeeId);
  const managerView = r.canManagerReview && !r.isSelf;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-[0.8125rem] text-c-subtle">
        <Link href={r.isSelf ? "/crm/performance" : "/crm/performance?tab=team"} className="hover:text-c-fg">
          Performance
        </Link>
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">
            {r.isSelf ? "My review" : `${r.firstName} ${r.lastName}`} · {r.cycleName}
          </h1>
          <p className="mt-1 text-sm text-c-muted">
            {formatDateShort(r.periodStart)} – {formatDate(r.periodEnd)} · Reviewer: {r.reviewerName ?? "HR"}
            {!r.cycleOpen && " · Cycle closed"}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Self-assessment" />
          <CardBody>
            {r.status === "self_assessment" ? (
              r.isSelf && r.cycleOpen ? (
                <SelfReviewForm id={r.id} />
              ) : (
                <EmptyState title="Not submitted yet" />
              )
            ) : (
              <div className="space-y-4">
                <Rating value={r.selfRating} />
                <p className="text-sm whitespace-pre-line">{r.selfAssessment}</p>
                {r.achievements && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-c-subtle">Achievements</p>
                    <p className="text-sm whitespace-pre-line text-c-muted">{r.achievements}</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Manager review" />
          <CardBody>
            {r.status === "completed" ? (
              <div className="space-y-4">
                <Rating value={r.managerRating} />
                <p className="text-sm whitespace-pre-line">{r.managerFeedback}</p>
              </div>
            ) : managerView && r.cycleOpen ? (
              <>
                {r.status === "self_assessment" && <p className="mb-4 text-[0.8125rem] text-c-warning">The self-assessment isn&apos;t in yet. You can still complete the review if needed.</p>}
                <ManagerReviewForm id={r.id} />
              </>
            ) : (
              <EmptyState title={r.status === "manager_review" ? "Waiting for the manager" : "After the self-assessment"} />
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Goals" action={r.isSelf || managerView ? <GoalDialog employeeId={r.employeeId} /> : undefined} />
        {goals.length ? (
          <ul className="divide-y divide-c-border">
            {goals.map((g) => (
              <li key={g.id} className="space-y-2 px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">{g.title}</span>
                  <StatusBadge status={g.status} />
                </div>
                <ProgressBar value={g.progress} label="Goal progress" />
                {(r.isSelf || managerView) && <GoalProgress id={g.id} status={g.status} progress={g.progress} />}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No goals set" />
        )}
      </Card>
    </>
  );
}
