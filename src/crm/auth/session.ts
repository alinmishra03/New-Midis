import "server-only";
import { and, eq, lt, ne } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/crm/db";
import { sessions } from "@/crm/db/schema";
import { generateToken, hashToken } from "./crypto";

/**
 * Database-backed sessions.
 *
 * The cookie holds a random 256-bit token. The database stores only its
 * SHA-256 as the session id, so a leaked database dump contains no usable
 * session. The cookie is HttpOnly, SameSite=Lax, Secure in production, and
 * scoped to /crm so the public site never receives it.
 *
 * Lifetimes
 * - "Remember me": 30 days, fixed, persistent cookie.
 * - Otherwise: a browser-session cookie, and the server expires the session
 *   after 8 hours of inactivity, or 24 hours after sign-in at the latest.
 */
export const SESSION_COOKIE = "midis_crm_session";
export const SESSION_COOKIE_PATH = "/crm";

const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const IDLE_MS = 8 * 60 * 60 * 1000;
const ABSOLUTE_MS = 24 * 60 * 60 * 1000;
/** Avoid writing lastSeenAt on every request. */
const TOUCH_EVERY_MS = 5 * 60 * 1000;

export async function requestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return {
    ipAddress: (forwarded ? forwarded.split(",")[0]!.trim() : h.get("x-real-ip")) ?? null,
    userAgent: h.get("user-agent")?.slice(0, 400) ?? null,
  };
}

/** Creates a session and sets the cookie. Only callable from a Server Action or Route Handler. */
export async function createSession(userId: string, remember: boolean) {
  const token = generateToken();
  const now = Date.now();
  const expiresAt = new Date(now + (remember ? REMEMBER_MS : IDLE_MS));
  const meta = await requestMeta();

  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    remember,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_COOKIE_PATH,
    ...(remember ? { expires: expiresAt } : {}),
  });
}

/**
 * The current session, validated against the database. Memoised per render.
 * Returns null for a missing, unknown or expired session.
 */
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const id = hashToken(token);
  const row = await db.query.sessions.findFirst({ where: eq(sessions.id, id) });
  if (!row) return null;

  const now = Date.now();
  const expired =
    row.expiresAt.getTime() <= now || (!row.remember && now - row.createdAt.getTime() > ABSOLUTE_MS);
  if (expired) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  if (now - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await db
      .update(sessions)
      .set({
        lastSeenAt: new Date(now),
        // Sliding idle window for non-remembered sessions.
        ...(row.remember ? {} : { expiresAt: new Date(now + IDLE_MS) }),
      })
      .where(eq(sessions.id, id));
  }

  return row;
});

/** Ends the current session (logout). */
export async function deleteCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete({ name: SESSION_COOKIE, path: SESSION_COOKIE_PATH });
}

/** Signs a user out everywhere — after a password change, reset, or deactivation. */
export async function deleteAllSessionsForUser(userId: string, exceptSessionId?: string) {
  await db
    .delete(sessions)
    .where(
      exceptSessionId
        ? and(eq(sessions.userId, userId), ne(sessions.id, exceptSessionId))
        : eq(sessions.userId, userId),
    );
}

/** Housekeeping: drop expired sessions. Called opportunistically on sign-in. */
export async function purgeExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
