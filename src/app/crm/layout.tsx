import type { Metadata } from "next";
import { Toaster } from "@/components/crm/forms";
import { getViewer } from "@/crm/auth/dal";

export const metadata: Metadata = {
  title: { default: "Employee Portal", template: "%s · MIDIS Employee Portal" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Root of the employee portal. Applies the portal theme (light / dark /
 * system, saved per user) and the toast layer. Deliberately none of the
 * public site's chrome or analytics.
 */
export default async function CrmLayout({ children }: LayoutProps<"/crm">) {
  const viewer = await getViewer();
  return (
    <div className="crm flex min-h-dvh flex-1 flex-col" data-theme={viewer?.theme ?? "system"} id="crm-root">
      {children}
      <Toaster />
    </div>
  );
}
