import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { BarList } from "@/components/crm/charts";
import { inputClass } from "@/components/crm/forms";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard, Table, TBody, THead, buttonClass, withParams } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { addDays, startOfMonth, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { availableReports, buildReport, type ReportKey } from "@/crm/services/reports";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

const pick = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function ReportsPage({ searchParams }: PageProps<"/crm/reports">) {
  const viewer = await requirePermission("reports.view_team", "reports.view_all", "payroll.view");
  const sp = await searchParams;
  const company = await getCompany();
  const today = todayIn(company.timezone);
  const reports = availableReports(viewer);
  const key = (reports.some((r) => r.key === sp.r) ? sp.r : reports[0]!.key) as ReportKey;
  const date = (v: string | undefined, d: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : d);
  const filters = {
    from: date(pick(sp.from), key === "payroll" ? addDays(today, -365) : startOfMonth(today)),
    to: date(pick(sp.to), today),
    departmentId: pick(sp.department),
  };
  const [report, options] = await Promise.all([buildReport(viewer, key, filters), employeeFormOptions()]);
  const params = { r: key, from: filters.from, to: filters.to, department: filters.departmentId };
  const exportBase = `/crm/api/reports/${key}`;

  return (
    <>
      <PageHeader
        title="Reports"
        description={can(viewer, "reports.view_all") ? "Company-wide reports with CSV and PDF export." : "Reports for your team."}
        actions={
          <>
            <a href={withParams(exportBase, { from: filters.from, to: filters.to, department: filters.departmentId }, {})} className={buttonClass("secondary")}>
              <Download /> CSV
            </a>
            <a href={withParams(exportBase, { from: filters.from, to: filters.to, department: filters.departmentId }, { format: "pdf" })} className={buttonClass("secondary")}>
              <FileText /> PDF
            </a>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Reports" className="flex gap-1 overflow-x-auto lg:flex-col">
          {reports.map((r) => (
            <a
              key={r.key}
              href={withParams("/crm/reports", { from: pick(sp.from), to: pick(sp.to), department: filters.departmentId }, { r: r.key })}
              aria-current={r.key === key ? "page" : undefined}
              className={cn("shrink-0 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors", r.key === key ? "bg-c-accent-soft font-medium text-c-fg" : "text-c-muted hover:bg-c-hover hover:text-c-fg")}
            >
              {r.label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="r" value={key} />
            {key !== "headcount" && (
              <>
                <label className="text-[0.8125rem] font-medium">
                  <span className="mb-1.5 block">From</span>
                  <input type="date" name="from" defaultValue={filters.from} max={today} className={inputClass} />
                </label>
                <label className="text-[0.8125rem] font-medium">
                  <span className="mb-1.5 block">To</span>
                  <input type="date" name="to" defaultValue={filters.to} max={today} className={inputClass} />
                </label>
              </>
            )}
            {key !== "payroll" && (
              <label className="text-[0.8125rem] font-medium">
                <span className="mb-1.5 block">Department</span>
                <select name="department" defaultValue={filters.departmentId ?? ""} className={`${inputClass} w-52`}>
                  <option value="">All departments</option>
                  {options.departments.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="submit" className={buttonClass("secondary")}>
              Apply
            </button>
          </form>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {report.summary.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          {report.chart && report.chart.length > 0 && (
            <Card>
              <CardHeader title={report.chartLabel ?? "Overview"} description={report.subtitle} />
              <CardBody>
                <BarList items={report.chart.slice(0, 15)} suffix={key === "attendance" ? "%" : ""} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title={report.title} description={`${report.rows.length} row${report.rows.length === 1 ? "" : "s"} · ${report.subtitle}`} />
            {report.rows.length ? (
              <Table>
                <THead>
                  <tr>
                    {report.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </THead>
                <TBody>
                  {report.rows.slice(0, 500).map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td key={j} className={typeof v === "number" ? "tabular" : undefined}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState title="No data for these filters" />
            )}
          </Card>
          <p className="text-xs text-c-subtle">Filters: {JSON.stringify(params).length > 0 && `${filters.from} → ${filters.to}`}. Exports include every row.</p>
        </div>
      </div>
    </>
  );
}
