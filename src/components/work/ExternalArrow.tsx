/**
 * The "leaves this site" arrow.
 *
 * Deliberately not the ArrowRight used on the site's own buttons: almost
 * every link on this page opens someone else's live site, and a different
 * arrow is the cheapest way to say so at a glance. Decorative — the links
 * that use it all state "(opens in a new tab)" in their accessible name.
 */
export function ExternalArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={className ?? "h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 10.5 10.5 5.5" />
      <path d="M6.3 5.5h4.2v4.2" />
    </svg>
  );
}
