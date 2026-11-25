import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { authTokens } from "@/crm/db/schema";
import { generateToken, hashToken } from "./crypto";

/**
 * One-time links for account activation (invite) and password reset.
 *
 * There is no outbound email yet, so HR/Admin copy the link from the CRM and
 * send it to the employee themselves. Tokens are random, stored hashed,
 * single-use, and expire: invites after 7 days, resets after 1 hour.
 * Issuing a new token revokes any earlier unused token of the same type.
 */
const TTL_MS = { invite: 7 * 24 * 60 * 60 * 1000, password_reset: 60 * 60 * 1000 } as const;
export type TokenType = keyof typeof TTL_MS;

export function tokenTtlLabel(type: TokenType) {
  return type === "invite" ? "7 days" : "1 hour";
}

export async function issueToken(
  userId: string,
  type: TokenType,
  createdById: string | null,
  tx?: Tx,
): Promise<{ token: string; expiresAt: Date }> {
  const q = tx ?? db;
  await q
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type), isNull(authTokens.usedAt)));

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TTL_MS[type]);
  await q.insert(authTokens).values({ userId, type, tokenHash: hashToken(token), expiresAt, createdById });
  return { token, expiresAt };
}

/** Cancels a just-issued token that was never delivered. */
export async function revokeToken(token: string) {
  await db.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.tokenHash, hashToken(token)), isNull(authTokens.usedAt)));
}

/** Looks a token up without using it (to render the set-password page). */
export async function peekToken(token: string) {
  if (!token || token.length > 100) return null;
  const row = await db.query.authTokens.findFirst({ where: eq(authTokens.tokenHash, hashToken(token)) });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) return null;
  return row;
}

/** Marks a token used, atomically: returns null if it was already used or has expired. */
export async function consumeToken(token: string, tx: Tx) {
  const [row] = await tx
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.tokenHash, hashToken(token)), isNull(authTokens.usedAt)))
    .returning();
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;
  return row;
}

/** Absolute URL for a token link. CRM_BASE_URL wins; otherwise the request's own origin. */
export function tokenUrl(token: string, origin: string) {
  const base = (process.env.CRM_BASE_URL || origin).replace(/\/$/, "");
  return `${base}/crm/set-password?token=${encodeURIComponent(token)}`;
}
