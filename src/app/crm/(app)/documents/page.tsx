import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Filter, Trash2, Wallet } from "lucide-react";
import { UploadDocumentDialog } from "@/components/crm/document-forms";
import { ConfirmAction, inputClass, SearchInput } from "@/components/crm/forms";
import { Badge, Card, EmptyState, FilterBar, PageHeader, Table, TBody, THead, Tabs, buttonClass, humanize } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { uuidOrUndefined } from "@/crm/lib/params";
import { formatDate } from "@/crm/lib/time";
import { allDocuments, companyDocuments, DOC_CATEGORIES, myDocuments } from "@/crm/services/documents";
import { employeeFormOptions } from "@/crm/services/employees";
import { deleteDocumentAction } from "./actions";

export const metadata: Metadata = { title: "Documents" };

type Doc = Awaited<ReturnType<typeof companyDocuments>>[number];
const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const VIS: Record<string, { label: string; tone: "neutral" | "warning" | "info" }> = {
  employee: { label: "Employee + HR", tone: "neutral" },
  hr_only: { label: "HR only", tone: "warning" },
  company: { label: "Everyone", tone: "info" },
};

function DocTable({ docs, showOwner, canDelete }: { docs: Doc[]; showOwner?: boolean; canDelete: (d: Doc) => boolean }) {
  if (!docs.length) return <EmptyState icon={<FileText />} title="No documents" />;
  return (
    <Table>
      <THead>
        <tr>
          <th>Document</th>
          {showOwner && <th className="hidden md:table-cell">Employee</th>}
          <th className="hidden sm:table-cell">Category</th>
          <th className="hidden lg:table-cell">Visible to</th>
          <th className="hidden md:table-cell">Added</th>
          <th className="text-right">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </THead>
      <TBody>
        {docs.map((d) => (
          <tr key={d.id}>
            <td className="max-w-xs">
              <span className="flex items-center gap-2.5">
                <FileText className="size-4 shrink-0 text-c-subtle" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.title}</span>
                  <span className="block truncate text-xs text-c-muted">
                    {d.fileName} · {size(d.sizeBytes)}
                  </span>
                </span>
              </span>
            </td>
            {showOwner && <td className="hidden md:table-cell">{d.employeeId ? <Link href={`/crm/employees/${d.employeeId}?tab=documents`} className="hover:underline">{d.firstName} {d.lastName}</Link> : <span className="text-c-muted">Company-wide</span>}</td>}
            <td className="hidden sm:table-cell">{humanize(d.category)}</td>
            <td className="hidden lg:table-cell">
              <Badge tone={VIS[d.visibility]!.tone}>{VIS[d.visibility]!.label}</Badge>
            </td>
            <td className="hidden text-c-muted md:table-cell">{formatDate(d.createdAt.toISOString().slice(0, 10))}</td>
            <td className="text-right">
              <span className="flex justify-end gap-1">
                <a href={`/crm/api/files/${d.fileId}?download=1`} className={buttonClass("ghost", "sm")}>
                  <Download /> <span className="hidden sm:inline">Download</span>
                </a>
                {canDelete(d) && <ConfirmAction action={deleteDocumentAction} fields={{ id: d.id }} label="" ariaLabel={`Delete ${d.title}`} icon={<Trash2 />} variant="ghost" size="icon" confirmVariant="danger" title={`Delete “${d.title}”?`} description="The file is removed from storage. This can't be undone." confirmLabel="Delete" />}
              </span>
            </td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}

export default async function DocumentsPage({ searchParams }: PageProps<"/crm/documents">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const hr = can(viewer, "documents.manage");
  const tabs = [
    { key: "mine", label: "My documents", href: "/crm/documents?tab=mine" },
    { key: "company", label: "Company policies", href: "/crm/documents?tab=company" },
    ...(hr ? [{ key: "manage", label: "All documents", href: "/crm/documents?tab=manage" }] : []),
  ];
  const defaultTab = hr && typeof sp.employee === "string" ? "manage" : "mine";
  const tab = tabs.some((t) => t.key === sp.tab) ? (sp.tab as string) : defaultTab;
  const options = hr ? await employeeFormOptions() : null;
  const categories = hr ? DOC_CATEGORIES : DOC_CATEGORIES.filter((c) => ["id_proof", "certificate", "other"].includes(c.value));

  return (
    <>
      <PageHeader
        title="Documents"
        description="Your employment documents and company policies, stored privately."
        actions={(hr || viewer.employee) && <UploadDocumentDialog hr={hr} employees={options?.managers ?? []} categories={categories} selfId={viewer.employee?.id ?? null} defaultEmployee={uuidOrUndefined(sp.employee)} />}
      />
      <Tabs tabs={tabs} active={tab} />

      {tab === "mine" && (
        <div className="space-y-4">
          <Card>
            {(async () => {
              const docs = await myDocuments(viewer);
              return <DocTable docs={docs} canDelete={(d) => hr || d.uploadedById === viewer.userId} />;
            })()}
          </Card>
          <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-c-accent-soft text-c-accent-text">
                <Wallet className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium">Payslips</span>
                <span className="text-[0.8125rem] text-c-muted">Generated as PDF from approved payroll runs.</span>
              </span>
            </span>
            <Link href="/crm/payroll" className={buttonClass("secondary", "sm")}>
              Open payslips
            </Link>
          </Card>
        </div>
      )}
      {tab === "company" && <Card>{(async () => <DocTable docs={await companyDocuments()} canDelete={() => hr} />)()}</Card>}
      {tab === "manage" && hr && (
        <Card>
          <FilterBar role="search">
            <input type="hidden" name="tab" value="manage" />
            <SearchInput name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search title or file name" aria-label="Search documents" />
            <select name="employee" defaultValue={typeof sp.employee === "string" ? sp.employee : ""} className={`${inputClass} sm:w-56`} aria-label="Employee">
              <option value="">Everyone</option>
              <option value="company">Company-wide only</option>
              {options!.managers.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select name="category" defaultValue={typeof sp.category === "string" ? sp.category : ""} className={`${inputClass} sm:w-48`} aria-label="Category">
              <option value="">All categories</option>
              {DOC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClass("secondary")}>
              <Filter /> Filter
            </button>
          </FilterBar>
          {(async () => {
            const docs = await allDocuments(viewer, {
              employeeId: typeof sp.employee === "string" ? sp.employee : undefined,
              category: typeof sp.category === "string" ? sp.category : undefined,
              q: typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined,
            });
            return <DocTable docs={docs} showOwner canDelete={() => true} />;
          })()}
        </Card>
      )}
    </>
  );
}
