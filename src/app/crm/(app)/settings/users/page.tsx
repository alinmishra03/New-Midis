import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { KeyRound } from "lucide-react";
import { AccessLinkButton } from "@/components/crm/employee-forms";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardHeader, EmptyState, PageHeader, PersonCell, StatusBadge, Table, TBody, THead, Tabs } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { db } from "@/crm/db";
import { employees, passwordResetRequests, roles, users } from "@/crm/db/schema";
import { formatDateTime, formatRelative } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";

export const metadata: Metadata = { title: "Users & access" };

const ORDINARY = ["employee", "manager"];

export default async function UsersPage({ searchParams }: PageProps<"/crm/settings/users">) {
  const viewer = await requirePermission("users.invite", "roles.manage");
  const sp = await searchParams;
  const tab = sp.tab === "requests" ? "requests" : "accounts";
  const company = await getCompany();
  const superAdmin = can(viewer, "roles.manage");

  const accounts = await db
    .select({
      userId: users.id,
      email: users.email,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      lockedUntil: users.lockedUntil,
      role: roles.name,
      roleKey: roles.key,
      employeeId: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      photoFileId: employees.photoFileId,
    })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(employees, eq(employees.userId, users.id))
    .orderBy(asc(users.status), asc(employees.firstName));

  const requests = await db
    .select({ id: passwordResetRequests.id, status: passwordResetRequests.status, createdAt: passwordResetRequests.createdAt, userId: users.id, email: users.email, userStatus: users.status, roleKey: roles.key, firstName: employees.firstName, lastName: employees.lastName, photoFileId: employees.photoFileId })
    .from(passwordResetRequests)
    .innerJoin(users, eq(users.id, passwordResetRequests.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(employees, eq(employees.userId, users.id))
    .orderBy(asc(passwordResetRequests.status), desc(passwordResetRequests.createdAt))
    .limit(100);
  const pending = requests.filter((r) => r.status === "pending").length;
  const canIssue = (roleKey: string, userId: string) => userId !== viewer.userId && (superAdmin || ORDINARY.includes(roleKey));

  return (
    <>
      <PageHeader title="Settings" description="Every portal account. Accounts are created from Employees → Add employee; nobody can register themselves." />
      <SettingsNav active="users" perms={{ settings: can(viewer, "settings.manage"), users: true, roles: superAdmin, audit: can(viewer, "audit.view") }} />
      <Tabs
        active={tab}
        tabs={[
          { key: "accounts", label: "Accounts", href: "/crm/settings/users", count: accounts.length },
          { key: "requests", label: "Password reset requests", href: "/crm/settings/users?tab=requests", count: pending },
        ]}
      />
      {tab === "accounts" ? (
        <Card>
          <Table>
            <THead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Last sign-in</th>
                <th className="text-right">Access</th>
              </tr>
            </THead>
            <TBody>
              {accounts.map((a) => (
                <tr key={a.userId}>
                  <td>
                    <PersonCell name={a.firstName ? `${a.firstName} ${a.lastName}` : a.email} sub={a.email} photoFileId={a.photoFileId} href={a.employeeId ? `/crm/employees/${a.employeeId}` : undefined} />
                  </td>
                  <td>{a.role}</td>
                  <td>
                    <StatusBadge status={a.status} />
                    {a.lockedUntil && a.lockedUntil > new Date() && <Badge tone="danger" className="ml-1.5">Locked</Badge>}
                  </td>
                  <td className="hidden text-c-muted md:table-cell" title={a.lastLoginAt ? formatDateTime(a.lastLoginAt, company.timezone) : undefined}>
                    {a.lastLoginAt ? formatRelative(a.lastLoginAt) : "Never"}
                  </td>
                  <td className="text-right">{a.status !== "disabled" && canIssue(a.roleKey, a.userId) && <AccessLinkButton userId={a.userId} invited={a.status === "invited"} />}</td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Forgot-password requests" description="Employees who used “Forgot password?”. Create a one-time reset link and send it to them directly." />
          {requests.length ? (
            <Table>
              <THead>
                <tr>
                  <th>Person</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </THead>
              <TBody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <PersonCell name={r.firstName ? `${r.firstName} ${r.lastName}` : r.email} sub={r.email} photoFileId={r.photoFileId} />
                    </td>
                    <td className="text-c-muted">{formatRelative(r.createdAt)}</td>
                    <td>
                      <StatusBadge status={r.status} label={r.status === "approved" ? "Link issued" : undefined} />
                    </td>
                    <td className="text-right">
                      {r.status === "pending" && r.userStatus === "active" && (canIssue(r.roleKey, r.userId) ? <AccessLinkButton userId={r.userId} invited={false} /> : <span className="text-xs text-c-subtle">Needs a Super Admin</span>)}
                    </td>
                  </tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={<KeyRound />} title="No reset requests" />
          )}
        </Card>
      )}
    </>
  );
}
