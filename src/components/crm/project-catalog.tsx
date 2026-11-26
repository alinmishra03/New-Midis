import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Archive, CircleAlert, ExternalLink, FolderKanban, Globe, Hammer, Rocket, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/crm/forms";
import { Avatar, Badge, Card, EmptyState, Pagination, StatusBadge, Table, TBody, THead, buttonClass, humanize, withParams } from "@/components/crm/ui";
import { PAGE_SIZE, SECTIONS, stageTone, type SectionKey, type SiteLink } from "@/crm/lib/project-catalog";
import type { CatalogProject } from "@/crm/services/project-catalog";

const BASE = "/crm/tasks";
type Sort = "name" | "status" | "env";
export type CatalogParams = { section?: string; q?: string; env?: string; dev?: string; sort?: string; dir?: string; page?: string };
const NOT_SET = "__none";

const SECTION_ICON: Record<SectionKey, ReactNode> = {
  live: <Globe />,
  completed: <Rocket />,
  ongoing: <Hammer />,
  shopify: <ShoppingBag />,
  archived: <Archive />,
};

const SECTION_EMPTY: Record<SectionKey, string> = {
  live: "No completed Production websites on a custom domain.",
  completed: "No completed projects with a Vercel link.",
  ongoing: "No projects in Planning, Active or On hold.",
  shopify: "No projects from the sheet's Shopify section.",
  archived: "No archived projects.",
};

/** The value each section's "Status" sort and filter use. */
const statusOf = (p: CatalogProject, s: SectionKey) => (s === "ongoing" ? humanize(p.status) : (p.devStatus ?? ""));

export function ProjectCatalog({ rows, params }: { rows: CatalogProject[]; params: CatalogParams }) {
  const section = (SECTIONS.find((s) => s.key === params.section)?.key ?? "live") as SectionKey;
  const meta = SECTIONS.find((s) => s.key === section)!;
  const counts = Object.fromEntries(SECTIONS.map((s) => [s.key, rows.filter((r) => r.section === s.key).length])) as Record<SectionKey, number>;
  const inSection = rows.filter((r) => r.section === section);

  const q = params.q?.trim().slice(0, 100) ?? "";
  const env = params.env ?? "";
  const dev = params.dev ?? "";
  const sort: Sort = params.sort === "status" || params.sort === "env" ? params.sort : "name";
  const dir = params.dir === "desc" ? "desc" : "asc";

  const envOptions = [...new Set(inSection.map((r) => r.environment ?? ""))].sort();
  const devOptions = [...new Set(inSection.map((r) => r.devStatus ?? ""))].sort();
  const match = (value: string | null, want: string) => !want || (want === NOT_SET ? !value : value === want);
  const filtered = inSection
    .filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => match(r.environment, env) && match(r.devStatus, dev));
  const key = (r: CatalogProject) => (sort === "name" ? r.name : sort === "status" ? statusOf(r, section) : (r.environment ?? ""));
  // Empty values always last, whichever direction.
  const sorted = [...filtered].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (!ka !== !kb) return ka ? -1 : 1;
    const c = ka.localeCompare(kb, undefined, { sensitivity: "base", numeric: true }) || a.name.localeCompare(b.name, undefined, { numeric: true });
    return dir === "asc" ? c : -c;
  });
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const shown = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const offset = (page - 1) * PAGE_SIZE;

  const current: Record<string, string | undefined> = { view: "projects", section, q: q || undefined, env: env || undefined, dev: dev || undefined, sort: sort === "name" ? undefined : sort, dir: dir === "asc" ? undefined : dir };
  const href = (changes: Record<string, string | undefined>) => withParams(BASE, current, changes);
  const filtering = !!(q || env || dev);
  const flagged = inSection.filter((r) => r.review && !r.isCategory).length;

  const sortHeader = (label: string, k: Sort) => {
    const on = sort === k;
    const next = on && dir === "asc" ? "desc" : "asc";
    const Icon = on ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th aria-sort={on ? (dir === "asc" ? "ascending" : "descending") : "none"}>
        <Link href={href({ sort: k === "name" ? undefined : k, dir: next === "asc" ? undefined : next, page: undefined })} className={cn("inline-flex items-center gap-1 hover:text-c-fg", on && "text-c-fg")}>
          {label}
          <Icon aria-hidden className={cn("size-3", !on && "opacity-40")} />
        </Link>
      </th>
    );
  };

  return (
    <div className="space-y-5">
      <SummaryStrip total={rows.length} counts={counts} />

      <nav aria-label="Project sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {SECTIONS.map((s) => {
          const on = s.key === section;
          return (
            <Link
              key={s.key}
              href={withParams(BASE, { view: "projects" }, { section: s.key })}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors [&_svg]:size-3.5",
                on ? "border-c-accent/40 bg-c-accent-soft text-c-accent-text" : "border-c-border bg-c-surface text-c-muted hover:border-c-border-strong hover:text-c-fg",
              )}
            >
              {SECTION_ICON[s.key]}
              {s.label}
              <span className={cn("tabular rounded-full px-1.5 text-xs", on ? "bg-c-surface/70" : "bg-c-hover")}>{counts[s.key]}</span>
            </Link>
          );
        })}
      </nav>

      <Card className={cn(section === "archived" && "bg-c-surface-2/40")}>
        <div className="flex flex-col gap-3 border-b border-c-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-c-fg [&_svg]:size-4 [&_svg]:text-c-subtle">
              {SECTION_ICON[section]}
              {meta.title}
              <span className="tabular text-sm font-normal text-c-muted">({filtering ? `${filtered.length} of ${inSection.length}` : inSection.length})</span>
            </h2>
            {section === "archived" && <p className="mt-0.5 text-xs text-c-muted">Closed sites and stores, kept for reference.</p>}
          </div>
          <form method="get" action={BASE} className="flex flex-wrap items-center gap-2" role="search" aria-label={`Filter ${meta.title}`}>
            <input type="hidden" name="view" value="projects" />
            <input type="hidden" name="section" value={section} />
            {sort !== "name" && <input type="hidden" name="sort" value={sort} />}
            {dir !== "asc" && <input type="hidden" name="dir" value={dir} />}
            <input name="q" defaultValue={q} placeholder="Search by name" aria-label="Search by project name" className={cn(inputClass, "h-8 w-full text-[0.8125rem] sm:w-48")} />
            <FilterSelect name="env" label="Environment" all="All environments" value={env} options={envOptions} />
            <FilterSelect name="dev" label="Development status" all="All dev statuses" value={dev} options={devOptions} />
            <button type="submit" className={buttonClass("secondary", "sm")}>
              Apply
            </button>
            {filtering && (
              <Link href={href({ q: undefined, env: undefined, dev: undefined, page: undefined })} className={buttonClass("ghost", "sm")}>
                Clear
              </Link>
            )}
          </form>
        </div>

        {flagged > 0 && (
          <p className="flex items-start gap-2 border-b border-c-border bg-c-warning-soft/50 px-4 py-2 text-xs text-c-muted [&_svg]:mt-px [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-c-warning">
            <CircleAlert aria-hidden />
            {flagged} project{flagged === 1 ? "" : "s"} marked <strong className="font-medium text-c-fg">Review</strong>: the stored details don&apos;t settle where {flagged === 1 ? "it belongs" : "they belong"}. Nothing was changed; hover the badge for the reason.
          </p>
        )}

        {shown.length === 0 ? (
          <EmptyState icon={SECTION_ICON[section]} title={filtering ? "No projects match these filters" : "Nothing here yet"} description={filtering ? "Try a different name or clear the filters." : SECTION_EMPTY[section]} />
        ) : (
          <Table className="[&_table]:min-w-[52rem]">
            <THead>
              <tr>
                <th className="w-10 text-right">#</th>
                {sortHeader(section === "shopify" ? "Store / Project Name" : section === "live" || section === "completed" ? "Website / Project Name" : "Project Name", "name")}
                <th className="hidden xl:table-cell">Project Code</th>
                <th>{section === "live" ? "Live Website URL" : section === "completed" ? "Vercel URL" : section === "shopify" ? "Store URL" : "Project URL"}</th>
                {section === "archived" ? (
                  <>
                    {sortHeader("Previous Status", "env")}
                    {sortHeader("Development Status", "status")}
                  </>
                ) : (
                  <>
                    {sortHeader("Environment", "env")}
                    {section === "ongoing" && sortHeader("Project Status", "status")}
                    {(section === "live" || section === "ongoing") && (section === "live" ? sortHeader("Development Status", "status") : <th className="hidden lg:table-cell">Development Status</th>)}
                    <th className="hidden md:table-cell">Team Members</th>
                    <th className="hidden md:table-cell">Tasks</th>
                  </>
                )}
                <th className="text-right">Actions</th>
              </tr>
            </THead>
            <TBody>
              {shown.map((p, i) => (
                <Row key={p.id} p={p} n={offset + i + 1} section={section} />
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} hrefFor={(n) => href({ page: n > 1 ? String(n) : undefined })} />
      </Card>
    </div>
  );
}

function SummaryStrip({ total, counts }: { total: number; counts: Record<SectionKey, number> }) {
  const items: { label: string; value: number; section?: SectionKey; icon: ReactNode; tint: string }[] = [
    { label: "Total projects", value: total, icon: <FolderKanban />, tint: "bg-c-hover text-c-muted" },
    { label: "Live websites", value: counts.live, section: "live", icon: <Globe />, tint: "bg-c-success-soft text-c-success" },
    { label: "Ongoing", value: counts.ongoing, section: "ongoing", icon: <Hammer />, tint: "bg-c-info-soft text-c-info" },
    { label: "Completed (Vercel)", value: counts.completed, section: "completed", icon: <Rocket />, tint: "bg-c-accent-soft text-c-accent-text" },
    { label: "Shopify", value: counts.shopify, section: "shopify", icon: <ShoppingBag />, tint: "bg-c-warning-soft text-c-warning" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => {
        const body = (
          <>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", it.tint)}>{it.icon}</span>
            <span className="min-w-0">
              <span className="tabular block text-lg leading-tight font-semibold text-c-fg">{it.value}</span>
              <span className="block truncate text-xs text-c-muted">{it.label}</span>
            </span>
          </>
        );
        const cls = "flex items-center gap-3 rounded-xl border border-c-border bg-c-surface px-3.5 py-3 shadow-c";
        return it.section ? (
          <Link key={it.label} href={withParams(BASE, { view: "projects" }, { section: it.section })} className={cn(cls, "transition-colors hover:border-c-border-strong")}>
            {body}
          </Link>
        ) : (
          <div key={it.label} className={cn(cls, "col-span-2 sm:col-span-1")}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

function FilterSelect({ name, label, all, value, options }: { name: string; label: string; all: string; value: string; options: string[] }) {
  return (
    <select name={name} defaultValue={value} aria-label={label} className={cn(inputClass, "h-8 w-auto min-w-36 text-[0.8125rem]")}>
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o || NOT_SET} value={o || NOT_SET}>
          {o || "Not set"}
        </option>
      ))}
    </select>
  );
}

function Row({ p, n, section }: { p: CatalogProject; n: number; section: SectionKey }) {
  const detail = `/crm/tasks/projects/${p.id}`;
  const archived = section === "archived";
  const primary = pickPrimary(p.links, section);
  const others = p.links.filter((l) => l !== primary);
  return (
    <tr className={cn(archived && "text-c-muted")}>
      <td className="tabular w-10 text-right text-xs text-c-subtle">{n}</td>
      <td className="max-w-[16rem]">
        <Link href={detail} className={cn("block truncate font-medium hover:text-c-accent-text hover:underline", archived ? "text-c-muted" : "text-c-fg")}>
          {p.name}
        </Link>
        <span className="mt-0.5 flex flex-wrap items-center gap-1">
          <span className="text-xs text-c-subtle xl:hidden">{p.code}</span>
          {p.isCategory && <Badge tone="neutral">Category</Badge>}
          {p.isShopify && section !== "shopify" && <Badge tone="warning">Shopify</Badge>}
          {p.review && !p.isCategory && (
            <span title={p.review}>
              <Badge tone="warning" className="cursor-help">
                <CircleAlert aria-hidden className="size-3" />
                Review<span className="sr-only">: {p.review}</span>
              </Badge>
            </span>
          )}
        </span>
      </td>
      <td className="hidden font-mono text-xs whitespace-nowrap text-c-muted xl:table-cell">{p.code}</td>
      <td className="max-w-[18rem]">
        {primary ? (
          <div className="space-y-1">
            <UrlLink link={primary} />
            {others.map((l) => (
              <UrlLink key={l.url} link={l} small />
            ))}
          </div>
        ) : (
          <span className="text-xs text-c-subtle">{p.isCategory ? "Category" : "No URL recorded"}</span>
        )}
      </td>
      {archived ? (
        <>
          <td>{stage(p.environment)}</td>
          <td>{stage(p.devStatus)}</td>
        </>
      ) : (
        <>
          <td>{stage(p.environment)}</td>
          {section === "ongoing" && (
            <td>
              <StatusBadge status={p.status} />
            </td>
          )}
          {(section === "live" || section === "ongoing") && <td className={cn(section === "ongoing" && "hidden lg:table-cell")}>{stage(p.devStatus)}</td>}
          <td className="hidden md:table-cell">
            <Members members={p.members} />
          </td>
          <td className="hidden md:table-cell">
            <Tasks done={p.done} total={p.total} />
          </td>
        </>
      )}
      <td className="text-right whitespace-nowrap">
        <span className="inline-flex items-center gap-1">
          {primary && (
            <a href={primary.url} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "icon", "size-8")} title={`Open ${primary.host} in a new tab`}>
              <ExternalLink aria-hidden />
              <span className="sr-only">Open {p.name} website in a new tab</span>
            </a>
          )}
          <Link href={detail} className={buttonClass("secondary", "sm")}>
            View<span className="sr-only"> {p.name}</span>
          </Link>
        </span>
      </td>
    </tr>
  );
}

/** Live shows the custom domain first; Completed shows the Vercel link first. */
function pickPrimary(links: SiteLink[], section: SectionKey) {
  if (!links.length) return null;
  const want = section === "completed" ? "vercel" : section === "shopify" ? "shopify" : "custom";
  return links.find((l) => l.kind === want) ?? links.find((l) => l.kind === "custom") ?? links[0]!;
}

function UrlLink({ link, small }: { link: SiteLink; small?: boolean }) {
  const label = link.url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.url}
        className={cn("min-w-0 truncate hover:underline", small ? "text-xs text-c-muted hover:text-c-fg" : "text-[0.8125rem] text-c-accent-text")}
      >
        {label}
      </a>
      <KindBadge kind={link.kind} />
    </span>
  );
}

function KindBadge({ kind }: { kind: SiteLink["kind"] }) {
  if (kind === "vercel")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-c-fg px-1.5 py-px text-[0.625rem] leading-4 font-semibold text-c-surface" title="Vercel deployment">
        <svg aria-hidden viewBox="0 0 24 24" className="size-2 fill-current">
          <path d="M12 2 24 22H0z" />
        </svg>
        Vercel
      </span>
    );
  if (kind === "custom") return <span className="shrink-0 rounded border border-c-border px-1.5 py-px text-[0.625rem] leading-4 font-medium text-c-muted">Domain</span>;
  if (kind === "shopify") return <span className="shrink-0 rounded bg-c-success-soft px-1.5 py-px text-[0.625rem] leading-4 font-medium text-c-success">Shopify</span>;
  return <span className="shrink-0 rounded border border-c-border px-1.5 py-px text-[0.625rem] leading-4 font-medium text-c-muted">Preview</span>;
}

function stage(value: string | null) {
  if (!value) return <span className="text-xs text-c-subtle">Not set</span>;
  return (
    <Badge tone={stageTone(value)} dot>
      {value}
    </Badge>
  );
}

function Members({ members }: { members: CatalogProject["members"] }) {
  if (!members.length) return <span className="text-xs text-c-subtle">None</span>;
  const names = members.map((m) => m.name + (m.isLead ? " (lead)" : "")).join(", ");
  return (
    <span className="flex items-center" title={names}>
      <span className="flex -space-x-1.5">
        {members.slice(0, 3).map((m) => (
          <Avatar key={m.id} name={m.name} photoFileId={m.photoFileId} size={24} className="ring-2 ring-c-surface" />
        ))}
      </span>
      {members.length > 3 && <span className="tabular ml-1.5 text-xs text-c-muted">+{members.length - 3}</span>}
      <span className="sr-only">{names}</span>
      {members.length === 1 && <span className="ml-2 max-w-[8rem] truncate text-xs text-c-muted">{members[0]!.name}</span>}
    </span>
  );
}

function Tasks({ done, total }: { done: number; total: number }) {
  if (!total) return <span className="text-xs text-c-subtle">No tasks</span>;
  const pct = Math.round((done / total) * 100);
  return (
    <span className="flex min-w-[5.5rem] flex-col gap-1">
      <span className="tabular text-xs text-c-muted">
        {done}/{total} done
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-c-hover" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tasks done">
        <span className="block h-full rounded-full bg-c-accent" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
