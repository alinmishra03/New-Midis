/**
 * Shown inside the portal frame while a page's data loads, so a click on the
 * sidebar responds immediately instead of appearing to do nothing.
 */
export default function CrmLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="animate-pulse">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded-md bg-c-border" />
        <div className="h-4 w-80 max-w-full rounded-md bg-c-border/70" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-c-border bg-c-surface" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-c-border bg-c-surface p-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 rounded-md bg-c-border/70" style={{ width: `${90 - i * 9}%` }} />
        ))}
      </div>
    </div>
  );
}
