import type { Metadata } from "next";
import Link from "next/link";
import { NewRoleDialog, RolePermissionsForm } from "@/components/crm/settings-forms";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { listRolesWithPermissions, permissionCatalogue } from "@/crm/services/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Roles & permissions" };

export default async function RolesPage({ searchParams }: PageProps<"/crm/settings/roles">) {
  const viewer = await requirePermission("roles.manage");
  const sp = await searchParams;
  const [roles, catalogue] = await Promise.all([listRolesWithPermissions(), permissionCatalogue()]);
  const selected = roles.find((r) => r.id === sp.role) ?? roles.find((r) => r.key === "employee") ?? roles[0]!;

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." actions={<NewRoleDialog />} />
      <SettingsNav active="roles" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: true, audit: can(viewer, "audit.view"), email: viewer.role.key === "super_admin" }} />
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <ul className="p-2">
            {roles.map((r) => (
              <li key={r.id}>
                <Link href={`/crm/settings/roles?role=${r.id}`} aria-current={r.id === selected.id ? "page" : undefined} className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", r.id === selected.id ? "bg-c-accent-soft font-medium" : "text-c-muted hover:bg-c-hover hover:text-c-fg")}>
                  {r.name}
                  <span className="tabular text-xs text-c-subtle">{r.users}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {selected.name} {selected.isSystem && <Badge>System role</Badge>}
              </span>
            }
            description={`${selected.description ?? ""} Everyone always has access to their own records; these permissions add access beyond that.`}
          />
          <CardBody>
            <RolePermissionsForm key={selected.id} roleId={selected.id} locked={selected.key === "super_admin"} granted={[...selected.permissions]} catalogue={catalogue} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
