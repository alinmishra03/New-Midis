import { cn } from "@/lib/utils";

/**
 * Word-by-word headline reveal.
 *
 * Rendered on the server as plain text in spans — the animation is purely
 * CSS and gated on `html.js`, so the headline is present and readable in the
 * initial HTML whether or not JavaScript ever runs. Search engines and
 * screen readers see one continuous string.
 */
export function SplitHeadline({
  lines,
  className,
  stagger = 70,
  initialDelay = 120,
  accentWords = [],
}: {
  lines: string[];
  className?: string;
  stagger?: number;
  initialDelay?: number;
  /** Words rendered in the signature orange. Matched case-insensitively. */
  accentWords?: string[];
}) {
  const normalise = (w: string) => w.toLowerCase().replace(/[.,]/g, "");
  const accents = new Set(accentWords.map(normalise));

  /*
   * Stagger delays are derived purely from the props — no counter is mutated
   * during render, so the output is deterministic across re-renders.
   */
  const lineWords = lines.map((line) => line.split(" "));
  const wordsBefore = (lineIndex: number) =>
    lineWords.slice(0, lineIndex).reduce((total, words) => total + words.length, 0);

  return (
    <span className={cn("block", className)}>
      {lineWords.map((words, li) => (
        <span key={li} className="block">
          {words.map((word, wi) => (
            <span key={`${li}-${wi}`} className="word">
              <span
                style={
                  {
                    "--word-delay": `${initialDelay + (wordsBefore(li) + wi) * stagger}ms`,
                  } as React.CSSProperties
                }
                className={accents.has(normalise(word)) ? "text-accent" : undefined}
              >
                {word}
              </span>
              {wi < words.length - 1 ? " " : null}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
