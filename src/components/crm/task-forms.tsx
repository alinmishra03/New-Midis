"use client";

import { FolderPlus, Paperclip, Pencil, Plus, Send, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  attachAction,
  commentAction,
  createProjectAction,
  createTaskAction,
  projectMemberAction,
  setProgressAction,
  updateProjectAction,
  updateTaskAction,
} from "@/app/crm/(app)/tasks/actions";
import { ActionForm, FormActions, CheckboxField, Dialog, SelectField, SubmitButton, TextAreaField, TextField, inputClass } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };
const PRIORITIES: Opt[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
const STATUSES: Opt[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

export type TaskFormValues = { id?: string; title?: string; description?: string | null; projectId?: string | null; assigneeId?: string | null; priority?: string; dueDate?: string | null };

/**
 * Create or edit a task. `assignees` maps a project id ("" = personal task)
 * to the people the viewer may assign it to; the server re-checks.
 */
export function TaskDialog({
  projects,
  assignees,
  values = {},
  fixedProject,
  label,
}: {
  projects: Opt[];
  assignees: Record<string, Opt[]>;
  values?: TaskFormValues;
  fixedProject?: string;
  label?: string;
}) {
  const editing = !!values.id;
  const [projectId, setProjectId] = useState(fixedProject ?? values.projectId ?? "");
  const router = useRouter();
  const people = assignees[projectId] ?? [];
  return (
    <Dialog
      title={editing ? "Edit task" : "New task"}
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass(editing ? "secondary" : "primary", editing ? "sm" : "md")}>
          {editing ? <Pencil /> : <Plus />} {label ?? (editing ? "Edit" : "New task")}
        </button>
      )}
    >
      {(close) => (
        <ActionForm
          action={editing ? updateTaskAction : createTaskAction}
          onSuccess={(s) => {
            close();
            if (!editing && s.data?.id) router.push(`/crm/tasks/${s.data.id}`);
          }}
          className="space-y-4"
        >
          {editing && <input type="hidden" name="id" value={values.id} />}
          <TextField label="Title" name="title" defaultValue={values.title} required autoFocus />
          <TextAreaField label="Description" name="description" defaultValue={values.description ?? ""} rows={4} />
          <div className="grid gap-3 sm:grid-cols-2">
            {fixedProject ? (
              <input type="hidden" name="projectId" value={fixedProject} />
            ) : (
              <SelectField label="Project" name="projectId" options={projects} placeholder="Personal task" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            )}
            <SelectField key={projectId} label="Assignee" name="assigneeId" options={people} placeholder={projectId ? "Unassigned" : "Me"} defaultValue={values.assigneeId ?? ""} />
            <SelectField label="Priority" name="priority" options={PRIORITIES} defaultValue={values.priority ?? "medium"} />
            <TextField label="Due date" name="dueDate" type="date" defaultValue={values.dueDate ?? ""} />
          </div>
          <FormActions>
            <SubmitButton>{editing ? "Save" : "Create task"}</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

/** Status + progress control. Submits on status change; progress has its own save. */
export function TaskProgressForm({ id, status, progress, compact }: { id: string; status: string; progress: number; compact?: boolean }) {
  const [s, setS] = useState(status);
  const [p, setP] = useState(progress);
  return (
    <ActionForm action={setProgressAction} className={compact ? "" : "space-y-3"} showMessage={!compact}>
      <input type="hidden" name="id" value={id} />
      {compact ? (
        <>
          <input type="hidden" name="progress" value={p} />
          <select
            name="status"
            value={s}
            aria-label="Status"
            onChange={(e) => {
              setS(e.target.value);
              if (e.target.value === "completed") setP(100);
              e.currentTarget.form?.requestSubmit();
            }}
            className="h-7 rounded-md border border-c-border bg-c-surface px-1.5 text-xs text-c-fg"
          >
            {STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <SelectField label="Status" name="status" options={STATUSES} value={s} onChange={(e) => { setS(e.target.value); if (e.target.value === "completed") setP(100); }} />
          <div>
            <label htmlFor={`progress-${id}`} className="mb-1.5 flex justify-between text-[0.8125rem] font-medium">
              Progress <span className="tabular text-c-muted">{p}%</span>
            </label>
            <input id={`progress-${id}`} type="range" name="progress" min={0} max={100} step={5} value={p} onChange={(e) => setP(Number(e.target.value))} className="w-full accent-[var(--c-accent)]" disabled={s === "completed"} />
          </div>
          <SubmitButton size="sm" variant="secondary">
            Update
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function CommentForm({ id }: { id: string }) {
  return (
    <ActionForm action={commentAction} resetOnSuccess showMessage={false} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <textarea name="body" rows={2} required placeholder="Write a comment…" aria-label="Comment" className={`${inputClass} resize-y`} />
      <SubmitButton size="icon" aria-label="Post comment" className="self-end">
        <Send />
      </SubmitButton>
    </ActionForm>
  );
}

export function AttachForm({ id }: { id: string }) {
  return (
    <ActionForm action={attachAction} resetOnSuccess className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="id" value={id} />
      <input type="file" name="file" data-upload="any" required className={inputClass} aria-label="File" />
      <SubmitButton variant="secondary" pendingLabel="Uploading…">
        <Paperclip /> Attach
      </SubmitButton>
    </ActionForm>
  );
}

export type ProjectFormValues = { id?: string; name?: string; code?: string; description?: string | null; status?: string; startDate?: string | null; dueDate?: string | null; ownerId?: string | null; departmentId?: string | null };

export function ProjectDialog({ values = {}, people, departments }: { values?: ProjectFormValues; people: Opt[]; departments: Opt[] }) {
  const editing = !!values.id;
  return (
    <Dialog
      size="lg"
      title={editing ? "Edit project" : "New project"}
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass(editing ? "secondary" : "primary", editing ? "sm" : "md")}>
          {editing ? <Pencil /> : <FolderPlus />} {editing ? "Edit project" : "New project"}
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={editing ? updateProjectAction : createProjectAction} onSuccess={close} className="space-y-4">
          {editing && <input type="hidden" name="id" value={values.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Name" name="name" defaultValue={values.name} required className="sm:col-span-2" />
            <TextField label="Code" name="code" defaultValue={values.code} required placeholder="WEB-2027" />
          </div>
          <TextAreaField label="Description" name="description" defaultValue={values.description ?? ""} rows={3} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Status" name="status" defaultValue={values.status ?? "planning"} options={[{ value: "planning", label: "Planning" }, { value: "active", label: "Active" }, { value: "on_hold", label: "On hold" }, { value: "completed", label: "Completed" }, { value: "archived", label: "Archived" }]} />
            <SelectField label="Owner" name="ownerId" options={people} placeholder="Me" defaultValue={values.ownerId ?? ""} />
            <TextField label="Start date" name="startDate" type="date" defaultValue={values.startDate ?? ""} />
            <TextField label="Due date" name="dueDate" type="date" defaultValue={values.dueDate ?? ""} />
            <SelectField label="Department" name="departmentId" options={departments} placeholder="None" defaultValue={values.departmentId ?? ""} />
          </div>
          {!editing && (
            <fieldset>
              <legend className="mb-1.5 text-[0.8125rem] font-medium">Members</legend>
              <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-lg border border-c-border p-3 sm:grid-cols-2">
                {people.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="members[]" value={p.value} className="size-4 accent-[var(--c-accent)]" />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <FormActions>
            <SubmitButton>{editing ? "Save project" : "Create project"}</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function AddMemberForm({ projectId, people }: { projectId: string; people: Opt[] }) {
  if (!people.length) return null;
  return (
    <ActionForm action={projectMemberAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex gap-2">
        <select name="employeeId" required className={inputClass} aria-label="Employee">
          {people.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <SubmitButton variant="secondary" size="icon" aria-label="Add member">
          <UserPlus />
        </SubmitButton>
      </div>
      <CheckboxField name="isLead" label="Project lead" />
    </ActionForm>
  );
}
