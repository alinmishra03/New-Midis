"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, ok, parseForm, runAction, setFlash, zId, type ActionState } from "@/crm/lib/actions";
import { fileFrom } from "@/crm/lib/storage";
import { addAttachment, addComment, createProject, createTask, deleteTask, setProjectMember, setTaskProgress, updateProject, updateTask } from "@/crm/services/tasks";

const optId = z.uuid().optional().transform((v) => v || null);
const optDate = z.iso.date().optional().transform((v) => v || null);

const taskSchema = z.object({
  title: z.string().trim().min(2, "Give the task a title.").max(200),
  description: z.string().trim().max(5000).optional().transform((v) => v || null),
  projectId: optId,
  assigneeId: optId,
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: optDate,
});

export async function createTaskAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const t = await createTask(viewer, parseForm(taskSchema, fd));
    return ok("Task created.", { id: t.id });
  });
}

export async function updateTaskAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await updateTask(viewer, zId.parse(fd.get("id")), parseForm(taskSchema, fd));
    return ok("Task updated.");
  });
}

export async function setProgressAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const status = z.enum(["todo", "in_progress", "review", "completed"]).parse(fd.get("status"));
    const progress = z.coerce.number().min(0).max(100).catch(0).parse(fd.get("progress") ?? 0);
    await setTaskProgress(viewer, zId.parse(fd.get("id")), status, progress);
    return ok("Task updated.");
  });
}

export async function deleteTaskAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const result = await runAction(async (viewer) => {
    await deleteTask(viewer, zId.parse(fd.get("id")));
    await setFlash("Task deleted.");
  });
  if (result?.ok) redirect("/crm/tasks");
  return result;
}

export async function commentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const body = z.string().trim().min(1, "Write a comment.").max(4000).safeParse(fd.get("body"));
    if (!body.success) return fail("Write a comment first.");
    await addComment(viewer, zId.parse(fd.get("id")), body.data);
    return ok("Comment added.");
  });
}

export async function attachAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const file = fileFrom(fd, "file");
    if (!file) return fail("Choose a file.");
    await addAttachment(viewer, zId.parse(fd.get("id")), file);
    return ok("File attached.");
  });
}

/* --------------------------------------------------------------- projects */

const projectSchema = z.object({
  name: z.string().trim().min(2, "Name the project.").max(150),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,16}$/, "2–16 letters, numbers or dashes."),
  description: z.string().trim().max(5000).optional().transform((v) => v || null),
  status: z.enum(["planning", "active", "on_hold", "completed", "archived"]).default("planning"),
  startDate: optDate,
  dueDate: optDate,
  ownerId: optId,
  departmentId: optId,
  members: z.array(z.uuid()).max(100).optional().default([]),
});

export async function createProjectAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let id: string | null = null;
  const result = await runAction(async (viewer) => {
    const { members, ...input } = parseForm(projectSchema, fd);
    const p = await createProject(viewer, input, members);
    id = p.id;
    await setFlash("Project created.");
  });
  if (result?.ok && id) redirect(`/crm/tasks/projects/${id}`);
  return result;
}

export async function updateProjectAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { members, ...input } = parseForm(projectSchema, fd);
    await updateProject(viewer, zId.parse(fd.get("id")), input);
    return ok("Project saved.");
  });
}

export async function projectMemberAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const add = fd.get("op") !== "remove";
    await setProjectMember(viewer, zId.parse(fd.get("projectId")), zId.parse(fd.get("employeeId")), add, fd.get("isLead") === "on");
    return ok(add ? "Member added." : "Member removed.");
  });
}
