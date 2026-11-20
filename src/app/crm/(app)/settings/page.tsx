import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanyForm } from "@/components/crm/settings-forms";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { getCompany } from "@/crm/services/company";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requirePermission("settings.manage", "roles.manage", "audit.view", "users.invite");
  if (!can(viewer, "settings.manage")) redirect(can(viewer, "users.invite", "roles.manage") ? "/crm/settings/users" : "/crm/settings/audit");
  const company = await getCompany();
  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="company" perms={{ settings: true, users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view") }} />
      <Card className="max-w-3xl">
        <CardHeader title="Company information" description="Shown on payslips and reports." />
        <CardBody>
          <CompanyForm values={company} />
        </CardBody>
      </Card>
    </>
  );
}
