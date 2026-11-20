import "server-only";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { ForbiddenError, getViewer, type Viewer } from "@/crm/auth/dal";
import { SESSION_COOKIE_PATH } from "@/crm/auth/session";

/**
 * Every CRM Server Action returns this shape to its form (via
 * useActionState), so forms can show a toast, field errors, or both.
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Optional payload, e.g. a one-time link to display. Never secrets beyond what the actor may see. */
  data?: Record<string, string>;
  /** Changes on every result so forms can react to repeated identical results. */
  at?: number;
} | null;

/** A user-facing failure: its message is shown as-is. */
export class AppError extends Error {}

export class ValidationError extends Error {
  constructor(public fieldErrors: Record<string, string[] | undefined>) {
    super("Please check the highlighted fields.");
  }
}

export const ok = (message?: string, data?: Record<string, string>): ActionState => ({ ok: true, message, data, at: Date.now() });
export const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });

/**
 * Runs an action body for a signed-in user and turns expected failures into
 * ActionState. Next.js redirects/notFound pass through. Unexpected errors are
 * logged on the server and reported generically, so internals never reach
 * the browser.
 */
export async function runAction(body: (viewer: Viewer) => Promise<ActionState | void>): Promise<ActionState> {
  try {
    const viewer = await getViewer();
    if (!viewer) return fail("Your session has expired. Please sign in again.");
    return (await body(viewer)) ?? ok();
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ValidationError) return { ok: false, message: err.message, fieldErrors: err.fieldErrors, at: Date.now() };
    if (err instanceof ForbiddenError || err instanceof AppError) return fail(err.message);
    console.error("[crm action]", err);
    return fail("Something went wrong. Please try again.");
  }
}

/** FormData → plain object. Repeated keys become arrays; empty strings become undefined. */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v) => typeof v === "string") as string[];
    const values = all.map((v) => v.trim()).filter((v) => v !== "");
    if (key.endsWith("[]")) out[key.slice(0, -2)] = values;
    else out[key] = values.length ? values[values.length - 1] : undefined;
  }
  return out;
}

/** Validates FormData against a zod schema, throwing a ValidationError with per-field messages. */
export function parseForm<S extends z.ZodType>(schema: S, fd: FormData): z.infer<S> {
  const result = schema.safeParse(formToObject(fd));
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    throw new ValidationError(fieldErrors);
  }
  return result.data;
}

/* --------------------------------------------------------------- flash */

export const FLASH_COOKIE = "crm_flash";

/**
 * A one-shot message shown as a toast on the next page — for actions that
 * redirect. Readable by the client (it holds nothing sensitive), which
 * displays and clears it.
 */
export async function setFlash(message: string, tone: "success" | "error" = "success") {
  (await cookies()).set(FLASH_COOKIE, encodeURIComponent(JSON.stringify({ message, tone })), {
    path: SESSION_COOKIE_PATH,
    maxAge: 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/* --------------------------------------------------------------- zod helpers */

export const zId = z.uuid({ error: "Invalid selection." });
export const zDate = z.iso.date({ error: "Enter a valid date." });
export const zOptionalText = (max = 2000) => z.string().max(max).optional();
/** A checkbox: present ("on") when ticked, absent when not. In zod 4 an absent key needs .optional(). */
export const zCheckbox = z
  .enum(["on", "true", "1"])
  .optional()
  .transform((v) => v !== undefined);
