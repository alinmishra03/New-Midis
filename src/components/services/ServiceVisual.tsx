import type { ReactNode } from "react";
import type { ServiceVisual as ServiceKind } from "@/content/service-details/types";
import { cn } from "@/lib/utils";

/**
 * Topic-specific hero artwork for service pages.
 *
 * Each composition is a stylised interface for what the service produces —
 * a search result for SEO, a conversation for AI, a storefront for Shopify —
 * built from HTML and SVG rather than screenshots or stock imagery. That keeps
 * it crisp at any size, costs no network requests, and means nothing in it
 * can be mistaken for a real client's data: every figure is shape, not
 * number. Purely decorative, so it is hidden from assistive technology.
 *
 * Motion is CSS-only (the `sv-*` classes in globals.css) and switches off
 * under reduced-motion preferences.
 */
/** Compositions for non-service pages: hubs, company pages, sectors, tools. */
export type PageVisualKind =
  | "hub"
  | "about"
  | "process"
  | "team"
  | "faq"
  | "sectors"
  | "insights"
  | "why"
  | "audit"
  | "work"
  | "booking"
  | "listing"
  | "specs";

type Kind = ServiceKind | PageVisualKind;

export function ServiceVisual({ kind, label = "", className }: { kind: Kind; label?: string; className?: string }) {
  const Comp = visuals[kind];
  return (
    <div aria-hidden="true" className={cn("relative select-none", className)}>
      {/* Soft brand glow behind the composition. */}
      <div className="accent-glow absolute -inset-6 rounded-full opacity-[0.12] blur-3xl" />
      <Comp label={label} />
    </div>
  );
}

/* ----------------------------------------------------------- primitives */

function Window({ children, title, className }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(23,25,28,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-line bg-paper px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        {title && (
          <span className="ml-3 truncate rounded-full bg-surface px-3 py-1 text-[0.625rem] text-muted">{title}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/** A floating secondary card, offset from the main window. */
function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sv-float absolute rounded-xl border border-line bg-surface p-3 shadow-[0_20px_50px_-20px_rgba(23,25,28,0.4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Line({ w, className }: { w: string; className?: string }) {
  return <span className={cn("block h-2 rounded-full bg-line", className)} style={{ width: w }} />;
}

function Bars({ heights, accentFrom = 99, className }: { heights: number[]; accentFrom?: number; className?: string }) {
  return (
    <div className={cn("flex h-full items-end gap-1.5", className)}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn("sv-grow flex-1 rounded-t-[3px]", i >= accentFrom ? "bg-accent" : "bg-ink/10")}
          style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}

/** Rising line chart with a draw-on stroke. */
function Trend({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={cn("h-full w-full", className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sv-trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#EF8716" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#EF8716" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 64 L30 62 L55 58 L80 50 L105 44 L130 34 L155 26 L180 16 L200 8 L200 80 L0 80 Z" fill="url(#sv-trend-fill)" />
      <path
        className="sv-draw"
        d="M0 64 L30 62 L55 58 L80 50 L105 44 L130 34 L155 26 L180 16 L200 8"
        fill="none"
        stroke="#EF8716"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Check() {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[0.55rem] font-bold text-ink">
      ✓
    </span>
  );
}

/* ------------------------------------------------------------- visuals */

function WebVisual({ label }: { label: string }) {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="midis.in / new-site">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="h-3 w-14 rounded-full bg-ink" />
            <div className="flex gap-2">
              <Line w="2rem" />
              <Line w="2rem" />
              <Line w="2rem" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-[1.2fr_1fr] gap-4">
            <div className="space-y-2.5">
              <span className="block h-4 w-[90%] rounded bg-ink" />
              <span className="block h-4 w-[70%] rounded bg-ink" />
              <Line w="85%" className="mt-4" />
              <Line w="65%" />
              <span className="mt-4 inline-block h-6 w-20 rounded-full bg-accent" />
            </div>
            <div className="sv-shimmer rounded-xl bg-gradient-to-br from-accent/25 via-accent-soft to-paper" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-line p-2.5">
                <span className="block h-6 w-6 rounded-md bg-accent-soft" />
                <Line w="80%" className="mt-2.5" />
                <Line w="55%" className="mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      </Window>
      <Chip className="-bottom-0 right-0 w-48 bg-ink! border-line-dark!">
        <p className="font-mono text-[0.625rem] leading-relaxed text-surface/70">
          <span className="text-accent">export default</span> function
          <br />
          <span className="text-surface">{label.replace(/\s+/g, "")}</span>() {"{"}
          <br />
          &nbsp;&nbsp;return &lt;<span className="text-accent">Page</span> /&gt;
          <span className="sv-caret ml-0.5 inline-block h-2.5 w-1 translate-y-0.5 bg-accent" />
        </p>
      </Chip>
      <Chip className="-left-4 top-24 hidden sm:block" >
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">Lighthouse</p>
        <div className="mt-2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-accent" />
          ))}
        </div>
      </Chip>
    </div>
  );
}

function UiUxVisual() {
  return (
    <div className="relative pb-8 pl-6">
      <Window title="Design file — flows">
        <div className="grid grid-cols-[3.5rem_1fr] bg-paper">
          <div className="space-y-2 border-r border-line bg-surface p-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={cn("block h-2 rounded-full", i === 1 ? "bg-accent" : "bg-line")} />
            ))}
          </div>
          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "sv-float flex-1 rounded-lg border bg-surface p-2",
                    i === 1 ? "border-accent ring-2 ring-accent/30" : "border-line",
                  )}
                  style={{ animationDelay: `${i * 400}ms` }}
                >
                  <span className="block h-10 rounded bg-accent-soft" />
                  <Line w="80%" className="mt-2" />
                  <Line w="50%" className="mt-1.5" />
                  <span className="mt-2 block h-3 rounded-full bg-ink/80" />
                </div>
              ))}
            </div>
            <svg viewBox="0 0 300 40" className="mt-3 h-8 w-full" fill="none">
              <path d="M40 4 C 80 36, 120 36, 150 8 S 230 -10, 260 30" stroke="#EF8716" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {["bg-ink", "bg-accent", "bg-accent-soft", "bg-line"].map((c) => (
                <span key={c} className={cn("h-6 rounded-md", c)} />
              ))}
            </div>
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 left-0 flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-accent" />
        <div>
          <Line w="4rem" />
          <Line w="2.5rem" className="mt-1.5" />
        </div>
      </Chip>
      <svg viewBox="0 0 24 24" className="sv-cursor absolute right-[22%] top-[38%] h-5 w-5 drop-shadow" fill="#17191C">
        <path d="M3 2l7 19 2.5-7.5L20 11z" />
      </svg>
    </div>
  );
}

function EcommerceVisual() {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="store / collections / new">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="h-3 w-16 rounded-full bg-ink" />
            <span className="relative h-6 w-6 rounded-md border border-line">
              <span className="sv-pulse absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <span
                  className={cn(
                    "block aspect-square rounded-lg",
                    i % 3 === 0 ? "bg-accent-soft" : i % 3 === 1 ? "bg-paper" : "bg-ink/[0.06]",
                  )}
                />
                <Line w="80%" className="mt-2" />
                <span className="mt-1.5 block h-2 w-8 rounded-full bg-accent/60" />
              </div>
            ))}
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 right-0 w-44">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">Checkout</p>
        <div className="mt-2 space-y-1.5">
          <Line w="100%" />
          <Line w="70%" />
        </div>
        <span className="mt-3 flex h-6 items-center justify-center rounded-full bg-ink text-[0.6rem] font-medium text-surface">
          Complete order
        </span>
      </Chip>
    </div>
  );
}

function SeoVisual() {
  return (
    <div className="relative pb-12 pr-6">
      <Window title="Search">
        <div className="p-5">
          <div className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6" />
              <path d="M14 14l4 4" />
            </svg>
            <Line w="45%" />
            <span className="sv-caret h-3 w-px bg-ink" />
          </div>
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn("rounded-lg p-3", i === 0 && "sv-rank border border-accent/40 bg-accent-soft/60")}
              >
                <span className={cn("block h-1.5 w-24 rounded-full", i === 0 ? "bg-accent-ink/60" : "bg-line")} />
                <span className={cn("mt-2 block h-3 rounded", i === 0 ? "w-[75%] bg-ink" : "w-[60%] bg-ink/30")} />
                <Line w="90%" className="mt-2" />
              </div>
            ))}
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 right-0 w-52">
        <div className="flex items-center justify-between">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">Organic clicks</p>
          <span className="text-[0.625rem] font-semibold text-accent-ink">▲</span>
        </div>
        <div className="mt-2 h-14">
          <Trend />
        </div>
      </Chip>
    </div>
  );
}

function AdsVisual() {
  return (
    <div className="relative pb-10 pl-6">
      <Window title="Campaigns — overview">
        <div className="p-5">
          <div className="grid grid-cols-3 gap-2.5">
            {["Spend", "Clicks", "Conversions"].map((k, i) => (
              <div key={k} className={cn("rounded-lg border p-2.5", i === 2 ? "border-accent/50 bg-accent-soft/60" : "border-line")}>
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-muted">{k}</p>
                <span className={cn("mt-2 block h-3 w-10 rounded", i === 2 ? "bg-accent" : "bg-ink/70")} />
              </div>
            ))}
          </div>
          <div className="mt-5 h-28">
            <Bars heights={[30, 42, 38, 50, 46, 58, 62, 70, 66, 80, 86, 92]} accentFrom={8} />
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 left-0 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[0.6rem] font-bold text-accent">G</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-[0.6rem] font-bold text-accent-ink">M</span>
        <div>
          <Line w="3.5rem" />
          <Line w="2rem" className="mt-1.5" />
        </div>
      </Chip>
    </div>
  );
}

function ContentVisual() {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="Draft — editorial">
        <div className="p-6">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-accent-ink">Guide</span>
          <span className="mt-3 block h-4 w-[85%] rounded bg-ink" />
          <span className="mt-2 block h-4 w-[55%] rounded bg-ink" />
          <div className="mt-5 space-y-2">
            <Line w="100%" />
            <Line w="94%" />
            <Line w="97%" />
            <Line w="60%" />
          </div>
          <div className="mt-4 border-l-2 border-accent pl-3">
            <Line w="80%" className="bg-accent/30" />
            <Line w="50%" className="mt-1.5 bg-accent/30" />
          </div>
          <div className="mt-4 space-y-2">
            <Line w="92%" />
            <Line w="40%" />
            <span className="sv-caret inline-block h-3 w-px bg-ink" />
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 right-0 w-44">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">Checklist</p>
        <div className="mt-2 space-y-2">
          {["Search intent", "Structure", "Internal links"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[0.625rem] text-ink">
              <Check />
              {t}
            </div>
          ))}
        </div>
      </Chip>
    </div>
  );
}

function VideoVisual() {
  return (
    <div className="relative pb-10 pl-6">
      <Window title="Edit — timeline">
        <div className="bg-ink p-4">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-ink-soft via-ink to-accent/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-ink">
              <svg viewBox="0 0 20 20" className="ml-0.5 h-4 w-4" fill="currentColor">
                <path d="M5 3l12 7-12 7z" />
              </svg>
            </span>
          </div>
          <div className="relative mt-4 space-y-1.5">
            {[
              ["bg-accent", "8%", "46%"],
              ["bg-surface/30", "20%", "62%"],
              ["bg-accent/50", "0%", "90%"],
            ].map(([c, l, w], i) => (
              <div key={i} className="h-3 rounded bg-surface/5">
                <span className={cn("block h-full rounded", c)} style={{ marginLeft: l, width: w }} />
              </div>
            ))}
            <span className="sv-playhead absolute -top-1 bottom-[-0.25rem] w-px bg-surface" />
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 left-0 w-40">
        <div className="flex aspect-video items-end rounded-md bg-gradient-to-br from-accent/60 to-ink p-1.5">
          <span className="h-2 w-12 rounded-sm bg-surface" />
        </div>
        <Line w="80%" className="mt-2" />
      </Chip>
    </div>
  );
}

function EmailVisual() {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="Automation — welcome series">
        <div className="flex flex-col items-center gap-0 p-6">
          {["Signs up", "Welcome email", "Waits 2 days", "Follow-up"].map((step, i) => (
            <div key={step} className="flex w-full flex-col items-center">
              {i > 0 && <span className="h-5 w-px bg-line" />}
              <div
                className={cn(
                  "sv-float flex w-[78%] items-center gap-3 rounded-lg border px-3 py-2.5",
                  i === 1 ? "border-accent/50 bg-accent-soft/60" : "border-line bg-surface",
                )}
                style={{ animationDelay: `${i * 300}ms` }}
              >
                <span className={cn("h-5 w-5 rounded-md", i === 1 ? "bg-accent" : "bg-ink/10")} />
                <span className="text-[0.65rem] font-medium text-ink">{step}</span>
              </div>
            </div>
          ))}
        </div>
      </Window>
      <Chip className="bottom-0 right-0 w-48">
        <div className="flex items-center gap-2">
          <span className="sv-pulse h-2 w-2 rounded-full bg-accent" />
          <Line w="5rem" className="bg-ink/70" />
        </div>
        <Line w="90%" className="mt-2" />
        <Line w="60%" className="mt-1.5" />
      </Chip>
    </div>
  );
}

function AiVisual() {
  return (
    <div className="relative pb-12 pl-6">
      <Window title="Assistant">
        <div className="space-y-3 p-5">
          <div className="ml-auto w-[70%] rounded-2xl rounded-br-sm bg-ink px-4 py-3">
            <Line w="90%" className="bg-surface/40" />
            <Line w="60%" className="mt-1.5 bg-surface/40" />
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[0.55rem] font-bold text-ink">
              AI
            </span>
            <div className="w-[78%] rounded-2xl rounded-tl-sm border border-line bg-paper px-4 py-3">
              <Line w="95%" />
              <Line w="88%" className="mt-1.5" />
              <Line w="55%" className="mt-1.5" />
              <div className="mt-3 flex gap-1.5">
                <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[0.55rem] text-accent-ink">Source</span>
                <span className="rounded-full border border-line px-2 py-0.5 text-[0.55rem] text-muted">Hand to a person</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pl-8">
            <span className="flex gap-1 rounded-full border border-line bg-surface px-3 py-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="sv-dot h-1.5 w-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </span>
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 left-0 w-56">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">Workflow</p>
        <div className="mt-2.5 flex items-center gap-1.5">
          {["Query", "Retrieve", "Answer"].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              {i > 0 && <span className="h-px w-3 bg-accent" />}
              <span className={cn("rounded-md px-2 py-1 text-[0.55rem] font-medium", i === 2 ? "bg-accent text-ink" : "bg-paper text-ink")}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </Chip>
    </div>
  );
}

function DesignVisual() {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="Brand board">
        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="flex aspect-square items-center justify-center rounded-xl bg-ink">
            <span className="font-display text-5xl font-semibold tracking-tight text-accent">Aa</span>
          </div>
          <div className="grid grid-rows-3 gap-2">
            {["bg-accent", "bg-accent-soft", "bg-ink-soft"].map((c) => (
              <span key={c} className={cn("rounded-lg", c)} />
            ))}
          </div>
          <div className="col-span-2 flex items-center gap-3 rounded-xl border border-line p-3">
            <svg viewBox="0 0 40 40" className="sv-spin-slow h-10 w-10">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#EF8716" strokeWidth="3" strokeDasharray="60 40" />
            </svg>
            <div className="flex-1 space-y-1.5">
              <Line w="70%" className="bg-ink/70" />
              <Line w="45%" />
            </div>
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 right-0 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-8 w-8 rounded-lg", i === 0 ? "bg-accent" : i === 1 ? "rounded-full bg-ink" : "rotate-45 bg-accent-soft")} />
        ))}
      </Chip>
    </div>
  );
}

/* -------------------------------------------------------- page visuals */

/** Services hub: the five practice groups as an orbit of tiles. */
function HubVisual() {
  const groups = ["Design", "Development", "E-commerce", "Growth", "AI"];
  return (
    <div className="relative mx-auto aspect-square max-w-md">
      <div className="absolute inset-[18%] rounded-full border border-dashed border-line" />
      <div className="absolute inset-[34%] flex items-center justify-center rounded-full bg-ink shadow-[0_30px_80px_-30px_rgba(23,25,28,0.6)]">
        <span className="font-display text-2xl font-semibold tracking-tight text-surface">
          mid<span className="text-accent">i</span>s
        </span>
      </div>
      {groups.map((g, i) => {
        const angle = (i / groups.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 38;
        const y = 50 + Math.sin(angle) * 38;
        return (
          <span
            key={g}
            className={cn(
              "sv-float absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium shadow-[0_16px_40px_-20px_rgba(23,25,28,0.4)]",
              i === 0 ? "border-accent bg-accent text-ink" : "border-line bg-surface text-ink",
            )}
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 500}ms` }}
          >
            {g}
          </span>
        );
      })}
    </div>
  );
}

/** About: a collage of the studio's working artefacts. */
function AboutVisual() {
  return (
    <div className="relative grid grid-cols-5 grid-rows-5 gap-3 pb-4" style={{ aspectRatio: "1 / 0.9" }}>
      <div className="col-span-3 row-span-3 flex flex-col justify-between rounded-2xl bg-ink p-5">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-surface/50">Brief</span>
        <div className="space-y-2">
          <span className="block h-3 w-[80%] rounded bg-surface" />
          <span className="block h-3 w-[55%] rounded bg-accent" />
        </div>
      </div>
      <div className="sv-float col-span-2 row-span-2 rounded-2xl border border-line bg-surface p-4">
        <span className="block h-full rounded-lg bg-gradient-to-br from-accent/30 to-accent-soft" />
      </div>
      <div className="col-span-2 row-span-3 rounded-2xl border border-line bg-surface p-4">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted">Outputs</span>
        <div className="mt-3 space-y-2.5">
          {["Sitemap", "Wireframes", "Build", "Launch"].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[0.65rem] text-ink">
              <Check />
              {t}
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-3 row-span-2 rounded-2xl border border-line bg-paper p-4">
        <div className="h-full">
          <Trend />
        </div>
      </div>
    </div>
  );
}

/** Process: the six stages as a vertical progress track. */
function ProcessVisual() {
  const stages = ["Discover", "Strategise", "Design", "Build", "Launch", "Grow"];
  return (
    <div className="relative pb-14 pl-6">
      <Window title="Project — stage tracker">
        <ol className="relative space-y-3 p-6">
          <span className="absolute bottom-9 left-[2.15rem] top-9 w-px bg-line" />
          {stages.map((s, i) => (
            <li key={s} className="relative flex items-center gap-4">
              <span
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.6rem] font-semibold",
                  i < 3 ? "border-accent bg-accent text-ink" : i === 3 ? "sv-pulse border-accent bg-surface text-accent-ink" : "border-line bg-surface text-muted",
                )}
              >
                {i < 3 ? "✓" : i + 1}
              </span>
              <span className={cn("text-xs font-medium", i <= 3 ? "text-ink" : "text-muted")}>{s}</span>
              <span className="ml-auto h-1.5 w-20 overflow-hidden rounded-full bg-line">
                <span className={cn("block h-full rounded-full bg-accent", i < 3 ? "w-full" : i === 3 ? "w-1/2" : "w-0")} />
              </span>
            </li>
          ))}
        </ol>
      </Window>
      <Chip className="bottom-0 left-0">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">This week</p>
        <Line w="7rem" className="mt-2 bg-ink/70" />
        <Line w="5rem" className="mt-1.5" />
      </Chip>
    </div>
  );
}

/** Team: a video-call style grid of people, without portraits. */
function TeamVisual() {
  return (
    <div className="relative pb-8 pr-6">
      <Window title="Project call">
        <div className="grid grid-cols-3 gap-2.5 bg-ink p-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "relative flex aspect-[4/3] items-center justify-center rounded-lg",
                i === 1 ? "bg-ink-soft ring-2 ring-accent" : "bg-ink-soft",
              )}
            >
              <span className={cn("h-9 w-9 rounded-full", i % 2 ? "bg-accent/70" : "bg-surface/25")} />
              <span className="absolute bottom-1.5 left-1.5 h-1.5 w-8 rounded-full bg-surface/30" />
            </div>
          ))}
        </div>
      </Window>
      <Chip className="bottom-0 right-0 flex items-center gap-2">
        <div className="flex -space-x-2">
          {["bg-accent", "bg-ink", "bg-accent-soft"].map((c) => (
            <span key={c} className={cn("h-6 w-6 rounded-full border-2 border-surface", c)} />
          ))}
        </div>
        <span className="text-[0.625rem] font-medium text-ink">Designers &amp; developers</span>
      </Chip>
    </div>
  );
}

/** FAQ: stacked question cards, the first one open. */
function FaqVisual() {
  return (
    <div className="relative space-y-3 pb-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "sv-float rounded-2xl border bg-surface px-5 py-4 shadow-[0_20px_50px_-30px_rgba(23,25,28,0.35)]",
            i === 0 ? "border-accent/50" : "border-line",
          )}
          style={{ marginLeft: `${(i % 2) * 1.5}rem`, animationDelay: `${i * 350}ms` }}
        >
          <div className="flex items-center justify-between gap-4">
            <span className={cn("block h-3 rounded", i === 0 ? "w-[70%] bg-ink" : "w-[55%] bg-ink/40")} />
            <span className={cn("text-sm font-semibold", i === 0 ? "text-accent-ink" : "text-muted")}>{i === 0 ? "–" : "+"}</span>
          </div>
          {i === 0 && (
            <div className="mt-3 space-y-1.5">
              <Line w="95%" />
              <Line w="80%" />
              <Line w="45%" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Industries hub: a mosaic of sector tiles. */
function SectorsVisual() {
  const sectors = ["SaaS", "Healthcare", "Real estate", "E-commerce", "Startups", "Education", "Services", "Manufacturing"];
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {sectors.map((s, i) => (
        <div
          key={s}
          className={cn(
            "sv-float flex aspect-square flex-col justify-end rounded-xl p-2.5 text-[0.6rem] font-medium leading-tight sm:text-[0.65rem]",
            i === 0 || i === 6 ? "bg-ink text-surface" : i === 3 ? "bg-accent text-ink" : "border border-line bg-surface text-ink",
            (i === 0 || i === 5) && "col-span-2 aspect-auto",
          )}
          style={{ animationDelay: `${i * 220}ms` }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

/** Insights: an editorial spread of article cards. */
function InsightsVisual() {
  return (
    <div className="relative pb-8 pr-8">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_30px_80px_-30px_rgba(23,25,28,0.35)]">
        <span className="block aspect-[16/8] rounded-xl bg-gradient-to-br from-ink via-ink-soft to-accent/60" />
        <span className="mt-4 block text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-accent-ink">Performance</span>
        <span className="mt-2 block h-3.5 w-[85%] rounded bg-ink" />
        <span className="mt-1.5 block h-3.5 w-[60%] rounded bg-ink" />
        <div className="mt-4 space-y-1.5">
          <Line w="100%" />
          <Line w="70%" />
        </div>
      </div>
      <Chip className="bottom-0 right-0 w-44">
        <span className="block aspect-video rounded-md bg-accent-soft" />
        <Line w="90%" className="mt-2 bg-ink/60" />
        <Line w="60%" className="mt-1.5" />
      </Chip>
    </div>
  );
}

/** Why MIDIS: a before/after comparison card. */
function WhyVisual() {
  const rows = ["Written outputs per stage", "Direct access to the builders", "Measured against agreed goals", "You own the code"];
  return (
    <div className="relative pb-6 pl-6">
      <Window title="Comparison">
        <div className="p-5">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5 gap-y-3 text-[0.65rem]">
            <span />
            <span className="font-semibold text-muted">Typical</span>
            <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-ink">MIDIS</span>
            {rows.map((r) => (
              <div key={r} className="contents">
                <span className="border-t border-line pt-3 text-ink">{r}</span>
                <span className="border-t border-line pt-3 text-center text-muted">—</span>
                <span className="flex justify-center border-t border-line pt-3">
                  <Check />
                </span>
              </div>
            ))}
          </div>
        </div>
      </Window>
    </div>
  );
}

/** Website audit: Lighthouse-style score gauges. */
function AuditVisual() {
  const scores = [
    ["Performance", 0.72],
    ["Accessibility", 0.9],
    ["Best practice", 0.82],
    ["SEO", 0.95],
  ] as const;
  return (
    <div className="relative pb-6 pr-6">
      <Window title="Lighthouse report">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 p-6 pb-14">
          {scores.map(([label, v]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 40 40" className="h-16 w-16 -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#e8e8e6" strokeWidth="3.5" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#EF8716"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${v * 100} 100`}
                />
              </svg>
              <span className="text-center text-[0.6rem] font-medium text-ink">{label}</span>
            </div>
          ))}
        </div>
      </Window>
      <Chip className="bottom-0 right-0 w-48">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">Top issue</p>
        <Line w="95%" className="mt-2 bg-ink/60" />
        <Line w="65%" className="mt-1.5" />
      </Chip>
    </div>
  );
}

/** Work: overlapping browser frames of delivered sites. */
function WorkVisual() {
  return (
    <div className="relative h-[22rem] sm:h-[24rem]">
      <Window title="project-one.com" className="absolute left-0 top-0 w-[72%] -rotate-2">
        <div className="space-y-2 p-4">
          <span className="block aspect-[16/8] rounded-lg bg-gradient-to-br from-accent/30 to-accent-soft" />
          <Line w="70%" className="bg-ink/70" />
          <Line w="45%" />
        </div>
      </Window>
      <Window title="project-two.com" className="sv-float absolute bottom-0 right-0 w-[72%] rotate-2">
        <div className="space-y-2 bg-ink p-4">
          <span className="block aspect-[16/8] rounded-lg bg-gradient-to-br from-ink-soft to-accent/50" />
          <Line w="70%" className="bg-surface/60" />
          <Line w="45%" className="bg-surface/25" />
        </div>
      </Window>
    </div>
  );
}

/** Healthcare & professional services: appointment booking. */
function BookingVisual() {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="Book an appointment">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="h-3 w-24 rounded bg-ink" />
            <span className="text-[0.6rem] text-muted">‹ ›</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 21 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-[0.55rem]",
                  i === 9 ? "bg-accent font-semibold text-ink" : i % 7 > 4 ? "text-line" : "bg-paper text-ink",
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["09:30", "11:00", "14:15", "16:45"].map((t, i) => (
              <span key={t} className={cn("rounded-full border px-2.5 py-1 text-[0.6rem]", i === 1 ? "border-ink bg-ink text-surface" : "border-line text-ink")}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 right-0 flex items-center gap-2">
        <Check />
        <span className="text-[0.65rem] font-medium text-ink">Booking confirmed</span>
      </Chip>
    </div>
  );
}

/** Real estate: property listing cards with a map pin. */
function ListingVisual() {
  return (
    <div className="relative pb-10 pl-6">
      <Window title="Listings — map view">
        <div className="grid grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 p-4">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-lg border border-line p-2">
                <span className={cn("block aspect-[4/3] rounded-md", i === 0 ? "bg-accent-soft" : "bg-paper")} />
                <Line w="80%" className="mt-2 bg-ink/60" />
                <span className="mt-1.5 block h-2 w-10 rounded-full bg-accent/60" />
              </div>
            ))}
          </div>
          <div className="relative bg-paper">
            <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <path d="M0 40 L100 30 M0 80 L100 95 M30 0 L40 120 M75 0 L65 120" stroke="#e8e8e6" strokeWidth="3" fill="none" />
            </svg>
            {[
              ["30%", "30%"],
              ["65%", "55%"],
              ["40%", "75%"],
            ].map(([l, t], i) => (
              <span
                key={i}
                className={cn("absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface", i === 1 ? "sv-pulse bg-accent" : "bg-ink")}
                style={{ left: l, top: t }}
              />
            ))}
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 left-0 w-40">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">Enquire</p>
        <span className="mt-2 flex h-6 items-center justify-center rounded-full bg-accent text-[0.6rem] font-medium text-ink">Arrange a viewing</span>
      </Chip>
    </div>
  );
}

/** Manufacturing: product catalogue with a specification sheet. */
function SpecsVisual() {
  return (
    <div className="relative pb-10 pr-6">
      <Window title="Products / series / spec">
        <div className="grid grid-cols-[1fr_1.2fr] gap-4 p-5">
          <div className="flex aspect-square items-center justify-center rounded-xl bg-paper">
            <svg viewBox="0 0 60 60" className="sv-spin-slow h-16 w-16" fill="none" stroke="#17191C" strokeWidth="2">
              <circle cx="30" cy="30" r="10" />
              <path d="M30 6v8M30 46v8M6 30h8M46 30h8M13 13l6 6M41 41l6 6M13 47l6-6M41 19l6-6" stroke="#EF8716" />
            </svg>
          </div>
          <div className="space-y-2.5">
            {["Material", "Tolerance", "Finish", "Lead time"].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-line pb-2 text-[0.6rem]">
                <span className="text-muted">{k}</span>
                <span className="h-2 w-10 rounded-full bg-ink/60" />
              </div>
            ))}
          </div>
        </div>
      </Window>
      <Chip className="bottom-0 right-0 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-[0.55rem] font-bold text-accent">PDF</span>
        <span className="text-[0.65rem] font-medium text-ink">Download datasheet</span>
      </Chip>
    </div>
  );
}

const visuals: Record<Kind, (props: { label: string }) => ReactNode> = {
  hub: HubVisual,
  about: AboutVisual,
  process: ProcessVisual,
  team: TeamVisual,
  faq: FaqVisual,
  sectors: SectorsVisual,
  insights: InsightsVisual,
  why: WhyVisual,
  audit: AuditVisual,
  work: WorkVisual,
  booking: BookingVisual,
  listing: ListingVisual,
  specs: SpecsVisual,
  web: WebVisual,
  uiux: UiUxVisual,
  ecommerce: EcommerceVisual,
  seo: SeoVisual,
  ads: AdsVisual,
  content: ContentVisual,
  video: VideoVisual,
  email: EmailVisual,
  ai: AiVisual,
  design: DesignVisual,
};
