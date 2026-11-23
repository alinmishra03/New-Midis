"use server";

import { z } from "zod";
import { ok, parseForm, runAction, zId, type ActionState } from "@/crm/lib/actions";
import { createCycle, createGoal, setCycleOpen, submitManagerReview, submitSelf, updateGoal } from "@/crm/services/performance";

const rating = z.coerce.number({ error: "Choose a rating." }).int().min(1, "Choose a rating.").max(5);

export async function createCycleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({ name: z.string().trim().min(3, "Name the cycle.").max(120), type: z.enum(["monthly", "quarterly", "annual"]), periodStart: z.iso.date(), periodEnd: z.iso.date() }),
      fd,
    );
    await createCycle(viewer, input);
    return ok("Review cycle opened. Employees have been asked for their self-assessments.");
  });
}

export async function cycleOpenAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const open = fd.get("open") === "1";
    await setCycleOpen(viewer, zId.parse(fd.get("id")), open);
    return ok(open ? "Cycle reopened." : "Cycle closed.");
  });
}

export async function selfReviewAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({ rating, assessment: z.string().trim().min(10, "Write at least a sentence.").max(5000), achievements: z.string().trim().max(5000).optional().transform((v) => v || null) }),
      fd,
    );
    await submitSelf(viewer, zId.parse(fd.get("id")), input);
    return ok("Self-assessment submitted to your manager.");
  });
}

export async function managerReviewAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(z.object({ rating, feedback: z.string().trim().min(10, "Write at least a sentence.").max(5000) }), fd);
    await submitManagerReview(viewer, zId.parse(fd.get("id")), input);
    return ok("Review completed. The employee has been notified.");
  });
}

export async function createGoalAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({ employeeId: zId, title: z.string().trim().min(3, "Describe the goal.").max(200), description: z.string().trim().max(2000).optional().transform((v) => v || null), dueDate: z.iso.date().optional().transform((v) => v || null) }),
      fd,
    );
    await createGoal(viewer, input);
    return ok("Goal added.");
  });
}

export async function updateGoalAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const status = z.enum(["not_started", "in_progress", "achieved", "missed"]).parse(fd.get("status"));
    const progress = z.coerce.number().min(0).max(100).catch(0).parse(fd.get("progress"));
    await updateGoal(viewer, zId.parse(fd.get("id")), { status, progress });
    return ok("Goal updated.");
  });
}
