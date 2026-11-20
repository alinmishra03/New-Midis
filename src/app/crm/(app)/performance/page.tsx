import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Target } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { CycleDialog, GoalDialog, GoalProgress } from "@/components/crm/performance-forms";
import { Card, CardHeader, EmptyState, PageHeader, PersonCell, ProgressBar, StatusBadge, Table, TBody, THead, Tabs } from "@/components/crm/ui";
import { can, getTeamEmployeeIds, requireViewer } from "@/crm/auth/dal";
import { formatDate, formatDateShort, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { goalsFor, listCycles, myReviews, reviewsToGive } from "@/crm/services/performance";
import { cycleOpenAction } from "./actions";

export const metadata: Metadata = { title: "Performance" };

const STATUS_LABEL: Record<string, string> = { self_assessment: "Self-assessment due", manager_review: "Awaiting manager", completed: "Completed" };

export default async function PerformancePage({ searchParams }: PageProps<"/crm/performance">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const company = await getCompany();
  const hasTeam = viewer.employee ? (await getTeamEmployeeIds(viewer.employee.id)).length > 0 : false;
  const reviewer = can(viewer, "performance.manage") || (can(viewer, "performance.review_team") && hasTeam);
  const tabs = [
    { key: "mine", label: "My performance", href: "/crm/performance" },
    ...(reviewer ? [{ key: "team", label: can(viewer, "performance.manage") ? "All reviews" : "Team reviews", href: "/crm/performance?tab=team" }] : []),
    ...(can(viewer, "performance.manage") ? [{ key: "cycles", label: "Review cycles", href: "/crm/performance?tab=cycles" }] : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : "mine";

  return (
    <>
      <PageHeader title="Performance" description="Reviews, feedback and goals." actions={tab === "cycles" ? <CycleDialog today={todayIn(company.timezone)} /> : undefined} />
      <Tabs tabs={tabs} active={tab} />
      {tab === "mine" && <Mine />}
      {tab === "team" && reviewer && <Team />}
      {tab === "cycles" && can(viewer, "performance.manage") && <Cycles />}
    </>
  );
}

async function Mine() {
  const viewer = await requireViewer();
  if (!viewer.employee) return <Card><EmptyState title="Your account isn't linked to an employee record" /></Card>;
  const [reviews, goals] = await Promise.all([myReviews(viewer), goalsFor(viewer, viewer.employee.id)]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="My reviews" />
        {reviews.length ? (
          <ul className="divide-y divide-c-border">
            {reviews.map((r) => (
              <li key={r.id}>
                <Link href={`/crm/performance/reviews/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-c-surface-2">
                  <span>
                    <span className="block text-sm font-medium">{r.cycleName}</span>
                    <span className="text-xs text-c-muted">
                      {formatDateShort(r.periodStart)} – {formatDateShort(r.periodEnd)}
                      {r.managerRating && ` · Rated ${r.managerRating}/5`}
                    </span>
                  </span>
                  <StatusBadge status={r.status} label={STATUS_LABEL[r.status]} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<ClipboardList />} title="No reviews yet" description="You'll be notified when a review cycle opens." />
        )}
      </Card>
      <Card>
        <CardHeader title="My goals" action={<GoalDialog employeeId={viewer.employee.id} />} />
        {goals.length ? (
          <ul className="divide-y divide-c-border">
            {goals.map((g) => (
              <li key={g.id} className="space-y-2 px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium">{g.title}</span>
                    {g.dueDate && <span className="text-xs text-c-muted">Target {formatDate(g.dueDate)}</span>}
                  </span>
                  <StatusBadge status={g.status} />
                </div>
                {g.description && <p className="text-xs text-c-muted">{g.description}</p>}
                <ProgressBar value={g.progress} label="Goal progress" />
                <GoalProgress id={g.id} status={g.status} progress={g.progress} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Target />} title="No goals yet" description="Add goals yourself, or your manager can set them." />
        )}
      </Card>
    </div>
  );
}

async function Team() {
  const viewer = await requireViewer();
  const rows = await reviewsToGive(viewer);
  if (!rows.length) return <Card><EmptyState icon={<ClipboardList />} title="No reviews to give" description="Reviews for your team appear here when a cycle opens." /></Card>;
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <th>Employee</th>
            <th>Cycle</th>
            <th className="hidden sm:table-cell">Self</th>
            <th className="hidden sm:table-cell">Manager</th>
            <th>Status</th>
            <th className="text-right">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </THead>
        <TBody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <PersonCell name={`${r.firstName} ${r.lastName}`} photoFileId={r.photoFileId} />
              </td>
              <td>{r.cycleName}</td>
              <td className="tabular hidden sm:table-cell">{r.selfRating ? `${r.selfRating}/5` : "—"}</td>
              <td className="tabular hidden sm:table-cell">{r.managerRating ? `${r.managerRating}/5` : "—"}</td>
              <td>
                <StatusBadge status={r.status} label={STATUS_LABEL[r.status]} />
              </td>
              <td className="text-right">
                <Link href={`/crm/performance/reviews/${r.id}`} className="text-[0.8125rem] font-medium text-c-accent-text hover:underline">
                  {r.status === "manager_review" && r.employeeId !== viewer.employee?.id ? "Review" : "Open"}
                </Link>
              </td>
            </tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

async function Cycles() {
  const cycles = await listCycles();
  if (!cycles.length) return <Card><EmptyState icon={<ClipboardList />} title="No review cycles yet" description="Open one to start a review round." /></Card>;
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <th>Cycle</th>
            <th>Period</th>
            <th>Progress</th>
            <th>Status</th>
            <th className="text-right">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </THead>
        <TBody>
          {cycles.map((c) => (
            <tr key={c.id}>
              <td className="font-medium">
                {c.name} <span className="text-xs font-normal text-c-muted capitalize">· {c.type}</span>
              </td>
              <td className="tabular whitespace-nowrap">
                {formatDateShort(c.periodStart)} – {formatDateShort(c.periodEnd)}
              </td>
              <td className="w-48">
                <p className="tabular mb-1 text-xs text-c-muted">
                  {c.completed}/{c.total} complete · {c.awaitingManager} awaiting manager
                </p>
                <ProgressBar value={c.total ? (c.completed / c.total) * 100 : 0} label="Cycle progress" />
              </td>
              <td>
                <StatusBadge status={c.isOpen ? "open" : "closed"} />
              </td>
              <td className="text-right">
                <ConfirmAction action={cycleOpenAction} fields={{ id: c.id, open: c.isOpen ? "0" : "1" }} label={c.isOpen ? "Close" : "Reopen"} title={c.isOpen ? `Close ${c.name}?` : `Reopen ${c.name}?`} description={c.isOpen ? "No further submissions will be accepted." : undefined} confirmLabel={c.isOpen ? "Close cycle" : "Reopen"} />
              </td>
            </tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
