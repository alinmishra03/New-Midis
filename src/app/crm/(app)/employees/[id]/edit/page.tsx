import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/crm/employee-forms";
import { Card, CardBody, PageHeader } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions, getEmployeeProfile } from "@/crm/services/employees";

export const metadata: Metadata = { title: "Edit employee" };

export default async function EditEmployeePage({ params }: PageProps<"/crm/employees/[id]/edit">) {
  const viewer = await requirePermission("employees.manage");
  const { id } = await params;
  const [profile, options, company] = await Promise.all([getEmployeeProfile(viewer, id), employeeFormOptions(), getCompany()]);
  if (!profile || !profile.employment) notFound();
  const { basic, employment } = profile;

  return (
    <>
      <PageHeader
        title={`Edit ${basic.fullName}`}
        breadcrumb={[
          { label: "Employees", href: "/crm/employees" },
          { label: basic.fullName, href: `/crm/employees/${basic.id}` },
        ]}
      />
      <Card className="max-w-3xl">
        <CardBody>
          <EmployeeForm
            options={options}
            canAssignElevated={can(viewer, "roles.manage")}
            today={todayIn(company.timezone)}
            values={{
              id: basic.id,
              firstName: basic.firstName,
              lastName: basic.lastName,
              phone: basic.phone,
              departmentId: basic.department?.id,
              designationId: basic.designation?.id,
              managerId: basic.manager?.id,
              workScheduleId: employment.workScheduleId,
              joiningDate: employment.joiningDate,
              employmentType: employment.employmentType,
              employmentStatus: basic.employmentStatus === "exited" ? "active" : basic.employmentStatus,
              workLocation: basic.workLocation,
              skills: basic.skills,
              bio: basic.bio,
              roleKey: employment.account?.roleKey,
            }}
          />
        </CardBody>
      </Card>
    </>
  );
}
