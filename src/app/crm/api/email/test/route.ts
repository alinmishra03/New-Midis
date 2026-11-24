import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getViewer } from "@/crm/auth/dal";
import { db } from "@/crm/db";
import { auditLogs } from "@/crm/db/schema";
import { audit } from "@/crm/lib/audit";
import { emailStatus, sendEmail, testEmail, testRecipient } from "@/crm/lib/email";
import { getCompany } from "@/crm/services/company";

/**
 * Super Admin only: sends ONE test email to the controlled test mailbox
 * (EMAIL_REPLY_TO). There is deliberately no recipient parameter — the request
 * body is ignored — so this can never be used to email anyone else.
 * Same-origin only, at most one test per minute per admin, audit-logged.
 */
const COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && !!host && new URL(origin).host === host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ ok: false, message: "Your session has expired. Please sign in again." }, { status: 401 });
  // Not found rather than forbidden, like every other restricted CRM page.
  if (viewer.role.key !== "super_admin") return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  const status = emailStatus();
  const to = testRecipient();
  if (!status.configured || !to) {
    return NextResponse.json({ ok: false, reason: "not_configured", message: "Email isn't configured.", problems: status.problems }, { status: 503 });
  }

  const recent = await db.query.auditLogs.findFirst({
    where: and(eq(auditLogs.action, "email.test"), eq(auditLogs.actorUserId, viewer.userId), gt(auditLogs.createdAt, new Date(Date.now() - COOLDOWN_MS))),
    columns: { id: true },
  });
  if (recent) return NextResponse.json({ ok: false, reason: "cooldown", message: "Please wait a minute before sending another test email." }, { status: 429 });

  const company = await getCompany();
  const result = await sendEmail({ to, ...testEmail({ environment: status.environment, companyName: company.name }) });
  await audit({
    actorUserId: viewer.userId,
    action: "email.test",
    entityType: "email",
    entityId: null,
    summary: result.ok ? "Sent a test email to the configured test mailbox" : `Test email not sent (${result.reason})`,
    metadata: result.ok ? { provider: "resend", messageId: result.id } : { reason: result.reason },
  });
  return result.ok
    ? NextResponse.json({ ok: true, id: result.id, message: "Accepted by Resend for delivery to the test mailbox." })
    : NextResponse.json({ ok: false, reason: result.reason, message: result.message }, { status: result.reason === "unavailable" ? 502 : 422 });
}
