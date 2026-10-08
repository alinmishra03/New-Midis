import type { ClientLogo, Project, ResultMetric, Testimonial } from "./types";

/* ==========================================================================
   EVIDENCE
   --------------------------------------------------------------------------
   These collections are intentionally empty.

   The Phase 1 audit of midis.in found that the published proof was not
   verifiable:

     - Case studies were anonymised placeholders ("Client A", "Client B",
       "Client C", "Client D") rather than redacted real engagements.
     - Portfolio imagery was stock photography and hash-named files
       (e.g. "afshin-t2y-9iMwtLr1WvI-unsplash.webp"), not project screenshots.
     - No testimonial carried a name, role or company.
     - The headline metrics (3.4x ROI, 120% organic traffic, 40% support cost
       saving, +25% CSAT) carried no client, baseline, period or measurement
       method. The report flags exactly this at §13: without context these
       numbers *create* scepticism rather than trust.

   The brief forbids inventing any of it, so none of it is invented here.

   Every section that consumes these arrays calls `hasEvidence()` and renders
   nothing when the array is empty. The site therefore reads as complete and
   confident rather than unfinished — and the moment MIDIS supplies real
   assets, the sections appear with no component changes.

   See docs/02-evidence-intake.md for exactly what to collect, in priority
   order. Populating Priority 1 alone activates the homepage proof strip, the
   Featured Work section, the Results section and the /work index.
   ========================================================================== */

/** Requires: written permission to display each client's mark. */
export const clientLogos: readonly ClientLogo[] = [];

/** Requires: real screenshots of delivered work + client naming permission. */
export const projects: readonly Project[] = [];

/** Requires: client, baseline, period and measurement method for each figure. */
export const results: readonly ResultMetric[] = [];

/** Requires: attributed quote — name, role, company. Never a stock portrait. */
export const testimonials: readonly Testimonial[] = [];

/**
 * Counters shown on the homepage trust strip.
 *
 * The old site claimed "15+ experts" while listing 8 people, and elsewhere
 * "over 15 years of experience" and "More than 25k Client Reviews" — all
 * unsupportable. Only genuinely countable facts appear here.
 */
export const verifiedCounts = {
  /** Derived from the published team list — countable, therefore safe. */
  teamMembers: 10,
  /** Set to a real number once confirmed; null hides the stat entirely. */
  projectsDelivered: null as number | null,
  yearsOperating: null as number | null,
  clientsServed: null as number | null,
  repeatBusinessRate: null as number | null,
} as const;
