import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CsvUploadForm, PersonMapForm, PreviewImportButtons, ProjectNameMapForm, RemoveAliasButton, RemoveUploadButton, RowDecisionForm } from "@/components/crm/integrations";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard, Table, TBody, THead } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { decisionOptions, TAB_ORDER, TAB_SPECS } from "@/crm/integrations/dev-sheet/admin";
import { CSV_MAX_BYTES } from "@/crm/integrations/dev-sheet/csv";
import { nameKey, TABS } from "@/crm/integrations/dev-sheet/parse";
import { REVIEW_REASONS, syncOverview } from "@/crm/integrations/dev-sheet/sync";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";

export const metadata: Metadata = { title: "Integrations" };

const TAB_LABEL: Record<string, string> = { all_website: TABS.allWebsite, client_reviewed: TABS.clientReviewed, daily_work_update: TABS.daily, people: "People" };
const NEEDS_PROJECT = ["multiple_projects", "unmatched_project", "project_needs_review"];
const NEEDS_PERSON = ["multiple_developers", "no_developer", "unknown_person", "person_not_in_development"];
const DELIM: Record<string, string> = { ",": "comma", ";": "semicolon", "\t": "tab" };

/**
 * Super Admin only: the Development team sheet's three tabs, uploaded as CSV,
 * previewed, then imported into Tasks & Projects. One-way; nothing in the CRM
 * is deleted.
 */
export default async function IntegrationsPage() {
  const viewer = await requireViewer();
  if (viewer.role.key !== "super_admin") notFound();
  const [overview, options, company] = await Promise.all([syncOverview(), decisionOptions(), getCompany()]);
  const tz = company.timezone;
  const uploads = new Map(overview.uploads.map((u) => [u.tab, u]));
  const allUploaded = TAB_ORDER.every((t) => uploads.has(t));
  const latest = overview.runs[0] ?? null;
  // A preview can be imported only while it is the latest run and the files are unchanged (the server checks this too).
  const previewCurrent =
    latest?.mode === "check" && latest.status === "succeeded" && allUploaded && JSON.stringify((latest.files ?? []).map((f) => f.sha256)) === JSON.stringify(TAB_ORDER.map((t) => uploads.get(t)!.sha256));
  const pc = previewCurrent ? latest!.counts ?? {} : null;
  const open = overview.open;
  const byReason = (...reasons: string[]) => open.filter((r) => reasons.includes(r.reviewReason ?? "")).length;
  const people = open.filter((r) => r.kind === "person");
  const unmatched = new Map<string, { name: string; rows: number[] }>();
  for (const r of open.filter((x) => x.reviewReason === "unmatched_project")) {
    const name = r.source["Project Name"] ?? "";
    const k = nameKey(name);
    unmatched.set(k, { name: unmatched.get(k)?.name ?? name, rows: [...(unmatched.get(k)?.rows ?? []), r.rowNumber] });
  }
  const items = open.filter((r) => r.kind !== "person" && r.reviewReason !== "unmatched_project");

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="integrations" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view"), email: true }} />

      <div className="space-y-5">
        <Card>
          <CardHeader title="CSV Import · Development team sheet" description="Upload the three tabs as CSV files, preview, then import into Tasks & Projects. One-way: the sheet isn't changed, and nothing in the CRM is ever deleted." />
          <CardBody className="space-y-5">
            <p className="text-[0.8125rem] text-c-muted">
              In Google Sheets open each tab and choose <strong>File → Download → Comma-separated values (.csv)</strong> (Excel: Save As → CSV UTF-8). Upload the same files again at any time: rows already imported are recognised and never duplicated. Up to {CSV_MAX_BYTES / 1024} KB per file.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              {TAB_ORDER.map((t) => {
                const u = uploads.get(t);
                const spec = TAB_SPECS[t];
                return (
                  <div key={t} className="space-y-3 rounded-lg border border-c-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{spec.name}</p>
                      {u ? <Badge tone="success" dot>Uploaded</Badge> : <Badge tone="warning" dot>Missing</Badge>}
                    </div>
                    {u ? (
                      <dl className="space-y-1 text-[0.8125rem]">
                        <div><dt className="inline text-c-muted">File: </dt><dd className="inline break-all">{u.fileName}</dd></div>
                        <div><dt className="inline text-c-muted">Rows: </dt><dd className="inline tabular">{u.dataRows}</dd> <span className="text-c-subtle">· {(u.sizeBytes / 1024).toFixed(1)} KB · {u.encoding} · {DELIM[u.delimiter] ?? u.delimiter}-separated</span></div>
                        <div><dt className="inline text-c-muted">Uploaded: </dt><dd className="inline">{formatDateTime(u.uploadedAt, tz)}{u.uploadedBy ? ` by ${u.uploadedBy}` : ""}</dd></div>
                        <div>
                          <dt className="text-c-muted">Columns detected:</dt>
                          <dd className="mt-1 flex flex-wrap gap-1">
                            {u.columns.map((c) => {
                              const known = spec.columns.some((x) => x.toLowerCase() === c.replace(/\s+/g, " ").toLowerCase());
                              return <Badge key={c} tone={known ? "neutral" : "warning"}>{c}{known ? "" : " (ignored)"}</Badge>;
                            })}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="text-[0.8125rem] text-c-muted">Required columns: {spec.columns.join(", ")}.</p>
                    )}
                    <CsvUploadForm tab={t} label={spec.name} hasFile={!!u} />
                    {u && <RemoveUploadButton tab={t} />}
                  </div>
                );
              })}
            </div>
            <PreviewImportButtons canPreview={allUploaded} previewRunId={previewCurrent ? latest!.id : null} />
            {!allUploaded && <p className="text-[0.8125rem] text-c-muted">Upload all three files to preview.</p>}
            {allUploaded && !previewCurrent && <p className="text-[0.8125rem] text-c-muted">Preview before importing. A new upload, a review decision or another run means previewing again.</p>}
          </CardBody>
        </Card>

        {pc && (
          <Card>
            <CardHeader title="Preview" description={`From ${formatDateTime(latest!.finishedAt ?? latest!.startedAt, tz)}. Nothing has been imported yet.`} />
            <CardBody className="space-y-4">
              <p className="text-sm font-semibold">Ready to import</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <StatCard label="Projects to create" value={pc.projectsCreated ?? 0} tone="success" />
                <StatCard label="Existing projects matched" value={(pc.projectsMatched ?? 0) + (pc.projectsLinked ?? 0)} hint={pc.projectsUpdated ? `${pc.projectsUpdated} with changes` : "no changes"} />
                <StatCard label="Tasks to create" value={pc.tasksCreated ?? 0} tone="success" />
                <StatCard label="Existing tasks matched" value={pc.tasksMatched ?? 0} hint={pc.tasksUpdated ? `${pc.tasksUpdated} with changes` : "no changes"} />
                <StatCard label="Daily updates to add" value={pc.updatesAdded ?? 0} />
                <StatCard label="Duplicate rows skipped" value={pc.duplicateRows ?? 0} />
              </div>
              <p className="text-sm font-semibold">Needs attention (not imported until resolved)</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <StatCard label="Unmatched employees" value={people.length} tone={people.length ? "warning" : undefined} />
                <StatCard label="Unmatched project names" value={unmatched.size} hint={`${byReason("unmatched_project")} rows`} tone={unmatched.size ? "warning" : undefined} />
                <StatCard label="Ambiguous projects" value={byReason("ambiguous_duplicate", "edited_project_row", "existing_crm_project", "project_needs_review", "multiple_projects")} tone="warning" />
                <StatCard label="Invalid or ambiguous dates" value={byReason("ambiguous_date", "missing_start_date")} tone="warning" />
                <StatCard label="Missing required fields" value={byReason("missing_required", "missing_status", "no_developer")} tone="warning" />
                <StatCard label="Total needing review" value={open.length} tone={open.length ? "warning" : "success"} />
              </div>
            </CardBody>
          </Card>
        )}

        {people.length > 0 && (
          <Card>
            <CardHeader title="People to identify" description="Names in the sheet that don't match exactly one Development employee. Nothing is guessed from similar names." />
            <CardBody className="space-y-4">
              {people.map((p) => (
                <div key={p.id} className="space-y-2 border-b border-c-border pb-4 last:border-0 last:pb-0">
                  <p className="text-sm"><strong>{p.source.name}</strong> — <span className="text-c-muted">{p.reviewDetail}</span></p>
                  <PersonMapForm id={p.id} employees={options.employees} />
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {unmatched.size > 0 && (
          <Card>
            <CardHeader title="Project names to map" description={`Names used in “${TABS.daily}” that don't match exactly one project. Mapping a name applies to every row that uses it, now and in later imports.`} />
            <CardBody className="space-y-4">
              {[...unmatched.values()].map((u) => (
                <div key={u.name} className="space-y-2 border-b border-c-border pb-4 last:border-0 last:pb-0">
                  <p className="text-sm"><strong>{u.name}</strong> <span className="text-c-muted">— {u.rows.length} row{u.rows.length === 1 ? "" : "s"} ({u.rows.slice(0, 8).join(", ")}{u.rows.length > 8 ? "…" : ""})</span></p>
                  <ProjectNameMapForm name={u.name} projects={options.projects} />
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Review queue" description="Rows that won't be imported on their own. Decisions apply from the next preview and import." />
          {items.length ? (
            <CardBody className="space-y-4">
              {items.map((r) => {
                const isProject = r.kind === "project";
                const choices = r.reviewReason === "removed_from_sheet" ? ["acknowledge"] : r.reviewReason === "conflict" ? ["use_sheet", "keep_crm"] : isProject ? ["create", "link", "ignore"] : ["separate", "attach", "ignore"];
                const v = r.source;
                return (
                  <div key={r.id} className="space-y-2 border-b border-c-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                      <Badge tone="warning">{REVIEW_REASONS[r.reviewReason ?? ""] ?? r.reviewReason}</Badge>
                      <span className="text-c-muted">{TAB_LABEL[r.sourceTab] ?? r.sourceTab} · row {r.rowNumber}</span>
                    </div>
                    <p className="text-sm">
                      {r.sourceTab === "daily_work_update" ? (
                        <>
                          <strong>{v["Date"] || "no date"}</strong> · {v["Project Name"] || "—"} · {[v["Frontend Developer"], v["Backend Developer"]].filter(Boolean).join(" / ") || "no developer"} · start {v["Start Date"] || "—"}
                          <span className="mt-1 block whitespace-pre-line text-c-muted">{(v["Daily Task / Deliverable"] ?? "").slice(0, 400)}</span>
                        </>
                      ) : (
                        <>
                          <strong>{v["Project Name"] || "no name"}</strong> · {v["Project URL"] || "no URL"} · {[v["Frontend Developer"], v["Backend Developer"]].filter(Boolean).join(" / ") || "no developer"} · {v["Environment Status"] || "—"} / {v["Development Status"] || "—"}
                        </>
                      )}
                    </p>
                    {r.reviewDetail && <p className="text-[0.8125rem] text-c-muted">{r.reviewDetail}</p>}
                    <RowDecisionForm id={r.id} choices={choices} needsProject={NEEDS_PROJECT.includes(r.reviewReason ?? "")} needsPerson={NEEDS_PERSON.includes(r.reviewReason ?? "")} needsDate={r.reviewReason === "ambiguous_date" || (r.reviewReason === "missing_required" && !v["Date"])} projects={options.projects} employees={options.employees} tasks={options.tasks} />
                  </div>
                );
              })}
            </CardBody>
          ) : (
            <EmptyState title="Nothing to review" description="Upload the files and preview to see what needs attention." />
          )}
        </Card>

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
