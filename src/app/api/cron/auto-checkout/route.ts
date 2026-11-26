import { createHash, timingSafeEqual } from "node:crypto";
import { runAutoCheckout } from "@/crm/services/auto-checkout";

/**
 * Daily automatic check-out (see services/auto-checkout.ts), called by Vercel
 * Cron (vercel.json) after 19:00 Asia/Kolkata. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`; anything else is refused, and so is
 * every call while CRON_SECRET isn't configured. Safe to call repeatedly.
 *
 * Responds 200 only when every eligible record was handled; 500 if any record
 * (or the whole run) failed, so the failure shows in Vercel's cron logs.
 */
export const maxDuration = 60;

const digest = (s: string) => createHash("sha256").update(s).digest();

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = request.headers.get("authorization") ?? "";
  return timingSafeEqual(digest(given), digest(`Bearer ${secret}`));
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const r = await runAutoCheckout();
    const ok = r.failed.length === 0;
    return Response.json(
      { ok, ran: r.ran, date: r.date, timeZone: r.timeZone, checkedOut: r.checkedOut, skipped: r.skipped.length, failed: r.failed.length, ...(r.ran ? {} : { note: "Before 19:00: nothing to do." }) },
      { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[auto-checkout] run FAILED:", e instanceof Error ? e.message : e);
    return Response.json({ ok: false, error: "Auto check-out failed; nothing was reported as done." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
