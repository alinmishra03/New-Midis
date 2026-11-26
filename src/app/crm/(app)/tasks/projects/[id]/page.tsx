import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { SegmentedBar } from "@/components/crm/charts";
import { ActivityList } from "@/components/crm/dashboard";
import { ConfirmAction } from "@/components/crm/forms";
import { AddMemberForm, ProjectDialog, TaskDialog } from "@/components/crm/task-forms";
import { TaskBoard } from "@/components/crm/task-views";
import { Badge, Card, CardBody, CardHeader, DescriptionList, EmptyState, PersonCell, StatusBadge } from "@/components/crm/ui";
import { requireViewer } from "@/crm/auth/dal";
import { formatDate, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { assignableEmployees, getProjectForViewer, listTasks, projectActivity } from "@/crm/services/tasks";
import { projectMemberAction } from "../../actions";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/crm/tasks/projects/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const project = await getProjectForViewer(viewer, id);
  if (!project) notFound();
  const p = project.project;
  const company = await getCompany();
  const [rows, activity, options, assignees] = await Promise.all([
    listTasks(viewer, "project", { projectId: id }),
    projectActivity(id),
    project.manage ? employeeFormOptions() : null,
    assignableEmployees(viewer, id),
  ]);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const memberIds = new Set(project.members.map((m) => m.id));
  const canAddTask = project.manage || project.member;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-[0.8125rem] text-c-subtle">
        <Link href="/crm/tasks?view=projects" className="hover:text-c-fg">
          Projects &amp; Websites
        </Link>
      </nav>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold sm:text-2xl">{p.name}</h1>
            <StatusBadge status={p.status} />
          </div>
          <p className="mt-1 text-sm text-c-muted">{p.code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.manage && options && (
            <ProjectDialog
              people={options.managers}
              departments={options.departments}
              values={{ id: p.id, name: p.name, code: p.code, description: p.description, status: p.status, startDate: p.startDate, dueDate: p.dueDate, ownerId: p.ownerId, departmentId: p.departmentId }}
            />
          )}
          {canAddTask && (
            <TaskDialog projects={[{ value: p.id, label: p.name }]} assignees={{ [p.id]: assignees.map((a) => ({ value: a.id, label: `${a.firstName} ${a.lastName}` })) }} fixedProject={p.id} label="Add task" />
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Progress" description={`${count("completed")} of ${rows.length} tasks completed`} />
          <CardBody>
            <SegmentedBar
              label="Tasks by status"
              segments={[
                { label: "To do", value: count("todo") },
                { label: "In progress", value: count("in_progress") },
                { label: "Review", value: count("review") },
                { label: "Completed", value: count("completed") },
              ]}
            />
            {p.description && <p className="mt-5 text-sm whitespace-pre-wrap text-c-muted">{p.description}</p>}
            <div className="mt-5">
              <DescriptionList
                columns={3}
                items={[
                  { label: "Owner", value: project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : "—" },
                  { label: "Start", value: formatDate(p.startDate) },
                  { label: "Due", value: formatDate(p.dueDate) },
                ]}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={`Members (${project.members.length})`} />
          <CardBody className="space-y-3">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2">
                <PersonCell name={m.name} photoFileId={m.photoFileId} href={`/crm/employees/${m.id}`} sub={m.id === p.ownerId ? "Owner" : m.isLead ? "Lead" : undefined} />
                <span className="flex items-center gap-1">
                  {m.isLead && <Badge tone="accent">Lead</Badge>}
                  {project.manage && m.id !== p.ownerId && (
                    <ConfirmAction action={projectMemberAction} fields={{ projectId: p.id, employeeId: m.id, op: "remove" }} label="" ariaLabel={`Remove ${m.name}`} icon={<X />} variant="ghost" size="icon" confirmVariant="danger" title={`Remove ${m.firstName} from ${p.name}?`} description="Their tasks stay in the project." confirmLabel="Remove" />
                  )}
                </span>
              </div>
            ))}
            {project.manage && options && (
              <div className="border-t border-c-border pt-3">
                <AddMemberForm projectId={p.id} people={options.managers.filter((o) => !memberIds.has(o.value))} />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 text-base font-semibold">Tasks</h2>
      {rows.length ? <TaskBoard rows={rows} today={todayIn(company.timezone)} editable={false} /> : <Card><EmptyState title="No tasks in this project yet" /></Card>}

      <Card className="mt-6">
        <CardHeader title="Project activity" />
        {activity.length ? <ActivityList items={activity} /> : <EmptyState title="No activity yet" />}
      </Card>
    </>
  );
}
