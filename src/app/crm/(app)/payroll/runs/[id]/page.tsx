import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Banknote, CircleDot, Download, FileText, RefreshCw, Wallet } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { Card, CardHeader, EmptyState, Notice, PageHeader, PersonCell, StatCard, StatusBadge, Table, TBody, THead, buttonClass } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { getRun } from "@/crm/services/payroll";
import { approveRunAction, generateRunAction, markPaidAction } from "../../actions";

export const metadata: Metadata = { title: "Payroll run" };

const money = (v: string | number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v));

export default async function RunPage({ params }: PageProps<"/crm/payroll/runs/[id]">) {
  const viewer = await requirePermission("payroll.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getRun(viewer, id);
  if (!data) notFound();
  const { run, slips } = data;
  const company = await getCompany();
  const label = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(run.year, run.month - 1, 1)));
  const sum = (k: "gross" | "deductions" | "net") => slips.reduce((t, s) => t + Number(s[k]), 0);
  const generatedByMe = run.createdById === viewer.userId && viewer.role.key !== "super_admin";

  return (
    <>
      <PageHeader
        title={`Payroll — ${label}`}
        breadcrumb={[{ label: "Payroll runs", href: "/crm/payroll?tab=runs" }]}
        description={
          run.status === "draft"
            ? `Draft. ${company.payroll.lossOfPayEnabled ? "Loss-of-pay and part-month proration are on." : "Loss-of-pay and proration are off: everyone with a structure gets their full monthly salary."}`
            : `Approved ${run.approvedAt ? formatDateTime(run.approvedAt, company.timezone) : ""}${data.approverEmail ? ` by ${data.approverEmail}` : ""}.`
        }
        actions={
          <>
            <a href={`/crm/api/payroll/runs/${run.id}/export`} className={buttonClass("secondary")}>
              <Download /> Export CSV
            </a>
            {run.status === "draft" && can(viewer, "payroll.manage") && (
              <ConfirmAction action={generateRunAction} fields={{ id: run.id }} label={slips.length ? "Regenerate" : "Generate payslips"} icon={<RefreshCw />} size="md" variant={slips.length ? "secondary" : "primary"} title={slips.length ? "Regenerate all payslips?" : "Generate payslips?"} description="Uses each employee's current salary structure and the month's approved adjustments. Existing draft payslips are replaced." confirmLabel="Generate" />
            )}
            {run.status === "draft" && can(viewer, "payroll.approve") && slips.length > 0 && !generatedByMe && (
              <ConfirmAction action={approveRunAction} fields={{ id: run.id }} label="Approve payroll" icon={<BadgeCheck />} size="md" variant="primary" title={`Approve payroll for ${label}?`} description={`${slips.length} payslips, net ${money(sum("net"))}. Employees will be able to see their payslips.`} confirmLabel="Approve" />
            )}
            {run.status === "approved" && can(viewer, "payroll.approve") && (
              <ConfirmAction action={markPaidAction} fields={{ id: run.id }} label="Mark as paid" icon={<Banknote />} size="md" title="Mark this payroll as paid?" confirmLabel="Mark paid" />
            )}
          </>
        }
      />
      {run.status === "draft" && generatedByMe && slips.length > 0 && <Notice tone="warning" className="mb-4">You generated this run, so someone else with approval rights must approve it.</Notice>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Status" value={<StatusBadge status={run.status} />} icon={<CircleDot />} />
        <StatCard label="Payslips" value={slips.length} icon={<FileText />} />
        <StatCard label="Gross" value={money(sum("gross"))} icon={<Wallet />} />
        <StatCard label="Net pay" value={money(sum("net"))} tone="success" icon={<Banknote />} />
      </div>
      <Card>
        <CardHeader title="Payslips" />
        {slips.length ? (
          <Table>
            <THead>
              <tr>
                <th>Employee</th>
                <th className="hidden sm:table-cell">Paid days</th>
                <th>Gross</th>
                <th className="hidden md:table-cell">Deductions</th>
                <th>Net</th>
                <th className="text-right">
                  <span className="sr-only">Payslip</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {slips.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/crm/payroll?tab=salaries&employee=${s.employeeId}`}>
                      <PersonCell name={`${s.firstName} ${s.lastName}`} sub={s.code} photoFileId={s.photoFileId} />
                    </Link>
                  </td>
                  <td className="tabular hidden sm:table-cell">
                    {Number(s.paidDays)}/{s.workingDays}
                  </td>
                  <td className="tabular">{money(s.gross)}</td>
                  <td className="tabular hidden md:table-cell">{money(s.deductions)}</td>
                  <td className="tabular font-medium">{money(s.net)}</td>
                  <td className="text-right">
                    <a href={`/crm/api/payslips/${s.id}`} target="_blank" rel="noreferrer" className={buttonClass("ghost", "sm")}>
                      <FileText /> PDF
                    </a>
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<FileText />} title="No payslips generated yet" description="Generate them from current salary structures." />
        )}
      </Card>
    </>
  );
}
