/**
 * Content model for the MIDIS site.
 *
 * Content is deliberately separated from presentation so that MIDIS can
 * populate evidence over time without touching components, and so that
 * unverified claims cannot be introduced accidentally — the types force the
 * supporting context to be supplied alongside every number.
 */

import type {
  IndustryBuyer,
  IndustryPlatform,
  IndustryTimeline,
} from "./industry-profiles";

export type ServiceGroup = "strategy-design" | "development" | "ecommerce" | "growth" | "ai";

export interface Service {
  slug: string;
  title: string;
  /** Short label for navigation and cards. */
  navLabel: string;
  group: ServiceGroup;
  /** The business problem this solves, in the client's language. */
  problem: string;
  /** Plain-English description of the offering. */
  summary: string;
  /** What the client actually receives. */
  deliverables: string[];
  /** Who it is for. */
  audience: string;
  /** Longer body copy, one paragraph per entry. */
  /** Phase 5 fills these; optional so the catalogue can exist first. */
  body?: string[];
  /** Service-specific questions. */
  faqs?: Faq[];
  /** Internal-linking graph: related service slugs. */
  relatedServices?: string[];
  /** Industry slugs where this service is especially relevant. */
  relatedIndustries?: string[];
  /**
   * True when MIDIS is confirmed to deliver this today (verified from the
   * live midis.in service list). False means the page is drafted pending
   * written confirmation and must not be published until confirmed.
   */
  verifiedOffering: boolean;
  seo: SeoMeta;
}

export interface Industry {
  slug: string;
  name: string;
  /** What makes buying a website hard in this sector. */
  challenges: string[];
  /** How MIDIS responds. */
  approach?: string[];
  /** Features that matter disproportionately here. */
  features?: string[];
  intro?: string[];
  faqs?: Faq[];
  relatedServices?: string[];
  /*
   * Structured decision data, merged in from content/industry-profiles.ts.
   * Optional on the type so a sector can exist in the catalogue before its
   * profile is written, but the drift guard in industries.ts refuses to let
   * one ship without it.
   */
  buyers?: IndustryBuyer[];
  integrations?: string[];
  platform?: IndustryPlatform;
  metrics?: string[];
  timeline?: IndustryTimeline;
  rebuildSignals?: string[];
  seo: SeoMeta;
}

export interface Faq {
  question: string;
  answer: string;
}

export type {
  IndustryBuyer,
  IndustryPlatform,
  IndustryTimeline,
  IndustryProfile,
} from "./industry-profiles";

export interface ProcessStep {
  number: string;
  title: string;
  summary: string;
  detail: string;
  outputs: string[];
}

export interface Differentiator {
  number: string;
  title: string;
  body: string;
}

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  /**
   * Intrinsic pixel dimensions of `photo`.
   *
   * Supplying these lets the layout size each portrait to its own aspect
   * ratio instead of forcing every photograph into one fixed frame, which is
   * what was cropping the taller portraits.
   */
  photoWidth?: number;
  photoHeight?: number;
  /** Optional — renders only when supplied. */
  specialism?: string;
  linkedin?: string;
  projectCount?: number;
  bio?: string;
}

/* ==========================================================================
   EVIDENCE TYPES
   Each requires its supporting context as a non-optional field. A result
   cannot be expressed in this model without naming its source and period,
   which is what the report asks for and what the old site lacked.
   ========================================================================== */

export interface ResultMetric {
  /** e.g. "3.4x" or "120%" */
  value: string;
  label: string;
  /** Named client, or an approved anonymisation such as "D2C retail client". */
  client: string;
  industry: string;
  /** Where the figure started. */
  baseline: string;
  /** e.g. "Jan–Jun 2026" */
  period: string;
  /** How it was measured, e.g. "GA4, organic sessions". */
  measurement: string;
  /** Slug of the case study that documents it. */
  caseStudy: string;
}

export interface Project {
  slug: string;
  name: string;
  client: string;
  industry: string;
  /** Optional — shown on the case study when relevant. */
  location?: string;
  category: ProjectCategory;
  summary: string;
  services: string[];
  year: string;
  /** Real screenshot of delivered work. Never stock photography. */
  thumbnail: string;
  thumbnailAlt: string;
  liveUrl?: string;
  /** Present only when a full written case study exists. */
  caseStudy?: CaseStudy;
}

export type ProjectCategory =
  | "websites"
  | "ecommerce"
  | "web-apps"
  | "branding"
  | "seo-growth";

export interface CaseStudy {
  /** Opening overview paragraph(s). */
  overview: string[];
  challenge: string[];
  approach: string[];
  design: string[];
  development: string[];
  stack: string[];
  results: ResultMetric[];
  testimonial?: Testimonial;
  images: { src: string; alt: string; caption?: string }[];
  relatedProjects: string[];
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  photo?: string;
  /** Link to the review on a third-party platform, where one exists. */
  sourceUrl?: string;
}

export interface ClientLogo {
  name: string;
  logo: string;
  /** Written permission to display must be on file. */
  permissionOnFile: boolean;
}

export interface SeoMeta {
  title: string;
  description: string;
}
