import type { Metadata } from "next";
import { EmployeeForm } from "@/components/crm/employee-forms";
import { Card, CardBody, PageHeader } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";

export const metadata: Metadata = { title: "Add employee" };

export default async function NewEmployeePage() {
  const viewer = await requirePermission("employees.manage");
  const [options, company] = await Promise.all([employeeFormOptions(), getCompany()]);
  return (
    <>
      <PageHeader
        title="Add employee"
        description="Creates their employee record and an invited account. You'll get a one-time activation link to send them."
        breadcrumb={[{ label: "Employees", href: "/crm/employees" }]}
      />
      <Card className="max-w-3xl">
        <CardBody>
          <EmployeeForm options={options} canAssignElevated={can(viewer, "roles.manage")} today={todayIn(company.timezone)} />
        </CardBody>
      </Card>
    </>
  );
}
