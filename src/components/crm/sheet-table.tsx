"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { SheetRow } from "@/crm/integrations/dev-sheet/view";
import { cn } from "@/lib/utils";
import { inputClass } from "./forms";

const PAGE_SIZES = [100, 250, 500];

/**
 * One uploaded CSV, shown exactly as uploaded: the file's own headings and
 * columns in order, every row in order with its row number, every cell as
 * it is (blank stays blank). Read-only; nothing here changes the data.
 */
export function SheetTable({ columns, rows, headerRow, fileName }: { columns: { letter: string; heading: string }[]; rows: SheetRow[]; headerRow: number; fileName: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(PAGE_SIZES[0]!);
  const [wrap, setWrap] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => String(r.n) === q || r.cells.some((c) => c.toLowerCase().includes(q)));
  }, [rows, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * size, current * size + size);
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
        <label className="flex items-center gap-2 text-xs text-c-muted">
          Rows per page
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            className={cn(inputClass, "w-auto py-1 pr-8")}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setWrap((w) => !w)} className="ml-auto text-xs font-medium text-c-accent-text hover:underline">
          {wrap ? "Shorten long text" : "Show all text in full"}
        </button>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-c-border">
        <table className="min-w-full border-separate border-spacing-0 text-left text-[0.8125rem]">
          <thead>
            <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:border-b [&>th]:border-c-border [&>th]:bg-c-surface-2 [&>th]:px-3 [&>th]:py-2 [&>th]:align-bottom [&>th]:font-medium">
              <th scope="col" className="left-0 z-30! w-14 min-w-14 border-r text-right text-xs text-c-subtle" title={`The headings are row ${headerRow} of the file`}>
                {headerRow}
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
            {visible.map((r) => (
              <tr key={r.n} className="group [&>td]:border-b [&>td]:border-c-border [&>td]:px-3 [&>td]:py-2 [&>td]:align-top">
                <th scope="row" className="sticky left-0 z-10 border-r border-b border-c-border bg-c-surface px-3 py-2 text-right align-top text-xs font-normal text-c-subtle tabular group-hover:bg-c-surface-2">
                  {r.n}
                </th>
                {r.cells.map((v, i) => (
                  <td key={i} className={cn("border-r border-c-border group-hover:bg-c-surface-2", longCol[i] ? "max-w-[32rem]" : "max-w-[20rem]")}>
                    {v !== "" && <div className={cn("break-words whitespace-pre-wrap", !wrap && "line-clamp-4")} title={!wrap && (v.length > 160 || v.split("\n").length > 4) ? v : undefined}>{v}</div>}
                  </td>
                ))}
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-c-muted">
                  No rows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-c-muted">
        <span>
          {filtered.length ? `Showing rows ${current * size + 1}–${Math.min(filtered.length, current * size + size)} of ${filtered.length}` : "0 rows"}
          {filtered.length !== rows.length ? ` (search: ${filtered.length} of ${rows.length})` : ""}
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
