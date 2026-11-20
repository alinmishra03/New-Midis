"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ok, parseForm, runAction, setFlash, zCheckbox, zId, type ActionState } from "@/crm/lib/actions";
import { deleteAnnouncement, saveAnnouncement } from "@/crm/services/announcements";

const schema = z.object({
  title: z.string().trim().min(3, "Add a title.").max(200),
  body: z.string().trim().min(3, "Write the announcement.").max(20000),
  category: z.enum(["company", "hr", "department", "notice", "policy", "event", "celebration"]),
  departmentId: z.uuid().optional().transform((v) => v || null),
  isPinned: zCheckbox,
  isImportant: zCheckbox,
  publish: zCheckbox,
});

export async function saveAnnouncementAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const id = fd.get("id") ? zId.parse(fd.get("id")) : null;
    const input = parseForm(schema, fd);
    const row = await saveAnnouncement(viewer, id, input);
    return ok(row.status === "published" ? (id ? "Saved." : "Published. Everyone it's for has been notified.") : "Saved as a draft.", { id: row.id });
  });
}

export async function deleteAnnouncementAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const result = await runAction(async (viewer) => {
    await deleteAnnouncement(viewer, zId.parse(fd.get("id")));
    await setFlash("Announcement deleted.");
  });
  if (result?.ok) redirect("/crm/announcements");
  return result;
}
