"use server";

import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/crm/db";
import { employees, passwordResetRequests, users } from "@/crm/db/schema";
import { dummyPasswordHash, hashPassword, passwordProblems, verifyPassword } from "@/crm/auth/crypto";
import { getSession, createSession, deleteAllSessionsForUser, deleteCurrentSession, purgeExpiredSessions, requestMeta } from "@/crm/auth/session";
import { consumeToken } from "@/crm/auth/tokens";
import { audit } from "@/crm/lib/audit";
import { fail, ok, setFlash, type ActionState } from "@/crm/lib/actions";
import { notify, userIdsWithPermission } from "@/crm/services/notifications";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC_LOGIN_ERROR = "That email and password don't match an active account.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
  remember: z.string().optional(),
  next: z.string().optional(),
});

/** Only same-app relative paths under /crm are honoured as post-login destinations. */
function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/crm") || next.startsWith("//") || next.includes("\\")) return "/crm";
  if (next.startsWith("/crm/login") || next.startsWith("/crm/set-password")) return "/crm";
  return next;
}

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
    remember: fd.get("remember") ?? undefined,
    next: fd.get("next") ?? undefined,
  });
  if (!parsed.success) return fail("Enter your company email and password.");
  const { email, password, remember, next } = parsed.data;
  const meta = await requestMeta();

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  // Always spend the same hashing time, so timing does not reveal which emails exist.
  if (!user || !user.passwordHash || user.status !== "active") {
    await verifyPassword(password, await dummyPasswordHash());
    return fail(GENERIC_LOGIN_ERROR);
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await verifyPassword(password, await dummyPasswordHash());
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return fail(`Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or ask HR to reset your password.`);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED;
    await db
      .update(users)
      .set({
        failedLoginCount: lock ? 0 : failed,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60000) : user.lockedUntil,
      })
      .where(eq(users.id, user.id));
    await audit({
      actorUserId: user.id,
      action: lock ? "auth.locked" : "auth.login_failed",
      entityType: "user",
      entityId: user.id,
      summary: lock ? `Account locked for ${LOCK_MINUTES} minutes after ${MAX_FAILED} failed sign-ins` : "Failed sign-in",
      ipAddress: meta.ipAddress,
    });
    return fail(GENERIC_LOGIN_ERROR);
  }

  await db
    .update(users)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  await createSession(user.id, remember === "on");
  await audit({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    summary: "Signed in",
    metadata: { remember: remember === "on", userAgent: meta.userAgent },
    ipAddress: meta.ipAddress,
  });
  await purgeExpiredSessions();
  redirect(safeNext(next));
}

export async function logout() {
  const session = await getSession();
  await deleteCurrentSession();
  if (session) {
    await audit({ actorUserId: session.userId, action: "auth.logout", entityType: "user", entityId: session.userId, summary: "Signed out" });
  }
  redirect("/crm/login");
}

/**
 * Forgot password. Without outbound email, the request is queued for HR,
 * who issue a one-time reset link. The response is identical whether or not
 * the email has an account, so the form cannot be used to discover accounts.
 */
export async function requestPasswordReset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.string().trim().toLowerCase().pipe(z.email()).safeParse(fd.get("email"));
  if (!parsed.success) return fail("Enter your company email address.");
  const message =
    "If that email belongs to an active account, HR has been asked to send you a reset link. They'll share it with you directly.";

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data) });
  if (!user || user.status !== "active") return ok(message);

  const recent = await db.query.passwordResetRequests.findFirst({
    where: and(
      eq(passwordResetRequests.userId, user.id),
      eq(passwordResetRequests.status, "pending"),
      gt(passwordResetRequests.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ),
  });
  if (!recent) {
    await db.insert(passwordResetRequests).values({ userId: user.id });
    const emp = await db.query.employees.findFirst({ where: eq(employees.userId, user.id), columns: { firstName: true, lastName: true } });
    const name = emp ? `${emp.firstName} ${emp.lastName}`.trim() : user.email;
    await notify(await userIdsWithPermission("users.invite"), {
      type: "password_reset_request",
      title: `${name} asked for a password reset`,
      body: "Issue a one-time reset link from Settings → Users.",
      link: "/crm/settings/users?tab=requests",
    });
    await audit({ actorUserId: null, action: "auth.reset_requested", entityType: "user", entityId: user.id, summary: `Password reset requested for ${user.email}` });
  }
  return ok(message);
}

const setPasswordSchema = z
  .object({ token: z.string().min(10).max(100), password: z.string(), confirm: z.string() })
  .superRefine((v, ctx) => {
    for (const p of passwordProblems(v.password)) ctx.addIssue({ code: "custom", path: ["password"], message: p });
    if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "The passwords don't match." });
  });

/** Completes an invite or a reset from a one-time link, then signs the user in. */
export async function setPasswordWithToken(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = setPasswordSchema.safeParse({ token: fd.get("token"), password: fd.get("password"), confirm: fd.get("confirm") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) (fieldErrors[String(i.path[0])] ??= []).push(i.message);
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors, at: Date.now() };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const meta = await requestMeta();
  const result = await db.transaction(async (tx) => {
    const token = await consumeToken(parsed.data.token, tx);
    if (!token) return null;
    // A deactivated account stays deactivated, whatever link is used.
    const current = await tx.query.users.findFirst({ where: eq(users.id, token.userId), columns: { status: true } });
    if (!current || current.status === "disabled") return null;
    const [user] = await tx
      .update(users)
      .set({ passwordHash, status: "active", passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
      .where(eq(users.id, token.userId))
      .returning({ id: users.id, status: users.status });
    await tx
      .update(passwordResetRequests)
      .set({ status: "approved", handledAt: new Date() })
      .where(and(eq(passwordResetRequests.userId, token.userId), eq(passwordResetRequests.status, "pending")));
    await audit(
      {
        actorUserId: token.userId,
        action: token.type === "invite" ? "auth.activated" : "auth.password_reset",
        entityType: "user",
        entityId: token.userId,
        summary: token.type === "invite" ? "Activated account and set password" : "Reset password with a one-time link",
        ipAddress: meta.ipAddress,
      },
      tx,
    );
    return { user, type: token.type };
  });

  if (!result?.user) return fail("This link has expired or has already been used. Ask HR for a new one.");

  // A new password signs out every other device.
  await deleteAllSessionsForUser(result.user.id);
  await createSession(result.user.id, false);
  await setFlash(result.type === "invite" ? "Welcome to MIDIS. Your account is ready." : "Your password has been changed.");
  redirect("/crm");
}
