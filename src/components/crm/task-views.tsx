import Link from "next/link";
import { CalendarDays, ListChecks } from "lucide-react";
import { TASK_STATUSES, type listTasks } from "@/crm/services/tasks";
import { formatDateShort } from "@/crm/lib/time";
import { cn } from "@/lib/utils";
import { TaskProgressForm } from "./task-forms";
import { Avatar, Badge, EmptyState, ProgressBar, StatusBadge, Table, TBody, THead, humanize } from "./ui";

type TaskRow = Awaited<ReturnType<typeof listTasks>>[number];

export const PRIORITY_TONE = { low: "neutral", medium: "info", high: "warning", urgent: "danger" } as const;

export function Due({ date, today, done }: { date: string | null; today: string; done: boolean }) {
  if (!date) return null;
  const overdue = !done && date < today;
  return (
    <span className={cn("flex items-center gap-1 text-xs", overdue ? "font-medium text-c-danger" : "text-c-muted")}>
      <CalendarDays className="size-3" />
      {overdue ? "Overdue · " : ""}
      {formatDateShort(date)}
    </span>
  );
}

// Column colour cue only (the column title still names the status).
const COLUMN_DOT: Record<string, string> = { todo: "bg-c-subtle", in_progress: "bg-c-warning", review: "bg-c-info", completed: "bg-c-success" };

export function TaskBoard({ rows, today, editable }: { rows: TaskRow[]; today: string; editable: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((col) => {
        const items = rows.filter((r) => r.status === col.key);
        return (
          <section key={col.key} aria-label={col.label} className="flex flex-col rounded-xl border border-c-border bg-c-surface-2">
            <header className="flex items-center justify-between px-4 py-3">
              <h2 className="flex items-center gap-2 text-[0.8125rem] font-semibold">
                <span aria-hidden className={cn("size-2 rounded-full", COLUMN_DOT[col.key] ?? "bg-c-subtle")} />
                {col.label}
              </h2>
              <span className="tabular rounded-full bg-c-surface px-2 text-xs text-c-muted ring-1 ring-c-border ring-inset">{items.length}</span>
            </header>
            <ul className="flex-1 space-y-2 px-3 pb-3">
              {items.length === 0 && <li className="rounded-lg border border-dashed border-c-border-strong/60 px-3 py-6 text-center text-xs text-c-subtle">Nothing here</li>}
              {items.map((t) => (
                <li key={t.id} className="rounded-lg border border-c-border bg-c-surface p-3 shadow-c transition-[border-color,box-shadow] duration-150 hover:border-c-border-strong hover:shadow-c-lg">
                  <Link href={`/crm/tasks/${t.id}`} className="block text-sm font-medium hover:text-c-accent-text">
                    {t.title}
                  </Link>
                  {t.projectName && <p className="mt-0.5 truncate text-xs text-c-muted">{t.projectName}</p>}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {t.priority !== "medium" && <Badge tone={PRIORITY_TONE[t.priority]}>{humanize(t.priority)}</Badge>}
                    <Due date={t.dueDate} today={today} done={t.status === "completed"} />
                  </div>
                  {t.status !== "completed" && t.progress > 0 && <ProgressBar value={t.progress} className="mt-2.5" label="Progress" />}
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    {t.assigneeFirst ? <Avatar name={`${t.assigneeFirst} ${t.assigneeLast}`} photoFileId={t.assigneePhoto} size={22} /> : <span className="text-xs text-c-subtle">Unassigned</span>}
                    {editable && <TaskProgressForm id={t.id} status={t.status} progress={t.progress} compact />}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function TaskTable({ rows, today, filtered = false }: { rows: TaskRow[]; today: string; filtered?: boolean }) {
  if (!rows.length) return <EmptyState icon={<ListChecks />} title={filtered ? "No tasks match these filters" : "No tasks"} description={filtered ? "Try a different search, or clear the filters." : undefined} />;
  return (
    <Table>
      <THead>
        <tr>
          <th>Task</th>
          <th className="hidden md:table-cell">Assignee</th>
          <th>Status</th>
          <th className="hidden sm:table-cell">Priority</th>
          <th>Due</th>
          <th className="hidden lg:table-cell">Progress</th>
        </tr>
      </THead>
      <TBody>
        {rows.map((t) => (
          <tr key={t.id}>
            <td className="max-w-xs">
              <Link href={`/crm/tasks/${t.id}`} className="block truncate font-medium hover:text-c-accent-text">
                {t.title}
              </Link>
              {t.projectName && <span className="block truncate text-xs text-c-muted">{t.projectName}</span>}
            </td>
            <td className="hidden md:table-cell">
              {t.assigneeFirst ? (
                <span className="flex items-center gap-2">
                  <Avatar name={`${t.assigneeFirst} ${t.assigneeLast}`} photoFileId={t.assigneePhoto} size={24} />
                  <span className="truncate">
                    {t.assigneeFirst} {t.assigneeLast}
                  </span>
                </span>
              ) : (
                <span className="text-c-subtle">Unassigned</span>
              )}
            </td>
            <td>
              <StatusBadge status={t.status} />
            </td>
            <td className="hidden sm:table-cell">
              <Badge tone={PRIORITY_TONE[t.priority]}>{humanize(t.priority)}</Badge>
            </td>
            <td>
              <Due date={t.dueDate} today={today} done={t.status === "completed"} />
            </td>
            <td className="hidden w-32 lg:table-cell">
              <ProgressBar value={t.progress} label="Progress" />
            </td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

