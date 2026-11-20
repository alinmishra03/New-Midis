import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Pin } from "lucide-react";
import { AnnouncementDialog } from "@/components/crm/announcement-forms";
import { Badge, Card, EmptyState, PageHeader, Tabs, humanize } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { formatDateTime } from "@/crm/lib/time";
import { ANNOUNCEMENT_CATEGORIES, listAnnouncements } from "@/crm/services/announcements";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage({ searchParams }: PageProps<"/crm/announcements">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const publisher = can(viewer, "announcements.publish");
  const [rows, company, options] = await Promise.all([listAnnouncements(viewer, category), getCompany(), publisher ? employeeFormOptions() : null]);

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Company news, HR updates, policies and events."
        actions={publisher && options ? <AnnouncementDialog categories={ANNOUNCEMENT_CATEGORIES} departments={options.departments} /> : undefined}
      />
      <Tabs
        active={category ?? "all"}
        tabs={[{ key: "all", label: "All", href: "/crm/announcements" }, ...ANNOUNCEMENT_CATEGORIES.map((c) => ({ key: c.value, label: c.label, href: `/crm/announcements?category=${c.value}` }))]}
      />
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id} className={a.isImportant ? "border-c-danger/40" : undefined}>
              <Link href={`/crm/announcements/${a.id}`} className="block p-5 hover:bg-c-surface-2">
                <div className="flex flex-wrap items-center gap-2">
                  {a.isPinned && (
                    <Badge tone="accent">
                      <Pin className="size-3" /> Pinned
                    </Badge>
                  )}
                  {a.isImportant && <Badge tone="danger">Important</Badge>}
                  <Badge>{humanize(a.category)}</Badge>
                  {a.department && <Badge tone="info">{a.department}</Badge>}
                  {a.status === "draft" && <Badge tone="warning">Draft</Badge>}
                  <span className="text-xs text-c-subtle">{a.publishedAt ? formatDateTime(a.publishedAt, company.timezone) : "Not published"}</span>
                </div>
                <h2 className="mt-2 text-base font-semibold">{a.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-c-muted">{a.body}</p>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<Megaphone />} title="No announcements" description={publisher ? "Post the first one with “New announcement”." : undefined} />
        </Card>
      )}
    </>
  );
}
