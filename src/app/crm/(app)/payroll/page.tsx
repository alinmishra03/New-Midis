import type { Metadata } from "next";
import Link from "next/link";
import { Check, Coins, Download, FileText, Users, Wallet, X } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { AdjustmentDialog, NewRunDialog, StructureDialog } from "@/components/crm/payroll-forms";
import { Badge, Card, CardBody, CardHeader, DescriptionList, EmptyState, PageHeader, PersonCell, StatusBadge, Table, TBody, THead, Tabs, buttonClass, humanize } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { formatDate, todayIn } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { listAdjustments, listRuns, myPayslips, salaryHistory, salaryOverview } from "@/crm/services/payroll";
import { decideAdjustmentAction } from "./actions";

export const metadata: Metadata = { title: "Payroll" };

const money = (v: string | number | null, c = "INR") => (v === null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(Number(v)));
const monthLabel = (y: number, m: number) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));

export default async function PayrollPage({ searchParams }: PageProps<"/crm/payroll">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const view = can(viewer, "payroll.view");
  const tabs = [
    { key: "mine", label: "My payslips", href: "/crm/payroll" },
    ...(view
      ? [
          { key: "runs", label: "Payroll runs", href: "/crm/payroll?tab=runs" },
          { key: "salaries", label: "Salary structures", href: "/crm/payroll?tab=salaries" },
          { key: "adjustments", label: "Adjustments", href: "/crm/payroll?tab=adjustments" },
        ]
      : []),
  ];
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : "mine";
  const company = await getCompany();
  const today = todayIn(company.timezone);

  return (
    <>
      <PageHeader
        title="Payroll"
        description={view ? "Salary structures, monthly runs and payslips. Restricted to authorised HR and finance staff." : "Your payslips and salary details."}
        actions={tab === "runs" && can(viewer, "payroll.manage") ? <NewRunDialog defaultPeriod={today.slice(0, 7)} /> : undefined}
      />
      <Tabs tabs={tabs} active={tab} />
      {tab === "mine" && <Mine />}
      {tab === "runs" && view && <Runs />}
      {tab === "salaries" && view && <Salaries employeeId={typeof sp.employee === "string" ? sp.employee : undefined} today={today} />}
      {tab === "adjustments" && view && <Adjustments today={today} />}
    </>
  );
}

async function Mine() {
  const viewer = await requireViewer();
  const [slips, structures] = await Promise.all([myPayslips(viewer), viewer.employee ? salaryHistory(viewer, viewer.employee.id) : Promise.resolve([])]);
  const current = structures[0];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Payslips" description="Available once payroll for the month is approved." />
        {slips.length ? (
          <Table>
            <THead>
              <tr>
                <th>Month</th>
                <th className="hidden sm:table-cell">Gross</th>
                <th className="hidden sm:table-cell">Deductions</th>
                <th>Net pay</th>
                <th className="text-right">
                  <span className="sr-only">Download</span>
                </th>
              </tr>
            </THead>
            <TBody>
              {slips.map((s) => (
                <tr key={s.id}>
                  <td>
                    {monthLabel(s.year, s.month)} {s.status === "paid" && <Badge tone="success">Paid</Badge>}
                  </td>
                  <td className="tabular hidden sm:table-cell">{money(s.gross, s.currency)}</td>
                  <td className="tabular hidden sm:table-cell">{money(s.deductions, s.currency)}</td>
                  <td className="tabular font-medium">{money(s.net, s.currency)}</td>
                  <td className="text-right">
                    <a href={`/crm/api/payslips/${s.id}`} target="_blank" rel="noreferrer" className={buttonClass("ghost", "sm")}>
                      <FileText /> View
                    </a>
                    <a href={`/crm/api/payslips/${s.id}?download=1`} className={buttonClass("ghost", "sm")}>
                      <Download /> <span className="hidden sm:inline">PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<Wallet />} title="No payslips yet" description="They appear here after HR runs and approves payroll." />
        )}
      </Card>
      <Card>
        <CardHeader title="Current salary structure" description="Monthly" />
        <CardBody>
          {current ? (
            <DescriptionList
              columns={1}
              items={[
                { label: "Effective from", value: formatDate(current.effectiveFrom) },
                { label: "Basic", value: money(current.basic, current.currency) },
                { label: "HRA", value: money(current.hra, current.currency) },
                ...current.allowances.map((a) => ({ label: a.label, value: money(a.amount, current.currency) })),
                ...current.deductions.map((d) => ({ label: `${d.label} (deduction)`, value: money(d.amount, current.currency) })),
              ]}
            />
          ) : (
            <p className="flex items-center gap-2 text-sm text-c-muted"><Wallet aria-hidden className="size-4 text-c-subtle" /> No salary structure recorded yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

async function Runs() {
  const viewer = await requireViewer();
  const runs = await listRuns(viewer);
  if (!runs.length) return <Card><EmptyState icon={<Wallet />} title="No payroll runs yet" description={can(viewer, "payroll.manage") ? "Create a run for a month, generate payslips, then have it approved." : undefined} /></Card>;
  return (
    <Card>
      <CardHeader title="Payroll runs" description={`${runs.length} run${runs.length === 1 ? "" : "s"} · open a month to see its payslips`} />
      <Table>
        <THead>
          <tr>
            <th>Month</th>
            <th>Status</th>
            <th>Payslips</th>
            <th className="hidden sm:table-cell">Gross</th>
            <th>Net</th>
          </tr>
        </THead>
        <TBody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/crm/payroll/runs/${r.id}`} className="font-medium hover:text-c-accent-text">
                  {monthLabel(r.year, r.month)}
                </Link>
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td className="tabular">{r.n}</td>
              <td className="tabular hidden sm:table-cell">{money(r.gross)}</td>
              <td className="tabular font-medium">{money(r.net)}</td>
            </tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

async function Salaries({ employeeId, today }: { employeeId?: string; today: string }) {
  const viewer = await requireViewer();
  const { rows, currency } = await salaryOverview(viewer);
  const selected = rows.find((r) => r.id === employeeId);
  const history = selected ? await salaryHistory(viewer, selected.id) : [];
  const manage = can(viewer, "payroll.manage");
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <Card>
        <CardHeader title="Employees" description="Choose someone to see their salary history" />
        <Table>
          <THead>
            <tr>
              <th>Employee</th>
              <th>Monthly gross</th>
              <th className="hidden md:table-cell">Deductions</th>
              <th className="hidden md:table-cell">Since</th>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <tr key={r.id} aria-selected={r.id === employeeId} className={r.id === employeeId ? "bg-c-accent-soft/40 shadow-[inset_3px_0_0_var(--c-accent)]" : undefined}>
                <td>
                  <Link href={`/crm/payroll?tab=salaries&employee=${r.id}`} className="block">
                    <PersonCell name={`${r.firstName} ${r.lastName}`} sub={[r.designation, r.code].filter(Boolean).join(" · ")} photoFileId={r.photoFileId} />
                  </Link>
                </td>
                <td className="tabular">{r.gross ? money(r.gross, currency) : <Badge tone="warning">Not set</Badge>}</td>
                <td className="tabular hidden md:table-cell">{money(r.deductions, currency)}</td>
                <td className="hidden text-c-muted md:table-cell">{r.structure ? formatDate(r.structure.effectiveFrom) : "—"}</td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <Card>
        {selected ? (
          <>
            <CardHeader
              title={`${selected.firstName} ${selected.lastName}`}
              description="Salary history"
              action={manage && selected.id !== viewer.employee?.id ? <StructureDialog employeeId={selected.id} employeeName={selected.firstName} today={today} /> : undefined}
            />
            {history.length ? (
              <ul className="divide-y divide-c-border">
                {history.map((s) => {
                  const allow = s.allowances.reduce((t, a) => t + Number(a.amount), 0);
                  return (
                    <li key={s.id} className="space-y-1 px-5 py-3 text-sm">
                      <p className="font-medium">From {formatDate(s.effectiveFrom)}</p>
                      <p className="text-xs text-c-muted">
                        Basic {money(s.basic, s.currency)} · HRA {money(s.hra, s.currency)} · Allowances {money(allow, s.currency)}
                      </p>
                      {s.deductions.length > 0 && <p className="text-xs text-c-muted">Deductions: {s.deductions.map((d) => `${d.label} ${money(d.amount, s.currency)}`).join(", ")}</p>}
                      {s.notes && <p className="text-xs text-c-subtle">{s.notes}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<Wallet />} title="No structure yet" description={manage ? "Add the first one." : undefined} />
            )}
          </>
        ) : (
          <EmptyState icon={<Users />} title="Choose an employee" description="Select someone to see or set their salary structure." />
        )}
      </Card>
    </div>
  );
}

async function Adjustments({ today }: { today: string }) {
  const viewer = await requireViewer();
  const [rows, overview] = await Promise.all([listAdjustments(viewer), salaryOverview(viewer)]);
  const approver = can(viewer, "payroll.approve");
  const people = overview.rows.filter((r) => r.id !== viewer.employee?.id || viewer.role.key === "super_admin").map((r) => ({ value: r.id, label: `${r.firstName} ${r.lastName}` }));
  return (
    <Card>
      <CardHeader title="One-off adjustments" description="Bonuses, allowances and deductions for a single month. Used by payroll only once approved." action={can(viewer, "payroll.manage") ? <AdjustmentDialog employees={people} defaultPeriod={today.slice(0, 7)} /> : undefined} />
      {rows.length ? (
        <Table>
          <THead>
            <tr>
              <th>Employee</th>
              <th>Month</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-right">
                <span className="sr-only">Decision</span>
              </th>
            </tr>
          </THead>
          <TBody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.firstName} {a.lastName}
                </td>
                <td>{monthLabel(a.year, a.month)}</td>
                <td>
                  <Badge tone={a.type === "deduction" ? "danger" : "success"}>{humanize(a.type)}</Badge>
                </td>
                <td className="max-w-xs truncate">{a.label}</td>
                <td className="tabular">{money(a.amount)}</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="text-right">
                  {a.status === "pending" && approver && (a.createdById !== viewer.userId || viewer.role.key === "super_admin") && (a.employeeId !== viewer.employee?.id || viewer.role.key === "super_admin") ? (
                    <div className="flex justify-end gap-1.5">
                      <ConfirmAction action={decideAdjustmentAction} fields={{ id: a.id, decision: "approve" }} label="Approve" icon={<Check />} title="Approve this adjustment?" confirmLabel="Approve" />
                      <ConfirmAction action={decideAdjustmentAction} fields={{ id: a.id, decision: "reject" }} label="" ariaLabel="Reject" icon={<X />} variant="ghost" size="icon" confirmVariant="danger" title="Reject this adjustment?" confirmLabel="Reject" />
                    </div>
                  ) : a.status === "pending" ? (
                    <span className="text-xs text-c-subtle">{a.createdById === viewer.userId ? "Awaiting another approver" : "Awaiting approval"}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon={<Coins />} title="No adjustments" description="One-off bonuses, allowances and deductions appear here." />
      )}
    </Card>
  );
}

