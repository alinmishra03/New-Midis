import type { Metadata } from "next";
import { Download, Filter, UserPlus, Users } from "lucide-react";
import { inputClass, SearchInput } from "@/components/crm/forms";
import { ImportEmployees } from "@/components/crm/employee-forms";
import { ButtonLink, Card, EmptyState, FilterBar, PageHeader, Pagination, PersonCell, ResultCount, StatusBadge, Table, TBody, THead, buttonClass, withParams } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { formatDate } from "@/crm/lib/time";
import { employeeFormOptions, listEmployees, PAGE_SIZE } from "@/crm/services/employees";

export const metadata: Metadata = { title: "Employees" };

const one = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : undefined);

export default async function EmployeesPage({ searchParams }: PageProps<"/crm/employees">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const filters = { q: one(sp.q), department: one(sp.department), role: one(sp.role), status: one(sp.status), sort: one(sp.sort), page: Number(one(sp.page) ?? 1) || 1 };
  const seeAll = can(viewer, "employees.view_all");
  const manage = can(viewer, "employees.manage");

  const [{ rows, total, page }, options] = await Promise.all([listEmployees(viewer, filters), employeeFormOptions()]);
  const current = { q: filters.q, department: filters.department, role: filters.role, status: filters.status, sort: filters.sort };
  const exportHref = withParams("/crm/api/employees/export", current, {});

  return (
    <>
      <PageHeader
        title="Employees"
        description={seeAll ? "Everyone at MIDIS. Open a profile for details." : "The company directory. You can see your colleagues' work details."}
        actions={
          <>
            {seeAll && (
              <a href={exportHref} className={buttonClass("secondary")}>
                <Download /> Export CSV
              </a>
            )}
            {manage && <ImportEmployees />}
            {manage && (
              <ButtonLink href="/crm/employees/new" variant="primary">
                <UserPlus /> Add employee
              </ButtonLink>
            )}
          </>
        }
      />

      <Card>
        <FilterBar role="search">
          <SearchInput name="q" defaultValue={filters.q} placeholder="Search by name, email, code or designation" aria-label="Search employees" />
          <select name="department" defaultValue={filters.department ?? ""} aria-label="Department" className={`${inputClass} sm:w-48`}>
            <option value="">All departments</option>
            {options.departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {seeAll && (
            <>
              <select name="role" defaultValue={filters.role ?? ""} aria-label="Role" className={`${inputClass} sm:w-40`}>
                <option value="">All roles</option>
                {options.roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <select name="status" defaultValue={filters.status ?? "current"} aria-label="Status" className={`${inputClass} sm:w-40`}>
                <option value="current">Current staff</option>
                <option value="probation">Probation</option>
                <option value="active">Confirmed</option>
                <option value="notice">Notice period</option>
                <option value="exited">Former employees</option>
                <option value="all">Everyone</option>
              </select>
            </>
          )}
          <button type="submit" className={buttonClass("secondary")}>
            <Filter /> Filter
          </button>
          {(filters.q || filters.department || filters.role || filters.status) && (
            <ButtonLink href="/crm/employees" variant="ghost">
              Clear
            </ButtonLink>
          )}
          <ResultCount>
            {total} {total === 1 ? "person" : "people"}
          </ResultCount>
        </FilterBar>

        {rows.length ? (
          <>
            <Table>
              <THead>
                <tr>
                  <th>Name</th>
                  <th className="hidden md:table-cell">Department</th>
                  <th className="hidden lg:table-cell">Reports to</th>
                  {seeAll && <th className="hidden lg:table-cell">Role</th>}
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Joined</th>
                </tr>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-[18rem]">
                      <PersonCell
                        name={`${r.firstName} ${r.lastName}`.trim()}
                        sub={[r.designation, r.employeeCode].filter(Boolean).join(" · ")}
                        photoFileId={r.photoFileId}
                        href={`/crm/employees/${r.id}`}
                      />
                    </td>
                    <td className="hidden text-c-muted md:table-cell">{r.department ?? "—"}</td>
                    <td className="hidden text-c-muted lg:table-cell">{r.managerName ?? "—"}</td>
                    {seeAll && <td className="hidden text-c-muted lg:table-cell">{r.role ?? "No account"}</td>}
                    <td>
                      <StatusBadge status={r.employmentStatus} />
                      {seeAll && r.userStatus === "invited" && <span className="ml-1.5 text-xs text-c-subtle">invite pending</span>}
                    </td>
                    <td className="tabular hidden text-c-muted sm:table-cell">{formatDate(r.joiningDate)}</td>
                  </tr>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} hrefFor={(p) => withParams("/crm/employees", current, { page: String(p) })} />
          </>
        ) : (
          <EmptyState
            icon={<Users />}
            title={filters.q || filters.department ? "No one matches those filters" : "No employees yet"}
            description={filters.q || filters.department ? "Try a different search, or clear the filters." : manage ? "Add employees one at a time, or import a CSV." : undefined}
            action={manage ? <ButtonLink href="/crm/employees/new" variant="primary">Add employee</ButtonLink> : undefined}
          />
        )}
      </Card>
    </>
  );
}
