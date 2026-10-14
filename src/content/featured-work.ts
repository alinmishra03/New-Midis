/* ==========================================================================
   FEATURED WORK  (the /work landing page)
   --------------------------------------------------------------------------
   WHAT THIS IS, AND WHAT IT IS NOT.

   This is not the portfolio. The portfolio is a separate site, published at
   PORTFOLIO_URL below, and it holds all eight projects with their own
   walkthroughs. This file carries the handful of them the /work page shows
   on the way there, and nothing else — no case studies, no metrics, no
   project pages. `content/evidence.ts` remains the home of documented
   outcomes and is still empty; nothing here fills it in by implication.

   PROVENANCE OF EVERY FIELD.

   `name`, `summary` and `tags` are the portfolio's own words for each
   project, read from midis-portfolio.vercel.app on 2026-10-14 and not
   rewritten here. `url` is the live site the portfolio links to, and each
   one was loaded in a browser on the same date: all six returned 200 with a
   rendered page and a matching title. `preview` is a screenshot of that
   page taken in the same pass, at one size for all of them, which is why
   the showcase never has to crop one differently from another.

   TWO THINGS A READER SHOULD KNOW BEFORE EDITING.

   The portfolio presents its entries as concepts — "CONCEPT ONE", "VIEW
   LIVE CONCEPT", "SELECT THIS DIRECTION" — so this page deliberately says
   "work" and "projects" and never "clients", never "we delivered", and
   never attaches a result to a name. Three of the six (AlinKriti, Country
   Kids, Gulf Connect) are also in the client report recorded in
   content/clients.ts; the other three are not, and that is exactly why none
   of the copy here claims a client relationship for any of them. If MIDIS
   confirms which were delivered engagements, `relationship` below is the
   field to set, and the cards can then say so.

   Omitted on purpose: the MIDIS site itself (showing midis.in as featured
   work on midis.in reads oddly) and Samriti Textiles (its only live address
   is a raw .myshopify.com development URL, and content/clients.ts records
   that engagement as not active). Both are still one click away in the
   portfolio.
   ========================================================================== */

/** The existing portfolio. Every "see more" on the page points here. */
export const PORTFOLIO_URL = "https://midis-portfolio.vercel.app/";

export interface FeaturedProject {
  slug: string;
  /** The project's own name, as the portfolio gives it. */
  name: string;
  /** Short category line. The portfolio's tags, title-cased. */
  category: string;
  /** The portfolio's own description, unedited. */
  summary: string;
  /** The live site. Verified to return a rendered page on 2026-10-14. */
  url: string;
  /** Bare host, shown as the visible link label. */
  host: string;
  /** 1800x1125 homepage screenshot in public/images/work. */
  preview: string;
  /**
   * Whether MIDIS has confirmed this as a delivered client engagement.
   * Unset everywhere today — see the note above. Nothing renders from it
   * yet; it exists so that the claim has somewhere to live when it is
   * verified, rather than being written into the copy by hand.
   */
  relationship?: "client";
}

export const featuredProjects: readonly FeaturedProject[] = [
  {
    slug: "country-kids",
    name: "Country Kids",
    category: "Early Learning · Website",
    summary:
      "A not-for-profit early learning centre rooted in Country, where every child belongs. Seven nature-named rooms, a curriculum shaped like the landscape and clear family pathways give the brand warmth and trust.",
    url: "https://www.countrykids.au/",
    host: "countrykids.au",
    preview: "/images/work/country-kids.jpg",
  },
  {
    slug: "gulf-connect",
    name: "Gulf Connect",
    category: "Capital Markets · Website",
    summary:
      "A capital-markets communications consultancy connecting international companies with Gulf capital, partners and media. An institutional palette, a three-part capability model and investor-focused pathways build confidence.",
    url: "https://www.gulfconnectconsultancy.com/",
    host: "gulfconnectconsultancy.com",
    preview: "/images/work/gulf-connect.jpg",
  },
  {
    slug: "alinkriti",
    name: "AlinKriti",
    category: "Jewellery · E-commerce",
    summary:
      "Handcrafted jewellery inspired by heritage and refined for the modern woman. Warm metallics, soft neutrals and story-led product presentation give every piece room to shine.",
    url: "https://alinkriti.com/",
    host: "alinkriti.com",
    preview: "/images/work/alinkriti.jpg",
  },
  {
    slug: "neocloudz",
    name: "NeoCloudz",
    category: "GPU Cloud · Web Platform",
    summary:
      "A GPU cloud presented as a live cluster terminal. Blackwell-class compute, workload-led solutions and developer tooling sit inside a dark, green-lit interface that feels operational from the first screen.",
    url: "https://www.neocloudz.com/",
    host: "neocloudz.com",
    preview: "/images/work/neocloudz.jpg",
  },
  {
    slug: "us-data-centers",
    name: "U.S. Data Centers",
    category: "AI Infrastructure · Website",
    summary:
      "Enterprise-scale AI infrastructure presented with technical clarity. Deployment speed, power, cooling and GPU-ready architecture lead a dark, data-rich interface built around high-density compute.",
    url: "https://www.usdatacenters.ai/",
    host: "usdatacenters.ai",
    preview: "/images/work/us-data-centers.jpg",
  },
  {
    slug: "digipowerx",
    name: "DigiPowerX",
    category: "Energy & Compute · Website",
    summary:
      "Energy, data centers and bare-metal GPU compute told as one vertically integrated story. A black-and-yellow industrial identity carries the journey from owned power to live AI infrastructure.",
    url: "https://www.digipowerx.com/",
    host: "digipowerx.com",
    preview: "/images/work/digipowerx.jpg",
  },
];

/** Screenshot of the portfolio itself, for the gateway section. */
export const portfolioPreview = {
  src: "/images/work/portfolio.jpg",
  alt: "The MIDIS portfolio site, showing its project showcase",
  host: "midis-portfolio.vercel.app",
};

/**
 * How many projects the portfolio holds in total.
 *
 * Counted from its own numbering ("01 / 08" through "08 / 08") on
 * 2026-10-14, so the page can say there is more to see without guessing at
 * a number. If the portfolio grows, this is the one place to update.
 */
export const portfolioProjectCount = 8;
