import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ buttons */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" && "h-8 px-3 text-[0.8125rem]",
    size === "md" && "h-9 px-3.5 text-sm",
    size === "lg" && "h-11 px-5 text-sm",
    size === "icon" && "size-9",
    variant === "primary" && "bg-c-accent text-c-on-accent shadow-c hover:bg-c-accent-hover hover:shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_12px_-4px_rgb(239_135_22/0.45)]",
    variant === "secondary" && "border border-c-border bg-c-surface text-c-fg shadow-c hover:border-c-border-strong hover:bg-c-hover",
    variant === "ghost" && "text-c-muted hover:bg-c-hover hover:text-c-fg",
    variant === "subtle" && "bg-c-hover text-c-fg hover:bg-c-border",
    variant === "danger" && "border border-c-danger/30 bg-c-danger-soft text-c-danger hover:border-c-danger/60 hover:bg-c-danger/15",
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* -------------------------------------------------------------------- cards */

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-c-border bg-c-surface shadow-c", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3 border-b border-c-border px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-c-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[0.8125rem] text-c-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

/* ------------------------------------------------------------------- badges */

export type Tone = "neutral" | "accent" | "success" | "danger" | "warning" | "info";

const toneClass: Record<Tone, string> = {
  neutral: "bg-c-hover text-c-muted",
  accent: "bg-c-accent-soft text-c-accent-text",
  success: "bg-c-success-soft text-c-success",
  danger: "bg-c-danger-soft text-c-danger",
  warning: "bg-c-warning-soft text-c-warning",
  info: "bg-c-info-soft text-c-info",
};

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    // The faint inset ring (in the badge's own colour) keeps soft badges defined on white and on hovered rows.
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset", toneClass[tone], className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Marks a check-out set by the 19:00 automatic check-out, not by the employee. */
export function AutoCheckoutBadge({ className }: { className?: string }) {
  return (
    <Badge tone="info" className={cn("ml-1.5 align-middle", className)}>
      Auto Checked Out
    </Badge>
  );
}

/** Consistent tones for the status values used across modules. */
export function statusTone(status: string): Tone {
  switch (status) {
    case "approved":
    case "active":
    case "present":
    case "completed":
    case "published":
    case "paid":
    case "hired":
    case "achieved":
    case "open":
      return "success";
    case "pending":
    case "review":
    case "draft":
    case "probation":
    case "half_day":
    case "in_progress":
    case "scheduled":
    case "interview":
    case "offer":
    case "self_assessment":
    case "manager_review":
    case "invited":
      return "warning";
    case "rejected":
    case "absent":
    case "disabled":
    case "exited":
    case "urgent":
    case "missed":
    case "no_hire":
      return "danger";
    case "cancelled":
    case "archived":
    case "closed":
    case "incomplete":
      return "neutral";
    default:
      return "info";
  }
}

export function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge tone={statusTone(status)} dot>
      {label ?? humanize(status)}
    </Badge>
  );
}

/* ------------------------------------------------------------------- layout */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: { label: string; href: string }[];
}) {
  return (
    // The breadcrumb sits on its own line so the title and the action buttons share one row; long
    // descriptions wrap under the title without pushing the buttons down.
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} className="mb-3" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-c-fg sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-c-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:pt-0.5">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Breadcrumb trail. Linked items lead back up; an item without `href` is the
 * current page and is shown as plain text.
 */
export function Breadcrumb({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-[0.8125rem] text-c-subtle", className)}>
      {items.map((b, i) => (
        <span key={`${b.label}-${i}`} className="flex min-w-0 items-center gap-1">
          {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-c-border-strong" />}
          {b.href ? (
            <Link href={b.href} className="rounded transition-colors hover:text-c-fg">
              {b.label}
            </Link>
          ) : (
            <span aria-current="page" className="truncate text-c-muted">
              {b.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * The search/filter row at the top of a list card: one consistent toolbar
 * for every list. It is an ordinary GET form, so filters stay in the URL
 * exactly as before; only the presentation is shared.
 */
export function FilterBar({ className, children, ...props }: ComponentProps<"form">) {
  return (
    <form
      className={cn("flex flex-col gap-2 border-b border-c-border bg-c-surface-2/60 px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center", className)}
      {...props}
    >
      {children}
    </form>
  );
}

/** The "N results" note at the end of a FilterBar. */
export function ResultCount({ children }: { children: ReactNode }) {
  return <span className="tabular text-[0.8125rem] text-c-muted sm:ml-auto">{children}</span>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-c-hover text-c-subtle ring-4 ring-c-surface-2 [&_svg]:size-5">{icon}</div>}
      <p className="text-sm font-medium text-c-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[0.8125rem] text-c-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  href?: string;
  tone?: Tone;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-c-muted">{label}</p>
        {icon && <span className={cn("flex size-8 items-center justify-center rounded-lg [&_svg]:size-4", toneClass[tone])}>{icon}</span>}
      </div>
      <p className="tabular mt-2 text-2xl leading-none font-semibold tracking-[-0.02em] text-c-fg">{value}</p>
      {hint && <p className="mt-2 text-xs text-c-subtle">{hint}</p>}
    </>
  );
  const cls = "block rounded-xl border border-c-border bg-c-surface p-4 shadow-c";
  return href ? (
    <Link href={href} className={cn(cls, "transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-c-border-strong hover:shadow-c-lg motion-reduce:hover:translate-y-0")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function ProgressBar({ value, tone = "accent", className, label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bar: Record<Tone, string> = {
    neutral: "bg-c-subtle",
    accent: "bg-c-accent",
    success: "bg-c-success",
    danger: "bg-c-danger",
    warning: "bg-c-warning",
    info: "bg-c-info",
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-c-hover", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", bar[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

/* -------------------------------------------------------------------- avatar */

const AVATAR_TINTS = ["#fdf1e4", "#e6f3ec", "#e8eefb", "#f3e8fb", "#fbe9eb", "#eef0f2"];
const AVATAR_INKS = ["#aa5a0a", "#23714f", "#2a5bb8", "#7a3fb0", "#b9343f", "#4a4f57"];

export function Avatar({
  name,
  photoFileId,
  size = 36,
  className,
}: {
  name: string;
  photoFileId?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const i = hash % AVATAR_TINTS.length;
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (photoFileId) {
    return (
      // Served through the permission-checked file route; not a public URL.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/crm/api/files/${photoFileId}`}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", className)}
      style={{ ...style, backgroundColor: AVATAR_TINTS[i], color: AVATAR_INKS[i] }}
    >
      {initials || "?"}
    </span>
  );
}

export function PersonCell({
  name,
  sub,
  photoFileId,
  href,
}: {
  name: string;
  sub?: ReactNode;
  photoFileId?: string | null;
  href?: string;
}) {
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={name} photoFileId={photoFileId} size={32} />
      <span className="min-w-0">
        <span className="block truncate font-medium text-c-fg">{name}</span>
        {sub && <span className="block truncate text-xs text-c-muted">{sub}</span>}
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="block rounded-md hover:[&_.font-medium]:text-c-accent-text">
      {body}
    </Link>
  ) : (
    body
  );
}

/* -------------------------------------------------------------------- tables */

/**
 * Tables scroll horizontally inside their card on narrow screens rather than
 * pushing the page wider. Columns that matter less get `hidden md:table-cell`
 * at the call site.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}
// Header labels are small caps-style for a calm, scannable header row. The first and last columns line up with
// the card's own 1.25rem padding, so a table sits flush under its CardHeader.
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-c-border bg-c-surface-2 text-[0.6875rem] font-semibold tracking-[0.04em] text-c-subtle uppercase [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th:first-child]:pl-5 [&_th:last-child]:pr-5">
      {children}
    </thead>
  );
}
export function TBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-c-border [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_td:first-child]:pl-5 [&_td:last-child]:pr-5 [&_tr]:transition-colors [&_tr:hover]:bg-c-surface-2">
      {children}
    </tbody>
  );
}

/* ---------------------------------------------------------------- key/value */

export function DescriptionList({ items, columns = 2 }: { items: { label: string; value: ReactNode }[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-2 lg:grid-cols-3")}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs font-medium text-c-subtle">{it.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-c-fg">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/* --------------------------------------------------------------------- tabs */

export function Tabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav aria-label="Sections" className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-c-border px-1">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              on ? "text-c-fg" : "text-c-muted hover:text-c-fg",
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className={cn("tabular rounded-full px-1.5 text-xs transition-colors", on ? "bg-c-accent-soft text-c-accent-text" : "bg-c-hover text-c-muted")}>{t.count}</span>
            )}
            <span
              aria-hidden
              className={cn("absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors", on ? "bg-c-accent" : "bg-transparent group-hover:bg-c-border-strong")}
            />
          </Link>
        );
      })}
    </nav>
  );
}

/* --------------------------------------------------------------- pagination */

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-c-border px-5 py-3 text-[0.8125rem] text-c-muted">
      <span className="tabular">
        Showing <span className="font-medium text-c-fg">{from}–{to}</span> of <span className="font-medium text-c-fg">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <span className="tabular hidden text-xs text-c-subtle sm:inline">
          Page {page} of {pages}
        </span>
        {page > 1 ? (
          <ButtonLink href={hrefFor(page - 1)} size="sm">
            <ChevronLeft /> Previous
          </ButtonLink>
        ) : (
          <Button size="sm" disabled>
            <ChevronLeft /> Previous
          </Button>
        )}
        {page < pages ? (
          <ButtonLink href={hrefFor(page + 1)} size="sm">
            Next <ChevronRight />
          </ButtonLink>
        ) : (
          <Button size="sm" disabled>
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ notice */

const NOTICE_ICON = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert } as const;

/** An inline message box (information, success, warning or error), with a matching icon. */
export function Notice({ tone = "info", children, className }: { tone?: keyof typeof NOTICE_ICON; children: ReactNode; className?: string }) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[0.8125rem] ring-1 ring-current/15 ring-inset", toneClass[tone], className)}>
      <Icon aria-hidden className="mt-px size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------- loading */

/** A loading placeholder block. Decorative: the surrounding loading screen announces "Loading…". */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={cn("c-skeleton rounded-md", className)} style={style} />;
}

/** Builds a URL with updated search params (server-side helper for filter links). */
export function withParams(base: string, current: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...changes })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}
