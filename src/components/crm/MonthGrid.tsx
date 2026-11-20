import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { daysBetweenInclusive, endOfMonth, formatMonth, isoWeekday, addDays } from "@/crm/lib/time";
import { cn } from "@/lib/utils";
import { Avatar, buttonClass } from "./ui";

export type GridEntry = { employeeId: string; name: string; photoFileId: string | null; startDate: string; endDate: string; label: string; color: string; pending?: boolean; half?: boolean };

/**
 * A people × days month view (team leave / WFH calendars). Scrolls
 * horizontally on narrow screens; each cell has a text tooltip and the
 * legend names every colour, so identity is never colour alone.
 */
export function MonthGrid({
  month,
  entries,
  people,
  holidays,
  weekendDays,
  hrefFor,
  today,
  legend,
}: {
  month: string;
  entries: GridEntry[];
  people: { id: string; name: string; photoFileId: string | null }[];
  holidays: { date: string; name: string }[];
  weekendDays: number[];
  hrefFor: (month: string) => string;
  today: string;
  legend: { label: string; color: string }[];
}) {
  const from = `${month}-01`;
  const days = daysBetweenInclusive(from, endOfMonth(from));
  const prev = addDays(from, -1).slice(0, 7);
  const next = addDays(endOfMonth(from), 1).slice(0, 7);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-c-border px-5 py-3">
        <div className="flex items-center gap-1">
          <Link href={hrefFor(prev)} className={buttonClass("ghost", "icon")} aria-label="Previous month">
            <ChevronLeft />
          </Link>
          <p className="min-w-36 text-center text-sm font-semibold">{formatMonth(from)}</p>
          <Link href={hrefFor(next)} className={buttonClass("ghost", "icon")} aria-label="Next month">
            <ChevronRight />
          </Link>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-c-muted">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm border border-dashed border-c-border-strong" /> Pending
          </li>
        </ul>
      </div>
      {people.length === 0 ? (
        <p className="px-5 py-10 text-center text-[0.8125rem] text-c-subtle">No one to show.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-40 bg-c-surface px-4 py-2 text-left font-medium text-c-muted">Person</th>
                {days.map((d) => (
                  <th key={d} className={cn("min-w-7 px-0 py-2 text-center font-medium", d === today ? "text-c-accent-text" : "text-c-subtle", weekendDays.includes(isoWeekday(d)) && "bg-c-surface-2")}>
                    <span className="block text-[0.625rem] leading-none">{"MTWTFSS"[isoWeekday(d) - 1]}</span>
                    <span className="tabular">{Number(d.slice(8))}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const mine = entries.filter((e) => e.employeeId === p.id);
                return (
                  <tr key={p.id} className="border-t border-c-border">
                    <td className="sticky left-0 z-10 bg-c-surface px-4 py-1.5">
                      <span className="flex items-center gap-2">
                        <Avatar name={p.name} photoFileId={p.photoFileId} size={22} />
                        <span className="truncate text-[0.8125rem]">{p.name}</span>
                      </span>
                    </td>
                    {days.map((d) => {
                      const e = mine.find((x) => x.startDate <= d && x.endDate >= d);
                      const hol = holidays.find((h) => h.date === d);
                      const weekend = weekendDays.includes(isoWeekday(d));
                      return (
                        <td key={d} className={cn("h-8 p-0.5 text-center", weekend && "bg-c-surface-2")} title={e ? `${p.name}: ${e.label}${e.pending ? " (pending)" : ""}` : hol ? hol.name : undefined}>
                          {e && !weekend && !hol ? (
                            <span
                              className={cn("block h-5 rounded-[4px]", e.pending && "border border-dashed bg-transparent!")}
                              style={{ background: e.color, borderColor: e.color, opacity: e.half ? 0.55 : 1 }}
                            >
                              <span className="sr-only">{e.label}</span>
                            </span>
                          ) : hol ? (
                            <span className="block h-5 rounded-[4px] bg-c-accent-soft" aria-label={hol.name} />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
