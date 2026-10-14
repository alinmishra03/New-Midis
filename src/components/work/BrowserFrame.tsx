import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The frame every project preview sits in.
 *
 * One component rather than a frame drawn per section, because the whole
 * page is the same screenshot shown at four sizes — the hero stack, the
 * featured rows, the showcase and the portfolio gateway. A single frame is
 * what stops them drifting into four slightly different browser chromes.
 *
 * It is a browser window and not a card: the address bar is what tells a
 * visitor that the thing in the picture is a real, live site rather than a
 * mockup, which is the entire argument this page is making. The address is
 * the project's own host, so it is also the only label the preview needs.
 *
 * Every screenshot in content/featured-work.ts is 1800x1125, so `aspect-[16/10]`
 * matches the source exactly and nothing is ever cropped or letterboxed.
 */
export function BrowserFrame({
  src,
  alt,
  host,
  priority = false,
  sizes,
  className,
  tone = "light",
  children,
}: {
  src: string;
  alt: string;
  /** Shown in the address bar. Bare host, no scheme. */
  host?: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  /** `dark` for frames sitting on the ink sections. */
  tone?: "light" | "dark";
  /** Overlaid on the screenshot — used for the showcase's hover affordance. */
  children?: React.ReactNode;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border backdrop-blur-sm",
        dark ? "border-surface/15 bg-surface/[0.04]" : "border-line bg-paper",
        className,
      )}
    >
      {/* Window chrome. Decorative in full: the three dots say "browser" and
          the address repeats the host already written in the text beside it,
          so a screen reader is given neither twice. */}
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center gap-2 border-b px-3 py-2 sm:px-4 sm:py-2.5",
          dark ? "border-surface/10" : "border-line",
        )}
      >
        <span className="flex shrink-0 items-center gap-1.5">
          {["bg-accent/70", dark ? "bg-surface/25" : "bg-ink/15", dark ? "bg-surface/15" : "bg-ink/10"].map(
            (dot, i) => (
              <span key={i} className={cn("block h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5", dot)} />
            ),
          )}
        </span>

        {host && (
          <span
            className={cn(
              "mx-auto max-w-[70%] truncate rounded-full px-3 py-0.5 text-[0.625rem] tracking-wide sm:text-[0.6875rem]",
              dark ? "bg-surface/[0.06] text-surface/55" : "bg-ink/[0.04] text-muted",
            )}
          >
            {host}
          </span>
        )}
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top"
        />
        {children}
      </div>
    </div>
  );
}
