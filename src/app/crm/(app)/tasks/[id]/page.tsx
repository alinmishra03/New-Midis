import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, History, MessageSquare, Paperclip, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { ActivityList } from "@/components/crm/dashboard";
import { AttachForm, CommentForm, TaskDialog, TaskProgressForm } from "@/components/crm/task-forms";
import { Avatar, Badge, Breadcrumb, Card, CardBody, CardHeader, DescriptionList, EmptyState, ProgressBar, StatusBadge, humanize } from "@/components/crm/ui";
import { requireViewer } from "@/crm/auth/dal";
import { formatDate, formatRelative } from "@/crm/lib/time";
import { getTaskForViewer, taskDialogOptions } from "@/crm/services/tasks";
import { deleteTaskAction } from "../actions";

export const metadata: Metadata = { title: "Task" };

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function TaskPage({ params }: PageProps<"/crm/tasks/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getTaskForViewer(viewer, id);
  if (!data) notFound();
  const { task, role, assignee, creator, project, comments, attachments, activity } = data;
  const dialog = role.edit ? await taskDialogOptions(viewer) : null;

  return (
    <>
      <Breadcrumb
        className="mb-3"
        items={[{ label: "Tasks", href: "/crm/tasks" }, ...(project ? [{ label: project.name, href: `/crm/tasks/projects/${project.id}` }] : []), { label: task.title }]}
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em] break-words sm:text-2xl">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <Badge tone={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warning" : "neutral"}>{humanize(task.priority)} priority</Badge>
          </div>
        </div>
        {role.edit && dialog && (
          <div className="flex gap-2">
            <TaskDialog
              projects={dialog.projects}
              assignees={dialog.assignees}
              values={{ id: task.id, title: task.title, description: task.description, projectId: task.projectId, assigneeId: task.assigneeId, priority: task.priority, dueDate: task.dueDate }}
            />
            <ConfirmAction action={deleteTaskAction} fields={{ id: task.id }} label="Delete" icon={<Trash2 />} variant="danger" confirmVariant="danger" title="Delete this task?" description="Its comments and attachments are deleted too. This can't be undone." confirmLabel="Delete task" />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <p className="text-sm whitespace-pre-wrap text-c-muted">{task.description || "No description."}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={`Comments (${comments.length})`} />
            <CardBody className="space-y-5">
              {comments.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-c-subtle">
                  <MessageSquare aria-hidden className="size-4" /> No comments yet.
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.firstName ? `${c.firstName} ${c.lastName}` : "Former employee"} photoFileId={c.photoFileId} size={30} />
                  <div className="min-w-0">
                    <p className="text-[0.8125rem]">
                      <span className="font-medium">{c.firstName ? `${c.firstName} ${c.lastName}` : "Former employee"}</span> <span className="text-xs text-c-subtle">{formatRelative(c.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap text-c-muted">{c.body}</p>
                  </div>
                </div>
              ))}
              {viewer.employee && <CommentForm id={task.id} />}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={`Attachments (${attachments.length})`} />
            <CardBody className="space-y-3">
              {attachments.map((a) => (
                <div key={a.fileId} className="flex items-center gap-3 rounded-lg border border-c-border px-3 py-2 text-sm">
                  <Paperclip className="size-4 text-c-subtle" />
                  <span className="min-w-0 flex-1 truncate">{a.fileName}</span>
                  <span className="text-xs text-c-subtle">{kb(a.sizeBytes)}</span>
                  <a href={`/crm/api/files/${a.fileId}?download=1`} className="flex items-center gap-1 text-[0.8125rem] font-medium text-c-accent-text hover:underline">
                    <Download className="size-3.5" /> Download
                  </a>
                </div>
              ))}
              <AttachForm id={task.id} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Progress" />
            <CardBody>
              {role.progress ? <TaskProgressForm id={task.id} status={task.status} progress={task.progress} /> : <ProgressBar value={task.progress} label="Progress" />}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Assignee", value: assignee ? <Link className="hover:underline" href={`/crm/employees/${assignee.id}`}>{assignee.firstName} {assignee.lastName}</Link> : "Unassigned" },
                  { label: "Created by", value: creator ? `${creator.firstName} ${creator.lastName}` : "—" },
                  { label: "Project", value: project ? `${project.name} (${project.code})` : "Personal task" },
                  { label: "Due", value: formatDate(task.dueDate) },
                  { label: "Completed", value: task.completedAt ? formatRelative(task.completedAt) : "—" },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Activity" />
            {activity.length ? <ActivityList items={activity} /> : <EmptyState icon={<History />} title="No activity yet" />}
          </Card>
        </div>
      </div>
    </>
  );
}
