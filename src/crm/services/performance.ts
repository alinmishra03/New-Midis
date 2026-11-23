import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/crm/db";
import { employees, goals, performanceReviews, reviewCycles } from "@/crm/db/schema";
import { can, ForbiddenError, getTeamEmployeeIds, isInTeam, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import type { ISODate } from "@/crm/lib/time";
import { notify, userIdForEmployee } from "./notifications";

/*
 * Performance: review cycles → self-assessment → manager review → completed,
 * plus goals. Visible to the employee, their reporting line
 * (performance.review_team) and HR (performance.manage). Nobody reviews
 * themselves as a manager.
 */

async function canReviewAsManager(viewer: Viewer, employeeId: string) {
  if (viewer.employee?.id === employeeId && viewer.role.key !== "super_admin") return false;
  if (can(viewer, "performance.manage")) return true;
  return can(viewer, "performance.review_team") && (await isInTeam(viewer, employeeId));
}

async function canSee(viewer: Viewer, employeeId: string) {
  return viewer.employee?.id === employeeId || can(viewer, "performance.manage") || (can(viewer, "performance.review_team") && (await isInTeam(viewer, employeeId)));
}

/* ------------------------------------------------------------------ cycles */

export async function createCycle(viewer: Viewer, input: { name: string; type: "monthly" | "quarterly" | "annual"; periodStart: ISODate; periodEnd: ISODate }) {
  if (!can(viewer, "performance.manage")) throw new ForbiddenError();
  if (input.periodEnd < input.periodStart) throw new AppError("The period ends before it starts.");
  const people = await db
    .select({ id: employees.id, managerId: employees.managerId, userId: employees.userId })
    .from(employees)
    .where(inArray(employees.employmentStatus, ["probation", "active", "notice"]));
  const cycle = await db.transaction(async (tx) => {
    const [c] = await tx.insert(reviewCycles).values(input).returning();
    if (people.length) await tx.insert(performanceReviews).values(people.map((p) => ({ cycleId: c!.id, employeeId: p.id, reviewerId: p.managerId })));
    await audit({ actorUserId: viewer.userId, action: "performance.cycle_create", entityType: "review_cycle", entityId: c!.id, summary: `Opened review cycle “${input.name}” for ${people.length} employees` }, tx);
    return c!;
  });
  await notify(people.map((p) => p.userId), { type: "review", title: `Performance review open: ${input.name}`, body: "Complete your self-assessment.", link: "/crm/performance" });
  return cycle;
}

export async function setCycleOpen(viewer: Viewer, id: string, open: boolean) {
  if (!can(viewer, "performance.manage")) throw new ForbiddenError();
  const [row] = await db.update(reviewCycles).set({ isOpen: open }).where(eq(reviewCycles.id, id)).returning();
  if (!row) throw new AppError("Cycle not found.");
  await audit({ actorUserId: viewer.userId, action: open ? "performance.cycle_reopen" : "performance.cycle_close", entityType: "review_cycle", entityId: id, summary: `${open ? "Reopened" : "Closed"} review cycle “${row.name}”` });
}

export async function listCycles() {
  const cycles = await db.select().from(reviewCycles).orderBy(desc(reviewCycles.periodEnd));
  if (!cycles.length) return [];
  const reviews = await db.select({ cycleId: performanceReviews.cycleId, status: performanceReviews.status }).from(performanceReviews).where(inArray(performanceReviews.cycleId, cycles.map((c) => c.id)));
  return cycles.map((c) => {
    const r = reviews.filter((x) => x.cycleId === c.id);
    return { ...c, total: r.length, completed: r.filter((x) => x.status === "completed").length, awaitingManager: r.filter((x) => x.status === "manager_review").length };
  });
}

/* ----------------------------------------------------------------- reviews */

const reviewSelect = {
  id: performanceReviews.id,
  cycleId: performanceReviews.cycleId,
  cycleName: reviewCycles.name,
  cycleOpen: reviewCycles.isOpen,
  periodStart: reviewCycles.periodStart,
  periodEnd: reviewCycles.periodEnd,
  employeeId: performanceReviews.employeeId,
  firstName: employees.firstName,
  lastName: employees.lastName,
  photoFileId: employees.photoFileId,
  reviewerId: performanceReviews.reviewerId,
  status: performanceReviews.status,
  selfRating: performanceReviews.selfRating,
  selfAssessment: performanceReviews.selfAssessment,
  achievements: performanceReviews.achievements,
  managerRating: performanceReviews.managerRating,
  managerFeedback: performanceReviews.managerFeedback,
  selfSubmittedAt: performanceReviews.selfSubmittedAt,
  completedAt: performanceReviews.completedAt,
};
const joined = () =>
  db.select(reviewSelect).from(performanceReviews).innerJoin(reviewCycles, eq(reviewCycles.id, performanceReviews.cycleId)).innerJoin(employees, eq(employees.id, performanceReviews.employeeId));

export function myReviews(viewer: Viewer) {
  if (!viewer.employee) return Promise.resolve([]);
  return joined().where(eq(performanceReviews.employeeId, viewer.employee.id)).orderBy(desc(reviewCycles.periodEnd));
}

/** Reviews the viewer gives: their reporting tree, or everyone with performance.manage. */
export async function reviewsToGive(viewer: Viewer) {
  if (can(viewer, "performance.manage")) return joined().orderBy(asc(performanceReviews.status), desc(reviewCycles.periodEnd), asc(employees.firstName)).limit(300);
  if (!can(viewer, "performance.review_team") || !viewer.employee) return [];
  const team = await getTeamEmployeeIds(viewer.employee.id);
  if (!team.length) return [];
  return joined().where(inArray(performanceReviews.employeeId, team)).orderBy(asc(performanceReviews.status), desc(reviewCycles.periodEnd), asc(employees.firstName));
}

export async function getReview(viewer: Viewer, id: string) {
  const [row] = await joined().where(eq(performanceReviews.id, id));
  if (!row || !(await canSee(viewer, row.employeeId))) return null;
  const reviewer = row.reviewerId ? await db.query.employees.findFirst({ where: eq(employees.id, row.reviewerId), columns: { firstName: true, lastName: true } }) : null;
  return { ...row, reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : null, isSelf: viewer.employee?.id === row.employeeId, canManagerReview: await canReviewAsManager(viewer, row.employeeId) };
}

export async function submitSelf(viewer: Viewer, id: string, input: { rating: number; assessment: string; achievements: string | null }) {
  const r = await getReview(viewer, id);
  if (!r || !r.isSelf) throw new ForbiddenError();
  if (!r.cycleOpen) throw new AppError("This review cycle is closed.");
  if (r.status !== "self_assessment") throw new AppError("Your self-assessment has already been submitted.");
  await db
    .update(performanceReviews)
    .set({ selfRating: input.rating, selfAssessment: input.assessment, achievements: input.achievements, selfSubmittedAt: new Date(), status: "manager_review" })
    .where(and(eq(performanceReviews.id, id), eq(performanceReviews.status, "self_assessment")));
  await audit({ actorUserId: viewer.userId, action: "performance.self_submit", entityType: "performance_review", entityId: id, summary: `Submitted self-assessment for ${r.cycleName}` });
  if (r.reviewerId) await notify([await userIdForEmployee(r.reviewerId)], { type: "review", title: `${r.firstName} ${r.lastName} submitted a self-assessment`, body: r.cycleName, link: `/crm/performance/reviews/${id}` });
}

export async function submitManagerReview(viewer: Viewer, id: string, input: { rating: number; feedback: string }) {
  const r = await getReview(viewer, id);
  if (!r || !r.canManagerReview) throw new ForbiddenError();
  if (!r.cycleOpen) throw new AppError("This review cycle is closed.");
  if (r.status === "completed") throw new AppError("This review is already complete.");
  await db
    .update(performanceReviews)
    .set({ managerRating: input.rating, managerFeedback: input.feedback, status: "completed", completedAt: new Date(), reviewerId: viewer.employee?.id ?? r.reviewerId })
    .where(eq(performanceReviews.id, id));
  await audit({ actorUserId: viewer.userId, action: "performance.manager_submit", entityType: "performance_review", entityId: id, summary: `Completed ${r.firstName} ${r.lastName}'s review for ${r.cycleName}` });
  await notify([await userIdForEmployee(r.employeeId)], { type: "review", title: `Your ${r.cycleName} review is complete`, link: `/crm/performance/reviews/${id}` });
}

/* ------------------------------------------------------------------- goals */

export async function goalsFor(viewer: Viewer, employeeId: string) {
  if (!(await canSee(viewer, employeeId))) throw new ForbiddenError();
  return db.select().from(goals).where(eq(goals.employeeId, employeeId)).orderBy(asc(goals.status), desc(goals.createdAt));
}

export async function createGoal(viewer: Viewer, input: { employeeId: string; title: string; description: string | null; dueDate: ISODate | null }) {
  const self = viewer.employee?.id === input.employeeId;
  if (!self && !(await canReviewAsManager(viewer, input.employeeId))) throw new ForbiddenError();
  const [g] = await db.insert(goals).values({ ...input, createdById: viewer.userId }).returning();
  await audit({ actorUserId: viewer.userId, action: "goal.create", entityType: "goal", entityId: g!.id, summary: `Set goal “${input.title}”` });
  if (!self) await notify([await userIdForEmployee(input.employeeId)], { type: "goal", title: `New goal: ${input.title}`, link: "/crm/performance" });
}

export async function updateGoal(viewer: Viewer, id: string, input: { status: "not_started" | "in_progress" | "achieved" | "missed"; progress: number }) {
  const g = await db.query.goals.findFirst({ where: eq(goals.id, id) });
  if (!g) throw new AppError("Goal not found.");
  if (viewer.employee?.id !== g.employeeId && !(await canReviewAsManager(viewer, g.employeeId))) throw new ForbiddenError();
  const progress = input.status === "achieved" ? 100 : Math.max(0, Math.min(100, Math.round(input.progress)));
  await db.update(goals).set({ status: input.status, progress }).where(eq(goals.id, id));
  await audit({ actorUserId: viewer.userId, action: "goal.update", entityType: "goal", entityId: id, summary: `Updated goal “${g.title}” to ${input.status.replace("_", " ")} (${progress}%)` });
}
