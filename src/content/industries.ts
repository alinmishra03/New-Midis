import { industryContent } from "./industry-content";
import type { Industry } from "./types";

/**
 * Industry pages. Report §6 / brief §5: each must provide distinct value —
 * no boilerplate swapped sector name. Every entry below names challenges
 * specific to that sector.
 */
export const industries: readonly Industry[] = [
  {
    slug: "saas",
    name: "SaaS",
    challenges: [
      "Explaining a complex product before the visitor loses patience",
      "Competing against better-funded companies with bigger marketing teams",
      "Converting free trials into paid accounts",
      "Serving both technical evaluators and the executive signing the cheque",
    ],
    relatedServices: ["ui-ux-design", "web-design", "nextjs-development", "seo"],
    seo: {
      title: "SaaS Website Design & Development | MIDIS",
      description:
        "Websites for SaaS companies that explain a complex product quickly and convert evaluators into trials. Built for speed and search.",
    },
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    challenges: [
      "Establishing trust and clinical credibility immediately",
      "Making appointment booking genuinely easy for older or anxious patients",
      "Presenting services clearly without overwhelming people",
      "Meeting accessibility obligations in practice, not just on paper",
    ],
    relatedServices: ["web-design", "web-development", "ui-ux-design", "seo"],
    seo: {
      title: "Healthcare Website Design | MIDIS",
      description:
        "Healthcare websites built for trust, accessibility and straightforward appointment booking.",
    },
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    challenges: [
      "Presenting large, frequently changing property inventories",
      "Making search and filtering fast enough to be useful",
      "Capturing enquiries while interest is still high",
      "Performing well on mobile, where most property browsing happens",
    ],
    relatedServices: ["web-development", "ui-ux-design", "seo", "google-meta-ads"],
    seo: {
      title: "Real Estate Website Design & Development | MIDIS",
      description:
        "Real estate websites with fast property search, strong mobile performance and enquiry capture built in.",
    },
  },
  {
    slug: "ecommerce",
    name: "E-commerce & D2C",
    challenges: [
      "Standing out in a category where every store uses the same themes",
      "Reducing cart abandonment at checkout",
      "Keeping product pages fast as the catalogue grows",
      "Turning first-time buyers into repeat customers",
    ],
    relatedServices: ["ecommerce-development", "shopify-development", "email-marketing", "seo"],
    seo: {
      title: "E-commerce & D2C Website Development | MIDIS",
      description:
        "E-commerce and D2C stores designed around the path to checkout, built to stay fast as your catalogue grows.",
    },
  },
  {
    slug: "startups",
    name: "Startups",
    challenges: [
      "Looking established enough to be taken seriously early on",
      "Moving fast without building something that needs replacing in a year",
      "Supporting fundraising as well as customer acquisition",
      "Getting maximum value from a constrained budget",
    ],
    relatedServices: ["web-design", "nextjs-development", "ui-ux-design", "graphic-design"],
    seo: {
      title: "Startup Website Design & Development | MIDIS",
      description:
        "Websites for startups that look established from day one and are built to scale rather than be replaced.",
    },
  },
  {
    slug: "education",
    name: "Education",
    challenges: [
      "Serving prospective students, current students and parents at once",
      "Presenting courses, intakes and requirements without confusion",
      "Handling enrolment enquiries at seasonal peaks",
      "Meeting public-sector accessibility expectations",
    ],
    relatedServices: ["web-design", "web-development", "content-writing", "seo"],
    seo: {
      title: "Education Website Design | MIDIS",
      description:
        "Education websites that serve students, parents and staff — clear course information and enrolment that works at peak.",
    },
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    challenges: [
      "Differentiating when competitors describe themselves identically",
      "Demonstrating expertise without breaching client confidentiality",
      "Generating enquiries from people researching before they make contact",
      "Presenting a firm of individuals as a coherent practice",
    ],
    relatedServices: ["web-design", "content-writing", "seo", "graphic-design"],
    seo: {
      title: "Professional Services Website Design | MIDIS",
      description:
        "Websites for professional services firms that demonstrate expertise and generate qualified enquiries.",
    },
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    challenges: [
      "Presenting large technical product ranges and specifications",
      "Serving distributors, procurement teams and engineers differently",
      "Being found for highly specific technical search terms",
      "Replacing PDF catalogues with something usable",
    ],
    relatedServices: ["web-development", "seo", "content-writing", "ui-ux-design"],
    seo: {
      title: "Manufacturing Website Design & Development | MIDIS",
      description:
        "Manufacturing websites that handle technical product ranges and get found for specific industry search terms.",
    },
  },
];

/** Merges the catalogue entry with its long-form page content. */
export function getIndustry(slug: string): Industry | undefined {
  const base = industries.find((i) => i.slug === slug);
  if (!base) return undefined;

  const extra = industryContent[slug];
  return extra ? { ...base, ...extra } : base;
}

export function getAllIndustries(): Industry[] {
  return industries.map((i) => getIndustry(i.slug)!);
}

/** Same drift guard as services — a thin industry page is the failure mode. */
const missingIndustryContent = industries
  .filter((i) => !industryContent[i.slug])
  .map((i) => i.slug);
if (missingIndustryContent.length > 0) {
  throw new Error(
    `industries.ts: missing page content for ${missingIndustryContent.join(", ")}. ` +
      `Add entries to industry-content.ts or remove them from the catalogue.`,
  );
}
