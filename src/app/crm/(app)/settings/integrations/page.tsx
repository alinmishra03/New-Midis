import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutoImportToggle, PersonMapForm, ProjectNameMapForm, RemoveAliasButton, RowDecisionForm, SyncButtons } from "@/components/crm/integrations";
import { SettingsNav } from "@/components/crm/SettingsNav";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatCard, Table, TBody, THead } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { decisionOptions } from "@/crm/integrations/google-sheets/admin";
import { sheetsStatus } from "@/crm/integrations/google-sheets/client";
import { nameKey, TABS } from "@/crm/integrations/google-sheets/parse";
import { REVIEW_REASONS, syncOverview } from "@/crm/integrations/google-sheets/sync";
import { formatDateTime } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";

export const metadata: Metadata = { title: "Integrations" };

const TAB_LABEL: Record<string, string> = { all_website: TABS.allWebsite, client_reviewed: TABS.clientReviewed, daily_work_update: TABS.daily, people: "People" };
const NEEDS_PROJECT = ["multiple_projects", "unmatched_project", "project_needs_review"];
const NEEDS_PERSON = ["multiple_developers", "no_developer", "unknown_person", "person_not_in_development"];

/**
 * Super Admin only: the one-way Google Sheets → CRM sync for the Development
 * team (status, Sync Now, history and the review queue). No credential is ever
 * rendered — only whether each setting is present and valid.
 */
export default async function IntegrationsPage() {
  const viewer = await requireViewer();
  if (viewer.role.key !== "super_admin") notFound();
  const [status, overview, options, company] = await Promise.all([sheetsStatus(), syncOverview(), decisionOptions(), getCompany()]);
  const tz = company.timezone;
  const last = overview.runs[0] ?? null;
  const c = overview.lastImport?.counts ?? {};
  const people = overview.open.filter((r) => r.kind === "person");
  const unmatched = new Map<string, { name: string; rows: number[] }>();
  for (const r of overview.open.filter((x) => x.reviewReason === "unmatched_project")) {
    const name = r.source["Project Name"] ?? "";
    const k = nameKey(name);
    unmatched.set(k, { name: unmatched.get(k)?.name ?? name, rows: [...(unmatched.get(k)?.rows ?? []), r.rowNumber] });
  }
  const items = overview.open.filter((r) => r.kind !== "person" && r.reviewReason !== "unmatched_project");
  const sheetUrl = status.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${status.spreadsheetId}/edit` : null;

  return (
    <>
      <PageHeader title="Settings" description="Company-wide configuration. Every change is recorded in the audit log." />
      <SettingsNav active="integrations" perms={{ settings: can(viewer, "settings.manage"), users: can(viewer, "users.invite"), roles: can(viewer, "roles.manage"), audit: can(viewer, "audit.view"), email: true }} />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Google Sheets · Development team" description="One-way: the sheet's projects and daily work updates are brought into Tasks & Projects. The sheet is never changed." />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {status.configured ? <Badge tone="success" dot>Connected settings present</Badge> : <Badge tone="danger" dot>Not configured</Badge>}
              {last && (last.status === "succeeded" ? <Badge tone="success">Last sync succeeded</Badge> : last.status === "failed" ? <Badge tone="danger">Last sync failed</Badge> : <Badge tone="warning">Sync running</Badge>)}
              {overview.open.length > 0 && <Badge tone="warning">{overview.open.length} need review</Badge>}
            </div>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-c-muted text-[0.8125rem]">Spreadsheet</dt><dd>{overview.lastOk?.spreadsheetTitle || "—"}{sheetUrl && <> · <a className="text-c-accent-text underline-offset-2 hover:underline" href={sheetUrl} target="_blank" rel="noreferrer noopener">open</a></>}</dd></div>
              <div><dt className="text-c-muted text-[0.8125rem]">Service account (share the sheet with it as Viewer)</dt><dd className="break-all">{status.clientEmail ?? "—"}</dd></div>
              <div><dt className="text-c-muted text-[0.8125rem]">Last successful sync</dt><dd>{overview.lastOk ? `${formatDateTime(overview.lastOk.finishedAt ?? overview.lastOk.startedAt, tz)} (${overview.lastOk.mode === "import" ? "import" : "check only"})` : "Never"}</dd></div>
              <div><dt className="text-c-muted text-[0.8125rem]">Last attempt</dt><dd>{last ? `${formatDateTime(last.startedAt, tz)} · ${last.status}${last.error ? ` — ${last.error}` : ""}` : "None yet"}</dd></div>
              <div><dt className="text-c-muted text-[0.8125rem]">Schedule</dt><dd>Once a day, around 09:00 IST (Vercel Hobby plan: daily jobs only), plus Sync now.</dd></div>
            </dl>
            {status.problems.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-[0.8125rem] text-c-danger">
                {status.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard label="Projects imported" value={c.projectsCreated ?? 0} hint="Last import" />
              <StatCard label="Projects updated" value={c.projectsUpdated ?? 0} hint="Last import" />
              <StatCard label="Tasks imported" value={c.tasksCreated ?? 0} hint="Last import" />
              <StatCard label="Tasks updated" value={c.tasksUpdated ?? 0} hint="Last import" />
              <StatCard label="Need review" value={overview.open.length} tone={overview.open.length ? "warning" : undefined} />
            </div>
            <SyncButtons disabled={!status.configured} />
            <AutoImportToggle on={overview.autoImport} />
          </CardBody>
        </Card>

        {people.length > 0 && (
          <Card>
            <CardHeader title="People to identify" description="Names in the sheet that don't match exactly one Development employee. Nothing is guessed." />
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
            <CardHeader title="Project names to map" description={`Names used in “${TABS.daily}” that aren't in the project tabs. Mapping a name applies to every row that uses it.`} />
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
          <CardHeader title="Review queue" description="Rows the sync won't import on its own. Decisions are applied on the next Check or Sync." />
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
                          <strong>{v["Date"]}</strong> · {v["Project Name"] || "—"} · {[v["Frontend Developer"], v["Backend Developer"]].filter(Boolean).join(" / ") || "no developer"} · start {v["Start Date"] || "—"}
                          <span className="mt-1 block whitespace-pre-line text-c-muted">{(v["Daily Task / Deliverable"] ?? "").slice(0, 400)}</span>
                        </>
                      ) : (
                        <>
                          <strong>{v["Project Name"]}</strong> · {v["Project URL"] || "no URL"} · {[v["Frontend Developer"], v["Backend Developer"]].filter(Boolean).join(" / ") || "no developer"} · {v["Environment Status"] || "—"} / {v["Development Status"] || "—"}
                        </>
                      )}
                    </p>
                    {r.reviewDetail && <p className="text-[0.8125rem] text-c-muted">{r.reviewDetail}</p>}
                    <RowDecisionForm id={r.id} choices={choices} needsProject={NEEDS_PROJECT.includes(r.reviewReason ?? "")} needsPerson={NEEDS_PERSON.includes(r.reviewReason ?? "")} needsDate={r.reviewReason === "ambiguous_date"} projects={options.projects} employees={options.employees} tasks={options.tasks} />
                  </div>
                );
              })}
            </CardBody>
          ) : (
            <EmptyState title="Nothing to review" description="Everything in the sheet either imported or is waiting for the next sync." />
          )}
        </Card>

        {overview.aliases.length > 0 && (
          <Card>
            <CardHeader title="Name mappings" description="Removing a mapping affects future syncs only; records already imported stay as they are." />
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
          <CardHeader title="Sync history" description="The last 20 runs." />
          {overview.runs.length ? (
            <Table>
              <THead><tr><th>Started</th><th>Trigger</th><th>Mode</th><th>Result</th><th>Projects (new / upd.)</th><th>Tasks (new / upd.)</th><th>Updates added</th><th>Review</th></tr></THead>
              <TBody>
                {overview.runs.map((r) => {
                  const k = r.counts ?? {};
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{formatDateTime(r.startedAt, tz)}</td>
                      <td>{r.trigger === "scheduled" ? "Daily" : "Manual"}</td>
                      <td>{r.mode === "import" ? "Import" : "Check"}</td>
                      <td>{r.status === "succeeded" ? <Badge tone="success">Succeeded</Badge> : r.status === "failed" ? <Badge tone="danger">Failed</Badge> : <Badge tone="warning">Running</Badge>}{r.error && <span className="mt-1 block max-w-xs text-xs text-c-danger">{r.error}</span>}</td>
                      <td className="tabular">{r.counts ? `${k.projectsCreated ?? 0} / ${k.projectsUpdated ?? 0}` : "—"}</td>
                      <td className="tabular">{r.counts ? `${k.tasksCreated ?? 0} / ${k.tasksUpdated ?? 0}` : "—"}</td>
                      <td className="tabular">{r.counts ? k.updatesAdded ?? 0 : "—"}</td>
                      <td className="tabular">{r.counts ? k.review ?? 0 : "—"}</td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <CardBody><p className="text-sm text-c-muted">No syncs yet. Use “Check sheet” first to see what would be imported.</p></CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
