import type { Metadata } from "next";
import Link from "next/link";
import { FileText, FolderKanban, ListChecks, Megaphone, Search } from "lucide-react";
import { Card, CardHeader, EmptyState, PageHeader, PersonCell, StatusBadge } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { listAnnouncements } from "@/crm/services/announcements";
import { allDocuments, companyDocuments, myDocuments } from "@/crm/services/documents";
import { listEmployees } from "@/crm/services/employees";
import { listProjects, listTasks } from "@/crm/services/tasks";

export const metadata: Metadata = { title: "Search" };

/**
 * Global search. Every section goes through the same permission-aware
 * service the module pages use, so results never include anything the
 * viewer couldn't open directly.
 */
export default async function SearchPage({ searchParams }: PageProps<"/crm/search">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  if (q.length < 2) {
    return (
      <>
        <PageHeader title="Search" />
        <Card>
          <EmptyState icon={<Search />} title="Type at least two characters" description="Search people, projects, tasks, announcements and documents." />
        </Card>
      </>
    );
  }
  const needle = q.toLowerCase();
  const has = (...v: (string | null | undefined)[]) => v.some((x) => x?.toLowerCase().includes(needle));

  const [people, projects, mine, team, all, announcements, docs] = await Promise.all([
    listEmployees(viewer, { q, page: 1 }),
    listProjects(viewer),
    listTasks(viewer, "mine", { q }),
    listTasks(viewer, "created", { q }),
    can(viewer, "tasks.view_all") ? listTasks(viewer, "all", { q }) : Promise.resolve([]),
    listAnnouncements(viewer),
    can(viewer, "documents.manage") ? allDocuments(viewer, { q }) : Promise.all([myDocuments(viewer), companyDocuments()]).then(([a, b]) => [...a, ...b]),
  ]);
  const tasks = [...new Map([...mine, ...team, ...all].map((t) => [t.id, t])).values()].slice(0, 15);
  const projectHits = projects.filter((p) => has(p.name, p.code, p.description)).slice(0, 10);
  const announcementHits = announcements.filter((a) => has(a.title, a.body)).slice(0, 10);
  const docHits = docs.filter((d) => has(d.title, d.fileName)).slice(0, 10);
  const total = people.rows.length + tasks.length + projectHits.length + announcementHits.length + docHits.length;

  return (
    <>
      <PageHeader title={`Results for “${q}”`} description={`${total} result${total === 1 ? "" : "s"}`} />
      {total === 0 ? (
        <Card>
          <EmptyState icon={<Search />} title="Nothing found" description="Try a different name, project code or keyword." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {people.rows.length > 0 && (
            <Card>
              <CardHeader title="People" />
              <ul className="divide-y divide-c-border">
                {people.rows.slice(0, 10).map((p) => (
                  <li key={p.id} className="px-5 py-2.5">
                    <PersonCell name={`${p.firstName} ${p.lastName}`} sub={[p.designation, p.department].filter(Boolean).join(" · ")} photoFileId={p.photoFileId} href={`/crm/employees/${p.id}`} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {tasks.length > 0 && (
            <Section title="Tasks" icon={<ListChecks className="size-4" />} items={tasks.map((t) => ({ key: t.id, href: `/crm/tasks/${t.id}`, title: t.title, sub: t.projectName ?? "Personal task", status: t.status }))} />
          )}
          {projectHits.length > 0 && <Section title="Projects" icon={<FolderKanban className="size-4" />} items={projectHits.map((p) => ({ key: p.id, href: `/crm/tasks/projects/${p.id}`, title: p.name, sub: p.code, status: p.status }))} />}
          {announcementHits.length > 0 && <Section title="Announcements" icon={<Megaphone className="size-4" />} items={announcementHits.map((a) => ({ key: a.id, href: `/crm/announcements/${a.id}`, title: a.title, sub: a.body.slice(0, 90) }))} />}
          {docHits.length > 0 && <Section title="Documents" icon={<FileText className="size-4" />} items={docHits.map((d) => ({ key: d.id, href: `/crm/api/files/${d.fileId}`, title: d.title, sub: d.fileName, external: true }))} />}
        </div>
      )}
    </>
  );
}

function Section({ title, icon, items }: { title: string; icon: React.ReactNode; items: { key: string; href: string; title: string; sub?: string; status?: string; external?: boolean }[] }) {
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="divide-y divide-c-border">
        {items.map((i) => (
          <li key={i.key}>
            {i.external ? (
              <a href={i.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-2.5 hover:bg-c-surface-2">
                <span className="text-c-subtle">{icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{i.title}</span>
                  {i.sub && <span className="block truncate text-xs text-c-muted">{i.sub}</span>}
                </span>
              </a>
            ) : (
              <Link href={i.href} className="flex items-center gap-3 px-5 py-2.5 hover:bg-c-surface-2">
                <span className="text-c-subtle">{icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{i.title}</span>
                  {i.sub && <span className="block truncate text-xs text-c-muted">{i.sub}</span>}
                </span>
                {i.status && <StatusBadge status={i.status} />}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
