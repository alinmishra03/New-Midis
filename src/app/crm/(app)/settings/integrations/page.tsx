import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CsvUploadForm, PreviewImportButtons, RemoveUploadButton } from "@/components/crm/integrations";
import { SheetTable } from "@/components/crm/sheet-table";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, PageHeader, StatCard, Table, TBody, THead } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { TAB_ORDER, TAB_SPECS } from "@/crm/integrations/dev-sheet/admin";
import { CSV_MAX_BYTES } from "@/crm/integrations/dev-sheet/csv";
import { syncOverview } from "@/crm/integrations/dev-sheet/sync";
import { spreadsheetView, type FileSummary } from "@/crm/integrations/dev-sheet/view";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";

export const metadata: Metadata = { title: "Integrations" };

const DELIM: Record<string, string> = { ",": "comma", ";": "semicolon", "\t": "tab" };

/** Read-only: what the latest preview/import did with one file's rows. The file itself is never changed. */
function FileOutcome({ s, tz }: { s: FileSummary; tz: string }) {
  const isImport = s.mode === "import";
  const items = [
    isImport ? { label: "Rows now in the CRM", value: s.existing } : { label: "New rows to import", value: s.ready },
    ...(isImport ? [] : [{ label: "Already in the CRM (not duplicated)", value: s.existing }]),
    { label: "Exact duplicate rows (counted once)", value: s.duplicates },
    ...(s.skipped ? [{ label: "Skipped (set aside earlier)", value: s.skipped }] : []),
    { label: "Rows not imported", value: s.notImported.length },
  ];
  return (
    <div className="space-y-2 rounded-lg border border-c-border bg-c-surface-2 p-3 text-[0.8125rem]">
      <p className="font-medium">
        {isImport ? "Import result" : "Preview"} · {formatDateTime(s.at, tz)}
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {items.map((i) => (
          <li key={i.label}>
            <span className="text-c-muted">{i.label}:</span> <span className="font-semibold tabular">{i.value}</span>
          </li>
        ))}
      </ul>
      {s.notImported.length > 0 && (
        <details>
          <summary className="cursor-pointer text-c-muted hover:text-c-fg">
            Which rows weren&apos;t {isImport ? "imported" : "importable"}, and why ({s.notImported.length}) — they stay in the file above, unchanged
          </summary>
          <ul className="mt-2 max-h-64 space-y-0.5 overflow-auto text-xs">
            {s.notImported.map((r) => (
              <li key={r.n}>
                <span className="inline-block w-16 text-c-subtle tabular">Row {r.n}</span>
                {r.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * Super Admin only: the Development team sheet's three tabs, uploaded as CSV
 * and shown exactly as uploaded. Preview reports what an import would create;
 * Import creates it in Tasks & Projects. One-way; nothing in the CRM is
 * deleted and the uploaded files are never changed.
 */
export default async function IntegrationsPage() {
  const viewer = await requireViewer();
  if (viewer.role.key !== "super_admin") notFound();
  const [overview, company, view] = await Promise.all([syncOverview(), getCompany(), spreadsheetView()]);
  const tz = company.timezone;
  const uploads = new Map(overview.uploads.map((u) => [u.tab, u]));
  const allUploaded = TAB_ORDER.every((t) => uploads.has(t));
  const latest = overview.runs[0] ?? null;
  // A preview can be imported only while it is the latest run and the files are unchanged (the server checks this too).
  const filesMatch = allUploaded && JSON.stringify((latest?.files ?? []).map((f) => f.sha256)) === JSON.stringify(TAB_ORDER.map((t) => uploads.get(t)!.sha256));
  const previewCurrent = latest?.mode === "check" && latest.status === "succeeded" && filesMatch;
  const shownRun = latest?.status === "succeeded" && filesMatch ? latest : null;
  const k = shownRun?.counts ?? null;
  const rowsInFiles = view.sheets.reduce((n, s) => n + s.filledRows, 0);
  const notImported = view.sheets.reduce((n, s) => n + (s.summary?.notImported.length ?? 0), 0);

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="integrations" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view"), email: true }} />

      <div className="space-y-5">
        <Card>
          <CardHeader title="CSV Import · Development team sheet" description="One-way into Tasks & Projects. The uploaded files are shown exactly as they are and never changed; nothing in the CRM is ever deleted." />
          <CardBody className="space-y-4">
            <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-c-muted">
              {["Upload the three CSV files", "Look through the spreadsheets below", "Preview import", "Import"].map((step, i) => (
                <li key={step}>
                  <span className="font-semibold text-c-fg tabular">{i + 1}.</span> {step}
                </li>
              ))}
            </ol>
            <p className="text-[0.8125rem] text-c-muted">
              In Google Sheets open each tab and choose <strong>File → Download → Comma-separated values (.csv)</strong> (Excel: Save As → CSV UTF-8). Uploading the same files again is safe: rows already imported are recognised and never duplicated. Up to {CSV_MAX_BYTES / 1024} KB per file.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
              {TAB_ORDER.map((t) => (
                <a key={t} href={`#sheet-${t}`} className="inline-flex items-center gap-1.5 rounded-full border border-c-border px-2.5 py-1 hover:bg-c-hover">
                  {TAB_SPECS[t].name} {uploads.has(t) ? <Badge tone="success">Uploaded</Badge> : <Badge tone="warning">Missing</Badge>}
                </a>
              ))}
            </div>
            <PreviewImportButtons canPreview={allUploaded} previewRunId={previewCurrent ? latest!.id : null} />
            {!allUploaded && <p className="text-[0.8125rem] text-c-muted">Upload all three files to preview.</p>}
            {allUploaded && !previewCurrent && <p className="text-[0.8125rem] text-c-muted">Preview first: Import applies exactly what the latest preview reported for these files.</p>}

            {k && shownRun && (
              <div className="space-y-3 border-t border-c-border pt-4">
                <p className="text-sm font-semibold">
                  {shownRun.mode === "import" ? "Import result" : "Preview — nothing has been imported yet"} · {formatDateTime(shownRun.finishedAt ?? shownRun.startedAt, tz)}
                </p>
                <p className="text-[0.8125rem] text-c-muted">
                  The uploaded files hold <strong className="text-c-fg">{rowsInFiles} rows</strong> (shown below, unchanged). The CRM records below are what {shownRun.mode === "import" ? "this import created" : "an import would create"}; rows already in the CRM are recognised and not created again.
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <StatCard label={shownRun.mode === "import" ? "Projects created" : "Projects to create"} value={k.projectsCreated ?? 0} tone="success" />
                  <StatCard label={shownRun.mode === "import" ? "Tasks created" : "Tasks to create"} value={k.tasksCreated ?? 0} tone="success" />
                  <StatCard label={shownRun.mode === "import" ? "Daily updates added" : "Daily updates to add"} value={k.updatesAdded ?? 0} tone="success" />
                  <StatCard label="Already in the CRM" value={(k.projectsMatched ?? 0) + (k.projectsLinked ?? 0) + (k.tasksMatched ?? 0)} hint="projects and tasks matched" />
                  <StatCard label="Duplicate rows skipped" value={view.sheets.reduce((n, s) => n + (s.summary?.duplicates ?? 0), 0)} />
                  <StatCard label="Rows not imported" value={notImported} tone={notImported ? "warning" : "success"} hint="listed under each file" />
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {view.sheets.map((sh) => {
          const u = uploads.get(sh.tab);
          const spec = TAB_SPECS[sh.tab];
          return (
            <Card key={sh.tab} id={`sheet-${sh.tab}`} className="scroll-mt-20">
              <CardHeader
                title={sh.name}
                description={u ? `${u.fileName} · ${sh.filledRows} rows · uploaded ${formatDateTime(u.uploadedAt, tz)}${u.uploadedBy ? ` by ${u.uploadedBy}` : ""}` : `Not uploaded. Required columns: ${spec.columns.join(", ")}.`}
                action={u ? <Badge tone="success" dot>Uploaded</Badge> : <Badge tone="warning" dot>Missing</Badge>}
              />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-72 flex-1">
                    <CsvUploadForm tab={sh.tab} label={spec.name} hasFile={!!u} />
                  </div>
                  {u && <RemoveUploadButton tab={sh.tab} />}
                </div>
                {u && (
                  <>
                    <p className="text-xs text-c-subtle">
                      {(u.sizeBytes / 1024).toFixed(1)} KB · {u.encoding} · {DELIM[u.delimiter] ?? u.delimiter}-separated · {sh.columns.length} columns · {sh.rows.length + 1} lines, headings on row {sh.headerRow}
                    </p>
                    <SheetTable columns={sh.columns} rows={sh.rows} headerRow={sh.headerRow} fileName={u.fileName} />
                    {sh.summary && <FileOutcome s={sh.summary} tz={tz} />}
                  </>
                )}
              </CardBody>
            </Card>
          );
        })}

        <Card>
          <CardHeader title="Import history" description="The last 20 previews and imports." />
          {overview.runs.length ? (
            <Table>
              <THead>
                <tr>
                  <th>When</th>
                  <th>By</th>
                  <th>Type</th>
                  <th>Files</th>
                  <th>Result</th>
                  <th>Projects (new / upd.)</th>
                  <th>Tasks (new / upd.)</th>
                  <th>Updates</th>
                  <th>Duplicates skipped</th>
                  <th>Rows not imported</th>
                </tr>
              </THead>
              <TBody>
                {overview.runs.map((r) => {
                  const c = r.counts ?? {};
                  const has = !!r.counts;
                  const withRows = r.files?.every((f) => f.rows) ?? false;
                  const notIn = withRows ? r.files!.reduce((n, f) => n + f.rows!.filter((x) => x.s === "review").length, 0) : null;
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{formatDateTime(r.startedAt, tz)}</td>
                      <td>{r.actorName}</td>
                      <td>{r.mode === "import" ? "Import" : "Preview"}</td>
                      <td className="max-w-56 text-xs">{r.files?.length ? r.files.map((f) => <span key={f.tab} className="block truncate" title={f.fileName}>{f.fileName} ({f.dataRows})</span>) : r.trigger === "scheduled" ? "Google Sheets (old)" : "—"}</td>
                      <td>
                        {r.status === "succeeded" ? <Badge tone="success">Succeeded</Badge> : r.status === "failed" ? <Badge tone="danger">Failed — nothing changed</Badge> : <Badge tone="warning">Running</Badge>}
                        {r.error && <span className="mt-1 block max-w-xs text-xs text-c-danger">{r.error}</span>}
                      </td>
                      <td className="tabular">{has ? `${c.projectsCreated ?? 0} / ${c.projectsUpdated ?? 0}` : "—"}</td>
                      <td className="tabular">{has ? `${c.tasksCreated ?? 0} / ${c.tasksUpdated ?? 0}` : "—"}</td>
                      <td className="tabular">{has ? c.updatesAdded ?? 0 : "—"}</td>
                      <td className="tabular">{has ? c.duplicateRows ?? 0 : "—"}</td>
                      <td className="tabular">{r.status === "failed" ? "all (rolled back)" : notIn ?? "—"}</td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <CardBody>
              <p className="text-sm text-c-muted">No previews or imports yet.</p>
            </CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
