/**
 * Verified MIDIS company facts.
 *
 * Every value here was extracted from the live midis.in site during the
 * Phase 1 audit. Nothing in this file is invented. If a field cannot be
 * verified it is omitted rather than guessed.
 */

export const site = {
  name: "MIDIS",
  legalName: "MIDIS",
  url: "https://www.midis.in",

  /** Report §1 / §25: sell the outcome, not the capability. */
  positioning: "We design and build websites that make businesses look as serious as they actually are.",
  tagline: "Strategy, design, development and digital growth for ambitious businesses.",

  email: "hello@midis.in",
  phone: "+91 97793 20626",
  /** E.164, for tel: and wa.me links. */
  phoneE164: "+919779320626",
  whatsapp: "919779320626",

  address: {
    street: "1st Floor, E 279, Industrial Area, Sector 75",
    locality: "S.A.S Nagar (Mohali)",
    region: "Punjab",
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
  href: string;
  columns?: NavColumn[];
}

export const nav: NavItem[] = [
  {
    label: "Services",
    href: "/services",
    columns: [
      {
        heading: "Strategy & Design",
        links: [
          { label: "Website Design", href: "/services/web-design" },
          { label: "UI/UX Design", href: "/services/ui-ux-design" },
          { label: "Website Redesign", href: "/services/website-redesign" },
          { label: "Graphic Design", href: "/services/graphic-design" },
        ],
      },
      {
        heading: "Development",
        links: [
          { label: "Web Development", href: "/services/web-development" },
          { label: "React Development", href: "/services/react-development" },
          { label: "Next.js Development", href: "/services/nextjs-development" },
          { label: "WordPress Development", href: "/services/wordpress-development" },
        ],
      },
      {
        heading: "E-commerce",
        links: [
          { label: "E-commerce Development", href: "/services/ecommerce-development" },
          { label: "Shopify Development", href: "/services/shopify-development" },
          { label: "WooCommerce Development", href: "/services/woocommerce-development" },
        ],
      },
      {
        heading: "Growth & AI",
        links: [
          { label: "Search Engine Optimisation", href: "/services/seo" },
          { label: "Google & Meta Ads", href: "/services/google-meta-ads" },
          { label: "AI Chatbot Development", href: "/services/ai-chatbot-development" },
          { label: "Content & Video", href: "/services/content-writing" },
        ],
      },
    ],
  },
  {
    label: "Industries",
    href: "/industries",
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
  { label: "Our Work", href: "/work" },
  { label: "Insights", href: "/insights" },
  {
    label: "Company",
    href: "/about",
    columns: [
      {
        heading: "About MIDIS",
        links: [
          { label: "About", href: "/about" },
          { label: "Why MIDIS", href: "/why-midis" },
          { label: "Our Process", href: "/process" },
          { label: "Our Team", href: "/team" },
        ],
      },
      {
        heading: "Resources",
        links: [
          { label: "Free Website Audit", href: "/tools/website-audit" },
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
  },
];
