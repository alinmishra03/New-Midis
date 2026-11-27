import { Skeleton } from "@/components/crm/ui";

/**
 * Shown inside the portal frame while a page's data loads, so a click on the
 * sidebar responds immediately instead of appearing to do nothing.
 */
export default function CrmLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-c-border bg-c-surface p-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-c-border bg-c-surface">
        <div className="border-b border-c-border px-5 py-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${90 - i * 9}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
