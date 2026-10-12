import { clients, type Client } from "./clients";

/* ==========================================================================
   CASE STUDIES
   --------------------------------------------------------------------------
   The homepage "Our Work. Real Results." section reads from here.

   WHAT IS VERIFIED, AND HOW.

   Industry. The brief forbids inventing client industries and marks several
   of its suggested categories "subject to verification", so every industry
   below was established by reading what the business says about itself on
   its own site on 2026-10-12. `industrySource` records the evidence. Three
   of the brief's suggested placements did not survive that check and were
   corrected — see the notes on alinkriti, sofisam and nexus-fundings.

   Profile. One line describing what the business does, taken from that same
   page. It is the only substantial fact this section can state about most
   of these engagements, and it is genuinely the client's own description
   rather than a characterisation of MIDIS's work.

   Services. Only where the MIDIS Client Portfolio & Delivery Overview states
   them. It states them for four of eighteen clients, two of which appear
   here. The rest carry null.

   Challenge, approach, results. The report records services and delivery
   status. It does not record a documented client requirement, a written
   account of the approach, or any performance evidence. The brief is
   explicit that these must not be invented and that a clearly marked draft
   placeholder belongs in the data instead of a fabricated fact — so they
   are null, and the panel says so in those words rather than inventing a
   plausible-sounding brief.

   Analytics. `analyticsStatus` is "awaiting" everywhere. Nothing is
   hardcoded into the component: dropping real screenshots into
   `analyticsImages` and flipping the status is the whole change, and the
   guards below refuse the inconsistent states.

   WHO IS NOT HERE, AND WHY. Six of the eighteen clients are absent, because
   a case study needs a verifiable industry and these have none:

     - Cozy&Comfy — the storefront returns HTTP 402 (Shopify "store
       unavailable"), so what it sold cannot be confirmed, and a suspended
       store is not a result worth featuring. `showcase` is false rather
       than the row being deleted, so MIDIS can reinstate it in one edit.
     - Yogshala, Mars Home Centre, Samrit — no website in the report and
       nothing to verify against. Assigning an industry from the name alone
       is exactly the invention the brief rules out.
     - TIV — the report records "Logo Design", not a web project.
     - The Thali Tales — the report records "Social Media & Graphic Design",
       not a web project.

   All eighteen still appear in the client showcase section; this is a
   narrower set by design.
   ========================================================================== */

export type CaseStudyIndustry =
  | "ecommerce-retail"
  | "education-childcare"
  | "hospitality"
  | "automotive"
  | "business-consulting"
  | "energy"
  | "finance";

export interface AnalyticsImage {
  /** Path under /public. Never a hotlink, never a stock chart. */
  src: string;
  /** Describes what the chart shows, for a reader who cannot see it. */
  alt: string;
  /** Intrinsic size, so the frame reserves space and nothing shifts. */
  width: number;
  height: number;
  caption?: string;
}

export interface CaseStudyProject {
  /** Matches a slug in clients.ts — the single source for name and URL. */
  slug: string;
  projectName: string;
  industry: CaseStudyIndustry;
  /** The evidence for that industry. Never an assumption. */
  industrySource: string;
  /** What the business does, from its own site. */
  profile: string;
  /** Services, only where the delivery report states them. */
  services: string | null;
  /** A documented client requirement. Null until MIDIS supplies one. */
  challenge: string | null;
  /** What MIDIS did. Null until MIDIS supplies it. */
  approach: string | null;
  /** Verified, client-approved outcomes. Empty everywhere today. */
  results: readonly string[];
  analyticsImages: readonly AnalyticsImage[];
  /** Where the figures came from — "Google Analytics 4", "Search Console". */
  analyticsSource: string | null;
  /** The window the figures cover, e.g. "Jan–Jun 2026". */
  analyticsPeriod: string | null;
  analyticsStatus: "awaiting" | "published";
  /** False keeps a client in the data but out of the section. */
  showcase: boolean;
  /** Why, when showcase is false. */
  showcaseNote?: string;
}

export const caseStudyIndustries: readonly { id: CaseStudyIndustry; label: string }[] = [
  /* The brief's own order, with the two categories its "Other Industries"
     bucket turned out to contain appended. "Home & Lifestyle" is absent
     because nothing verified landed in it — see alinkriti below. */
  { id: "ecommerce-retail", label: "E-commerce & Retail" },
  { id: "education-childcare", label: "Education & Childcare" },
  { id: "hospitality", label: "Hospitality" },
  { id: "automotive", label: "Automotive" },
  { id: "business-consulting", label: "Business & Consulting" },
  { id: "energy", label: "Energy & Sustainability" },
  { id: "finance", label: "Finance & Lending" },
];

/** Shared by every row until MIDIS supplies evidence. */
const AWAITING = {
  challenge: null,
  approach: null,
  results: [] as const,
  analyticsImages: [] as const,
  analyticsSource: null,
  analyticsPeriod: null,
  analyticsStatus: "awaiting",
  showcase: true,
} satisfies Partial<CaseStudyProject>;

export const caseStudies: readonly CaseStudyProject[] = [
  /* ------------------------------------------- e-commerce & retail */
  {
    ...AWAITING,
    slug: "alinkriti",
    projectName: "Alinkriti",
    industry: "ecommerce-retail",
    /* The brief suggested Home & Lifestyle. The site is a jewellery
       storefront, so it is retail, and Home & Lifestyle ends up with no
       verified project at all. */
    industrySource:
      "alinkriti.com describes itself as jewellery for women and runs a Shopify storefront (checked 2026-10-12).",
    profile: "An online jewellery brand, selling its own designs direct to customers.",
    services: null,
  },
  {
    ...AWAITING,
    slug: "menopause-relief-store",
    projectName: "The Menopause Relief Store",
    industry: "ecommerce-retail",
    industrySource:
      "themenopausereliefstore.com runs WordPress with WooCommerce — cart and add-to-cart present — under the heading \"Elevating Women's Midlife Wellness\" (checked 2026-10-12).",
    profile: "An online store selling wellness products for women in midlife and menopause.",
    services: null,
  },

  /* ----------------------------------------- education & childcare */
  {
    ...AWAITING,
    slug: "country-kids",
    projectName: "Country Kids",
    industry: "education-childcare",
    industrySource:
      "countrykids.au describes a not-for-profit early learning centre in Ravenhall, Victoria, for children from six weeks to six years (checked 2026-10-12).",
    profile:
      "A not-for-profit early learning centre in Victoria, with funded kinder programmes and seven age-grouped rooms.",
    /* One of only four clients whose services the delivery report states. */
    services: "Website Development & Design",
  },

  /* ---------------------------------------------------- hospitality */
  {
    ...AWAITING,
    slug: "high-spirits",
    projectName: "High Spirits",
    industry: "hospitality",
    industrySource:
      "highspirits.au describes an Indian buffet restaurant in Bunbury, Western Australia (checked 2026-10-12).",
    profile: "An Indian restaurant in Western Australia, serving a vegetarian and non-vegetarian buffet.",
    services: null,
  },
  {
    ...AWAITING,
    slug: "aureus-hospitality",
    projectName: "Aureus Hospitality",
    industry: "hospitality",
    /* The homepage renders its copy with JavaScript, so a plain fetch
       returns the document title and little else. The title is still the
       site's own word for what it is. */
    industrySource:
      "aureus-hospitality.com is titled \"Hotel Consultancy\"; the rest of the page is client-rendered (checked 2026-10-12).",
    profile: "A hotel consultancy.",
    services: null,
  },

  /* ----------------------------------------------------- automotive */
  {
    ...AWAITING,
    slug: "mobile-tyre-champions",
    projectName: "Mobile Tyre Champions",
    industry: "automotive",
    industrySource:
      "mobiletyrechampions.com describes 24/7 mobile tyre fitting and roadside tyre services across Surrey, Hampshire and Berkshire (checked 2026-10-12).",
    profile:
      "A mobile tyre fitting service covering the south of England, with 24/7 roadside callout.",
    services: null,
  },

  /* -------------------------------------------- business & consulting */
  {
    ...AWAITING,
    slug: "gulf-connect-consultancy",
    projectName: "Gulf Connect Consultancy",
    industry: "business-consulting",
    industrySource:
      "gulfconnectconsultancy.com describes introducing international companies to Gulf investors and placing their stories with regional business media (checked 2026-10-12).",
    profile:
      "A consultancy connecting international companies with investors and business media across the Gulf.",
    services: "Website Development, Design & Branding",
  },
  {
    ...AWAITING,
    slug: "sofisam",
    projectName: "SofiSam",
    industry: "business-consulting",
    /* The brief filed this under "Other Industries"; the site is explicit
       about being a consultancy. */
    industrySource:
      "sofisam.com is titled \"SOFISAM FZCO | International Strategic Consulting\" and describes an advisory and structuring firm based in Dubai (checked 2026-10-12).",
    profile: "A corporate advisory and strategic consulting firm based in Dubai.",
    services: null,
  },
  {
    ...AWAITING,
    slug: "hqb-pro-solutions",
    projectName: "HQB Pro Solutions",
    industry: "business-consulting",
    industrySource:
      "hqbprosolutions.com describes accounting, medical billing, taxation, bookkeeping and IT services for Canadian businesses in Edmonton, Alberta (checked 2026-10-12).",
    profile:
      "An Edmonton firm providing accounting, billing and IT services to Canadian businesses.",
    services: null,
  },
  {
    ...AWAITING,
    slug: "mounting-backend-service",
    projectName: "Mounting Backend Service",
    industry: "business-consulting",
    industrySource:
      "mountingbackendservices.com lists people operations, recruitment, compliance management, back-office operations, data entry and IT services (checked 2026-10-12).",
    profile:
      "A back-office and business operations provider, covering recruitment, compliance and data work.",
    services: null,
  },

  /* --------------------------------------------------------- energy */
  {
    ...AWAITING,
    slug: "solar-spectrum",
    projectName: "Solar Spectrum",
    industry: "energy",
    industrySource:
      "solarspectrum.com.au describes solar panels and battery storage for homes and businesses in Australia (checked 2026-10-12).",
    profile: "An Australian supplier of solar panels and battery storage for homes and businesses.",
    services: null,
  },

  /* -------------------------------------------------------- finance */
  {
    ...AWAITING,
    slug: "nexus-fundings",
    projectName: "Nexus Fundings",
    industry: "finance",
    /* Also filed under "Other Industries" in the brief. It is a broker. */
    industrySource:
      "nexusfundings.com.au lists home, car, personal, commercial, equipment and SMSF loans (checked 2026-10-12).",
    profile: "An Australian loan broker, arranging home, vehicle, commercial and SMSF lending.",
    services: null,
  },

  /* ------------------------------------------------ held back, with cause */
  {
    ...AWAITING,
    slug: "cozy-and-comfy",
    projectName: "Cozy&Comfy",
    industry: "ecommerce-retail",
    industrySource:
      "cozyndcomfy.com returns Shopify's \"store unavailable\" page (HTTP 402), which confirms the platform but not what was sold (checked 2026-10-12).",
    profile: "A Shopify store, no longer trading.",
    services: null,
    showcase: false,
    showcaseNote:
      "The storefront is suspended, so neither the catalogue nor the result can be verified. Set showcase to true once MIDIS confirms what the store sold and whether it should be shown.",
  },
];

/* ==========================================================================
   DERIVED VIEWS
   ========================================================================== */

const clientBySlug = new Map<string, Client>(clients.map((c) => [c.slug, c]));

/** The client record behind a case study — name, URL and reachability. */
export function clientFor(project: CaseStudyProject): Client {
  const client = clientBySlug.get(project.slug);
  if (!client) throw new Error(`case-studies.ts: no client named ${project.slug}.`);
  return client;
}

/**
 * The project's live site, or null.
 *
 * Driven by the reachability check in clients.ts rather than by the report,
 * so a client the report calls active but whose site does not answer never
 * becomes a broken "View Project" link.
 */
export function projectHref(project: CaseStudyProject): string | null {
  const client = clientFor(project);
  return client.reachable && client.website ? client.website : null;
}

export const shownCaseStudies = caseStudies.filter((p) => p.showcase);

/** Only categories that actually contain a project — never an empty tab. */
export const activeCaseStudyIndustries = caseStudyIndustries.filter((cat) =>
  shownCaseStudies.some((p) => p.industry === cat.id),
);

export function caseStudiesIn(industry: CaseStudyIndustry): readonly CaseStudyProject[] {
  return shownCaseStudies.filter((p) => p.industry === industry);
}

/** Whether any project anywhere has analytics to show. */
export function hasPublishedAnalytics(): boolean {
  return caseStudies.some((p) => p.analyticsStatus === "published");
}

/* ==========================================================================
   GUARDS — these throw at module load, which fails the build rather than
   shipping a section that quietly contradicts itself.
   ========================================================================== */

for (const p of caseStudies) {
  if (!clientBySlug.has(p.slug)) {
    throw new Error(`case-studies.ts: "${p.slug}" is not a client in clients.ts.`);
  }
  if (!p.industrySource.trim()) {
    throw new Error(`case-studies.ts: ${p.slug} has no evidence for its industry.`);
  }
  /* A published status with nothing to show is the state that would render
     an empty analytics frame; an awaiting status holding images would hide
     evidence MIDIS has already supplied. */
  if (p.analyticsStatus === "published" && p.analyticsImages.length === 0) {
    throw new Error(`case-studies.ts: ${p.slug} is marked published with no analyticsImages.`);
  }
  if (p.analyticsStatus === "awaiting" && p.analyticsImages.length > 0) {
    throw new Error(`case-studies.ts: ${p.slug} has analyticsImages but is still marked awaiting.`);
  }
  /* A figure with no source and no period is the unattributed metric the
     Phase 1 audit found on the old site. */
  if (p.results.length > 0 && !p.analyticsSource) {
    throw new Error(`case-studies.ts: ${p.slug} states results with no analyticsSource.`);
  }
  if (!p.showcase && !p.showcaseNote) {
    throw new Error(`case-studies.ts: ${p.slug} is held back with no reason recorded.`);
  }
  for (const img of p.analyticsImages) {
    if (!img.alt.trim()) {
      throw new Error(`case-studies.ts: an analytics image for ${p.slug} has no alt text.`);
    }
  }
}

const duplicates = caseStudies
  .map((p) => p.slug)
  .filter((slug, i, all) => all.indexOf(slug) !== i);
if (duplicates.length > 0) {
  throw new Error(`case-studies.ts: duplicate entries for ${duplicates.join(", ")}.`);
}
