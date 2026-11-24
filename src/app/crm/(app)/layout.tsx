import { after } from "next/server";
import { AppShell } from "@/components/crm/AppShell";
import { DirectUploadProvider } from "@/components/crm/direct-upload";
import { requireViewer } from "@/crm/auth/dal";
import { blobEnabled } from "@/crm/lib/storage";
import { visibleNav } from "@/crm/nav";
import { unreadCount } from "@/crm/services/notifications";
import { runReminders } from "@/crm/services/reminders";

/**
 * The signed-in portal frame. Note that layouts do not re-run on client
 * navigation, so this is not where access is enforced — every page and
 * action calls the Data Access Layer itself.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const unread = await unreadCount(viewer.userId);
  // Meeting / due-task / birthday reminders, generated after the response is sent.
  after(() => runReminders(viewer).catch((e) => console.error("[crm reminders]", e)));

  return (
    // Uploads go browser → private Blob when Blob is configured (production), so files up to
    // 10 MB aren't cut off by the ~4.5 MB Vercel Function request-body limit.
    <DirectUploadProvider enabled={blobEnabled()} userId={viewer.userId}>
      <AppShell
        nav={visibleNav(viewer.permissions)}
        unread={unread}
        user={{
          name: viewer.employee?.fullName ?? viewer.email,
          email: viewer.email,
          roleName: viewer.role.name,
          photoFileId: viewer.employee?.photoFileId ?? null,
          theme: viewer.theme,
        }}
      >
        {children}
      </AppShell>
    </DirectUploadProvider>
  );
}
