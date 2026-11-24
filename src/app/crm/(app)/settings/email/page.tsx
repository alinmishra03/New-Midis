import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestEmailButton } from "@/components/crm/email-test";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { EXPECTED_FROM, EXPECTED_REPLY_TO, emailStatus } from "@/crm/lib/email";

export const metadata: Metadata = { title: "Email" };

/**
 * Super Admin only: shows whether outgoing email (Resend) is configured and
 * lets the admin send a test to the controlled test mailbox. No secret value is
 * ever rendered — only whether each setting is present and valid.
 */
export default async function EmailSettingsPage() {
  const viewer = await requireViewer();
  if (viewer.role.key !== "super_admin") notFound();
  const status = emailStatus();
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-c-border py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-c-muted">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="email" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view"), email: true }} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Outgoing email" description="Sent through Resend from the verified midis.in domain. Settings live in Vercel environment variables." />
          <CardBody>
            <dl>
              {row("Status", status.configured ? <Badge tone="success" dot>Configured</Badge> : <Badge tone="danger" dot>Not configured</Badge>)}
              {row("Environment", status.environment)}
              {row("API key (RESEND_API_KEY)", status.problems.some((p) => p.startsWith("RESEND_API_KEY")) ? <Badge tone="danger">Missing or invalid</Badge> : <Badge tone="success">Set (hidden)</Badge>)}
              {row("Sender (EMAIL_FROM)", status.from === EXPECTED_FROM ? EXPECTED_FROM : <Badge tone="danger">{status.from ? "Not the expected sender" : "Missing"}</Badge>)}
              {row("Reply-to (EMAIL_REPLY_TO)", status.replyTo?.toLowerCase() === EXPECTED_REPLY_TO ? EXPECTED_REPLY_TO : <Badge tone="danger">{status.replyTo ? "Not the expected address" : "Missing"}</Badge>)}
            </dl>
            {status.problems.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[0.8125rem] text-c-danger">
                {status.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[0.8125rem] text-c-muted">{status.deliveryPolicy}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Send a test email" description="Goes only to the reply-to mailbox above. You can't choose another recipient." />
          <CardBody>
            <p className="mb-4 text-[0.8125rem] text-c-muted">
              Emails sent by the portal: account invitations, password reset links (from HR and from &ldquo;Forgot password&rdquo;). In-app notifications are not emailed.
            </p>
            <TestEmailButton disabled={!status.configured} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
