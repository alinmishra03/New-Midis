import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Evidence gate.
 *
 * The MIDIS audit found the previous site presented placeholder case studies
 * ("Client A/B/C/D"), stock photography as project work, and metrics with no
 * client, baseline or measurement period. The rebuild never does this.
 *
 * Every proof-bearing section calls `hasEvidence` and renders nothing at all
 * when the supporting content is absent, so the page closes up cleanly rather
 * than showing an empty shelf or inventing filler.
 */
export function hasEvidence<T>(items: readonly T[] | undefined | null): items is readonly T[] {
  return Array.isArray(items) && items.length > 0;
}

/** Names that keep their capitals mid-sentence. */
const PROPER_NOUNS = new Set(["Shopify", "React", "Google", "Meta"]);

/**
 * Lower-cases a title for use inside a sentence ("Where website design
 * usually goes wrong") without mangling brands and acronyms: SEO, UI/UX,
 * WordPress, Next.js, YouTube, ChatGPT and OpenAI keep their casing, as do
 * the names in PROPER_NOUNS.
 */
export function midSentence(title: string): string {
  return title
    .split(" ")
    .map((word) =>
      PROPER_NOUNS.has(word) || /[A-Z].*[A-Z]/.test(word) || /\.\w/.test(word) ? word : word.toLowerCase(),
    )
    .join(" ");
}
