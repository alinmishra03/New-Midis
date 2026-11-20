"use server";

import { z } from "zod";
import { ok, parseForm, runAction, zId, type ActionState } from "@/crm/lib/actions";
import { addHoliday, cancelMeeting, deleteHoliday, scheduleMeeting } from "@/crm/services/calendar";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.");
const meetingSchema = z.object({
  title: z.string().trim().min(2, "Add a title.").max(200),
  description: z.string().trim().max(5000).optional().transform((v) => v || null),
  date: z.iso.date({ error: "Choose a date." }),
  start: hhmm,
  end: hhmm,
  location: z.string().trim().max(200).optional().transform((v) => v || null),
  meetingLink: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Use an https:// link." })]).optional().transform((v) => v || null),
  scope: z.enum(["private", "team", "company"]).default("private"),
  participants: z.array(z.uuid()).max(200).optional().default([]),
});

export async function scheduleMeetingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const { participants, ...input } = parseForm(meetingSchema, fd);
    await scheduleMeeting(viewer, { ...input, participantIds: participants });
    return ok("Meeting scheduled. Participants have been notified.");
  });
}

export async function cancelMeetingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await cancelMeeting(viewer, zId.parse(fd.get("id")));
    return ok("Meeting cancelled.");
  });
}

const holidaySchema = z.object({
  date: z.iso.date({ error: "Choose a date." }),
  name: z.string().trim().min(2, "Name the holiday.").max(120),
  type: z.enum(["public", "optional"]).default("public"),
  description: z.string().trim().max(500).optional().transform((v) => v || null),
});

export async function addHolidayAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await addHoliday(viewer, parseForm(holidaySchema, fd));
    return ok("Holiday added.");
  });
}

export async function deleteHolidayAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await deleteHoliday(viewer, zId.parse(fd.get("id")));
    return ok("Holiday removed.");
  });
}
