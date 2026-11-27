import type { Metadata } from "next";
import { Filter, FolderKanban, ListChecks } from "lucide-react";
import { ProjectCatalog } from "@/components/crm/project-catalog";
import { inputClass, SearchInput } from "@/components/crm/forms";
import { ProjectDialog, TaskDialog } from "@/components/crm/task-forms";
import { TaskBoard, TaskTable } from "@/components/crm/task-views";
import { ButtonLink, Card, EmptyState, FilterBar, PageHeader, Tabs, buttonClass, humanize } from "@/components/crm/ui";
import { can, getTeamEmployeeIds, requireViewer } from "@/crm/auth/dal";
import { todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { listProjectCatalog } from "@/crm/services/project-catalog";
import { listTasks, taskDialogOptions, TASK_STATUSES, type TaskView } from "@/crm/services/tasks";

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
    { key: "projects", label: "Projects & Websites", href: "/crm/tasks?view=projects" },
  ];
  const view = tabs.some((t) => t.key === sp.view) ? (sp.view as string) : "mine";
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const priority = typeof sp.priority === "string" ? sp.priority : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;

  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const [dialog, options] = await Promise.all([taskDialogOptions(viewer), can(viewer, "projects.manage") ? employeeFormOptions() : null]);

  return (
    <>
      <PageHeader
        title={view === "projects" ? "Projects & Websites" : "Tasks & Projects"}
        description={view === "projects" ? "Manage live websites, completed projects, ongoing development, and Shopify stores." : "Your work, your team's work, and the projects it belongs to."}
        actions={
          <>
            {options && <ProjectDialog people={options.managers} departments={options.departments} />}
            {viewer.employee && <TaskDialog projects={dialog.projects} assignees={dialog.assignees} />}
          </>
        }
      />
      <Tabs tabs={tabs} active={view} />

      {view === "projects" ? (
        <ProjectsView params={{ section: str("section"), q: str("q"), env: str("env"), dev: str("dev"), sort: str("sort"), dir: str("dir"), page: str("page") }} />
      ) : (
        <>
          {view === "mine" ? (
            (async () => {
              const rows = await listTasks(viewer, view as TaskView, { status, priority, q });
              return rows.length ? <TaskBoard rows={rows} today={today} editable /> : <Card><EmptyState icon={<ListChecks />} title="No tasks assigned to you" description="Create a personal task, or wait for one to be assigned." /></Card>;
            })()
          ) : (
            <Card>
              <FilterBar role="search">
                <input type="hidden" name="view" value={view} />
                <SearchInput name="q" defaultValue={q} placeholder="Search tasks" aria-label="Search tasks" />
                <select name="status" defaultValue={status ?? ""} className={`${inputClass} sm:w-40`} aria-label="Status">
                  <option value="">All statuses</option>
                  {TASK_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select name="priority" defaultValue={priority ?? ""} className={`${inputClass} sm:w-36`} aria-label="Priority">
                  <option value="">Any priority</option>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>
                      {humanize(p)}
                    </option>
                  ))}
                </select>
                <button type="submit" className={buttonClass("secondary")}>
                  <Filter /> Filter
                </button>
                {(q || status || priority) && (
                  <ButtonLink href={`/crm/tasks?view=${view}`} variant="ghost">
                    Clear
                  </ButtonLink>
                )}
              </FilterBar>
              {(async () => {
                const rows = await listTasks(viewer, view as TaskView, { status, priority, q });
                return <TaskTable rows={rows} today={today} filtered={!!(q || status || priority)} />;
              })()}
            </Card>
          )}
        </>
      )}
    </>
  );
}

async function ProjectsView({ params }: { params: Parameters<typeof ProjectCatalog>[0]["params"] }) {
  const viewer = await requireViewer();
  const rows = await listProjectCatalog(viewer);
  if (!rows.length) return <Card><EmptyState icon={<FolderKanban />} title="No projects yet" description={can(viewer, "projects.manage") ? "Create a project to group tasks and members." : "Projects you're a member of will appear here."} /></Card>;
  return <ProjectCatalog rows={rows} params={params} />;
}
