import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNull } from "drizzle-orm";
import { db } from "@/crm/db";
import { candidates, departments, employees, files, interviews, jobOpenings, onboardingTasks, users } from "@/crm/db/schema";
import { can, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { storeUpload, type UploadInput } from "@/crm/lib/storage";
import { addDays, formatDateTime, todayIn, zonedToInstant, type ISODate } from "@/crm/lib/time";
import { AccountError, createEmployeeWithAccount } from "./accounts";
import { getCompany } from "./company";
import { notify, userIdForEmployee } from "./notifications";

function requireRecruiter(viewer: Viewer) {
  if (!can(viewer, "recruitment.manage")) throw new ForbiddenError();
}

/* ------------------------------------------------------------------- jobs */

export type JobInput = { title: string; departmentId: string | null; location: string | null; employmentType: "full_time" | "part_time" | "contract" | "intern"; description: string | null; positions: number; status: "draft" | "open" | "on_hold" | "closed"; hiringManagerId: string | null };

export async function saveJob(viewer: Viewer, id: string | null, input: JobInput) {
  requireRecruiter(viewer);
  if (id) {
    const [row] = await db.update(jobOpenings).set(input).where(eq(jobOpenings.id, id)).returning();
    if (!row) throw new AppError("Job not found.");
    await audit({ actorUserId: viewer.userId, action: "job.update", entityType: "job", entityId: id, summary: `Updated job “${input.title}”` });
    return row;
  }
  const [row] = await db.insert(jobOpenings).values(input).returning();
  await audit({ actorUserId: viewer.userId, action: "job.create", entityType: "job", entityId: row!.id, summary: `Created job “${input.title}”` });
  return row!;
}

export async function listJobs(viewer: Viewer) {
  requireRecruiter(viewer);
  const jobs = await db
    .select({ id: jobOpenings.id, title: jobOpenings.title, status: jobOpenings.status, positions: jobOpenings.positions, location: jobOpenings.location, employmentType: jobOpenings.employmentType, department: departments.name, createdAt: jobOpenings.createdAt })
    .from(jobOpenings)
    .leftJoin(departments, eq(departments.id, jobOpenings.departmentId))
    .orderBy(asc(jobOpenings.status), desc(jobOpenings.createdAt));
  if (!jobs.length) return [];
  const counts = await db.select({ jobId: candidates.jobId, stage: candidates.stage, n: count() }).from(candidates).where(inArray(candidates.jobId, jobs.map((j) => j.id))).groupBy(candidates.jobId, candidates.stage);
  return jobs.map((j) => {
    const c = counts.filter((x) => x.jobId === j.id);
    return { ...j, candidates: c.reduce((s, x) => s + x.n, 0), hired: c.find((x) => x.stage === "hired")?.n ?? 0, interviewing: c.find((x) => x.stage === "interview")?.n ?? 0 };
  });
}

export async function getJob(viewer: Viewer, id: string) {
  requireRecruiter(viewer);
  const job = await db.query.jobOpenings.findFirst({ where: eq(jobOpenings.id, id) });
  if (!job) return null;
  const list = await db
    .select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone, source: candidates.source, stage: candidates.stage, notes: candidates.notes, resumeFileId: candidates.resumeFileId, employeeId: candidates.employeeId, createdAt: candidates.createdAt, resumeName: files.fileName })
    .from(candidates)
    .leftJoin(files, eq(files.id, candidates.resumeFileId))
    .where(eq(candidates.jobId, id))
    .orderBy(asc(candidates.stage), desc(candidates.createdAt));
  const ivs = list.length
    ? await db
        .select({ id: interviews.id, candidateId: interviews.candidateId, scheduledAt: interviews.scheduledAt, durationMinutes: interviews.durationMinutes, mode: interviews.mode, location: interviews.location, status: interviews.status, rating: interviews.rating, recommendation: interviews.recommendation, feedback: interviews.feedback, interviewerFirst: employees.firstName, interviewerLast: employees.lastName })
        .from(interviews)
        .leftJoin(employees, eq(employees.id, interviews.interviewerId))
        .where(inArray(interviews.candidateId, list.map((c) => c.id)))
        .orderBy(asc(interviews.scheduledAt))
    : [];
  const dept = job.departmentId ? await db.query.departments.findFirst({ where: eq(departments.id, job.departmentId) }) : null;
  return { job, department: dept?.name ?? null, candidates: list.map((c) => ({ ...c, interviews: ivs.filter((i) => i.candidateId === c.id) })) };
}

/* -------------------------------------------------------------- candidates */

export async function addCandidate(viewer: Viewer, input: { jobId: string; fullName: string; email: string; phone: string | null; source: string | null; notes: string | null; resume: UploadInput | null }) {
  requireRecruiter(viewer);
  const job = await db.query.jobOpenings.findFirst({ where: eq(jobOpenings.id, input.jobId) });
  if (!job) throw new AppError("Job not found.");
  const dup = await db.query.candidates.findFirst({ where: and(eq(candidates.jobId, input.jobId), eq(candidates.email, input.email)) });
  if (dup) throw new AppError("This candidate has already applied for this job.");
  await db.transaction(async (tx) => {
    const resume = input.resume ? await storeUpload(input.resume, viewer.userId, { tx, allowed: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] }) : null;
    const [c] = await tx.insert(candidates).values({ jobId: input.jobId, fullName: input.fullName, email: input.email, phone: input.phone, source: input.source, notes: input.notes, resumeFileId: resume?.id ?? null }).returning();
    await audit({ actorUserId: viewer.userId, action: "candidate.add", entityType: "candidate", entityId: c!.id, summary: `Added candidate ${input.fullName} for “${job.title}”` }, tx);
  });
}

export async function setCandidateStage(viewer: Viewer, id: string, stage: "applied" | "screening" | "interview" | "offer" | "rejected", notes?: string | null) {
  requireRecruiter(viewer);
  const c = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
  if (!c) throw new AppError("Candidate not found.");
  if (c.stage === "hired") throw new AppError("This candidate has already been hired.");
  await db.update(candidates).set({ stage, ...(notes !== undefined ? { notes } : {}) }).where(eq(candidates.id, id));
  await audit({ actorUserId: viewer.userId, action: "candidate.stage", entityType: "candidate", entityId: id, summary: `Moved ${c.fullName} to ${stage}` });
}

/* -------------------------------------------------------------- interviews */

export async function scheduleInterview(viewer: Viewer, input: { candidateId: string; interviewerId: string; date: ISODate; time: string; durationMinutes: number; mode: string; location: string | null }) {
  requireRecruiter(viewer);
  const c = await db.query.candidates.findFirst({ where: eq(candidates.id, input.candidateId) });
  if (!c) throw new AppError("Candidate not found.");
  const company = await getCompany();
  const scheduledAt = zonedToInstant(input.date, input.time, company.timezone);
  if (scheduledAt < new Date()) throw new AppError("Pick a time in the future.");
  const [iv] = await db.insert(interviews).values({ candidateId: c.id, interviewerId: input.interviewerId, scheduledAt, durationMinutes: input.durationMinutes, mode: input.mode, location: input.location }).returning();
  if (c.stage === "applied" || c.stage === "screening") await db.update(candidates).set({ stage: "interview" }).where(eq(candidates.id, c.id));
  await audit({ actorUserId: viewer.userId, action: "interview.schedule", entityType: "candidate", entityId: c.id, summary: `Scheduled an interview with ${c.fullName} for ${formatDateTime(scheduledAt, company.timezone)}` });
  await notify([await userIdForEmployee(input.interviewerId)], { type: "interview", title: `You're interviewing ${c.fullName}`, body: formatDateTime(scheduledAt, company.timezone), link: `/crm/recruitment/interviews/${iv!.id}` });
}

/** An interview for its interviewer or a recruiter. */
export async function getInterview(viewer: Viewer, id: string) {
  const iv = await db.query.interviews.findFirst({ where: eq(interviews.id, id) });
  if (!iv) return null;
  const isInterviewer = !!viewer.employee && iv.interviewerId === viewer.employee.id;
  if (!isInterviewer && !can(viewer, "recruitment.manage")) return null;
  const c = (await db.query.candidates.findFirst({ where: eq(candidates.id, iv.candidateId) }))!;
  const job = await db.query.jobOpenings.findFirst({ where: eq(jobOpenings.id, c.jobId), columns: { id: true, title: true } });
  const interviewer = iv.interviewerId ? await db.query.employees.findFirst({ where: eq(employees.id, iv.interviewerId), columns: { firstName: true, lastName: true } }) : null;
  return { iv, candidate: { id: c.id, fullName: c.fullName, email: c.email, phone: c.phone, resumeFileId: c.resumeFileId, stage: c.stage }, job, interviewer, isInterviewer };
}

export async function submitInterviewFeedback(viewer: Viewer, id: string, input: { rating: number; recommendation: "strong_hire" | "hire" | "hold" | "no_hire"; feedback: string }) {
  const data = await getInterview(viewer, id);
  if (!data) throw new ForbiddenError();
  if (data.iv.status === "cancelled") throw new AppError("This interview was cancelled.");
  await db.update(interviews).set({ ...input, status: "completed" }).where(eq(interviews.id, id));
  await audit({ actorUserId: viewer.userId, action: "interview.feedback", entityType: "candidate", entityId: data.candidate.id, summary: `Recorded interview feedback for ${data.candidate.fullName}` });
}

export async function cancelInterview(viewer: Viewer, id: string) {
  requireRecruiter(viewer);
  const [row] = await db.update(interviews).set({ status: "cancelled" }).where(and(eq(interviews.id, id), eq(interviews.status, "scheduled"))).returning();
  if (!row) throw new AppError("Only scheduled interviews can be cancelled.");
  if (row.interviewerId) await notify([await userIdForEmployee(row.interviewerId)], { type: "interview", title: "An interview you were on was cancelled", link: "/crm/notifications" });
}

/** The viewer's upcoming interviews as an interviewer. */
export async function myInterviews(viewer: Viewer) {
  if (!viewer.employee) return [];
  return db
    .select({ id: interviews.id, scheduledAt: interviews.scheduledAt, status: interviews.status, candidate: candidates.fullName, job: jobOpenings.title })
    .from(interviews)
    .innerJoin(candidates, eq(candidates.id, interviews.candidateId))
    .innerJoin(jobOpenings, eq(jobOpenings.id, candidates.jobId))
    .where(eq(interviews.interviewerId, viewer.employee.id))
    .orderBy(desc(interviews.scheduledAt))
    .limit(30);
}

/* ------------------------------------------------------------- hire & onboarding */

export const DEFAULT_CHECKLIST: { title: string; category: "documents" | "accounts" | "department" | "manager" | "formalities"; offsetDays: number }[] = [
  { title: "Collect signed offer letter", category: "documents", offsetDays: -3 },
  { title: "Collect ID proof and address proof", category: "documents", offsetDays: 0 },
  { title: "Collect bank account details for salary", category: "documents", offsetDays: 0 },
  { title: "Create company email account", category: "accounts", offsetDays: -1 },
  { title: "Send employee portal activation link", category: "accounts", offsetDays: 0 },
  { title: "Confirm department and designation", category: "department", offsetDays: 0 },
  { title: "Assign reporting manager", category: "manager", offsetDays: 0 },
  { title: "Workstation, laptop and tools", category: "formalities", offsetDays: 0 },
  { title: "Induction and policy walkthrough", category: "formalities", offsetDays: 2 },
  { title: "Set up salary structure in Payroll", category: "formalities", offsetDays: 5 },
];

export async function startOnboarding(viewer: Viewer, employeeId: string) {
  if (!can(viewer, "onboarding.manage")) throw new ForbiddenError();
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
  if (!emp) throw new AppError("Employee not found.");
  const existing = await db.query.onboardingTasks.findFirst({ where: eq(onboardingTasks.employeeId, employeeId) });
  if (existing) throw new AppError("Onboarding has already started for this person.");
  await db.insert(onboardingTasks).values(DEFAULT_CHECKLIST.map((t, i) => ({ employeeId, title: t.title, category: t.category, sortOrder: i, dueDate: addDays(emp.joiningDate, t.offsetDays) })));
  await audit({ actorUserId: viewer.userId, action: "onboarding.start", entityType: "employee", entityId: employeeId, summary: `Started onboarding for ${emp.firstName} ${emp.lastName}` });
}

export async function toggleOnboardingTask(viewer: Viewer, id: string, done: boolean) {
  if (!can(viewer, "onboarding.manage")) throw new ForbiddenError();
  const [row] = await db.update(onboardingTasks).set(done ? { completedAt: new Date(), completedById: viewer.userId } : { completedAt: null, completedById: null }).where(eq(onboardingTasks.id, id)).returning();
  if (!row) throw new AppError("Checklist item not found.");
  await audit({ actorUserId: viewer.userId, action: "onboarding.task", entityType: "employee", entityId: row.employeeId, summary: `${done ? "Completed" : "Reopened"} “${row.title}”` });
}

export async function addOnboardingTask(viewer: Viewer, employeeId: string, title: string, category: "documents" | "accounts" | "department" | "manager" | "formalities", dueDate: ISODate | null) {
  if (!can(viewer, "onboarding.manage")) throw new ForbiddenError();
  await db.insert(onboardingTasks).values({ employeeId, title, category, dueDate, sortOrder: 100 });
}

export async function onboardingOverview(viewer: Viewer) {
  if (!can(viewer, "onboarding.manage")) throw new ForbiddenError();
  const rows = await db
    .select({ employeeId: onboardingTasks.employeeId, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId, joiningDate: employees.joiningDate, total: count(onboardingTasks.id) })
    .from(onboardingTasks)
    .innerJoin(employees, eq(employees.id, onboardingTasks.employeeId))
    .groupBy(onboardingTasks.employeeId, employees.firstName, employees.lastName, employees.photoFileId, employees.joiningDate)
    .orderBy(desc(employees.joiningDate));
  const open = await db.select({ employeeId: onboardingTasks.employeeId, n: count() }).from(onboardingTasks).where(isNull(onboardingTasks.completedAt)).groupBy(onboardingTasks.employeeId);
  const company = await getCompany();
  const since = addDays(todayIn(company.timezone), -120);
  // Recent joiners (last 120 days, still on probation) with no checklist yet.
  const notStarted = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(and(eq(employees.employmentStatus, "probation"), gte(employees.joiningDate, since)));
  const started = new Set(rows.map((r) => r.employeeId));
  return {
    rows: rows.map((r) => ({ ...r, remaining: open.find((o) => o.employeeId === r.employeeId)?.n ?? 0 })),
    notStarted: notStarted.filter((n) => !started.has(n.id)),
    since,
  };
}

export async function onboardingChecklist(viewer: Viewer, employeeId: string) {
  if (!can(viewer, "onboarding.manage") && viewer.employee?.id !== employeeId) throw new ForbiddenError();
  return db
    .select({ id: onboardingTasks.id, title: onboardingTasks.title, category: onboardingTasks.category, dueDate: onboardingTasks.dueDate, completedAt: onboardingTasks.completedAt, completedBy: users.email })
    .from(onboardingTasks)
    .leftJoin(users, eq(users.id, onboardingTasks.completedById))
    .where(eq(onboardingTasks.employeeId, employeeId))
    .orderBy(asc(onboardingTasks.sortOrder), asc(onboardingTasks.createdAt));
}

/** Converts a candidate into an employee with an invited account and starts onboarding. */
export async function hireCandidate(viewer: Viewer, candidateId: string, input: { email: string; joiningDate: ISODate; designationId: string | null; managerId: string | null }) {
  requireRecruiter(viewer);
  if (!can(viewer, "employees.manage") || !can(viewer, "users.invite")) throw new ForbiddenError("Hiring creates an employee account, which needs HR permissions.");
  const c = await db.query.candidates.findFirst({ where: eq(candidates.id, candidateId) });
  if (!c) throw new AppError("Candidate not found.");
  if (c.stage === "hired") throw new AppError("Already hired.");
  const job = (await db.query.jobOpenings.findFirst({ where: eq(jobOpenings.id, c.jobId) }))!;
  const [first, ...rest] = c.fullName.trim().split(/\s+/);
  let created;
  try {
    created = await createEmployeeWithAccount(
      { email: input.email, firstName: first ?? c.fullName, lastName: rest.join(" "), roleKey: "employee", joiningDate: input.joiningDate, departmentId: job.departmentId, designationId: input.designationId, managerId: input.managerId, employmentType: job.employmentType, phone: c.phone },
      viewer.userId,
    );
  } catch (e) {
    if (e instanceof AccountError) throw new AppError(e.message);
    throw e;
  }
  await db.update(candidates).set({ stage: "hired", employeeId: created.employeeId }).where(eq(candidates.id, candidateId));
  await audit({ actorUserId: viewer.userId, action: "candidate.hire", entityType: "candidate", entityId: candidateId, summary: `Hired ${c.fullName} for “${job.title}” (${created.employeeCode})` });
  if (can(viewer, "onboarding.manage")) await startOnboarding(viewer, created.employeeId);
  // Close the opening once all positions are filled.
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(candidates).where(and(eq(candidates.jobId, job.id), eq(candidates.stage, "hired")));
  if (n >= job.positions) await db.update(jobOpenings).set({ status: "closed" }).where(eq(jobOpenings.id, job.id));
  return created;
}
