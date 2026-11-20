"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/crm/auth/dal";
import { ok, runAction, type ActionState } from "@/crm/lib/actions";
import { markRead } from "@/crm/services/notifications";

export async function markAllReadAction(): Promise<ActionState> {
  return runAction(async (viewer) => {
    await markRead(viewer.userId, "all");
    return ok("All caught up.");
  });
}

/** Plain form action (progressive): marks one of the viewer's own notifications read. */
export async function markOneReadAction(fd: FormData) {
  const viewer = await getViewer();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!viewer || !id.success) return;
  await markRead(viewer.userId, [id.data]);
  revalidatePath("/crm/notifications");
}
