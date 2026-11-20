"use server";

import { z } from "zod";
import { ok, runAction, type ActionState } from "@/crm/lib/actions";
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
