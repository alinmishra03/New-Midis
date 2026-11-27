/**
 * Settings → Integrations while the uploaded spreadsheets load: the same
 * layout as the page (import card, then one card per file with a table), so
 * nothing jumps when the data arrives.
 */
export default function IntegrationsLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="animate-pulse">
      <span className="sr-only">Loading the uploaded spreadsheets…</span>
      <div className="mb-6 space-y-2">
        <div className="h-7 w-32 rounded-md bg-c-border" />
        <div className="h-4 w-96 max-w-full rounded-md bg-c-border/70" />
      </div>
      <div className="mb-5 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-c-border/70" />
        ))}
      </div>
      <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-c-border bg-c-surface p-5">
          <div className="h-5 w-72 max-w-full rounded-md bg-c-border" />
          <div className="h-4 w-full rounded-md bg-c-border/70" />
          <div className="h-9 w-56 rounded-md bg-c-border/70" />
        </div>
        {[0, 1, 2].map((card) => (
          <div key={card} className="rounded-xl border border-c-border bg-c-surface">
            <div className="space-y-2 border-b border-c-border px-5 py-4">
              <div className="h-5 w-48 rounded-md bg-c-border" />
              <div className="h-4 w-80 max-w-full rounded-md bg-c-border/70" />
            </div>
            <div className="space-y-3 p-5">
              <div className="h-4 w-44 rounded-md bg-c-border" />
              <div className="overflow-hidden rounded-lg border border-c-border">
                <div className="h-9 border-b border-c-border bg-c-surface-2" />
                {[0, 1, 2, 3, 4].map((r) => (
                  <div key={r} className="flex gap-4 border-b border-c-border px-3 py-2.5 last:border-b-0">
                    <div className="h-3.5 w-8 rounded bg-c-border/70" />
                    {[0, 1, 2, 3].map((c) => (
                      <div key={c} className="h-3.5 flex-1 rounded bg-c-border/70" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
