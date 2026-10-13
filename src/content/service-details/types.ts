import type { Faq } from "../types";

/**
 * Hero artwork families. Each service page picks the one that depicts what
 * the service actually produces, so an SEO page shows search performance and
 * an AI page shows a conversation rather than one generic illustration.
 */
export type ServiceVisual =
  | "web" /* browser + code: website design, development, frameworks */
  | "uiux" /* design canvas, components, flows */
  | "ecommerce" /* storefront, product grid, cart */
  | "seo" /* search result + ranking chart */
  | "ads" /* campaign dashboard, spend / conversions */
  | "content" /* editor, article, social posts */
  | "video" /* timeline editor, player */
  | "email" /* inbox + automation flow */
  | "ai" /* chat interface + automation workflow */
  | "design"; /* brand board: type, colour, marks */

export interface TitledItem {
  title: string;
  body: string;
}

/**
 * Richer, keyword-researched page content for one service. Merged into the
 * catalogue entry by getService(), alongside service-content.ts.
 *
 * Nothing here may assert a statistic, client result, award or certification.
 */
export interface ServiceDetail {
  /** Keyword-led H1, e.g. "Website Design Agency for Growing Businesses". */
  h1: string;
  keywords: {
    primary: string;
    secondary: string[];
    longTail: string[];
  };
  /** <title> without the brand suffix (the layout template appends it). ≤ 55 chars. */
  seoTitle: string;
  /** 140–160 characters, includes the primary keyword naturally. */
  seoDescription: string;
  visual: ServiceVisual;
  /** "Business challenges we solve" — exactly 3. */
  challenges: TitledItem[];
  /** "What we offer" — exactly 6, concrete capabilities. */
  offerings: TitledItem[];
  /** Service-specific delivery process — exactly 4 steps. */
  process: TitledItem[];
  /** Mainstream tools/technologies for this discipline — 6 to 10. */
  tech: string[];
  /** Extra long-tail FAQs, appended to the existing ones — exactly 2. */
  extraFaqs: Faq[];
}
