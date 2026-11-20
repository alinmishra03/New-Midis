import type { Metadata } from "next";
import { inputClass } from "@/components/crm/forms";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Card, EmptyState, PageHeader, Pagination, Table, TBody, THead, buttonClass, withParams } from "@/components/crm/ui";
import { can, requirePermission } from "@/crm/auth/dal";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { listAudit } from "@/crm/services/settings";

export const metadata: Metadata = { title: "Audit log" };

const s = (v: string | string[] | undefined) => (typeof v === "string" && v ? v.slice(0, 100) : undefined);

export default async function AuditPage({ searchParams }: PageProps<"/crm/settings/audit">) {
  const viewer = await requirePermission("audit.view");
  const sp = await searchParams;
  const filters = { q: s(sp.q), action: s(sp.action), from: s(sp.from), to: s(sp.to) };
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total, pageSize }, company] = await Promise.all([listAudit(viewer, { ...filters, page }), getCompany()]);

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="audit" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: true }} />
      <Card>
        <form className="flex flex-wrap items-end gap-2 border-b border-c-border p-4">
          <input name="q" defaultValue={filters.q} placeholder="Search summary or person" aria-label="Search" className={`${inputClass} max-w-xs`} />
          <select name="action" defaultValue={filters.action ?? ""} aria-label="Area" className={`${inputClass} w-44`}>
            <option value="">All areas</option>
            {["auth", "user", "employee", "attendance", "leave", "wfh", "task", "project", "document", "payroll", "performance", "candidate", "announcement", "meeting", "settings", "roles", "report"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={filters.from} aria-label="From" className={`${inputClass} w-40`} />
          <input type="date" name="to" defaultValue={filters.to} aria-label="To" className={`${inputClass} w-40`} />
          <button type="submit" className={buttonClass("secondary")}>
            Filter
          </button>
          <span className="tabular ml-auto text-[0.8125rem] text-c-muted">{total} entries</span>
        </form>
        {rows.length ? (
          <>
            <Table>
              <THead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th className="hidden lg:table-cell">Action</th>
                  <th className="hidden xl:table-cell">IP</th>
                </tr>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="tabular text-xs whitespace-nowrap text-c-muted">{formatDateTime(r.createdAt, company.timezone)}</td>
                    <td className="text-[0.8125rem]">{r.actorEmail ?? <span className="text-c-subtle">System / unknown</span>}</td>
                    <td className="text-[0.8125rem]">{r.summary}</td>
                    <td className="hidden font-mono text-xs text-c-subtle lg:table-cell">{r.action}</td>
                    <td className="hidden font-mono text-xs text-c-subtle xl:table-cell">{r.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} hrefFor={(p) => withParams("/crm/settings/audit", filters, { page: String(p) })} />
          </>
        ) : (
          <EmptyState title="No matching entries" />
        )}
      </Card>
    </>
  );
}
