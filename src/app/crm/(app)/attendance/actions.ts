"use server";

import { z } from "zod";
import { ok, parseForm, runAction, zId, type ActionState } from "@/crm/lib/actions";
import { hrSetAttendance, requestCorrection, reviewCorrection } from "@/crm/services/attendance-corrections";
import { checkIn, checkOut, endBreak, startBreak } from "@/crm/services/attendance";

/** Self-service attendance. Timestamps are taken on the server inside the service. */
export async function checkInAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const mode = z.enum(["office", "remote"]).catch("office").parse(fd.get("mode"));
    const note = z.string().max(300).optional().catch(undefined).parse(fd.get("note") || undefined);
    const { late } = await checkIn(viewer, mode, note);
    return ok(late ? `Checked in — ${late} minutes after your start time.` : "Checked in. Have a good day.");
  });
}

export async function checkOutAction(): Promise<ActionState> {
  return runAction(async (viewer) => {
    await checkOut(viewer);
    return ok("Checked out. See you tomorrow.");
  });
}

export async function startBreakAction(): Promise<ActionState> {
  return runAction(async (viewer) => {
    await startBreak(viewer);
    return ok("Break started.");
  });
}

export async function endBreakAction(): Promise<ActionState> {
  return runAction(async (viewer) => {
    await endBreak(viewer);
    return ok("Welcome back.");
  });
}

/* -------------------------------------------------------- corrections */

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.")
  .optional()
  .transform((v) => v || null);

const correctionSchema = z.object({
  date: z.iso.date({ error: "Choose the date." }),
  checkIn: timeField,
  checkOut: timeField,
  reason: z.string().trim().min(5, "Explain what happened (at least 5 characters).").max(500),
});

export async function requestCorrectionAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await requestCorrection(viewer, parseForm(correctionSchema, fd));
    return ok("Correction requested. Your manager and HR have been notified.");
  });
}

export async function reviewCorrectionAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = zId.parse(fd.get("id"));
    const approve = fd.get("decision") === "approve";
    const comment = z.string().max(500).optional().catch(undefined).parse(fd.get("comment") || undefined) ?? null;
    await reviewCorrection(viewer, id, approve, comment);
    return ok(approve ? "Correction approved and applied." : "Correction rejected.");
  });
}

export async function hrSetAttendanceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(correctionSchema.extend({ employeeId: zId }), fd);
    await hrSetAttendance(viewer, input);
    return ok("Attendance updated. The change is in the audit log.");
  });
}
