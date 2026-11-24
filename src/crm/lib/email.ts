import "server-only";

/**
 * Transactional email through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Server-only: the API key never reaches the browser. Configuration comes from
 * environment variables set in Vercel:
 *   RESEND_API_KEY   — secret; never logged, returned or rendered
 *   EMAIL_FROM       — must be "MIDIS CRM <connect@midis.in>"
 *   EMAIL_REPLY_TO   — must be connect@midis.in; also the ONLY recipient of the Super Admin test email
 *
 * Safety rules
 * - sendEmail() never throws. Callers send AFTER their database work has
 *   committed and treat delivery as best-effort, so an email problem can never
 *   undo or half-complete an account, invitation or password reset.
 * - Outside Vercel production, mail is delivered ONLY to the controlled test
 *   mailbox (EMAIL_REPLY_TO): a message for anyone else is REDIRECTED there,
 *   marked "[Preview]", and never reaches its original recipient. Preview and
 *   local testing can therefore never email real employees.
 * - In production, reserved/test domains (example.*, *.invalid, *.test,
 *   *.localhost) are never mailed.
 * - Links in emails are built from CRM_BASE_URL (or the deployment's own
 *   VERCEL_URL outside production), never from request headers.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;
export const EXPECTED_FROM = "MIDIS CRM <connect@midis.in>";
export const EXPECTED_REPLY_TO = "connect@midis.in";
const SENDING_DOMAIN = "midis.in";

const EMAIL_RE = /^[^\s@<>()",;:]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const RESERVED_RE = /@(?:[^@]*\.)?(?:example\.(?:com|org|net)|example|invalid|test|localhost)$|\.(?:invalid|test|localhost|example)$/i;

export type EmailConfig = { apiKey: string; from: string; replyTo: string };
export type EmailStatus = {
  configured: boolean;
  /** Safe, human-readable problems (never contain secret values). */
  problems: string[];
  from: string | null;
  replyTo: string | null;
  environment: "production" | "preview" | "development";
  /** Where workflow emails go in this environment. */
  deliveryPolicy: string;
};
export type SendResult =
  | { ok: true; id: string; redirected?: boolean }
  | { ok: false; reason: "not_configured" | "suppressed" | "invalid_recipient" | "rejected" | "unavailable"; message: string };

export function environment(): EmailStatus["environment"] {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL) return "preview";
  return "development";
}

function readConfig(): { config: EmailConfig | null; problems: string[]; from: string | null; replyTo: string | null } {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() || null;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || null;
  const problems: string[] = [];
  if (!apiKey) problems.push("RESEND_API_KEY is not set.");
  else if (!/^re_[A-Za-z0-9_-]{16,}$/.test(apiKey)) problems.push("RESEND_API_KEY doesn't look like a Resend API key (expected re_…).");
  if (!from) problems.push("EMAIL_FROM is not set.");
  else if (from !== EXPECTED_FROM) problems.push(`EMAIL_FROM must be exactly "${EXPECTED_FROM}".`);
  if (!replyTo) problems.push("EMAIL_REPLY_TO is not set.");
  else if (replyTo.toLowerCase() !== EXPECTED_REPLY_TO) problems.push(`EMAIL_REPLY_TO must be ${EXPECTED_REPLY_TO}.`);
  const fromAddress = from?.match(/<([^>]+)>$/)?.[1] ?? from ?? "";
  if (from && !fromAddress.toLowerCase().endsWith(`@${SENDING_DOMAIN}`)) problems.push(`EMAIL_FROM must use the verified domain ${SENDING_DOMAIN}.`);
  return { config: problems.length ? null : { apiKey, from: from!, replyTo: replyTo!.toLowerCase() }, problems, from, replyTo };
}

export function emailStatus(): EmailStatus {
  const { config, problems, from, replyTo } = readConfig();
  const env = environment();
  return {
    configured: !!config,
    problems,
    from,
    replyTo,
    environment: env,
    deliveryPolicy:
      env === "production"
        ? "Production: account, password and leave/WFH emails go to the employee or approver concerned."
        : "Not production: every email is redirected to the test mailbox (EMAIL_REPLY_TO) and marked [Preview]; no other recipient is ever emailed.",
  };
}

/** The controlled test mailbox (EMAIL_REPLY_TO), or null when email isn't configured. */
export function testRecipient(): string | null {
  return readConfig().config?.replyTo ?? null;
}

/** Base URL for links inside emails. Never derived from request headers. */
export function emailLinkBase(): string | null {
  const base = process.env.CRM_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  if (environment() !== "production" && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (environment() === "development") return "http://localhost:3000";
  return null;
}

/** The one-time set-password link for a token (same URL shape as tokenUrl()). */
export function emailTokenLink(token: string): string | null {
  const base = emailLinkBase();
  return base ? `${base}/crm/set-password?token=${encodeURIComponent(token)}` : null;
}

/** Deliver one message. Never throws; returns a safe result for the caller to act on. */
export async function sendEmail(msg: { to: string; subject: string; text: string; html: string; idempotencyKey?: string }): Promise<SendResult> {
  try {
    const { config } = readConfig();
    if (!config) return { ok: false, reason: "not_configured", message: "Email isn't configured." };
    const original = msg.to.trim().toLowerCase();
    if (!EMAIL_RE.test(original)) return { ok: false, reason: "invalid_recipient", message: "That email address isn't valid." };
    // Not production: the message goes to the test mailbox INSTEAD of its recipient (never in addition).
    const redirected = environment() !== "production" && original !== config.replyTo;
    if (!redirected && RESERVED_RE.test(original)) return { ok: false, reason: "suppressed", message: "Test/reserved address; not emailed." };
    const to = redirected ? config.replyTo : original;
    const subject = redirected ? `[Preview] ${msg.subject}` : msg.subject;
    const note = "Preview copy: in production this email goes to the employee or approver concerned. It was redirected to the test mailbox.";
    const text = redirected ? `${note}\n\n${msg.text}` : msg.text;
    const html = redirected ? msg.html.replace(/<body([^>]*)>/, `<body$1><p style="margin:0;padding:10px 16px;background:#fef3c7;font:13px Arial,sans-serif;color:#78350f">${note}</p>`) : msg.html;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          ...(msg.idempotencyKey ? { "Idempotency-Key": msg.idempotencyKey.slice(0, 256) } : {}),
        },
        body: JSON.stringify({ from: config.from, to: [to], reply_to: config.replyTo, subject, text, html }),
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timer);
    }
    let body: { id?: unknown; name?: unknown; message?: unknown } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      body = {};
    }
    if (res.ok && typeof body.id === "string") return redirected ? { ok: true, id: body.id, redirected } : { ok: true, id: body.id };
    // Resend error bodies carry a type name and a message; neither contains our key. Log type + status only.
    const name = typeof body.name === "string" ? body.name.slice(0, 60) : "unknown_error";
    console.error(`[crm email] Resend rejected the message: HTTP ${res.status} ${name}`);
    if (res.status === 429 || res.status >= 500) return { ok: false, reason: "unavailable", message: "The email service is temporarily unavailable." };
    return { ok: false, reason: "rejected", message: `The email service rejected the message (${name}).` };
  } catch (e) {
    const aborted = (e as { name?: string })?.name === "AbortError";
    console.error(`[crm email] ${aborted ? "timed out" : "request failed"}`);
    return { ok: false, reason: "unavailable", message: aborted ? "The email service didn't respond in time." : "The email service couldn't be reached." };
  }
}

/* ------------------------------------------------------------------ templates */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Detail = [label: string, value: string | null | undefined];

function layout(title: string, paragraphs: string[], button?: { label: string; href: string } | null, footnote?: string, details: Detail[] = []) {
  const rows = details.filter((d): d is [string, string] => !!d[1]?.trim());
  const table = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 16px;border-collapse:collapse;font-size:14px">${rows
        .map(([k, v]) => `<tr><td style="padding:7px 14px 7px 0;color:#78716c;vertical-align:top;white-space:nowrap;border-bottom:1px solid #f5f5f4">${esc(k)}</td><td style="padding:7px 0;vertical-align:top;border-bottom:1px solid #f5f5f4;white-space:pre-wrap">${esc(v)}</td></tr>`)
        .join("")}</table>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e7e5e4">
<tr><td style="height:6px;background:#f08a1c;border-radius:12px 12px 0 0"></td></tr>
<tr><td style="padding:28px 32px">
<p style="margin:0 0 4px;font-size:13px;color:#78716c">MIDIS Employee Portal</p>
<h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${esc(p)}</p>`).join("\n")}
${table}
${button ? `<p style="margin:22px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#f08a1c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${esc(button.label)}</a></p>
<p style="margin:0 0 14px;font-size:12px;color:#78716c;word-break:break-all">If the button doesn't work, open this address: ${esc(button.href)}</p>` : ""}
${footnote ? `<p style="margin:18px 0 0;font-size:12px;color:#78716c">${esc(footnote)}</p>` : ""}
</td></tr></table>
<p style="font-size:11px;color:#a8a29e;margin:16px 0 0">Sent by MIDIS · Reply to this email to reach ${esc(EXPECTED_REPLY_TO)}</p>
</td></tr></table></body></html>`;
  const text = [title, "", ...paragraphs, ...(rows.length ? ["", ...rows.map(([k, v]) => `${k}: ${v}`)] : []), ...(button ? ["", `${button.label}: ${button.href}`] : []), ...(footnote ? ["", footnote] : [])].join("\n");
  return { html, text };
}

export function invitationEmail(p: { firstName: string; link: string; companyName: string }) {
  const { html, text } = layout(
    `Welcome to ${p.companyName}`,
    [`Hi ${p.firstName},`, `An account has been created for you on the ${p.companyName} employee portal. Set your password to activate it.`, "This link works once and expires in 7 days."],
    { label: "Set your password", href: p.link },
    "If you weren't expecting this, you can ignore this email. Never share this link with anyone.",
  );
  return { subject: `Activate your ${p.companyName} employee portal account`, html, text };
}

export function passwordResetEmail(p: { firstName: string; link: string; companyName: string }) {
  const { html, text } = layout(
    "Reset your password",
    [`Hi ${p.firstName},`, `We received a request to reset your ${p.companyName} employee portal password.`, "This link works once and expires in 1 hour. Using it signs you out of every other device."],
    { label: "Choose a new password", href: p.link },
    "If you didn't ask for this, ignore this email — your password stays the same. Never share this link with anyone.",
  );
  return { subject: `Reset your ${p.companyName} employee portal password`, html, text };
}

export function testEmail(p: { environment: string; companyName: string }) {
  const { html, text } = layout(
    "Email delivery test",
    [`This is a test email from the ${p.companyName} employee portal (${p.environment}).`, "If you can read this, Resend is configured correctly for the CRM. No action is needed."],
  );
  return { subject: `[Test] ${p.companyName} employee portal email`, html, text };
}

/** One line, no control characters, bounded length (names come from user-entered data). */
const subjectLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
const link = (href: string | null, label: string) => (href ? { label, href } : null);

export function passwordChangedEmail(p: { firstName: string; companyName: string; when: string; method: "reset" | "change"; forgotLink: string | null }) {
  const { html, text } = layout(
    "Your password was changed",
    [
      `Hi ${p.firstName},`,
      `The password for your ${p.companyName} employee portal account was ${p.method === "reset" ? "reset using a one-time link" : "changed from your profile"} on ${p.when}. Every other device has been signed out.`,
      "If this was you, no action is needed.",
      "If it wasn't you, reset your password straight away and tell HR, or reply to this email.",
    ],
    link(p.forgotLink, "Reset my password"),
    "For your security this email never contains your password or a sign-in link.",
  );
  return { subject: subjectLine(`Your ${p.companyName} employee portal password was changed`), html, text };
}

export type RequestKind = "leave" | "wfh";
const kindLabel = (k: RequestKind, typeName?: string | null) => (k === "leave" ? typeName || "Leave" : "Work from home");

/** To an approver (manager/HR): a new leave or WFH request is waiting. */
export function requestSubmittedEmail(p: {
  kind: RequestKind;
  employeeName: string;
  typeName?: string | null;
  dates: string;
  days?: string | null;
  reason: string | null;
  link: string | null;
  companyName: string;
}) {
  const what = kindLabel(p.kind, p.typeName);
  const { html, text } = layout(
    `New ${p.kind === "leave" ? "leave" : "work-from-home"} request`,
    [`${p.employeeName} has submitted a request that needs your review.`],
    link(p.link, "Review in the portal"),
    "You're receiving this because you can approve this request. Sign in to approve or reject it.",
    [["Employee", p.employeeName], ["Type", what], ["Dates", p.dates], ["Days", p.days], ["Reason", p.reason]],
  );
  return { subject: subjectLine(`${what} request from ${p.employeeName} · ${p.dates}`), html, text };
}

/** To the employee: their leave or WFH request was approved or rejected. */
export function requestDecisionEmail(p: {
  kind: RequestKind;
  approved: boolean;
  firstName: string;
  typeName?: string | null;
  dates: string;
  days?: string | null;
  approverName: string;
  comment: string | null;
  link: string | null;
  companyName: string;
}) {
  const what = kindLabel(p.kind, p.typeName);
  const status = p.approved ? "approved" : "rejected";
  const { html, text } = layout(
    `Your ${p.kind === "leave" ? "leave" : "work-from-home"} request was ${status}`,
    [`Hi ${p.firstName},`, `Your ${what} request for ${p.dates} was ${status} by ${p.approverName}.`],
    link(p.link, "View your request"),
    undefined,
    [["Type", what], [p.approved ? "Approved dates" : "Requested dates", p.dates], ["Days", p.days], [p.approved ? "Approved by" : "Rejected by", p.approverName], [p.approved ? "Note" : "Reason", p.comment]],
  );
  return { subject: subjectLine(`${what} ${status}: ${p.dates}`), html, text };
}
