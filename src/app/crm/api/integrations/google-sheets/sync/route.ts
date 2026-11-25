import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/crm/db";
import { sheetsStatus } from "@/crm/integrations/google-sheets/client";
import { runSheetSync } from "@/crm/integrations/google-sheets/sync";

/**
 * Daily Google Sheets sync, called by Vercel Cron (vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; anything else is refused. It imports
 * only when a Super Admin has turned automatic import on; otherwise it just
 * checks the sheet (nothing written to projects or tasks).
 */
export const maxDuration = 300;

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < 16) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.trim().length < 16) {
    return NextResponse.json({ ok: false, message: "Not configured." }, { status: 503 });
  }
  if (!authorised(request)) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  if (!sheetsStatus().configured) return NextResponse.json({ ok: false, message: "Google Sheets isn't configured." }, { status: 503 });

  const settings = await db.query.sheetSyncSettings.findFirst();
  const mode = settings?.autoImport ? "import" : "check";
  try {
    const r = await runSheetSync({ mode, trigger: "scheduled", actorUserId: null });
    return NextResponse.json(r.ok ? { ok: true, mode, counts: r.counts } : { ok: false, mode, message: r.error }, { status: r.ok ? 200 : 502 });
  } catch (e) {
    // e.g. another sync is running: the next scheduled run tries again.
    return NextResponse.json({ ok: false, mode, message: e instanceof Error ? e.message : "Sync failed." }, { status: 409 });
  }
}
