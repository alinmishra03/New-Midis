import { SearchX } from "lucide-react";
import { ButtonLink, Card, EmptyState } from "@/components/crm/ui";

/**
 * Shown for unknown portal URLs and for records or pages the user isn't
 * permitted to see (the DAL answers those with notFound(), so the response
 * never confirms that a restricted record exists).
 */
export default function CrmNotFound() {
  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={<SearchX />}
        title="Page not found"
        description="It may have moved, or you may not have access to it. If you think you should, ask HR."
        action={<ButtonLink href="/crm" variant="primary">Back to dashboard</ButtonLink>}
      />
    </Card>
  );
}
