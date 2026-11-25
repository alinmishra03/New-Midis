"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, Wrench } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { CellNote, OtherItem, RowStatus, SheetRow } from "@/crm/integrations/dev-sheet/view";
import { cn } from "@/lib/utils";
import { PersonMapForm, ProjectNameMapForm, RowDecisionForm } from "./integrations";
import { inputClass } from "./forms";
import { Badge, type Tone } from "./ui";

type Opt = { value: string; label: string };
export type SheetOptions = { employees: Opt[]; projects: Opt[]; tasks: Opt[] };

const STATUS: Record<RowStatus, { label: string; tone: Tone }> = {
  review: { label: "Needs review", tone: "warning" },
  decided: { label: "Decision saved", tone: "info" },
  ready: { label: "Ready", tone: "success" },
  imported: { label: "Imported", tone: "accent" },
  duplicate: { label: "Duplicate", tone: "neutral" },
  ignored: { label: "Ignored", tone: "neutral" },
  empty: { label: "Empty row", tone: "neutral" },
  unchecked: { label: "Not checked", tone: "neutral" },
};
const ORDER: RowStatus[] = ["review", "decided", "ready", "imported", "duplicate", "ignored", "empty", "unchecked"];
const PAGE = 100;
const LONG = 140;

/** True when a cell would be cut off by the 3-line clamp. */
const isLong = (v: string) => v.length > LONG || v.split("\n").length > 3;

function Note({ note }: { note: CellNote }) {
  if (note.kind === "project") return <span className="block text-[0.6875rem] text-c-accent-text">→ CRM: {note.to}</span>;
  if (note.state === "matched") return <span className="block text-[0.6875rem] text-c-success" title={`“${note.name}” in the sheet`}>→ {note.to}</span>;
  if (note.state === "ignored") return <span className="block text-[0.6875rem] text-c-subtle">“{note.name}” ignored</span>;
  return <span className="block text-[0.6875rem] font-medium text-c-warning">“{note.name}” not matched</span>;
}

/**
 * One uploaded CSV as a spreadsheet: the original headings and cells exactly
 * as uploaded, with the CRM's import status in its own column. Rows that need
 * a decision open an inline editor; nothing here edits the uploaded data.
 */
export function SheetTable({ columns, rows, options, fileName }: { columns: { letter: string; heading: string }[]; rows: SheetRow[]; options: SheetOptions; fileName: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RowStatus | "all" | "attention">("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [wrapAll, setWrapAll] = useState(false);

  const attention = (r: SheetRow) => r.status === "review" || !!r.people?.length;
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const r of rows) c.set(r.status, (c.get(r.status) ?? 0) + 1);
    c.set("attention", rows.filter(attention).length);
    return c;
  }, [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "attention" ? !attention(r) : filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return String(r.n) === q || r.cells.some((c) => c.toLowerCase().includes(q)) || (r.reason ?? "").toLowerCase().includes(q) || (r.detail ?? "").toLowerCase().includes(q);
    });
  }, [rows, query, filter]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE, current * PAGE + PAGE);
  const toggle = (n: number) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    return next;
  });
  const chip = (key: RowStatus | "all" | "attention", label: string, n: number) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        setFilter(key);
        setPage(0);
      }}
      aria-pressed={filter === key}
      className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", filter === key ? "border-c-accent bg-c-accent-soft text-c-accent-text" : "border-c-border text-c-muted hover:bg-c-hover")}
    >
      {label} <span className="tabular">{n}</span>
    </button>
  );
  const longCol = columns.map((c) => /task|deliverable|description|note/i.test(c.heading));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1 sm:max-w-xs">
          <span className="sr-only">Search {fileName}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-c-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search cells or row number"
            className={cn(inputClass, "pl-9")}
          />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by import status">
          {chip("all", "All rows", rows.length)}
          {(counts.get("attention") ?? 0) > 0 && chip("attention", "Needs attention", counts.get("attention")!)}
          {ORDER.filter((s) => s !== "review" && counts.get(s)).map((s) => chip(s, STATUS[s].label, counts.get(s)!))}
        </div>
        <button type="button" onClick={() => setWrapAll((w) => !w)} className="ml-auto text-xs font-medium text-c-accent-text hover:underline">
          {wrapAll ? "Collapse long text" : "Show all text in full"}
        </button>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-c-border">
        <table className="min-w-full border-separate border-spacing-0 text-left text-[0.8125rem]">
          <thead>
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:border-b [&>th]:border-c-border [&>th]:bg-c-surface-2 [&>th]:px-3 [&>th]:py-2 [&>th]:align-bottom [&>th]:font-medium">
              <th scope="col" className="left-0 z-30! w-14 min-w-14 border-r text-right text-xs text-c-subtle">Row</th>
              <th scope="col" className="left-14 z-30! w-52 min-w-52 border-r-2 border-r-c-border-strong text-xs text-c-muted">
                Import status
                <span className="block text-[0.6875rem] font-normal text-c-subtle">CRM · not part of the CSV</span>
              </th>
              {columns.map((c, i) => (
                <th key={i} scope="col" className={cn("border-r border-c-border text-c-fg", longCol[i] ? "min-w-[22rem]" : "min-w-[9rem]")}>
                  <span className="block text-[0.625rem] font-normal tracking-wide text-c-subtle">{c.letter}</span>
                  <span className="whitespace-pre-wrap">{c.heading}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const expanded = wrapAll || open.has(r.n);
              const fixable = !!(r.review || r.people?.length || r.projectName);
              const st = STATUS[r.status];
              const dim = r.status === "empty" || r.status === "duplicate" || r.status === "ignored";
              return (
                <Fragment key={r.n}>
                  <tr className={cn("group [&>td]:border-b [&>td]:border-c-border [&>td]:px-3 [&>td]:py-2 [&>td]:align-top", dim && "text-c-muted")}>
                    <td className="sticky left-0 z-10 border-r bg-c-surface text-right text-xs text-c-subtle tabular group-hover:bg-c-surface-2">
                      <button type="button" onClick={() => toggle(r.n)} className="inline-flex items-center gap-0.5 hover:text-c-fg" aria-expanded={open.has(r.n)} aria-label={`Row ${r.n}: ${open.has(r.n) ? "collapse" : "expand"}`}>
                        {r.n}
                        {open.has(r.n) ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </button>
                    </td>
                    <td className="sticky left-14 z-10 border-r-2 border-r-c-border-strong bg-c-surface group-hover:bg-c-surface-2">
                      <Badge tone={st.tone} dot>{st.label}</Badge>
                      {r.reason && r.reason !== st.label && <span className="mt-1 block text-xs text-c-muted">{r.reason}</span>}
                      {!!r.people?.length && r.status !== "review" && <span className="mt-1 block text-xs font-medium text-c-warning">{r.people.length === 1 ? "1 name" : `${r.people.length} names`} to match</span>}
                      {fixable && (
                        <button type="button" onClick={() => toggle(r.n)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-c-accent-text hover:underline">
                          <Wrench className="size-3" /> {open.has(r.n) ? "Close" : "Resolve"}
                        </button>
                      )}
                    </td>
                    {r.cells.map((v, i) => (
                      <td key={i} className={cn("border-r border-c-border", r.status === "review" && "bg-c-warning-soft/40", longCol[i] ? "max-w-[32rem]" : "max-w-[20rem]")}>
                        {v !== "" && <div className={cn("break-words whitespace-pre-wrap", !expanded && "line-clamp-3")}>{v}</div>}
                        {!expanded && isLong(v) && (
                          <button type="button" onClick={() => toggle(r.n)} className="mt-0.5 text-[0.6875rem] font-medium text-c-accent-text hover:underline">
                            Show full text
                          </button>
                        )}
                        {r.notes?.[i]?.map((n, k) => <Note key={k} note={n} />)}
                      </td>
                    ))}
                  </tr>
                  {open.has(r.n) && (
                    <tr>
                      <td colSpan={columns.length + 2} className="border-b border-c-border bg-c-surface-2 p-0">
                        <div className="sticky left-0 w-[min(60rem,85vw)] space-y-3 p-4">
                          <p className="text-sm">
                            <strong>Row {r.n}</strong> · <Badge tone={st.tone}>{st.label}</Badge> {r.reason && r.reason !== st.label && <span className="text-c-muted">{r.reason}</span>}
                          </p>
                          {r.detail && <p className="text-[0.8125rem] text-c-muted">{r.detail}</p>}
                          {r.projectName && (
                            <div className="space-y-1">
                              <p className="text-[0.8125rem]">
                                Map the project name <strong>“{r.projectName.name}”</strong> to a CRM project. This applies to all {r.projectName.rows} row{r.projectName.rows === 1 ? "" : "s"} using it, now and in later imports. The sheet keeps its original name.
                              </p>
                              <ProjectNameMapForm name={r.projectName.name} projects={options.projects} />
                            </div>
                          )}
                          {r.people?.map((p) => (
                            <div key={p.recordId} className="space-y-1">
                              <p className="text-[0.8125rem]">
                                Match the name <strong>“{p.name}”</strong> to a Development employee. This applies to every row using it; the sheet keeps the original name.{p.detail ? <span className="text-c-muted"> {p.detail}</span> : null}
                              </p>
                              <PersonMapForm id={p.recordId} employees={options.employees} />
                            </div>
                          ))}
                          {r.review && (
                            <div className="space-y-1">
                              <p className="text-[0.8125rem]">{r.projectName || r.people?.length ? "Or decide for this row only:" : "Decide for this row:"}</p>
                              <RowDecisionForm id={r.review.recordId} choices={r.review.choices} needsProject={r.review.needsProject} needsPerson={r.review.needsPerson} needsDate={r.review.needsDate} projects={options.projects} employees={options.employees} tasks={options.tasks} />
                            </div>
                          )}
                          {!fixable && <p className="text-[0.8125rem] text-c-muted">Nothing to resolve on this row.</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-sm text-c-muted">
                  No rows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-c-muted">
        <span>
          {filtered.length ? `Rows ${current * PAGE + 1}–${Math.min(filtered.length, current * PAGE + PAGE)} of ${filtered.length}` : "0 rows"}
          {filtered.length !== rows.length ? ` (filtered from ${rows.length})` : ""}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded-md p-1 hover:bg-c-hover disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </button>
            <span className="tabular">
              Page {current + 1} of {pages}
            </span>
            <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded-md p-1 hover:bg-c-hover disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Review items that aren't on any uploaded row (for example a row that was imported earlier and has since been removed). */
export function OtherReviewItems({ items, options }: { items: OtherItem[]; options: SheetOptions }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="divide-y divide-c-border">
      {items.map((it) => (
        <li key={it.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
            <Badge tone="warning" dot>Needs review</Badge>
            <span className="font-medium">{it.label}</span>
            <span className="text-c-muted">— {it.reason}</span>
            <button type="button" onClick={() => setOpen(open === it.id ? null : it.id)} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-c-accent-text hover:underline">
              <Wrench className="size-3" /> {open === it.id ? "Close" : "Resolve"}
            </button>
          </div>
          {open === it.id && (
            <div className="space-y-2 rounded-lg bg-c-surface-2 p-3">
              {it.detail && <p className="text-[0.8125rem] text-c-muted">{it.detail}</p>}
              {it.person && <PersonMapForm id={it.person.recordId} employees={options.employees} />}
              {it.editor && <RowDecisionForm id={it.editor.recordId} choices={it.editor.choices} needsProject={it.editor.needsProject} needsPerson={it.editor.needsPerson} needsDate={it.editor.needsDate} projects={options.projects} employees={options.employees} tasks={options.tasks} />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
