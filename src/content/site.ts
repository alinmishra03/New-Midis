/**
 * Verified MIDIS company facts.
 *
 * Every value here was extracted from the live midis.in site during the
 * Phase 1 audit, or supplied directly by MIDIS with the date recorded.
 * Nothing in this file is invented. If a field cannot be verified it is
 * omitted rather than guessed.
 */

/**
 * The Indian line, declared once.
 *
 * `site.phone` and `site.phoneE164` are read by the organisation schema, the
 * footer, the contact page and the enquiry confirmation, all of which want a
 * single primary number — so both of those keep pointing here while
 * `phoneNumbers` carries the full published list. One source, so the bar and
 * the schema cannot end up quoting different digits.
 */
const INDIA_LINE = {
  region: "IN",
  regionName: "India",
  display: "+91 97793 20626",
  e164: "+919779320626",
} as const;

export const site = {
  name: "MIDIS",
  legalName: "MIDIS",
  url: "https://www.midis.in",

  /** Report §1 / §25: sell the outcome, not the capability. */
  positioning: "We design and build websites that make businesses look as serious as they actually are.",
  tagline: "Strategy, design, development and digital growth for ambitious businesses.",

  email: "hello@midis.in",
  /** Primary line. See INDIA_LINE above for why it is not written twice. */
  phone: INDIA_LINE.display,
  /** E.164, for tel: and wa.me links. */
  phoneE164: INDIA_LINE.e164,

  /**
   * Every published line, in the order the announcement bar shows them.
   * The US number was supplied by MIDIS on 2026-10-12.
   *
   * `region` is a compact label for the dialling code, not a claim about an
   * office: the registered address below is the only location MIDIS states.
   */
  phoneNumbers: [
    {
      region: "US",
      regionName: "United States",
      display: "+1 (862) 295-0117",
      e164: "+18622950117",
    },
    INDIA_LINE,
  ],

  /**
   * WhatsApp is recorded separately from `phone` on purpose: a line is never
   * assumed to be WhatsApp-enabled because it appears on the contact page,
   * and the US number above is NOT assumed to be reachable this way.
   */
  whatsapp: "919779320626",
  /** Prefilled opener, shared by every WhatsApp entry point. */
  whatsappMessage: "Hello MIDIS, I'd like to discuss a project with your team.",

  address: {
    street: "Plot No. A-28(C, Phase 7, Industrial Area, Sector 73",
    locality: "Sahibzada Ajit Singh Nagar",
    region: "Punjab",
    /* The address carries a PIN code, which the previous one did not. It is
       its own field rather than being folded into `region`, so schema.org
       gets a real `postalCode` and the region stays just the region. */
    postalCode: "160055",
    country: "IN",
    countryName: "India",
  },

  socials: [
    { name: "LinkedIn", url: "https://www.linkedin.com/company/midismarket/" },
    { name: "Instagram", url: "https://www.instagram.com/officialmidis/" },
    { name: "YouTube", url: "https://www.youtube.com/@MidisOfficial" },
    { name: "Facebook", url: "https://www.facebook.com/people/Midis/61579354660327/" },
  ],

  analytics: {
    ga4: "G-EPDDCR21K0",
    metaPixel: "1731274227883408",
  },

  /** Existing Strapi instance — reused, not replaced. */
  cms: {
    baseUrl: "https://jubilant-sparkle-2f7bfe100e.strapiapp.com",
    blogs: "/api/blogs",
    enquiries: "/api/enquiries",
  },
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  heading: string;
  links: NavLink[];
}

export interface NavItem {
  label: string;
  /**
   * Where the item itself goes. For a group this is the hub page, used by
   * the panel's closing link; the trigger itself is a button, not a link.
   */
  href: string;
  /**
   * Extra path prefixes that should show this item as current. Needed
   * because four groups all sit under /services, so matching on href alone
   * would light every one of them at once.
   */
  match?: string[];
  columns?: NavColumn[];
  /** Closing link at the foot of the panel. */
  overview?: NavLink;
}

/* ==========================================================================
   PRIMARY NAVIGATION
   --------------------------------------------------------------------------
   Every href below resolves to a page that exists. The requested structure
   named five destinations this site has no page for, and they are left out
   rather than linked to nothing:

     On-Page SEO, Local SEO      no /services page
     Website UI Design           no page; UI/UX Design is the only one, so
     User Experience Design      that item is a plain link, not a one-item menu
     Social Media Marketing      no page
     Social Media Management     no page

   The "Social Media" group is therefore called Marketing and lists what
   MIDIS actually publishes: the ads, email and content pages. Calling it
   Social Media would promise management work with nothing behind it.

   Case Studies points at the homepage section, which is the only case-study
   content that exists; /work is still an empty, noindexed placeholder and
   stays out of the navigation until hasPortfolio flips.
   ========================================================================== */

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "SEO",
    href: "/services/seo",
    match: ["/services/seo", "/services/technical-seo", "/services/ecommerce-seo"],
    overview: { label: "All services", href: "/services" },
    columns: [
      {
        heading: "Search visibility",
        links: [
          { label: "SEO", href: "/services/seo" },
          { label: "Technical SEO", href: "/services/technical-seo" },
          { label: "E-commerce SEO", href: "/services/ecommerce-seo" },
        ],
      },
    ],
  },
  {
    label: "AI",
    href: "/services/ai-chatbot-development",
    match: [
      "/services/ai-chatbot-development",
      "/services/chatgpt-integration",
      "/services/openai-api-integration",
      "/services/generative-ai-consultancy",
    ],
    overview: { label: "All services", href: "/services" },
    columns: [
      {
        heading: "AI & automation",
        links: [
          { label: "AI Chatbot Development", href: "/services/ai-chatbot-development" },
          { label: "ChatGPT Integration", href: "/services/chatgpt-integration" },
          { label: "OpenAI API Integration", href: "/services/openai-api-integration" },
          { label: "Generative AI Consultancy", href: "/services/generative-ai-consultancy" },
        ],
      },
    ],
  },
  {
    label: "Web Development",
    href: "/services/web-development",
    match: [
      "/services/web-design",
      "/services/web-development",
      "/services/website-redesign",
      "/services/react-development",
      "/services/nextjs-development",
      "/services/ecommerce-development",
      "/services/shopify-development",
      "/services/woocommerce-development",
      "/services/wordpress-development",
    ],
    overview: { label: "All services", href: "/services" },
    /* Nine pages, so two columns — one dropdown of nine would be a list. */
    columns: [
      {
        heading: "Websites",
        links: [
          { label: "Website Design", href: "/services/web-design" },
          { label: "Web Development", href: "/services/web-development" },
          { label: "Website Redesign", href: "/services/website-redesign" },
          { label: "React Development", href: "/services/react-development" },
          { label: "Next.js Development", href: "/services/nextjs-development" },
        ],
      },
      {
        heading: "E-commerce & CMS",
        links: [
          { label: "E-commerce Development", href: "/services/ecommerce-development" },
          { label: "Shopify Development", href: "/services/shopify-development" },
          { label: "WooCommerce Development", href: "/services/woocommerce-development" },
          { label: "WordPress Development", href: "/services/wordpress-development" },
        ],
      },
    ],
  },
  /* One real page, so a link rather than a menu holding a single item. */
  { label: "UI/UX", href: "/services/ui-ux-design" },
  {
    label: "Marketing",
    href: "/services/google-meta-ads",
    match: [
      "/services/google-meta-ads",
      "/services/email-marketing",
      "/services/content-writing",
      "/services/video-editing",
      "/services/youtube-management",
      "/services/graphic-design",
    ],
    overview: { label: "All services", href: "/services" },
    columns: [
      {
        heading: "Advertising",
        links: [
          { label: "Google & Meta Ads", href: "/services/google-meta-ads" },
          { label: "Email Marketing", href: "/services/email-marketing" },
        ],
      },
      {
        heading: "Content & creative",
        links: [
          { label: "Content Writing", href: "/services/content-writing" },
          { label: "Video Editing", href: "/services/video-editing" },
          { label: "YouTube Management", href: "/services/youtube-management" },
          { label: "Graphic Design", href: "/services/graphic-design" },
        ],
      },
    ],
  },
  {
    label: "Industries",
    href: "/industries",
    overview: { label: "All industries", href: "/industries" },
    columns: [
      {
        heading: "Sectors we work in",
        links: [
          { label: "SaaS", href: "/industries/saas" },
          { label: "Healthcare", href: "/industries/healthcare" },
          { label: "Real Estate", href: "/industries/real-estate" },
          { label: "E-commerce & D2C", href: "/industries/ecommerce" },
        ],
      },
      {
        heading: "",
        links: [
          { label: "Startups", href: "/industries/startups" },
          { label: "Education", href: "/industries/education" },
          { label: "Professional Services", href: "/industries/professional-services" },
          { label: "Manufacturing", href: "/industries/manufacturing" },
        ],
      },
    ],
  },
  /*
   * A plain link, not a menu: /work is itself the index of the work, and a
   * dropdown would have to list either the six featured projects — which all
   * leave the site — or the portfolio, which is the page's own main CTA.
   *
   * It sits immediately before Company so the row still ends on the company
   * group, and it is the ninth item in a bar that was rebuilt around eight.
   * The bar wraps to the drawer below 1320px, so the extra item costs width
   * only on genuinely wide screens.
   */
  { label: "Work", href: "/work" },
  {
    label: "Company",
    href: "/about",
    match: ["/about", "/why-midis", "/process", "/team", "/insights", "/faq", "/contact", "/tools"],
    columns: [
      {
        heading: "About MIDIS",
        links: [
          { label: "About Us", href: "/about" },
          { label: "Why MIDIS", href: "/why-midis" },
          { label: "Our Process", href: "/process" },
          { label: "Our Team", href: "/team" },
        ],
      },
      {
        heading: "Resources",
        links: [
          { label: "Case Studies", href: "/#case-studies" },
          { label: "Insights", href: "/insights" },
          { label: "Free Website Audit", href: "/tools/website-audit" },
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
  },
];
