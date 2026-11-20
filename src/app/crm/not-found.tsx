import { SearchX } from "lucide-react";
import { Brand } from "@/components/crm/Brand";
import { ButtonLink, Card, EmptyState } from "@/components/crm/ui";

/**
 * Unknown /crm URLs (no matching route) render here, outside the signed-in
 * shell. Pages that call notFound() for missing or restricted records use
 * (app)/not-found.tsx instead, which keeps the sidebar.
 */
export default function CrmRootNotFound() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
      <Brand size="lg" />
      <Card className="w-full max-w-lg">
        <EmptyState
          icon={<SearchX />}
          title="Page not found"
          description="This page doesn't exist in the employee portal. It may have moved, or the link may be wrong."
          action={<ButtonLink href="/crm" variant="primary">Go to the portal</ButtonLink>}
        />
      </Card>
    </div>
  );
}
