import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { PersonalForm, PhotoUpload } from "@/components/crm/employee-forms";
import { ChangePasswordForm } from "@/components/crm/profile-forms";
import { Avatar, Card, CardBody, CardHeader, DescriptionList, EmptyState, PageHeader, StatusBadge } from "@/components/crm/ui";
import { requireViewer } from "@/crm/auth/dal";
import { formatDate } from "@/crm/lib/time";
import { getEmployeeProfile } from "@/crm/services/employees";

export const metadata: Metadata = { title: "My profile" };

const LINKS = [
  { label: "My attendance", href: "/crm/attendance" },
  { label: "Leave balance & requests", href: "/crm/leave" },
  { label: "Payslips", href: "/crm/payroll" },
  { label: "My tasks", href: "/crm/tasks" },
  { label: "My documents", href: "/crm/documents" },
  { label: "Notifications", href: "/crm/notifications" },
];

export default async function ProfilePage() {
  const viewer = await requireViewer();
  if (!viewer.employee) {
    return (
      <>
        <PageHeader title="My profile" />
        <Card className="mb-6">
          <EmptyState icon={<TriangleAlert />} title="Your account isn't linked to an employee record" description="Ask HR to link it." />
        </Card>
        <Card>
          <CardHeader title="Change password" />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </>
    );
  }
  const profile = (await getEmployeeProfile(viewer, viewer.employee.id))!;
  const { basic, employment, personal } = profile;

  return (
    <>
      <PageHeader title="My profile & settings" description="Keep your personal details up to date. HR manages your employment details." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardBody className="flex flex-col items-center text-center">
              <Avatar name={basic.fullName} photoFileId={basic.photoFileId} size={88} />
              <p className="mt-3 text-lg font-semibold">{basic.fullName}</p>
              <p className="text-sm text-c-muted">{basic.designation?.title ?? "No designation"}</p>
              <div className="mt-2">
                <StatusBadge status={basic.employmentStatus} />
              </div>
              <div className="mt-4">
                <PhotoUpload employeeId={basic.id} />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Employment" description="Managed by HR" />
            <CardBody>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Employee ID", value: basic.employeeCode },
                  { label: "Official email", value: basic.officialEmail },
                  { label: "Department", value: basic.department?.name },
                  { label: "Reporting manager", value: basic.manager?.name },
                  { label: "Joined", value: formatDate(employment?.joiningDate) },
                  { label: "Portal role", value: viewer.role.name },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Quick links" />
            <ul className="divide-y divide-c-border">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-c-surface-2">
                    {l.label} <ArrowRight className="size-4 text-c-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Personal details" description="Visible only to you and HR." />
            <CardBody>{personal && <PersonalForm employeeId={basic.id} values={{ ...personal, phone: basic.phone, skills: basic.skills, bio: basic.bio }} />}</CardBody>
          </Card>
          <Card>
            <CardHeader title="Change password" description="Changing it signs you out on every other device." />
            <CardBody>
              <ChangePasswordForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
