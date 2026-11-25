import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CsvUploadForm, PreviewImportButtons, RemoveAliasButton, RemoveUploadButton } from "@/components/crm/integrations";
import { OtherReviewItems, SheetTable } from "@/components/crm/sheet-table";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, PageHeader, StatCard, Table, TBody, THead } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { decisionOptions, TAB_ORDER, TAB_SPECS } from "@/crm/integrations/dev-sheet/admin";
import { CSV_MAX_BYTES } from "@/crm/integrations/dev-sheet/csv";
import { syncOverview } from "@/crm/integrations/dev-sheet/sync";
import { spreadsheetView } from "@/crm/integrations/dev-sheet/view";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";

export const metadata: Metadata = { title: "Integrations" };

const DELIM: Record<string, string> = { ",": "comma", ";": "semicolon", "\t": "tab" };

/**
 * Super Admin only: the Development team sheet's three tabs, uploaded as CSV and
 * shown as spreadsheets (original cells, unchanged) with each row's import
 * status beside it; flagged rows are resolved inline, then previewed and
 * imported into Tasks & Projects. One-way; nothing in the CRM is deleted.
 */
export default async function IntegrationsPage() {
  const viewer = await requireViewer();
  if (viewer.role.key !== "super_admin") notFound();
  const [overview, options, company, view] = await Promise.all([syncOverview(), decisionOptions(), getCompany(), spreadsheetView()]);
  const tz = company.timezone;
  const uploads = new Map(overview.uploads.map((u) => [u.tab, u]));
  const allUploaded = TAB_ORDER.every((t) => uploads.has(t));
  const latest = overview.runs[0] ?? null;
  // A preview can be imported only while it is the latest run, the files are unchanged and no decision or mapping
  // was saved after it (the server checks all of this too).
  const filesMatch = allUploaded && JSON.stringify((latest?.files ?? []).map((f) => f.sha256)) === JSON.stringify(TAB_ORDER.map((t) => uploads.get(t)!.sha256));
  const previewCurrent = latest?.mode === "check" && latest.status === "succeeded" && filesMatch && !view.changedSincePreview;
  const pc = previewCurrent ? latest!.counts ?? {} : null;
  const flagged = view.sheets.reduce((n, sh) => n + sh.rows.filter((r) => r.status === "review" || r.people?.length).length, 0) + view.others.length;
  const byStatus = (st: string) => view.sheets.reduce((n, sh) => n + sh.rows.filter((r) => r.status === st).length, 0);

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="integrations" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view"), email: true }} />

      <div className="space-y-5">
        <Card>
          <CardHeader title="CSV Import · Development team sheet" description="One-way into Tasks & Projects. The sheet and the uploaded files are never changed, and nothing in the CRM is ever deleted." />
          <CardBody className="space-y-4">
            <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-c-muted">
              {["Upload the three CSV files", "Check the spreadsheets below", "Resolve flagged rows", "Preview", "Import"].map((step, i) => (
                <li key={step}><span className="font-semibold text-c-fg tabular">{i + 1}.</span> {step}</li>
              ))}
            </ol>
            <p className="text-[0.8125rem] text-c-muted">
              In Google Sheets open each tab and choose <strong>File → Download → Comma-separated values (.csv)</strong> (Excel: Save As → CSV UTF-8). Uploading the same files again is safe: rows already imported are recognised and never duplicated. Up to {CSV_MAX_BYTES / 1024} KB per file.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
              {TAB_ORDER.map((t) => (
                <a key={t} href={`#sheet-${t}`} className="inline-flex items-center gap-1.5 rounded-full border border-c-border px-2.5 py-1 hover:bg-c-hover">
                  {TAB_SPECS[t].name} {uploads.has(t) ? <Badge tone="success">{uploads.get(t)!.dataRows} rows</Badge> : <Badge tone="warning">Missing</Badge>}
                </a>
              ))}
              {flagged > 0 && <Badge tone="warning" dot>{flagged} row{flagged === 1 ? "" : "s"} need attention</Badge>}
            </div>
            <PreviewImportButtons canPreview={allUploaded} previewRunId={previewCurrent ? latest!.id : null} />
            {!allUploaded && <p className="text-[0.8125rem] text-c-muted">Upload all three files to preview.</p>}
            {allUploaded && !previewCurrent && (
              <p className="text-[0.8125rem] text-c-muted">
                {view.changedSincePreview ? "Decisions or mappings were saved since the last preview. " : ""}Preview before importing. A new upload, a decision or another run means previewing again. Rows marked “Needs review” are never imported until resolved.
              </p>
            )}
            {pc && (
              <div className="space-y-3 border-t border-c-border pt-4">
                <p className="text-sm font-semibold">Preview from {formatDateTime(latest!.finishedAt ?? latest!.startedAt, tz)} — nothing has been imported yet</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <StatCard label="Projects to create" value={pc.projectsCreated ?? 0} tone="success" />
                  <StatCard label="Existing projects matched" value={(pc.projectsMatched ?? 0) + (pc.projectsLinked ?? 0)} hint={pc.projectsUpdated ? `${pc.projectsUpdated} with changes` : "no changes"} />
                  <StatCard label="Tasks to create" value={pc.tasksCreated ?? 0} tone="success" />
                  <StatCard label="Existing tasks matched" value={pc.tasksMatched ?? 0} hint={pc.tasksUpdated ? `${pc.tasksUpdated} with changes` : "no changes"} />
                  <StatCard label="Daily updates to add" value={pc.updatesAdded ?? 0} />
                  <StatCard label="Rows needing review (not imported)" value={byStatus("review") + view.others.length} tone={byStatus("review") + view.others.length ? "warning" : "success"} hint={`${pc.duplicateRows ?? 0} duplicate rows skipped`} />
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {view.sheets.map((sh) => {
          const u = uploads.get(sh.tab);
          const spec = TAB_SPECS[sh.tab];
          const extra = sh.columns.filter((c) => c.heading.trim() && !spec.columns.some((x) => x.toLowerCase() === c.heading.replace(/\s+/g, " ").trim().toLowerCase()));
          return (
            <Card key={sh.tab} id={`sheet-${sh.tab}`} className="scroll-mt-20">
              <CardHeader
                title={sh.name}
                description={
                  u
                    ? `${u.fileName} · ${sh.rows.length} rows below the heading row (row ${sh.headerRow}) · uploaded ${formatDateTime(u.uploadedAt, tz)}${u.uploadedBy ? ` by ${u.uploadedBy}` : ""}`
                    : `Not uploaded. Required columns: ${spec.columns.join(", ")}.`
                }
                action={u ? <Badge tone="success" dot>Uploaded</Badge> : <Badge tone="warning" dot>Missing</Badge>}
              />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-72 flex-1"><CsvUploadForm tab={sh.tab} label={spec.name} hasFile={!!u} /></div>
                  {u && <RemoveUploadButton tab={sh.tab} />}
                </div>
                {u && (
                  <>
                    <p className="text-xs text-c-subtle">
                      {(u.sizeBytes / 1024).toFixed(1)} KB · {u.encoding} · {DELIM[u.delimiter] ?? u.delimiter}-separated · {sh.columns.length} columns
                      {sh.hiddenEmptyColumns ? ` (+${sh.hiddenEmptyColumns} empty unnamed column${sh.hiddenEmptyColumns === 1 ? "" : "s"} not shown)` : ""}
                      {extra.length ? ` · not imported: ${extra.map((c) => `“${c.heading}”`).join(", ")}` : ""}
                      {" · "}
                      {sh.checked ? `statuses from the ${sh.checked.mode === "import" ? "import" : "preview"} at ${formatDateTime(sh.checked.at, tz)}` : "statuses appear after Preview import"}
                    </p>
                    <SheetTable columns={sh.columns} rows={sh.rows} options={options} fileName={u.fileName} />
                  </>
                )}
              </CardBody>
            </Card>
          );
        })}

        {view.others.length > 0 && (
          <Card>
            <CardHeader title="Other items to review" description="Not on any row of the uploaded files — for example a row imported earlier that is no longer in the sheet. Nothing in the CRM was deleted." />
            <CardBody>
              <OtherReviewItems items={view.others} options={options} />
            </CardBody>
          </Card>
        )}

        {overview.aliases.length > 0 && (
          <Card>
            <CardHeader title="Saved mappings" description="Reused by every later import. Removing one affects future imports only; records already imported stay as they are." />
            <Table>
              <THead><tr><th>Type</th><th>Sheet name</th><th>Maps to</th><th className="w-24"><span className="sr-only">Remove</span></th></tr></THead>
              <TBody>
                {overview.aliases.map((a) => (
                  <tr key={a.id}>
                    <td>{a.kind === "person" ? "Person" : "Project"}</td>
                    <td className="font-mono text-xs">{a.alias}</td>
                    <td>{a.kind === "person" ? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "—" : a.projectName ?? "—"}</td>
                    <td><RemoveAliasButton id={a.id} /></td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}

        <Card>
          <CardHeader title="Import history" description="The last 20 previews and imports." />
          {overview.runs.length ? (
            <Table>
              <THead><tr><th>When</th><th>By</th><th>Type</th><th>Files</th><th>Result</th><th>Projects (new / upd.)</th><th>Tasks (new / upd.)</th><th>Updates</th><th>Duplicates skipped</th><th>Review</th><th>Failed records</th></tr></THead>
              <TBody>
                {overview.runs.map((r) => {
                  const k = r.counts ?? {};
                  const has = !!r.counts;
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{formatDateTime(r.startedAt, tz)}</td>
                      <td>{r.actorName}</td>
                      <td>{r.mode === "import" ? "Import" : "Preview"}</td>
                      <td className="max-w-56 text-xs">{r.files?.length ? r.files.map((f) => <span key={f.tab} className="block truncate" title={f.fileName}>{f.fileName} ({f.dataRows})</span>) : r.trigger === "scheduled" ? "Google Sheets (old)" : "—"}</td>
                      <td>{r.status === "succeeded" ? <Badge tone="success">Succeeded</Badge> : r.status === "failed" ? <Badge tone="danger">Failed — nothing changed</Badge> : <Badge tone="warning">Running</Badge>}{r.error && <span className="mt-1 block max-w-xs text-xs text-c-danger">{r.error}</span>}</td>
                      <td className="tabular">{has ? `${k.projectsCreated ?? 0} / ${k.projectsUpdated ?? 0}` : "—"}</td>
                      <td className="tabular">{has ? `${k.tasksCreated ?? 0} / ${k.tasksUpdated ?? 0}` : "—"}</td>
                      <td className="tabular">{has ? k.updatesAdded ?? 0 : "—"}</td>
                      <td className="tabular">{has ? k.duplicateRows ?? 0 : "—"}</td>
                      <td className="tabular">{has ? k.review ?? 0 : "—"}</td>
                      <td className="tabular">{r.status === "failed" ? "all (rolled back)" : has ? 0 : "—"}</td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <CardBody><p className="text-sm text-c-muted">No previews or imports yet.</p></CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
