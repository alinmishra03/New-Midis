import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AddChecklistItem, ChecklistItem } from "@/components/crm/recruitment-forms";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, ProgressBar, humanize } from "@/components/crm/ui";
import { requirePermission } from "@/crm/auth/dal";
import { db } from "@/crm/db";
import { employees } from "@/crm/db/schema";
import { formatDate, formatDateShort } from "@/crm/lib/time";
import { onboardingChecklist } from "@/crm/services/recruitment";

export const metadata: Metadata = { title: "Onboarding" };

const ORDER = ["documents", "accounts", "department", "manager", "formalities"] as const;

export default async function OnboardingPage({ params }: PageProps<"/crm/recruitment/onboarding/[employeeId]">) {
  const viewer = await requirePermission("onboarding.manage");
  const { employeeId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) notFound();
  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { firstName: true, lastName: true, joiningDate: true } });
  if (!emp) notFound();
  const items = await onboardingChecklist(viewer, employeeId);
  const done = items.filter((i) => i.completedAt).length;

  return (
    <>
      <PageHeader title={`Onboarding — ${emp.firstName} ${emp.lastName}`} description={`Joining ${formatDate(emp.joiningDate)}`} breadcrumb={[{ label: "Onboarding", href: "/crm/recruitment?tab=onboarding" }]} />
      <Card className="mb-4">
        <CardBody>
          <p className="tabular mb-2 text-sm text-c-muted">
            {done} of {items.length} complete
          </p>
          <ProgressBar value={items.length ? (done / items.length) * 100 : 0} tone={done === items.length ? "success" : "accent"} label="Onboarding progress" />
        </CardBody>
      </Card>
      {items.length === 0 ? (
        <Card>
          <EmptyState title="No checklist yet" />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ORDER.filter((cat) => items.some((i) => i.category === cat)).map((cat) => (
            <Card key={cat}>
              <CardHeader title={humanize(cat)} />
              <CardBody className="space-y-3">
                {items
                  .filter((i) => i.category === cat)
                  .map((i) => (
                    <ChecklistItem key={i.id} id={i.id} done={!!i.completedAt} title={i.title} meta={i.completedAt ? `Done${i.completedBy ? ` by ${i.completedBy}` : ""}` : i.dueDate ? `Due ${formatDateShort(i.dueDate)}` : "No due date"} />
                  ))}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-4">
        <CardHeader title="Add an item" />
        <CardBody>
          <AddChecklistItem employeeId={employeeId} />
        </CardBody>
      </Card>
    </>
  );
}
