import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { AnnouncementDialog } from "@/components/crm/announcement-forms";
import { ConfirmAction } from "@/components/crm/forms";
import { Badge, Card, CardBody, humanize } from "@/components/crm/ui";
import { can, requireViewer } from "@/crm/auth/dal";
import { formatDateTime } from "@/crm/lib/time";
import { ANNOUNCEMENT_CATEGORIES, getAnnouncement } from "@/crm/services/announcements";
import { getCompany } from "@/crm/services/company";
import { employeeFormOptions } from "@/crm/services/employees";
import { deleteAnnouncementAction } from "../actions";

export const metadata: Metadata = { title: "Announcement" };

export default async function AnnouncementPage({ params }: PageProps<"/crm/announcements/[id]">) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const a = await getAnnouncement(viewer, id);
  if (!a) notFound();
  const publisher = can(viewer, "announcements.publish");
  const [company, options] = await Promise.all([getCompany(), publisher ? employeeFormOptions() : null]);

  return (
    <article className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-3 text-[0.8125rem] text-c-subtle">
        <Link href="/crm/announcements" className="hover:text-c-fg">
          Announcements
        </Link>
      </nav>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {a.isImportant && <Badge tone="danger">Important</Badge>}
        <Badge>{humanize(a.category)}</Badge>
        {a.department && <Badge tone="info">{a.department}</Badge>}
        {a.status === "draft" && <Badge tone="warning">Draft</Badge>}
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{a.title}</h1>
          <p className="mt-1 text-[0.8125rem] text-c-muted">
            {a.publishedAt ? `Published ${formatDateTime(a.publishedAt, company.timezone)}` : "Draft"}
            {publisher && a.authorEmail && ` · by ${a.authorEmail}`}
          </p>
        </div>
        {publisher && options && (
          <div className="flex gap-2">
            <AnnouncementDialog categories={ANNOUNCEMENT_CATEGORIES} departments={options.departments} values={{ id: a.id, title: a.title, body: a.body, category: a.category, departmentId: a.departmentId, isPinned: a.isPinned, isImportant: a.isImportant, status: a.status }} />
            <ConfirmAction action={deleteAnnouncementAction} fields={{ id: a.id }} label="Delete" icon={<Trash2 />} variant="danger" size="sm" confirmVariant="danger" title="Delete this announcement?" confirmLabel="Delete" />
          </div>
        )}
      </div>
      <Card>
        <CardBody>
          <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line">{a.body}</p>
        </CardBody>
      </Card>
    </article>
  );
}
