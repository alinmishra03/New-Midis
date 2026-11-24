import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/crm/db";
import { employees, leaveRequests, leaveTypes, rolePermissions, roles, users, wfhRequests } from "@/crm/db/schema";
import { audit } from "@/crm/lib/audit";
import { emailLinkBase, passwordChangedEmail, requestDecisionEmail, requestSubmittedEmail, sendEmail, type RequestKind, type SendResult } from "@/crm/lib/email";
import { formatDate, formatDateTime } from "@/crm/lib/time";
import { getCompany } from "./company";
import { managerUserId, userIdsWithPermission } from "./notifications";

/**
 * Workflow emails: password-changed confirmations and leave / work-from-home
 * request, approval and rejection notices. Built on the same sendEmail() as
 * invitations and resets (crm/lib/email.ts).
 *
 * Reliability
 * - Called only AFTER the CRM change has committed, and scheduled with after()
 *   so the user's response never waits on (or fails because of) Resend.
 * - Nothing here throws into the caller; failures are logged by type only and
 *   recorded in the audit log as counts/reasons (never addresses or content).
 * - Duplicates: each message has a stable Resend Idempotency-Key per
 *   (event, record, recipient), and the CRM actions themselves are
 *   single-shot (a request can only be created once for its dates, and only
 *   decided once, guarded by its "pending" status).
 *
 * Privacy / RBAC
 * - Request notices go only to people who can act on the request under the
 *   existing rules: the direct manager when their role holds leave.approve_team
 *   (or leave.manage), and active users holding leave.manage (HR, Super Admin).
 *   The applicant never receives their own approval request.
 * - Decision notices go only to the employee who made the request.
 * - Links point at the normal CRM pages, which require sign-in; no tokens.
 */

type Recipient = { userId: string; email: string; firstName: string };

/** Runs an email job after the response; never throws into the caller. */
export function sendAfterResponse(label: string, job: () => Promise<unknown>) {
  const run = async () => {
    try {
      await job();
    } catch (e) {
      console.error(`[crm email] ${label} failed: ${e instanceof Error ? e.name : "error"}`);
    }
  };
  try {
    after(run);
  } catch {
    // Outside a request scope (scripts/tests): run detached.
    void run();
  }
}

async function activeRecipients(userIds: (string | null | undefined)[]): Promise<Recipient[]> {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))];
  if (!ids.length) return [];
  const rows = await db
    .select({ userId: users.id, email: users.email, firstName: employees.firstName })
    .from(users)
    .leftJoin(employees, eq(employees.userId, users.id))
    .where(and(inArray(users.id, ids), eq(users.status, "active")));
  return rows.map((r) => ({ userId: r.userId, email: r.email, firstName: r.firstName || "there" }));
}

/** Does this (active) user's role allow deciding team leave/WFH? */
async function canApproveTeam(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(rolePermissions, and(eq(rolePermissions.roleId, roles.id), inArray(rolePermissions.permissionKey, ["leave.approve_team", "leave.manage"])))
    .where(and(eq(users.id, userId), eq(users.status, "active"), or(eq(roles.key, "super_admin"), inArray(rolePermissions.permissionKey, ["leave.approve_team", "leave.manage"]))))
    .limit(1);
  return !!row;
}

/** The people who may decide an employee's leave/WFH, minus the applicant. */
export async function requestApprovers(employeeId: string, applicantUserId: string | null): Promise<Recipient[]> {
  const manager = await managerUserId(employeeId);
  const ids = [...(manager && (await canApproveTeam(manager)) ? [manager] : []), ...(await userIdsWithPermission("leave.manage"))].filter((u) => u !== applicantUserId);
  return activeRecipients(ids);
}

function dateRange(start: string, end: string, halfDay?: string | null) {
  const range = start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
  if (halfDay === "first_half") return `${range} (first half)`;
  if (halfDay === "second_half") return `${range} (second half)`;
  return range;
}

const daysLabel = (d: string | number) => {
  const n = Number(d);
  return `${n} day${n === 1 ? "" : "s"}`;
};

const portal = (path: string) => {
  const base = emailLinkBase();
  return base ? `${base}${path}` : null;
};

async function deliver(event: string, entityType: string, entityId: string, actorUserId: string | null, items: { recipient: Recipient; content: { subject: string; text: string; html: string } }[]) {
  const results: SendResult[] = [];
  for (const { recipient, content } of items) {
    results.push(await sendEmail({ to: recipient.email, ...content, idempotencyKey: `crm-${event}-${entityId}-${recipient.userId}` }));
  }
  const sent = results.filter((r) => r.ok).length;
  const reasons: Record<string, number> = {};
  for (const r of results) if (!r.ok) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  await audit({
    actorUserId,
    action: sent === results.length && sent > 0 ? "email.workflow_sent" : "email.workflow_not_sent",
    entityType,
    entityId,
    summary: results.length ? `Email "${event}": ${sent} of ${results.length} sent` : `Email "${event}": no eligible recipient`,
    metadata: { event, recipients: results.length, sent, ...(Object.keys(reasons).length ? { notSent: reasons } : {}), messageIds: results.flatMap((r) => (r.ok ? [r.id] : [])) },
  }).catch(() => undefined);
  return { sent, total: results.length };
}

/* ------------------------------------------------------------ password */

/**
 * Confirms a completed password reset / change to the account's own address.
 * `eventId` makes it idempotent (the consumed token id, or the change timestamp).
 */
export async function emailPasswordChanged(userId: string, method: "reset" | "change", eventId: string) {
  const [recipient] = await activeRecipients([userId]);
  if (!recipient) return { sent: 0, total: 0 };
  const company = await getCompany();
  const content = passwordChangedEmail({
    firstName: recipient.firstName,
    companyName: company.name,
    when: formatDateTime(new Date(), company.timezone),
    method,
    forgotLink: portal("/crm/forgot-password"),
  });
  return deliver(`password-changed-${eventId}`, "user", userId, userId, [{ recipient, content }]);
}

/* ---------------------------------------------------------- leave / WFH */

async function loadRequest(kind: RequestKind, id: string) {
  if (kind === "leave") {
    const [r] = await db
      .select({ employeeId: leaveRequests.employeeId, startDate: leaveRequests.startDate, endDate: leaveRequests.endDate, halfDay: leaveRequests.halfDay, days: leaveRequests.days, reason: leaveRequests.reason, status: leaveRequests.status, approverId: leaveRequests.approverId, decisionComment: leaveRequests.decisionComment, typeName: leaveTypes.name })
      .from(leaveRequests)
      .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
      .where(eq(leaveRequests.id, id));
    return r ?? null;
  }
  const r = await db.query.wfhRequests.findFirst({ where: eq(wfhRequests.id, id) });
  return r ? { ...r, halfDay: null, days: null, typeName: null } : null;
}

/** New request → its approvers (manager with approval rights, HR / Super Admin). */
export async function emailRequestSubmitted(kind: RequestKind, requestId: string, applicantUserId: string) {
  const req = await loadRequest(kind, requestId);
  if (!req || req.status !== "pending") return { sent: 0, total: 0 };
  const [emp, company] = await Promise.all([db.query.employees.findFirst({ where: eq(employees.id, req.employeeId), columns: { firstName: true, lastName: true } }), getCompany()]);
  const employeeName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : "An employee";
  const approvers = await requestApprovers(req.employeeId, applicantUserId);
  const content = requestSubmittedEmail({
    kind,
    employeeName,
    typeName: req.typeName,
    dates: dateRange(req.startDate, req.endDate, req.halfDay),
    days: req.days != null ? daysLabel(req.days) : null,
    reason: req.reason,
    link: portal(kind === "leave" ? "/crm/leave?tab=approvals" : "/crm/wfh?tab=approvals"),
    companyName: company.name,
  });
  return deliver(`${kind}-submitted`, kind, requestId, applicantUserId, approvers.map((recipient) => ({ recipient, content })));
}

/** Approved / rejected → the employee who asked. */
export async function emailRequestDecided(kind: RequestKind, requestId: string, approved: boolean, actorUserId: string) {
  const req = await loadRequest(kind, requestId);
  if (!req || req.status !== (approved ? "approved" : "rejected")) return { sent: 0, total: 0 };
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, req.employeeId), columns: { userId: true } });
  const [recipient] = await activeRecipients([emp?.userId]);
  if (!recipient) return deliver(`${kind}-${approved ? "approved" : "rejected"}`, kind, requestId, actorUserId, []);
  const approver = req.approverId ? await db.query.employees.findFirst({ where: eq(employees.userId, req.approverId), columns: { firstName: true, lastName: true } }) : null;
  const company = await getCompany();
  const content = requestDecisionEmail({
    kind,
    approved,
    firstName: recipient.firstName,
    typeName: req.typeName,
    dates: dateRange(req.startDate, req.endDate, req.halfDay),
    days: req.days != null ? daysLabel(req.days) : null,
    approverName: approver ? `${approver.firstName} ${approver.lastName}`.trim() : "HR",
    comment: req.decisionComment,
    link: portal(kind === "leave" ? "/crm/leave" : "/crm/wfh"),
    companyName: company.name,
  });
  return deliver(`${kind}-${approved ? "approved" : "rejected"}`, kind, requestId, actorUserId, [{ recipient, content }]);
}
