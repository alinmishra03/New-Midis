import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, ListChecks } from "lucide-react";
import { inputClass } from "@/components/crm/forms";
import { ProjectDialog, TaskDialog } from "@/components/crm/task-forms";
import { TaskBoard, TaskTable } from "@/components/crm/task-views";
import { Card, EmptyState, PageHeader, ProgressBar, StatusBadge, Tabs, buttonClass, humanize } from "@/components/crm/ui";
import { can, getTeamEmployeeIds, requireViewer } from "@/crm/auth/dal";
import { formatDateShort, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { listProjects, listTasks, taskDialogOptions, TASK_STATUSES, type TaskView } from "@/crm/services/tasks";

export const metadata: Metadata = { title: "Tasks & Projects" };

export default async function TasksPage({ searchParams }: PageProps<"/crm/tasks">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const hasTeam = viewer.employee ? (await getTeamEmployeeIds(viewer.employee.id)).length > 0 : false;
  const tabs = [
    { key: "mine", label: "My tasks", href: "/crm/tasks" },
    { key: "created", label: "Assigned by me", href: "/crm/tasks?view=created" },
    ...(hasTeam ? [{ key: "team", label: "Team tasks", href: "/crm/tasks?view=team" }] : []),
    ...(can(viewer, "tasks.view_all") ? [{ key: "all", label: "All tasks", href: "/crm/tasks?view=all" }] : []),
    { key: "projects", label: "Projects", href: "/crm/tasks?view=projects" },
  ];
  const view = tabs.some((t) => t.key === sp.view) ? (sp.view as string) : "mine";
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const priority = typeof sp.priority === "string" ? sp.priority : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;

  const [dialog, options] = await Promise.all([taskDialogOptions(viewer), can(viewer, "projects.manage") ? employeeFormOptions() : null]);

  return (
    <>
      <PageHeader
        title="Tasks & Projects"
        description="Your work, your team's work, and the projects it belongs to."
        actions={
          <>
            {options && <ProjectDialog people={options.managers} departments={options.departments} />}
            {viewer.employee && <TaskDialog projects={dialog.projects} assignees={dialog.assignees} />}
          </>
        }
      />
      <Tabs tabs={tabs} active={view} />

      {view === "projects" ? (
        <ProjectsGrid />
      ) : (
        <>
          {view !== "mine" && (
            <form className="mb-4 flex flex-wrap gap-2">
              <input type="hidden" name="view" value={view} />
              <input name="q" defaultValue={q} placeholder="Search tasks" aria-label="Search tasks" className={`${inputClass} max-w-xs`} />
              <select name="status" defaultValue={status ?? ""} className={`${inputClass} w-40`} aria-label="Status">
                <option value="">All statuses</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select name="priority" defaultValue={priority ?? ""} className={`${inputClass} w-36`} aria-label="Priority">
                <option value="">Any priority</option>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {humanize(p)}
                  </option>
                ))}
              </select>
              <button type="submit" className={buttonClass("secondary")}>
                Filter
              </button>
            </form>
          )}
          {(async () => {
            const rows = await listTasks(viewer, view as TaskView, { status, priority, q });
            if (view === "mine") return rows.length ? <TaskBoard rows={rows} today={today} editable /> : <Card><EmptyState icon={<ListChecks />} title="No tasks assigned to you" description="Create a personal task, or wait for one to be assigned." /></Card>;
            return <Card><TaskTable rows={rows} today={today} /></Card>;
          })()}
        </>
      )}
    </>
  );
}

async function ProjectsGrid() {
  const viewer = await requireViewer();
  const projects = await listProjects(viewer);
  if (!projects.length) return <Card><EmptyState icon={<FolderKanban />} title="No projects yet" description={can(viewer, "projects.manage") ? "Create a project to group tasks and members." : "Projects you're a member of will appear here."} /></Card>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <Link key={p.id} href={`/crm/tasks/projects/${p.id}`} className="block rounded-xl border border-c-border bg-c-surface p-5 shadow-c transition-colors hover:border-c-border-strong">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="text-xs text-c-muted">{p.code}</p>
            </div>
            <StatusBadge status={p.status} />
          </div>
          {p.description && <p className="mt-2 line-clamp-2 text-[0.8125rem] text-c-muted">{p.description}</p>}
          <div className="mt-4 flex items-center justify-between text-xs text-c-muted">
            <span className="tabular">
              {p.done}/{p.total} tasks done · {p.members} member{p.members === 1 ? "" : "s"}
            </span>
            {p.dueDate && <span>Due {formatDateShort(p.dueDate)}</span>}
          </div>
          <ProgressBar value={p.total ? (p.done / p.total) * 100 : 0} className="mt-2" label="Project progress" />
        </Link>
      ))}
    </div>
  );
}
