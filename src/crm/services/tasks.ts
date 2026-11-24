import "server-only";
import { and, asc, count, desc, eq, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/crm/db";
import { auditLogs, employees, files, projectMembers, projects, taskAttachments, taskComments, tasks, users } from "@/crm/db/schema";
import { can, ForbiddenError, getTeamEmployeeIds, isInTeam, type Viewer } from "@/crm/auth/dal";
import { canViewAnyTask } from "@/crm/auth/file-access";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { storeUpload, type UploadInput } from "@/crm/lib/storage";
import { formatDate, type ISODate } from "@/crm/lib/time";
import { notify, userIdForEmployee } from "./notifications";

/*
 * Tasks & projects.
 *
 * Who can do what (enforced here, not in the UI):
 * - Create a project: projects.manage. That permission does NOT grant access
 *   to other people's projects: managers manage the projects they own or lead.
 * - See a project: tasks.view_all (read-only, e.g. HR), its owner, or a member.
 * - Manage a project (edit, members): its owner or a lead; a Super Admin
 *   manages every project.
 * - See a task: tasks.view_all, assignee, creator, project member, or the
 *   assignee's manager (canViewAnyTask).
 * - Create a task in a project: project managers and members; assign only
 *   to project members. Personal tasks (no project): assign to yourself, or
 *   to your reporting tree if you're a manager.
 * - Update status/progress: assignee, creator, project lead/owner, a Super
 *   Admin, or the assignee's manager.
 * - Edit details / delete: creator, project lead/owner, or a Super Admin.
 * - Comment / attach: anyone who can see the task.
 */

export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

function me(viewer: Viewer) {
  if (!viewer.employee) throw new AppError("Your account isn't linked to an employee record.");
  return viewer.employee;
}

/* ================================================================ projects */

/** Company-wide project administration is reserved for the Super Admin. */
const isSuperAdmin = (viewer: Viewer) => viewer.role.key === "super_admin";

async function projectRole(viewer: Viewer, projectId: string) {
  const p = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!p) return null;
  const empId = viewer.employee?.id;
  const membership = empId ? await db.query.projectMembers.findFirst({ where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, empId)) }) : undefined;
  const manage = isSuperAdmin(viewer) || (!!empId && p.ownerId === empId) || !!membership?.isLead;
  const view = manage || can(viewer, "tasks.view_all") || !!membership;
  return { project: p, manage, view, member: !!membership };
}

export async function getProjectForViewer(viewer: Viewer, projectId: string) {
  const r = await projectRole(viewer, projectId);
  if (!r?.view) return null;
  const [members, owner] = await Promise.all([
    db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, isLead: projectMembers.isLead })
      .from(projectMembers)
      .innerJoin(employees, eq(employees.id, projectMembers.employeeId))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(desc(projectMembers.isLead), asc(employees.firstName)),
    r.project.ownerId ? db.query.employees.findFirst({ where: eq(employees.id, r.project.ownerId), columns: { id: true, firstName: true, lastName: true, photoFileId: true } }) : null,
  ]);
  return { ...r, members: members.map((m) => ({ ...m, name: `${m.firstName} ${m.lastName}`.trim() })), owner };
}

/** Projects the viewer can see, with task progress. */
export async function listProjects(viewer: Viewer) {
  const empId = viewer.employee?.id;
  let where: SQL | undefined;
  if (!isSuperAdmin(viewer) && !can(viewer, "tasks.view_all")) {
    if (!empId) return [];
    const memberOf = db.select({ id: projectMembers.projectId }).from(projectMembers).where(eq(projectMembers.employeeId, empId));
    where = or(eq(projects.ownerId, empId), inArray(projects.id, memberOf));
  }
  const rows = await db.select().from(projects).where(where).orderBy(asc(projects.status), desc(projects.updatedAt));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [counts, memberCounts] = await Promise.all([
    db.select({ projectId: tasks.projectId, status: tasks.status, n: count() }).from(tasks).where(inArray(tasks.projectId, ids)).groupBy(tasks.projectId, tasks.status),
    db.select({ projectId: projectMembers.projectId, n: count() }).from(projectMembers).where(inArray(projectMembers.projectId, ids)).groupBy(projectMembers.projectId),
  ]);
  return rows.map((p) => {
    const c = counts.filter((x) => x.projectId === p.id);
    const total = c.reduce((s, x) => s + x.n, 0);
    const done = c.find((x) => x.status === "completed")?.n ?? 0;
    return { ...p, total, done, members: memberCounts.find((m) => m.projectId === p.id)?.n ?? 0 };
  });
}

export type ProjectInput = { name: string; code: string; description: string | null; status: "planning" | "active" | "on_hold" | "completed" | "archived"; startDate: ISODate | null; dueDate: ISODate | null; ownerId: string | null; departmentId: string | null };

export async function createProject(viewer: Viewer, input: ProjectInput, memberIds: string[]) {
  if (!can(viewer, "projects.manage")) throw new ForbiddenError("Only managers can create projects.");
  const ownerId = input.ownerId ?? viewer.employee?.id ?? null;
  if (input.dueDate && input.startDate && input.dueDate < input.startDate) throw new AppError("The due date is before the start date.");
  const existing = await db.query.projects.findFirst({ where: eq(projects.code, input.code) });
  if (existing) throw new AppError("That project code is already used.");
  const project = await db.transaction(async (tx) => {
    const [p] = await tx.insert(projects).values({ ...input, ownerId }).returning();
    const members = [...new Set([...(ownerId ? [ownerId] : []), ...memberIds])];
    if (members.length) await tx.insert(projectMembers).values(members.map((employeeId) => ({ projectId: p!.id, employeeId, isLead: employeeId === ownerId })));
    await audit({ actorUserId: viewer.userId, action: "project.create", entityType: "project", entityId: p!.id, summary: `Created project ${p!.name} (${p!.code})` }, tx);
    return p!;
  });
  await notifyMembers(memberIds.filter((m) => m !== viewer.employee?.id), { type: "project_added", title: `You were added to the project ${project.name}`, link: `/crm/tasks/projects/${project.id}` });
  return project;
}

export async function updateProject(viewer: Viewer, projectId: string, input: ProjectInput) {
  const r = await projectRole(viewer, projectId);
  if (!r?.manage) throw new ForbiddenError();
  if (input.dueDate && input.startDate && input.dueDate < input.startDate) throw new AppError("The due date is before the start date.");
  const clash = await db.query.projects.findFirst({ where: and(eq(projects.code, input.code), ne(projects.id, projectId)) });
  if (clash) throw new AppError("That project code is already used.");
  await db.update(projects).set(input).where(eq(projects.id, projectId));
  await audit({ actorUserId: viewer.userId, action: "project.update", entityType: "project", entityId: projectId, summary: `Updated project ${input.name}` });
}

export async function setProjectMember(viewer: Viewer, projectId: string, employeeId: string, add: boolean, isLead = false) {
  const r = await projectRole(viewer, projectId);
  if (!r?.manage) throw new ForbiddenError();
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { firstName: true, lastName: true, employmentStatus: true } });
  if (!emp) throw new AppError("Employee not found.");
  if (add) {
    if (emp.employmentStatus === "exited") throw new AppError("That person no longer works here.");
    await db.insert(projectMembers).values({ projectId, employeeId, isLead }).onConflictDoUpdate({ target: [projectMembers.projectId, projectMembers.employeeId], set: { isLead } });
    await notifyMembers([employeeId], { type: "project_added", title: `You were added to the project ${r.project.name}`, link: `/crm/tasks/projects/${projectId}` });
  } else {
    if (r.project.ownerId === employeeId) throw new AppError("The project owner can't be removed. Change the owner first.");
    await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.employeeId, employeeId)));
  }
  await audit({ actorUserId: viewer.userId, action: add ? "project.member_add" : "project.member_remove", entityType: "project", entityId: projectId, summary: `${add ? "Added" : "Removed"} ${emp.firstName} ${emp.lastName} ${add ? "to" : "from"} ${r.project.name}` });
}

async function notifyMembers(employeeIds: string[], n: Parameters<typeof notify>[1]) {
  const ids = await Promise.all(employeeIds.map((e) => userIdForEmployee(e)));
  await notify(ids, n);
}

/* =================================================================== tasks */

async function taskRole(viewer: Viewer, task: typeof tasks.$inferSelect) {
  const empId = viewer.employee?.id;
  const proj = task.projectId ? await projectRole(viewer, task.projectId) : null;
  const managerOfAssignee = !!task.assigneeId && (await isInTeam(viewer, task.assigneeId));
  const edit = isSuperAdmin(viewer) || (!!empId && task.createdById === empId) || !!proj?.manage;
  const progress = edit || (!!empId && task.assigneeId === empId) || managerOfAssignee;
  const view = progress || (await canViewAnyTask(viewer, [task.id]));
  return { view, progress, edit, proj };
}

export async function getTaskForViewer(viewer: Viewer, taskId: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) return null;
  const role = await taskRole(viewer, task);
  if (!role.view) return null;
  const [assignee, creator, project, comments, attachments, activity] = await Promise.all([
    task.assigneeId ? db.query.employees.findFirst({ where: eq(employees.id, task.assigneeId), columns: { id: true, firstName: true, lastName: true, photoFileId: true } }) : null,
    task.createdById ? db.query.employees.findFirst({ where: eq(employees.id, task.createdById), columns: { id: true, firstName: true, lastName: true } }) : null,
    task.projectId ? db.query.projects.findFirst({ where: eq(projects.id, task.projectId), columns: { id: true, name: true, code: true } }) : null,
    db
      .select({ id: taskComments.id, body: taskComments.body, createdAt: taskComments.createdAt, authorId: employees.id, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId })
      .from(taskComments)
      .leftJoin(employees, eq(employees.id, taskComments.authorId))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt)),
    db
      .select({ fileId: files.id, fileName: files.fileName, sizeBytes: files.sizeBytes, createdAt: taskAttachments.createdAt })
      .from(taskAttachments)
      .innerJoin(files, eq(files.id, taskAttachments.fileId))
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt)),
    db
      .select({ id: auditLogs.id, summary: auditLogs.summary, createdAt: auditLogs.createdAt, actorEmail: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(and(eq(auditLogs.entityType, "task"), eq(auditLogs.entityId, taskId)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(30),
  ]);
  return { task, role, assignee, creator, project, comments, attachments, activity };
}

/** People a task may be assigned to, for the viewer, in a project (or personal). */
export async function assignableEmployees(viewer: Viewer, projectId: string | null) {
  if (projectId) {
    const r = await projectRole(viewer, projectId);
    if (!r || !(r.manage || r.member)) return [];
    return db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
      .from(projectMembers)
      .innerJoin(employees, eq(employees.id, projectMembers.employeeId))
      .where(and(eq(projectMembers.projectId, projectId), ne(employees.employmentStatus, "exited")))
      .orderBy(asc(employees.firstName));
  }
  const empId = viewer.employee?.id;
  const ids = empId ? [empId, ...(await getTeamEmployeeIds(empId))] : [];
  const conds = [ne(employees.employmentStatus, "exited")];
  if (!can(viewer, "projects.manage") || !can(viewer, "tasks.view_all")) conds.push(inArray(employees.id, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]));
  return db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName }).from(employees).where(and(...conds)).orderBy(asc(employees.firstName));
}

export type TaskInput = { title: string; description: string | null; projectId: string | null; assigneeId: string | null; priority: "low" | "medium" | "high" | "urgent"; dueDate: ISODate | null };

async function assertCanAssign(viewer: Viewer, projectId: string | null, assigneeId: string | null) {
  if (!assigneeId) return;
  const allowed = await assignableEmployees(viewer, projectId);
  if (!allowed.some((a) => a.id === assigneeId)) {
    throw new AppError(projectId ? "Tasks can only be assigned to members of the project." : "You can assign personal tasks only to yourself or your team.");
  }
}

export async function createTask(viewer: Viewer, input: TaskInput) {
  const creator = me(viewer);
  if (input.projectId) {
    const r = await projectRole(viewer, input.projectId);
    if (!r || !(r.manage || r.member)) throw new ForbiddenError("You're not a member of that project.");
  }
  const assigneeId = input.assigneeId ?? (input.projectId ? null : creator.id);
  await assertCanAssign(viewer, input.projectId, assigneeId);
  const [task] = await db.insert(tasks).values({ ...input, assigneeId, createdById: creator.id }).returning();
  await audit({ actorUserId: viewer.userId, action: "task.create", entityType: "task", entityId: task!.id, summary: `Created task “${task!.title}”` });
  if (input.projectId) await audit({ actorUserId: viewer.userId, action: "task.create", entityType: "project", entityId: input.projectId, summary: `Added task “${task!.title}”` });
  if (assigneeId && assigneeId !== creator.id) {
    await notify([await userIdForEmployee(assigneeId)], { type: "task_assigned", title: `${creator.fullName} assigned you “${task!.title}”`, body: input.dueDate ? `Due ${formatDate(input.dueDate)}` : null, link: `/crm/tasks/${task!.id}` });
  }
  return task!;
}

export async function updateTask(viewer: Viewer, taskId: string, input: TaskInput) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new AppError("Task not found.");
  const role = await taskRole(viewer, task);
  if (!role.edit) throw new ForbiddenError();
  if (input.projectId !== task.projectId && input.projectId) {
    const r = await projectRole(viewer, input.projectId);
    if (!r || !(r.manage || r.member)) throw new ForbiddenError("You're not a member of that project.");
  }
  if (input.assigneeId !== task.assigneeId) await assertCanAssign(viewer, input.projectId, input.assigneeId);
  await db.update(tasks).set(input).where(eq(tasks.id, taskId));
  const changed = (Object.keys(input) as (keyof TaskInput)[]).filter((k) => input[k] !== task[k]);
  await audit({ actorUserId: viewer.userId, action: "task.update", entityType: "task", entityId: taskId, summary: `Edited ${changed.join(", ") || "task"}`, metadata: { fields: changed } });
  if (input.assigneeId && input.assigneeId !== task.assigneeId && input.assigneeId !== viewer.employee?.id) {
    await notify([await userIdForEmployee(input.assigneeId)], { type: "task_assigned", title: `You were assigned “${input.title}”`, link: `/crm/tasks/${taskId}` });
  }
}

export async function setTaskProgress(viewer: Viewer, taskId: string, status: TaskStatus, progress: number) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new AppError("Task not found.");
  const role = await taskRole(viewer, task);
  if (!role.progress) throw new ForbiddenError();
  const p = status === "completed" ? 100 : Math.max(0, Math.min(99, Math.round(progress)));
  await db
    .update(tasks)
    .set({ status, progress: p, completedAt: status === "completed" ? (task.completedAt ?? new Date()) : null })
    .where(eq(tasks.id, taskId));
  if (status !== task.status) {
    const label = TASK_STATUSES.find((s) => s.key === status)!.label;
    await audit({ actorUserId: viewer.userId, action: "task.status", entityType: "task", entityId: taskId, summary: `Moved to ${label}` });
    if (task.projectId) await audit({ actorUserId: viewer.userId, action: "task.status", entityType: "project", entityId: task.projectId, summary: `“${task.title}” moved to ${label}` });
    // Tell the other party: creator when the assignee moves it, assignee when someone else does.
    const target = viewer.employee?.id === task.assigneeId ? task.createdById : task.assigneeId;
    if (target && target !== viewer.employee?.id) {
      await notify([await userIdForEmployee(target)], { type: "task_status", title: `“${task.title}” moved to ${label}`, link: `/crm/tasks/${taskId}` });
    }
  } else if (p !== task.progress) {
    await audit({ actorUserId: viewer.userId, action: "task.progress", entityType: "task", entityId: taskId, summary: `Progress ${task.progress}% → ${p}%` });
  }
}

export async function deleteTask(viewer: Viewer, taskId: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new AppError("Task not found.");
  if (!(await taskRole(viewer, task)).edit) throw new ForbiddenError();
  await db.delete(tasks).where(eq(tasks.id, taskId));
  await audit({ actorUserId: viewer.userId, action: "task.delete", entityType: task.projectId ? "project" : "task", entityId: task.projectId ?? taskId, summary: `Deleted task “${task.title}”` });
}

export async function addComment(viewer: Viewer, taskId: string, body: string) {
  const author = me(viewer);
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task || !(await taskRole(viewer, task)).view) throw new ForbiddenError();
  await db.insert(taskComments).values({ taskId, authorId: author.id, body });
  const recipients = [task.assigneeId, task.createdById].filter((e): e is string => !!e && e !== author.id);
  await notify(await Promise.all(recipients.map((e) => userIdForEmployee(e))), { type: "task_comment", title: `${author.fullName} commented on “${task.title}”`, body: body.slice(0, 140), link: `/crm/tasks/${taskId}` });
}

export async function addAttachment(viewer: Viewer, taskId: string, file: UploadInput) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task || !(await taskRole(viewer, task)).view) throw new ForbiddenError();
  const stored = await storeUpload(file, viewer.userId);
  await db.insert(taskAttachments).values({ taskId, fileId: stored.id });
  await audit({ actorUserId: viewer.userId, action: "task.attach", entityType: "task", entityId: taskId, summary: `Attached ${stored.fileName}` });
}

/* ================================================================= listing */

const taskSelect = {
  id: tasks.id,
  title: tasks.title,
  status: tasks.status,
  priority: tasks.priority,
  dueDate: tasks.dueDate,
  progress: tasks.progress,
  projectId: tasks.projectId,
  projectName: projects.name,
  assigneeId: tasks.assigneeId,
  assigneeFirst: employees.firstName,
  assigneeLast: employees.lastName,
  assigneePhoto: employees.photoFileId,
  updatedAt: tasks.updatedAt,
};

export type TaskView = "mine" | "created" | "team" | "all" | "project";

export async function listTasks(viewer: Viewer, view: TaskView, opts: { projectId?: string; status?: string; priority?: string; q?: string } = {}) {
  const empId = viewer.employee?.id;
  const conds: SQL[] = [];
  if (view === "mine") conds.push(eq(tasks.assigneeId, empId ?? "00000000-0000-0000-0000-000000000000"));
  else if (view === "created") conds.push(eq(tasks.createdById, empId ?? "00000000-0000-0000-0000-000000000000"));
  else if (view === "team") {
    const team = empId ? await getTeamEmployeeIds(empId) : [];
    conds.push(inArray(tasks.assigneeId, team.length ? team : ["00000000-0000-0000-0000-000000000000"]));
  } else if (view === "all") {
    if (!can(viewer, "tasks.view_all")) throw new ForbiddenError();
  } else if (view === "project") {
    if (!opts.projectId || !(await projectRole(viewer, opts.projectId))?.view) throw new ForbiddenError();
    conds.push(eq(tasks.projectId, opts.projectId));
  }
  if (opts.status && TASK_STATUSES.some((s) => s.key === opts.status)) conds.push(eq(tasks.status, opts.status as TaskStatus));
  if (opts.priority && ["low", "medium", "high", "urgent"].includes(opts.priority)) conds.push(eq(tasks.priority, opts.priority as TaskInput["priority"]));
  if (opts.projectId && view !== "project") conds.push(eq(tasks.projectId, opts.projectId));
  if (opts.q) conds.push(sql`${tasks.title} ilike ${`%${opts.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`}`);
  return db
    .select(taskSelect)
    .from(tasks)
    .leftJoin(projects, eq(projects.id, tasks.projectId))
    .leftJoin(employees, eq(employees.id, tasks.assigneeId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(sql`${tasks.dueDate} asc nulls last`, desc(tasks.updatedAt))
    .limit(300);
}

export async function projectActivity(projectId: string) {
  return db
    .select({ id: auditLogs.id, summary: auditLogs.summary, createdAt: auditLogs.createdAt, actorEmail: users.email })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(eq(auditLogs.entityType, "project"), eq(auditLogs.entityId, projectId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(30);
}

/** Open tasks due on or before a date, for reminders. */
export async function dueTasksFor(employeeId: string, until: ISODate) {
  return db
    .select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, employeeId), ne(tasks.status, "completed"), sql`${tasks.dueDate} <= ${until}`))
    .limit(20);
}


/** Options for the task dialog: projects the viewer can add tasks to, and who they can assign. */
export async function taskDialogOptions(viewer: Viewer) {
  const projects = (await listProjects(viewer)).filter((p) => !["completed", "archived"].includes(p.status));
  const assignees: Record<string, { value: string; label: string }[]> = {};
  const toOpt = (rows: { id: string; firstName: string; lastName: string }[]) => rows.map((r) => ({ value: r.id, label: `${r.firstName} ${r.lastName}`.trim() }));
  assignees[""] = toOpt(await assignableEmployees(viewer, null));
  const usable: { value: string; label: string }[] = [];
  for (const p of projects) {
    const people = await assignableEmployees(viewer, p.id);
    if (people.length) {
      assignees[p.id] = toOpt(people);
      usable.push({ value: p.id, label: `${p.name} (${p.code})` });
    }
  }
  return { projects: usable, assignees };
}
