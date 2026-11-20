"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/crm/db";
import { users } from "@/crm/db/schema";
import { hashPassword, passwordProblems, verifyPassword } from "@/crm/auth/crypto";
import { deleteAllSessionsForUser, requestMeta } from "@/crm/auth/session";
import { fail, ok, runAction, ValidationError, type ActionState } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";

const schema = z.object({ current: z.string().min(1).max(200), password: z.string().max(200), confirm: z.string().max(200) });

/** Changes the viewer's own password (needs the current one) and signs out every other device. */
export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const parsed = schema.safeParse({ current: fd.get("current"), password: fd.get("password"), confirm: fd.get("confirm") });
    if (!parsed.success) return fail("Fill in all three fields.");
    const { current, password, confirm } = parsed.data;
    const problems = passwordProblems(password);
    if (problems.length) throw new ValidationError({ password: problems });
    if (password !== confirm) throw new ValidationError({ confirm: ["The passwords don't match."] });
    if (password === current) throw new ValidationError({ password: ["Choose a password you haven't been using."] });

    const user = await db.query.users.findFirst({ where: eq(users.id, viewer.userId) });
    if (!user?.passwordHash || !(await verifyPassword(current, user.passwordHash))) throw new ValidationError({ current: ["That isn't your current password."] });

    await db.update(users).set({ passwordHash: await hashPassword(password), passwordChangedAt: new Date() }).where(eq(users.id, viewer.userId));
    await deleteAllSessionsForUser(viewer.userId, viewer.sessionId);
    await audit({ actorUserId: viewer.userId, action: "auth.password_change", entityType: "user", entityId: viewer.userId, summary: "Changed password", ipAddress: (await requestMeta()).ipAddress });
    return ok("Password changed. Other devices have been signed out.");
  });
}
