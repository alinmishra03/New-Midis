/**
 * Date and time in the company timezone.
 *
 * Instants are stored in UTC. Business questions ("what day is it?", "was
 * 09:20 late?") are answered in the company's configured timezone, never the
 * server's — Vercel runs in UTC, which would put an Indian check-in at 01:00
 * on the previous day. Dates are passed around as "YYYY-MM-DD" strings,
 * which is how Postgres `date` columns arrive, so no Date object ever
 * smuggles in a timezone.
 *
 * Pure functions, safe on client and server.
 */

export type ISODate = string; // YYYY-MM-DD

const pad = (n: number) => String(n).padStart(2, "0");

function parts(instant: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const out: Record<string, string> = {};
  for (const p of f.formatToParts(instant)) out[p.type] = p.value;
  return out;
}

/** The calendar date of an instant in a timezone. */
export function zonedDate(instant: Date, timeZone: string): ISODate {
  const p = parts(instant, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Minutes since local midnight of an instant in a timezone. */
export function zonedMinutes(instant: Date, timeZone: string): number {
  const p = parts(instant, timeZone);
  return Number(p.hour) * 60 + Number(p.minute);
}

/** Offset of a timezone from UTC at an instant, in minutes (e.g. +330 for IST). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const p = parts(instant, timeZone);
  const asUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** The UTC instant for a local wall-clock date + "HH:MM" in a timezone. */
export function zonedToInstant(date: ISODate, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  // Two passes handle DST transitions in zones that have them.
  let instant = new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000);
  instant = new Date(guess.getTime() - offsetMinutes(instant, timeZone) * 60000);
  return instant;
}

export function todayIn(timeZone: string): ISODate {
  return zonedDate(new Date(), timeZone);
}

export function toISODate(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(s: ISODate): number {
  const w = parseISODate(s).getUTCDay();
  return w === 0 ? 7 : w;
}

export function daysBetweenInclusive(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function startOfMonth(s: ISODate): ISODate {
  return `${s.slice(0, 7)}-01`;
}

export function endOfMonth(s: ISODate): ISODate {
  const [y, m] = s.split("-").map(Number) as [number, number];
  return toISODate(new Date(Date.UTC(y, m, 0)));
}

/** Monday of the ISO week containing `s`. */
export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, 1 - isoWeekday(s));
}

export function minutesFromHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

export function formatMinutes(total: number): string {
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(Math.round(total));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  return `${sign}${h}h ${pad(m)}m`;
}

/* ---------------------------------------------------------------- display */

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const DATE_SHORT_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const WEEKDAY_FMT = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });
const MONTH_FMT = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

/** "20 Nov 2026" for an ISO date. */
export function formatDate(s: ISODate | null | undefined): string {
  return s ? DATE_FMT.format(parseISODate(s)) : "—";
}
export function formatDateShort(s: ISODate): string {
  return DATE_SHORT_FMT.format(parseISODate(s));
}
export function formatWeekday(s: ISODate): string {
  return WEEKDAY_FMT.format(parseISODate(s));
}
export function formatMonth(s: ISODate): string {
  return MONTH_FMT.format(parseISODate(s));
}

/** "09:42" for an instant in the company timezone. */
export function formatTime(instant: Date | null | undefined, timeZone: string): string {
  if (!instant) return "—";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(
    instant,
  );
}

/** "20 Nov 2026, 09:42" for an instant in the company timezone. */
export function formatDateTime(instant: Date | null | undefined, timeZone: string): string {
  if (!instant) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(instant);
}

/** "3 hours ago" style relative time. */
export function formatRelative(instant: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - instant.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return DATE_FMT.format(instant);
}

/** Next occurrence (today or later) of a month-day, for birthdays and anniversaries. */
export function nextAnniversary(dateOfEvent: ISODate, today: ISODate): { date: ISODate; years: number } {
  const [ey, em, ed] = dateOfEvent.split("-").map(Number) as [number, number, number];
  const ty = Number(today.slice(0, 4));
  const build = (y: number) => {
    // 29 Feb falls back to 28 Feb in non-leap years.
    const last = new Date(Date.UTC(y, em, 0)).getUTCDate();
    return `${y}-${pad(em)}-${pad(Math.min(ed, last))}`;
  };
  let date = build(ty);
  let y = ty;
  if (date < today) {
    y = ty + 1;
    date = build(y);
  }
  return { date, years: y - ey };
}
