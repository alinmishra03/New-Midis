import { serviceContent } from "./service-content";
import type { Service } from "./types";

/**
 * Service catalogue.
 *
 * `verifiedOffering: true`  — advertised on midis.in today (audit-confirmed).
 * `verifiedOffering: false` — commercial SEO landing pages added at the
 *   client's request. These must be confirmed as genuinely delivered before
 *   launch; see docs/02-evidence-intake.md item 12. Publishing a page for a
 *   service MIDIS cannot fulfil is both a credibility and a commercial risk.
 */
export const services: readonly Service[] = [
  /* ---------------------------------------------------------------- hero offers */
  {
    slug: "web-design",
    title: "Website Design",
    navLabel: "Website Design",
    group: "strategy-design",
    verifiedOffering: true,
    problem: "Your website looks smaller than the business behind it.",
    summary:
      "Websites designed around what your business needs to communicate and what your buyer needs to believe — not around a template.",
    audience: "Businesses whose current site undersells them, or who are launching and need to look credible from day one.",
    deliverables: ["Wireframes and structure", "Visual design system", "Responsive page designs", "Design handoff or build"],
    seo: {
      title: "Website Design Agency | MIDIS",
      description:
        "Website design that gives your business the credibility it has earned. Strategy-led design, built around how your customers actually buy.",
    },
  },
  {
    slug: "web-development",
    title: "Website Development",
    navLabel: "Web Development",
    group: "development",
    verifiedOffering: true,
    problem: "Your site is slow, fragile, or impossible to update without a developer.",
    summary:
      "Fast, accessible, server-rendered websites built on component systems your team can extend — with performance and search handled during the build.",
    audience: "Businesses who need a site that performs technically, not just one that looks finished.",
    deliverables: ["Production front-end", "CMS integration", "Third-party integrations", "Analytics and tracking"],
    seo: {
      title: "Website Development Company | MIDIS",
      description:
        "Website development focused on speed, accessibility and search visibility. Server-rendered builds on systems your team can actually maintain.",
    },
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    navLabel: "UI/UX Design",
    group: "strategy-design",
    verifiedOffering: true,
    problem: "People arrive, get confused, and leave.",
    summary:
      "Interface and experience design grounded in how people actually move through your product or site, and where they currently give up.",
    audience: "SaaS products, web applications and content-heavy sites with a usability or conversion problem.",
    deliverables: ["User journey mapping", "Wireframes and prototypes", "Interface design system", "Usability review"],
    seo: {
      title: "UI/UX Design Services | MIDIS",
      description:
        "UI and UX design that removes friction from the path between arriving and converting. Research-led, not decorative.",
    },
  },
  {
    slug: "website-redesign",
    title: "Website Redesign",
    navLabel: "Website Redesign",
    group: "strategy-design",
    verifiedOffering: false,
    problem: "Your site has aged badly — and you're worried a rebuild will cost you your rankings.",
    summary:
      "A redesign that modernises how the business is presented while explicitly protecting the search visibility you already have.",
    audience: "Established businesses with an existing site that earns traffic but no longer represents them well.",
    deliverables: ["Content and URL audit", "301 redirect map", "Redesigned site", "Post-launch ranking monitoring"],
    seo: {
      title: "Website Redesign Services | MIDIS",
      description:
        "Website redesign that preserves your existing search rankings. Full URL audit and redirect mapping included as standard.",
    },
  },

  /* ---------------------------------------------------------------- development */
  {
    slug: "react-development",
    title: "React Development",
    navLabel: "React Development",
    group: "development",
    verifiedOffering: false,
    problem: "You need an interactive product, not a brochure.",
    summary:
      "Component-driven React applications built for maintainability — typed, tested where it matters, and structured so a second developer can pick them up.",
    audience: "Teams building web applications, dashboards or highly interactive product interfaces.",
    deliverables: ["React application", "Component library", "State and data layer", "Documentation"],
    seo: {
      title: "React Development Services | MIDIS",
      description:
        "React development for web applications and interactive products. Maintainable component architecture, built to be handed over.",
    },
  },
  {
    slug: "nextjs-development",
    title: "Next.js Development",
    navLabel: "Next.js Development",
    group: "development",
    verifiedOffering: false,
    problem: "Your React site is invisible to search engines.",
    summary:
      "Server-rendered Next.js builds that give you application-grade interactivity without sacrificing crawlability or load performance.",
    audience: "Businesses who need both a fast, modern front-end and strong organic search performance.",
    deliverables: ["Next.js application", "SSR/SSG architecture", "SEO and metadata layer", "Deployment pipeline"],
    seo: {
      title: "Next.js Development Agency | MIDIS",
      description:
        "Next.js development combining modern interactivity with server rendering, so your site is fast for users and visible to search engines.",
    },
  },
  {
    slug: "wordpress-development",
    title: "WordPress Development",
    navLabel: "WordPress Development",
    group: "development",
    verifiedOffering: false,
    problem: "You need your team to publish without raising a ticket.",
    summary:
      "Custom WordPress builds — not a bought theme — with an editing experience your non-technical staff can use confidently.",
    audience: "Content-heavy businesses who publish frequently and want editorial independence.",
    deliverables: ["Custom theme", "Editor-friendly content blocks", "Performance tuning", "Team training"],
    seo: {
      title: "WordPress Development Company | MIDIS",
      description:
        "Custom WordPress development built around your editors. Fast, secure, and genuinely easy for your team to update.",
    },
  },

  /* ---------------------------------------------------------------- e-commerce */
  {
    slug: "ecommerce-development",
    title: "E-commerce Development",
    navLabel: "E-commerce Development",
    group: "ecommerce",
    verifiedOffering: true,
    problem: "Traffic arrives, carts fill, and then people disappear.",
    summary:
      "Online stores built around the decisions a shopper actually makes — with the friction removed from the path to checkout.",
    audience: "Retail and D2C brands selling online, or moving online for the first time.",
    deliverables: ["Storefront build", "Product and catalogue structure", "Checkout optimisation", "Payments and fulfilment integration"],
    seo: {
      title: "E-commerce Development Agency | MIDIS",
      description:
        "E-commerce development focused on the path to checkout. Store builds, catalogue structure and conversion-led design.",
    },
  },
  {
    slug: "shopify-development",
    title: "Shopify Development",
    navLabel: "Shopify Development",
    group: "ecommerce",
    verifiedOffering: true,
    problem: "Your Shopify store looks like everyone else's and converts like it too.",
    summary:
      "Custom Shopify storefronts and theme development that give your brand a distinct buying experience on infrastructure you don't have to maintain.",
    audience: "D2C and retail brands on Shopify who have outgrown an off-the-shelf theme.",
    deliverables: ["Custom theme development", "App integrations", "Conversion improvements", "Speed optimisation"],
    seo: {
      title: "Shopify Development Agency | MIDIS",
      description:
        "Custom Shopify development and theme builds for brands that have outgrown a stock theme. Built for conversion and speed.",
    },
  },
  {
    slug: "woocommerce-development",
    title: "WooCommerce Development",
    navLabel: "WooCommerce Development",
    group: "ecommerce",
    verifiedOffering: false,
    problem: "You want to sell online without handing over control of your stack.",
    summary:
      "WooCommerce stores for businesses that want ownership of their platform and the flexibility to customise how selling works.",
    audience: "Businesses already on WordPress, or those needing unusual pricing, catalogue or fulfilment logic.",
    deliverables: ["WooCommerce build", "Custom product logic", "Payment and shipping setup", "Performance tuning"],
    seo: {
      title: "WooCommerce Development Services | MIDIS",
      description:
        "WooCommerce development for businesses that want control of their e-commerce platform and flexibility in how they sell.",
    },
  },

  /* ---------------------------------------------------------------- growth */
  {
    slug: "seo",
    title: "Search Engine Optimisation",
    navLabel: "SEO",
    group: "growth",
    verifiedOffering: true,
    problem: "Your best customers are searching, and finding your competitors.",
    summary:
      "Search work that starts with the commercial terms your buyers actually use, then fixes the technical and content reasons you aren't ranking for them.",
    audience: "Businesses whose category has genuine search demand that they currently aren't capturing.",
    deliverables: ["Technical audit", "Keyword and content strategy", "On-page optimisation", "Performance reporting"],
    seo: {
      title: "SEO Services | MIDIS",
      description:
        "SEO built around commercial search intent, not vanity keywords. Technical fixes, content strategy and measurable reporting.",
    },
  },
  {
    slug: "technical-seo",
    title: "Technical SEO",
    navLabel: "Technical SEO",
    group: "growth",
    verifiedOffering: true,
    problem: "You publish good content and still don't rank.",
    summary:
      "Fixing the structural reasons search engines can't properly crawl, render or understand your site — starting with whether your content exists in the HTML at all.",
    audience: "Sites with content worth ranking that something technical is holding back.",
    deliverables: ["Crawl and index audit", "Rendering and performance fixes", "Structured data", "Internal link architecture"],
    seo: {
      title: "Technical SEO Services | MIDIS",
      description:
        "Technical SEO audits and fixes: crawlability, server rendering, Core Web Vitals, canonicals and structured data that matches your actual content.",
    },
  },
  {
    slug: "ecommerce-seo",
    title: "E-commerce SEO",
    navLabel: "E-commerce SEO",
    group: "growth",
    verifiedOffering: true,
    problem: "Your products exist but nobody finds them.",
    summary:
      "Search work built for the problems stores actually have — duplicate product content, faceted navigation, variant canonicals and under-invested category pages.",
    audience: "Online stores competing against marketplaces and larger retailers for the same products.",
    deliverables: ["Category architecture", "Faceted navigation and canonical handling", "Product content strategy", "Out-of-stock and migration policy"],
    seo: {
      title: "E-commerce SEO Agency | MIDIS",
      description:
        "E-commerce SEO covering category architecture, faceted navigation, duplicate product content and the structural issues stores face.",
    },
  },
  {
    slug: "google-meta-ads",
    title: "Google & Meta Ads",
    navLabel: "Google & Meta Ads",
    group: "growth",
    verifiedOffering: true,
    problem: "You're spending on ads and can't tell what's working.",
    summary:
      "Paid campaigns across Google and Meta, built on proper conversion tracking so spend is judged on enquiries and revenue rather than clicks.",
    audience: "Businesses with budget already in market who need it to produce measurable returns.",
    deliverables: ["Campaign strategy and build", "Conversion tracking setup", "Creative and ad copy", "Ongoing optimisation"],
    seo: {
      title: "Google & Meta Ads Management | MIDIS",
      description:
        "Paid advertising on Google and Meta with conversion tracking built in, so you can see what your spend actually produces.",
    },
  },
  {
    slug: "graphic-design",
    title: "Graphic Design",
    navLabel: "Graphic Design",
    group: "strategy-design",
    verifiedOffering: true,
    problem: "Your brand looks different everywhere it appears.",
    summary:
      "Visual identity and brand assets that stay consistent across every surface — site, social, print and campaign.",
    audience: "Businesses whose visual presentation has drifted, or who need a coherent identity from the start.",
    deliverables: ["Visual identity", "Brand guidelines", "Marketing collateral", "Social and campaign assets"],
    seo: {
      title: "Graphic Design Services | MIDIS",
      description:
        "Graphic design and visual identity that stays consistent everywhere your brand appears.",
    },
  },
  {
    slug: "content-writing",
    title: "Content Writing",
    navLabel: "Content Writing",
    group: "growth",
    verifiedOffering: true,
    problem: "Your copy explains what you do, but not why it matters.",
    summary:
      "Website copy, articles and campaign content written for your buyer — informed by search demand, but written to be read.",
    audience: "Businesses whose messaging isn't landing, or who need a consistent publishing output.",
    deliverables: ["Website copy", "Articles and guides", "Ad and campaign copy", "Tone of voice guidance"],
    seo: {
      title: "Content Writing Services | MIDIS",
      description:
        "Content writing that explains why your offering matters. Search-informed, written for people rather than algorithms.",
    },
  },
  {
    slug: "video-editing",
    title: "Video Editing",
    navLabel: "Video Editing",
    group: "growth",
    verifiedOffering: true,
    problem: "You have footage, but nothing publishable.",
    summary: "Edited video for campaigns, social and the website — cut for the platform it's actually going to run on.",
    audience: "Brands running social or campaign video who need consistent output.",
    deliverables: ["Short-form social edits", "Campaign and ad video", "Long-form editing", "Motion graphics"],
    seo: {
      title: "Video Editing Services | MIDIS",
      description: "Video editing for social, campaigns and websites — cut for the platform it will run on.",
    },
  },
  {
    slug: "youtube-management",
    title: "YouTube Management",
    navLabel: "YouTube Management",
    group: "growth",
    verifiedOffering: true,
    problem: "Your channel exists but isn't growing.",
    summary: "End-to-end channel management — content planning, optimisation and publishing cadence.",
    audience: "Businesses and founders building an audience on YouTube.",
    deliverables: ["Channel strategy", "Content planning", "Thumbnails and metadata", "Publishing and optimisation"],
    seo: {
      title: "YouTube Channel Management | MIDIS",
      description: "YouTube channel management covering strategy, content planning, optimisation and publishing.",
    },
  },
  {
    slug: "email-marketing",
    title: "Email Marketing",
    navLabel: "Email Marketing",
    group: "growth",
    verifiedOffering: true,
    problem: "You collect email addresses and never use them.",
    summary: "Automated email programmes that keep existing customers buying and bring stalled prospects back.",
    audience: "E-commerce brands and service businesses with an unused list.",
    deliverables: ["Automation flows", "Campaign design and copy", "Segmentation", "Performance reporting"],
    seo: {
      title: "Email Marketing Services | MIDIS",
      description: "Email marketing and automation that turns an unused list into repeat revenue.",
    },
  },

  /* ---------------------------------------------------------------- AI */
  {
    slug: "ai-chatbot-development",
    title: "AI Chatbot Development",
    navLabel: "AI Chatbot Development",
    group: "ai",
    verifiedOffering: true,
    problem: "Your team answers the same questions all day.",
    summary:
      "Chatbots that resolve routine queries accurately and hand over to a human the moment they shouldn't be handling something.",
    audience: "Businesses with high volumes of repetitive support or pre-sales questions.",
    deliverables: ["Conversation design", "Chatbot build and training", "Human handover rules", "Analytics dashboard"],
    seo: {
      title: "AI Chatbot Development | MIDIS",
      description:
        "AI chatbot development that resolves routine queries and escalates properly. Built around your real support data.",
    },
  },
  {
    slug: "chatgpt-integration",
    title: "ChatGPT Integration",
    navLabel: "ChatGPT Integration",
    group: "ai",
    verifiedOffering: true,
    problem: "You want AI in your product without rebuilding it.",
    summary:
      "ChatGPT integrated into your existing platform, app or site for support, lead capture or internal knowledge, in your brand's voice.",
    audience: "Product and operations teams adding conversational AI to something that already exists.",
    deliverables: ["Integration build", "Brand tone configuration", "CRM and site connection", "Ongoing tuning"],
    seo: {
      title: "ChatGPT Integration Services | MIDIS",
      description:
        "ChatGPT integration for websites, apps and internal systems — configured to your brand voice and connected to your tools.",
    },
  },
  {
    slug: "openai-api-integration",
    title: "OpenAI API Integration",
    navLabel: "OpenAI API Integration",
    group: "ai",
    verifiedOffering: true,
    problem: "You have a process that should be automated and isn't.",
    summary:
      "Custom workflows built on the OpenAI API — content generation, summarisation, classification and analysis wired into your systems.",
    audience: "Teams with document-heavy or repetitive processes worth automating.",
    deliverables: ["Workflow design", "API integration", "Evaluation and guardrails", "Monitoring"],
    seo: {
      title: "OpenAI API Integration | MIDIS",
      description:
        "Custom OpenAI API integrations for automation, summarisation and analysis, built into the systems you already run.",
    },
  },
  {
    slug: "generative-ai-consultancy",
    title: "Generative AI Consultancy",
    navLabel: "Generative AI Consultancy",
    group: "ai",
    verifiedOffering: true,
    problem: "You know AI matters but not where it applies to you.",
    summary:
      "Working out which AI use-cases are genuinely worth building for your business, and which are a distraction — then building the ones that are.",
    audience: "Leadership teams deciding where to invest in AI.",
    deliverables: ["Opportunity assessment", "Feasibility analysis", "Prototype", "Implementation roadmap"],
    seo: {
      title: "Generative AI Consultancy | MIDIS",
      description:
        "Generative AI consultancy that separates the use-cases worth building from the ones that aren't, then delivers them.",
    },
  },
];

export const serviceGroups = [
  { id: "strategy-design", label: "Strategy & Design" },
  { id: "development", label: "Development" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "growth", label: "Marketing & Growth" },
  { id: "ai", label: "AI & Automation" },
] as const;

/** Hero offers, per the report's Phase 1 recommendation to lead with web. */
export const featuredServiceSlugs = [
  "web-design",
  "web-development",
  "ecommerce-development",
  "ui-ux-design",
  "seo",
  "ai-chatbot-development",
] as const;

/**
 * Merges the catalogue entry with its long-form page content.
 * Returns undefined for an unknown slug so routes can 404 correctly.
 */
export function getService(slug: string): Service | undefined {
  const base = services.find((s) => s.slug === slug);
  if (!base) return undefined;

  const extra = serviceContent[slug];
  return extra ? { ...base, ...extra } : base;
}

/** Every service, merged with its page content. */
export function getAllServices(): Service[] {
  return services.map((s) => getService(s.slug)!);
}

/**
 * Guards against the catalogue and the content map drifting apart — a
 * service published without body copy would be exactly the thin page the
 * report warns against. Throwing at module load surfaces it during the build
 * rather than as an empty page in production.
 */
const missingContent = services.filter((s) => !serviceContent[s.slug]).map((s) => s.slug);
if (missingContent.length > 0) {
  throw new Error(
    `services.ts: missing page content for ${missingContent.join(", ")}. ` +
      `Add entries to service-content.ts or remove them from the catalogue.`,
  );
}

const orphanContent = Object.keys(serviceContent).filter(
  (slug) => !services.some((s) => s.slug === slug),
);
if (orphanContent.length > 0) {
  throw new Error(
    `service-content.ts: content for unknown service(s) ${orphanContent.join(", ")}.`,
  );
}
