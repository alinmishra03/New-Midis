/**
 * The contact form takes one field that accepts either an email address or a
 * phone number. Classifying that value has to happen in two places — in the
 * browser for immediate feedback, and again in the route handler, which is
 * the only authority — so the rule lives here once rather than being written
 * twice and drifting apart.
 */

export type ContactKind = "email" | "phone";

export interface ClassifiedContact {
  kind: ContactKind;
  /** The value as the visitor typed it, trimmed and with runs of whitespace collapsed. */
  value: string;
}

/**
 * Deliberately permissive: one @, something either side, and a dot-suffixed
 * TLD. Stricter patterns reject valid addresses, and the only consequence of
 * being generous here is a bounced reply — the address is never trusted for
 * anything but writing back.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** Digits plus the separators people actually type, with an optional `+`. */
const PHONE_SHAPE_RE = /^\+?[\d\s().\-/]+$/;

/* E.164 allows at most 15 digits. Seven is the shortest plausible subscriber
   number, so anything below it is a typo rather than a number. */
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

export const CONTACT_MAX_LENGTH = 200;

/** Shared wording, so the browser and the server never disagree. */
export const CONTACT_REQUIRED_MESSAGE = "Please enter your email address or phone number";
export const CONTACT_INVALID_MESSAGE =
  "Enter a valid email address or phone number, including the country code if it's international";

export function normaliseContact(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function isPhone(value: string): boolean {
  if (!PHONE_SHAPE_RE.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

/**
 * Returns what the value is, or null if it is neither.
 *
 * Email is tested first: a well-formed address can never also satisfy the
 * phone shape, so the order only matters for giving a definite answer.
 * Separators and spacing are preserved in the returned value — formatting is
 * never a reason to reject a number, and the team is better served seeing the
 * number the way the client wrote it.
 */
export function classifyContact(raw: string): ClassifiedContact | null {
  const value = normaliseContact(raw);
  if (!value || value.length > CONTACT_MAX_LENGTH) return null;
  if (EMAIL_RE.test(value)) return { kind: "email", value };
  if (isPhone(value)) return { kind: "phone", value };
  return null;
}
