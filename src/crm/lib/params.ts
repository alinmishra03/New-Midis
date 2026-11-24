/**
 * Guards for values read from the address bar (search params). Anything that
 * reaches a UUID, date or enum comparison in PostgreSQL must be well-formed,
 * otherwise the database rejects the query and the page fails with a 500.
 * Invalid values are dropped (treated as "no filter"), never passed on.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** A real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-31 and 2026-13-01). */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2999 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export const uuidOrUndefined = (v: unknown) => (isUuid(v) ? v : undefined);
export const isoDateOr = (v: unknown, fallback: string) => (isIsoDate(v) ? v : fallback);

/** A real year-month in YYYY-MM form (rejects e.g. 2026-13 and 2026-00). */
export function isYearMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}$/.test(v) && isIsoDate(`${v}-01`);
}

export const yearMonthOr = (v: unknown, fallback: string) => (isYearMonth(v) ? v : fallback);
