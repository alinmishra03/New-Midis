"use server";

import { z } from "zod";
import { ok, parseForm, runAction, zId, type ActionState } from "@/crm/lib/actions";
import { fileFrom } from "@/crm/lib/storage";
import { adjustBalance, applyLeave, cancelLeave, decideLeave } from "@/crm/services/leave-workflow";
import { cancelWfh, decideWfh, requestWfh } from "@/crm/services/wfh";

const applySchema = z.object({
  leaveTypeId: z.uuid({ error: "Choose a leave type." }),
  startDate: z.iso.date({ error: "Choose a start date." }),
  endDate: z.iso.date({ error: "Choose an end date." }),
  halfDay: z.enum(["none", "first_half", "second_half"]).default("none"),
  reason: z.string().trim().min(3, "Add a short reason.").max(1000),
});

export async function applyLeaveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(applySchema, fd);
    const { days } = await applyLeave(viewer, { ...input, document: fileFrom(fd, "document") });
    return ok(`Leave requested for ${days} day${days === 1 ? "" : "s"}. Your manager and HR have been notified.`);
  });
}

const decision = (fd: FormData) => ({
  id: zId.parse(fd.get("id")),
  approve: fd.get("decision") === "approve",
  comment: z.string().max(500).optional().catch(undefined).parse(fd.get("comment") || undefined) ?? null,
});

export async function decideLeaveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const d = decision(fd);
    await decideLeave(viewer, d.id, d.approve, d.comment);
    return ok(d.approve ? "Leave approved." : "Leave rejected.");
  });
}

export async function cancelLeaveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await cancelLeave(viewer, zId.parse(fd.get("id")));
    return ok("Leave cancelled.");
  });
}

const adjustSchema = z.object({
  employeeId: zId,
  leaveTypeId: zId,
  delta: z.coerce.number({ error: "Enter a number of days." }),
  comment: z.string().trim().min(3, "Give a reason.").max(300),
});

export async function adjustBalanceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(adjustSchema, fd);
    await adjustBalance(viewer, input.employeeId, input.leaveTypeId, input.delta, input.comment);
    return ok("Balance adjusted.");
  });
}

/* --------------------------------------------------------------- WFH */

const wfhSchema = z.object({
  startDate: z.iso.date({ error: "Choose a start date." }),
  endDate: z.iso.date({ error: "Choose an end date." }),
  reason: z.string().trim().min(3, "Add a short reason.").max(1000),
});

export async function requestWfhAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await requestWfh(viewer, parseForm(wfhSchema, fd));
    return ok("Work from home requested.");
  });
}

export async function decideWfhAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const d = decision(fd);
    await decideWfh(viewer, d.id, d.approve, d.comment);
    return ok(d.approve ? "Work from home approved." : "Work from home rejected.");
  });
}

export async function cancelWfhAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await cancelWfh(viewer, zId.parse(fd.get("id")));
    return ok("Request cancelled.");
  });
}
