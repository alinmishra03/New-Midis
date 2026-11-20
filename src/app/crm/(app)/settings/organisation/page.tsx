import type { Metadata } from "next";
import { DepartmentDialog, DesignationDialog } from "@/components/crm/settings-forms";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardHeader, PageHeader, Table, TBody, THead } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { listDepartments, listDesignations } from "@/crm/services/settings";

export const metadata: Metadata = { title: "Departments & designations" };

export default async function OrganisationPage() {
  const viewer = await requirePermission("settings.manage");
  const [depts, desigs] = await Promise.all([listDepartments(), listDesignations()]);
  const deptOptions = depts.filter((d) => d.isActive).map((d) => ({ value: d.id, label: d.name }));
  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="organisation" perms={{ settings: true, users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view") }} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Departments" action={<DepartmentDialog />} />
          <Table>
            <THead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>People</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {depts.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.name} {!d.isActive && <Badge>Inactive</Badge>}
                  </td>
                  <td className="font-mono text-xs">{d.code}</td>
                  <td className="tabular">{d.employees}</td>
                  <td className="text-right">
                    <DepartmentDialog values={d} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
        <Card>
          <CardHeader title="Designations" action={<DesignationDialog departments={deptOptions} />} />
          <Table>
            <THead>
              <tr>
                <th>Title</th>
                <th>Department</th>
                <th>Level</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {desigs.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.title} {!d.isActive && <Badge>Inactive</Badge>}
                  </td>
                  <td className="text-c-muted">{d.department ?? "Any"}</td>
                  <td className="tabular">{d.level}</td>
                  <td className="text-right">
                    <DesignationDialog departments={deptOptions} values={d} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
