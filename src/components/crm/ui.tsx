import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ buttons */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" && "h-8 px-3 text-[0.8125rem]",
    size === "md" && "h-9 px-3.5 text-sm",
    size === "lg" && "h-11 px-5 text-sm",
    size === "icon" && "size-9",
    variant === "primary" && "bg-c-accent text-c-on-accent shadow-c hover:bg-c-accent-hover",
    variant === "secondary" && "border border-c-border bg-c-surface text-c-fg shadow-c hover:border-c-border-strong hover:bg-c-hover",
    variant === "ghost" && "text-c-muted hover:bg-c-hover hover:text-c-fg",
    variant === "subtle" && "bg-c-hover text-c-fg hover:bg-c-border",
    variant === "danger" && "border border-c-danger/30 bg-c-danger-soft text-c-danger hover:border-c-danger/60",
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
        <h2 className="text-[0.9375rem] font-semibold text-c-fg">{title}</h2>
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
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", toneClass[tone], className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-c-subtle">
            {breadcrumb.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                <Link href={b.href} className="hover:text-c-fg">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-c-fg sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-c-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
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
      {icon && <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-c-hover text-c-subtle [&_svg]:size-5">{icon}</div>}
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
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-c-fg">{value}</p>
      {hint && <p className="mt-1 text-xs text-c-subtle">{hint}</p>}
    </>
  );
  const cls = "block rounded-xl border border-c-border bg-c-surface p-4 shadow-c";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-c-border-strong")}>
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
export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-c-border bg-c-surface-2 text-xs font-medium text-c-muted [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-medium [&_th]:whitespace-nowrap">{children}</thead>;
}
export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-c-border [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_tr]:transition-colors [&_tr:hover]:bg-c-surface-2">{children}</tbody>;
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
              "relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              on ? "text-c-fg" : "text-c-muted hover:text-c-fg",
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className="tabular rounded-full bg-c-hover px-1.5 text-xs text-c-muted">{t.count}</span>
            )}
            {on && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-c-accent" />}
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
    <div className="flex items-center justify-between gap-3 border-t border-c-border px-4 py-3 text-[0.8125rem] text-c-muted">
      <span className="tabular">
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink href={hrefFor(page - 1)} size="sm">
            Previous
          </ButtonLink>
        ) : (
          <Button size="sm" disabled>
            Previous
          </Button>
        )}
        {page < pages ? (
          <ButtonLink href={hrefFor(page + 1)} size="sm">
            Next
          </ButtonLink>
        ) : (
          <Button size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

/** Builds a URL with updated search params (server-side helper for filter links). */
export function withParams(base: string, current: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...changes })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}
