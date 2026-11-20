import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Bell, CheckCheck } from "lucide-react";
import { ConfirmAction } from "@/components/crm/forms";
import { Card, EmptyState, PageHeader, Pagination, Tabs } from "@/components/crm/ui";
import { requireViewer } from "@/crm/auth/dal";
import { db } from "@/crm/db";
import { notifications } from "@/crm/db/schema";
import { formatDateTime, formatRelative } from "@/crm/lib/time";
import { getCompany } from "@/crm/services/company";
import { cn } from "@/lib/utils";
import { markAllReadAction, markOneReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifications" };
const PAGE = 30;

export default async function NotificationsPage({ searchParams }: PageProps<"/crm/notifications">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const unreadOnly = sp.filter === "unread";
  const page = Math.max(1, Number(sp.page) || 1);
  const company = await getCompany();
  const where = and(eq(notifications.userId, viewer.userId), unreadOnly ? isNull(notifications.readAt) : undefined);
  const [rows, [total], [unread]] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(notifications).where(where),
    db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, viewer.userId), isNull(notifications.readAt))),
  ]);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Approvals, assignments, reminders and HR updates."
        actions={unread?.n ? <ConfirmAction action={markAllReadAction} fields={{}} label="Mark all as read" icon={<CheckCheck />} title="Mark all notifications as read?" confirmLabel="Mark all read" /> : undefined}
      />
      <Tabs
        active={unreadOnly ? "unread" : "all"}
        tabs={[
          { key: "all", label: "All", href: "/crm/notifications" },
          { key: "unread", label: "Unread", href: "/crm/notifications?filter=unread", count: unread?.n ?? 0 },
        ]}
      />
      <Card>
        {rows.length ? (
          <ul className="divide-y divide-c-border">
            {rows.map((n) => (
              <li key={n.id} className={cn("flex items-start gap-3 px-5 py-4", !n.readAt && "bg-c-accent-soft/40")}>
                <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-c-accent")} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", n.readAt ? "text-c-muted" : "font-medium")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[0.8125rem] text-c-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-c-subtle" title={formatDateTime(n.createdAt, company.timezone)}>
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.link && (
                    <Link href={n.link} className="text-[0.8125rem] font-medium text-c-accent-text hover:underline">
                      Open
                    </Link>
                  )}
                  {!n.readAt && (
                    <form action={markOneReadAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-[0.8125rem] text-c-muted hover:text-c-fg">
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Bell />} title={unreadOnly ? "No unread notifications" : "No notifications yet"} />
        )}
        <Pagination page={page} pageSize={PAGE} total={total?.n ?? 0} hrefFor={(p) => `/crm/notifications?${unreadOnly ? "filter=unread&" : ""}page=${p}`} />
      </Card>
    </>
  );
}
