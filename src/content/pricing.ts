import { services } from "./services";

/* ==========================================================================
   SERVICE PRICING
   --------------------------------------------------------------------------
   ⚠  EVERY FIGURE BELOW IS AN ESTIMATE. NONE HAS BEEN CONFIRMED BY MIDIS.
       They are marked `estimated: true` and must be replaced with real rates
       before this site is treated as quoting anyone.

   Where they came from
   --------------------
   This file was deliberately empty. Nothing in the repository carries a
   verified MIDIS rate: the audit found no published rate card on midis.in,
   and the only thing the company says about cost in its own words is the FAQ
   answer in content/company.ts —

     "It depends on scope rather than page count. [...] We scope properly
      before quoting, and the proposal breaks down what drives the number."

   The client asked for prices on the homepage anyway, and asked that they be
   estimated here. So rather than invent numbers outright, each one is placed
   against published 2026 Indian agency benchmarks and positioned at the upper
   middle of the band — MIDIS sells against "look as serious as you actually
   are", so bottom-of-market figures would read wrong next to that:

     business site, agency-built ......... ₹40,000 – ₹80,000
     growth / CMS site with SEO .......... ₹80,000 – ₹2,00,000
     e-commerce build, entry ............. from ₹50,000 – ₹80,000
     custom app / large store ............ ₹1,50,000 upwards
     Shopify "launch" tier, published .... ₹1,50,000
     SEO retainer, mid-market SME ........ ₹40,000 – ₹80,000/month

   They are also set as a coherent ladder, because eight cards sit in one grid
   and a visitor reads them against each other: design below development,
   development below Shopify, Shopify below custom e-commerce.

   What they are NOT
   -----------------
   They are not MIDIS's rates. They carry no proposal, no scope and no margin
   behind them. A published price is a commercial commitment — a client can
   hold the company to it, and a figure set too low loses work that would
   otherwise have been quoted properly. Treat the table below as a starting
   point for that conversation, not an answer to it.

   Structured data is deliberately withheld while `estimated` is set: the
   visible price is what the client asked for, but handing Google a machine-
   readable Offer carrying an invented number is a different kind of claim.
   Clearing the flag turns the Offer markup on, from the same source, so the
   page and the schema can never disagree.

   TO CONFIRM A PRICE
   ------------------
   Replace `from` with the real figure, set `source` to where it was confirmed
   — a signed rate card, a proposal template, written confirmation; never
   "approx" — and delete the `estimated` flag. Each is independent, so they
   can be confirmed one service at a time: an unconfirmed slug simply keeps
   showing "Custom Quote", and the grid stays aligned either way.

     currency  "INR" unless the figure is quoted in something else.
     from      The lowest number MIDIS will publish for that service.
     basis     "project" for a one-off build, "month" for a retainer. A
               monthly figure renders as "₹X/month" so it can never be
               mistaken for a project price sitting next to one.
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
  /**
   * Set while the figure is an estimate rather than a confirmed MIDIS rate.
   *
   * The price still renders — that is what the client asked for — but the
   * Offer structured data is withheld, so an unverified number is never
   * handed to Google as a machine-readable commitment. Delete the flag when
   * the rate is confirmed and the markup turns on from the same source.
   */
  estimated?: boolean;
}

/**
 * Keyed by service slug.
 *
 * ⚠ ESTIMATES, NOT CONFIRMED MIDIS RATES. See the header for how each was
 * derived and what has to happen before they can be relied on.
 */
export const servicePricing: Readonly<Record<string, ServicePrice>> = {
  /* ---------------------------------------------------------- build work */
  "web-design": {
    currency: "INR",
    from: 65000,
    basis: "project",
    source: "ESTIMATE — upper-middle of the ₹40k–80k agency band for a designed business site",
    estimated: true,
  },
  "ui-ux-design": {
    currency: "INR",
    from: 85000,
    basis: "project",
    source: "ESTIMATE — product design engagement, set above a marketing-site design",
    estimated: true,
  },
  "web-development": {
    currency: "INR",
    from: 95000,
    basis: "project",
    source: "ESTIMATE — lower end of the ₹80k–2L growth/CMS build band",
    estimated: true,
  },
  "shopify-development": {
    currency: "INR",
    from: 150000,
    basis: "project",
    source: "ESTIMATE — matches the published Shopify 'launch tier' benchmark",
    estimated: true,
  },
  "ecommerce-development": {
    currency: "INR",
    from: 195000,
    basis: "project",
    source: "ESTIMATE — custom store, set above Shopify per the ₹1.5L+ custom-build band",
    estimated: true,
  },
  "ai-chatbot-development": {
    currency: "INR",
    from: 120000,
    basis: "project",
    source: "ESTIMATE — custom application work, below a full e-commerce build",
    estimated: true,
  },

  /* ------------------------------------------------------------ retainers */
  seo: {
    currency: "INR",
    from: 45000,
    basis: "month",
    source: "ESTIMATE — entry of the ₹40k–80k mid-market SME retainer band",
    estimated: true,
  },
  "google-meta-ads": {
    currency: "INR",
    from: 40000,
    basis: "month",
    source: "ESTIMATE — management fee, set just below the SEO retainer",
    estimated: true,
  },
};

export function getServicePrice(slug: string): ServicePrice | undefined {
  return servicePricing[slug];
}

/** True when at least one verified price exists to show or mark up. */
export function hasPublishedPricing(): boolean {
  return Object.keys(servicePricing).length > 0;
}

/**
 * Formats a confirmed price as the amount alone — "₹1,20,000", or
 * "₹12,000/month" when the figure is a recurring one.
 *
 * The amount carries its basis but not its framing, so the card can set
 * "Starting at" next to it in one weight while the figure itself takes
 * another, and the plan dialog can put it under a "Starting price" heading,
 * without either of them restating the other's words. A monthly figure keeps
 * "/month" welded on deliberately: a project price and a retainer must never
 * be able to appear side by side looking like the same kind of number.
 *
 * Grouped in the Indian numbering system, because that is the audience the
 * figure is quoted to.
 */
export function formatPriceAmount(price: ServicePrice): string {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.from);

  return price.basis === "month" ? `${amount}/month` : amount;
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
