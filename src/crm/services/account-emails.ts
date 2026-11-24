import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/crm/db";
import { authTokens, employees, users } from "@/crm/db/schema";
import { hashToken } from "@/crm/auth/crypto";
import { issueToken, type TokenType } from "@/crm/auth/tokens";
import { audit } from "@/crm/lib/audit";
import { emailTokenLink, invitationEmail, passwordResetEmail, sendEmail, type SendResult } from "@/crm/lib/email";
import { getCompany } from "./company";

/**
 * Account emails: activation (invite) and password-reset links.
 *
 * They reuse the existing one-time token mechanism (crm/auth/tokens.ts): the
 * token is random, stored only as its SHA-256, single use, and expires (invite
 * 7 days, reset 1 hour). Every function here runs AFTER the account change has
 * committed and never throws, so a delivery problem can't undo or corrupt it —
 * the caller falls back to showing the link to HR, as before.
 */

/** Emails a token link to the account's own address. `token` is the raw token just issued. */
export async function emailAccessLink(userId: string, type: TokenType, token: string, actorUserId: string | null): Promise<SendResult> {
  try {
    const link = emailTokenLink(token);
    if (!link) return { ok: false, reason: "not_configured", message: "The portal address for email links isn't configured (CRM_BASE_URL)." };
    const [user, emp, company] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true, status: true } }),
      db.query.employees.findFirst({ where: eq(employees.userId, userId), columns: { firstName: true } }),
      getCompany(),
    ]);
    if (!user || user.status === "disabled") return { ok: false, reason: "invalid_recipient", message: "This account can't receive email." };
    const content = (type === "invite" ? invitationEmail : passwordResetEmail)({ firstName: emp?.firstName || "there", link, companyName: company.name });
    // One email per token: retries of the same request can't send duplicates.
    const result = await sendEmail({ to: user.email, ...content, idempotencyKey: `crm-${type}-${hashToken(token).slice(0, 32)}` });
    await audit({
      actorUserId,
      action: result.ok ? (type === "invite" ? "email.invite_sent" : "email.reset_sent") : "email.not_sent",
      entityType: "user",
      entityId: userId,
      summary: result.ok ? `Emailed ${type === "invite" ? "an activation" : "a password reset"} link` : `${type === "invite" ? "Activation" : "Password reset"} email not sent (${result.reason})`,
      metadata: result.ok ? { provider: "resend", messageId: result.id } : { reason: result.reason },
    }).catch(() => undefined);
    return result;
  } catch {
    return { ok: false, reason: "unavailable", message: "The email couldn't be sent." };
  }
}

const SELF_RESET_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Self-service "forgot password" for an ACTIVE account: issues a 1-hour reset
 * token and emails it. At most one email per account per 15 minutes. If the
 * email isn't delivered, the token is revoked at once (nobody else ever saw it)
 * and the caller falls back to the HR queue. Returns whether an email went out.
 */
export async function selfServiceResetEmail(userId: string): Promise<"sent" | "cooldown" | "not_sent"> {
  try {
    const recent = await db.query.authTokens.findFirst({
      where: and(eq(authTokens.userId, userId), eq(authTokens.type, "password_reset"), gt(authTokens.createdAt, new Date(Date.now() - SELF_RESET_COOLDOWN_MS))),
      orderBy: desc(authTokens.createdAt),
      columns: { id: true },
    });
    if (recent) return "cooldown";
    const { token } = await issueToken(userId, "password_reset", null);
    const result = await emailAccessLink(userId, "password_reset", token, null);
    if (result.ok) return "sent";
    await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.tokenHash, hashToken(token)));
    return "not_sent";
  } catch {
    return "not_sent";
  }
}
