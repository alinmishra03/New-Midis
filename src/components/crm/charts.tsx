"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Portal charts, following the dataviz method: thin marks with 4px rounded
 * data-ends anchored to the baseline, 2px surface gaps between fills,
 * recessive grid, one axis, hover tooltips on every mark, values available
 * as text (direct labels or a visually hidden table), and colour from the
 * validated tokens in globals.css (--viz-*). Text never takes series colour.
 */

/* ----------------------------------------------------------------- BarList */

/** Ranked horizontal bars, single series, every bar directly labelled with its value. */
export function BarList({
  items,
  suffix = "",
  empty = "No data yet.",
}: {
  items: { label: string; value: number; href?: string; hint?: string }[];
  /** Appended to each value, e.g. "%" or " d". (Props must be serialisable: no formatter functions.) */
  suffix?: string;
  empty?: string;
}) {
  const format = (v: number) => `${v.toLocaleString("en-IN")}${suffix}`;
  if (!items.length || items.every((i) => i.value === 0)) return <p className="py-6 text-center text-[0.8125rem] text-c-subtle">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const row = (
          <>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8125rem]">
              <span className="truncate text-c-fg">{item.label}</span>
              <span className="tabular shrink-0 font-medium text-c-fg">{format(item.value)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-c-hover" title={`${item.label}: ${format(item.value)}${item.hint ? ` · ${item.hint}` : ""}`}>
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{ width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / max) * 100)}%`, background: "var(--viz-single)" }}
              />
            </div>
          </>
        );
        return (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href} className="block rounded-md hover:[&_span:first-child]:text-c-accent-text">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------- ColumnChart */

/**
 * Vertical columns over a category axis (e.g. days), single series, one
 * y-axis. Hover (or focus) any column for its exact value; the full data is
 * also in a visually hidden table for screen readers.
 */
export function ColumnChart({
  data,
  height = 180,
  suffix = "",
  max: fixedMax,
  label,
  valueLabel = "Value",
}: {
  data: { label: string; value: number; detail?: string }[];
  height?: number;
  suffix?: string;
  max?: number;
  label: string;
  valueLabel?: string;
}) {
  const format = (v: number) => `${Math.round(v).toLocaleString("en-IN")}${suffix}`;
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <p className="py-6 text-center text-[0.8125rem] text-c-subtle">No data yet.</p>;

  const max = fixedMax ?? niceMax(Math.max(...data.map((d) => d.value), 1));
  const ticks = [0, max / 2, max];
  const W = 100; // viewBox units per chart width; columns are laid out in percentages
  const band = W / data.length;
  const colW = Math.min(band * 0.56, 7);
  const plotH = height - 28;

  return (
    <figure className="relative" aria-label={label}>
      <div className="relative" style={{ height }}>
        {/* grid + y labels */}
        {ticks.map((t) => {
          const y = plotH - (t / max) * plotH;
          return (
            <div key={t} className="pointer-events-none absolute inset-x-0" style={{ top: y }}>
              <div className="ml-9 border-t" style={{ borderColor: "var(--viz-grid)" }} />
              <span className="tabular absolute -top-2 left-0 w-8 text-right text-[0.6875rem] text-c-subtle">{format(t)}</span>
            </div>
          );
        })}
        <svg className="absolute top-0 right-0 left-9 overflow-visible" style={{ height: plotH, width: "calc(100% - 2.25rem)" }} viewBox={`0 0 ${W} ${plotH}`} preserveAspectRatio="none" aria-hidden>
          {data.map((d, i) => {
            const h = d.value > 0 ? Math.max(2, (d.value / max) * plotH) : 0;
            const x = i * band + (band - colW) / 2;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={plotH - h}
                  width={colW}
                  height={h}
                  rx={Math.min(colW / 2, 1.2)}
                  fill="var(--viz-single)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  className="transition-opacity"
                />
              </g>
            );
          })}
        </svg>
        {/* Hit targets: the whole band, wider and taller than the mark. */}
        <div className="absolute top-0 right-0 left-9 flex" style={{ height: plotH }}>
          {data.map((d, i) => (
            <button
              key={i}
              type="button"
              className="h-full flex-1 cursor-default focus-visible:outline-offset-0"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.label}: ${format(d.value)}${d.detail ? `, ${d.detail}` : ""}`}
            />
          ))}
        </div>
        {/* x labels: every label when few, otherwise every other */}
        <div className="absolute right-0 bottom-0 left-9 flex">
          {data.map((d, i) => (
            <span key={i} className={cn("flex-1 truncate text-center text-[0.6875rem] text-c-subtle", data.length > 12 && i % 2 === 1 && "invisible")}>
              {d.label}
            </span>
          ))}
        </div>
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-c-border bg-c-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-c-lg"
            style={{
              left: `calc(2.25rem + (100% - 2.25rem) * ${(hover + 0.5) / data.length})`,
              top: Math.max(0, plotH - (data[hover]!.value / max) * plotH - 44),
            }}
          >
            <span className="block text-c-muted">{data[hover]!.label}</span>
            <span className="tabular font-semibold text-c-fg">{format(data[hover]!.value)}</span>
            {data[hover]!.detail && <span className="block text-c-muted">{data[hover]!.detail}</span>}
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Label</th>
            <th>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/* ----------------------------------------------------------- SegmentedBar */

/**
 * Parts of a whole as one bar (up to four categories, palette slots 1–4 in
 * fixed order), with a legend that names each part and gives its count —
 * identity is never colour alone.
 */
export function SegmentedBar({ segments, label }: { segments: { label: string; value: number }[]; label: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <figure aria-label={label}>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-c-hover">
        {total > 0 &&
          segments.map((s, i) =>
            s.value > 0 ? (
              <div
                key={s.label}
                title={`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="h-full transition-opacity first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(s.value / total) * 100}%`, background: `var(--viz-${i + 1})`, opacity: hover === null || hover === i ? 1 : 0.5 }}
              />
            ) : null,
          )}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-[0.8125rem]">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: `var(--viz-${i + 1})` }} />
            <span className="truncate text-c-muted">{s.label}</span>
            <span className="tabular ml-auto font-medium text-c-fg">{s.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
