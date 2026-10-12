import { services } from "./services";

/* ==========================================================================
   SERVICE PRICING
   --------------------------------------------------------------------------
   `servicePricing` is intentionally empty.

   Nothing in this repository carries a verified MIDIS rate. The audit found
   no published rate card on midis.in, and the only thing the company says
   about cost in its own words is the FAQ answer in content/company.ts:

     "It depends on scope rather than page count. [...] We scope properly
      before quoting, and the proposal breaks down what drives the number."

   So the homepage pricing section shows "Custom Quote" on every card and
   says plainly why. A "from ₹X" invented here would be the same failure the
   rest of this project refuses — a number with no source behind it — except
   that this one is a commercial commitment as well as a credibility risk.

   The moment MIDIS confirms real starting prices, adding them here makes the
   figures appear on the cards AND emits Offer structured data, with no
   component changes. Until then neither exists, which is correct: Google
   treats an Offer whose price is not visible on the page as a violation.

   The type requires `source` precisely so a figure cannot be dropped in
   without recording where it was confirmed.
   ========================================================================== */

export interface ServicePrice {
  /** ISO 4217 code, e.g. "INR". */
  currency: string;
  /** The lowest figure MIDIS is willing to publish for this service. */
  from: number;
  /** What that figure buys. */
  basis: "project" | "month";
  /**
   * Where it was confirmed — a signed rate card, a proposal template, or
   * written confirmation from MIDIS. Never a guess, never "approx".
   */
  source: string;
}

/** Keyed by service slug. Empty until MIDIS confirms published rates. */
export const servicePricing: Readonly<Record<string, ServicePrice>> = {};

export function getServicePrice(slug: string): ServicePrice | undefined {
  return servicePricing[slug];
}

/** True when at least one verified price exists to show or mark up. */
export function hasPublishedPricing(): boolean {
  return Object.keys(servicePricing).length > 0;
}

/**
 * Formats a confirmed price for display. Grouped in the Indian numbering
 * system, because that is the audience the figure is quoted to.
 */
export function formatServicePrice(price: ServicePrice): string {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.from);

  return price.basis === "month" ? `From ${amount}/month` : `From ${amount}`;
}

/* --------------------------------------------------------------------------
   The services the homepage pricing section presents, in display order.

   Every one is `verifiedOffering: true` in the catalogue — advertised on
   midis.in today. The `verifiedOffering: false` entries are SEO landing
   pages awaiting written confirmation that MIDIS delivers them, and putting
   one in a pricing section would be inviting an enquiry for work that may
   not be sellable yet. The guard below enforces that.
   -------------------------------------------------------------------------- */

export const pricingServiceSlugs = [
  "web-design",
  "web-development",
  "shopify-development",
  "ecommerce-development",
  "ui-ux-design",
  "seo",
  "google-meta-ads",
  "ai-chatbot-development",
] as const;

/**
 * Drift guard, in the same spirit as the one in services.ts: a slug renamed
 * in the catalogue, or a service quietly flipped to unverified, fails the
 * build here rather than rendering an empty or unsellable card.
 */
const pricingProblems = pricingServiceSlugs.flatMap((slug) => {
  const service = services.find((s) => s.slug === slug);
  if (!service) return [`${slug} is not in the service catalogue`];
  if (!service.verifiedOffering) return [`${slug} is not a verified offering`];
  return [];
});

if (pricingProblems.length > 0) {
  throw new Error(`pricing.ts: ${pricingProblems.join("; ")}.`);
}

/** Guards the inverse: a price for a service nobody can reach. */
const orphanPrices = Object.keys(servicePricing).filter(
  (slug) => !services.some((s) => s.slug === slug),
);

if (orphanPrices.length > 0) {
  throw new Error(`pricing.ts: price set for unknown service ${orphanPrices.join(", ")}.`);
}
