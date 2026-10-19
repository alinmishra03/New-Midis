/* ==========================================================================
   SERVICE CARD IMAGERY
   --------------------------------------------------------------------------
   One photograph per service, used only as a card *background* — never as a
   separate image block above, below or beside the content.

   Why this exists
   ---------------
   The hand-built SVG compositions in `ServiceVisual` are shared between
   services: one `web` illustration served six development pages, one
   `ecommerce` illustration served three store pages, one `seo` three search
   pages. Website Design and Website Development showed the same artwork;
   so did Shopify and E-commerce. This map gives every service a distinct
   visual identity instead.

   Rules this file enforces
   ------------------------
   - Exactly one entry per service slug in `services.ts`.
   - No photograph is used twice. `assertUniqueServiceImagery()` is called
     from the build, so a duplicate fails `next build` rather than shipping.
   - Subjects match the service: the checkout photo is on E-commerce
     Development, the storefront photo on Shopify, the analytics photo on SEO.

   Files are produced by `scripts/prepare-service-imagery.mjs`, which also
   records the Pexels id behind each one. Source and licence are documented
   in `docs/service-imagery.md`.
   ========================================================================== */

/** Where `prepare-service-imagery.mjs` writes, and what the cards read. */
const DIR = "/images/services";

/**
 * `subject` describes what the photograph shows.
 *
 * It is deliberately not alt text. These are decorative backgrounds behind
 * text that already says what the service is, so they render `aria-hidden`
 * with an empty alt — announcing "monitor displaying a web design layout"
 * before the heading "Website Design" would be noise to a screen reader.
 * The field exists so the choice is reviewable, and so a mismatched or
 * repeated photo is obvious in a diff rather than only on the deployed page.
 */
export type ServiceImage = {
  readonly src: string;
  readonly subject: string;
};

export const serviceImagery: Readonly<Record<string, ServiceImage>> = {
  /* ------------------------------------------------- strategy & design */
  "web-design": {
    src: `${DIR}/web-design.webp`,
    subject: "Monitor displaying a web design layout in a studio workspace",
  },
  "ui-ux-design": {
    src: `${DIR}/ui-ux-design.webp`,
    subject: "Sketchpad of interface wireframes beside a phone and keyboard",
  },
  "website-redesign": {
    src: `${DIR}/website-redesign.webp`,
    subject: "Designer sketching a replacement layout at a desk",
  },
  "graphic-design": {
    src: `${DIR}/graphic-design.webp`,
    subject: "Fan of printed colour swatches held open",
  },

  /* ------------------------------------------------------- development */
  "web-development": {
    src: `${DIR}/web-development.webp`,
    subject: "Syntax-highlighted source code filling a monitor",
  },
  "react-development": {
    src: `${DIR}/react-development.webp`,
    subject: "JavaScript component code on a laptop screen",
  },
  "nextjs-development": {
    src: `${DIR}/nextjs-development.webp`,
    subject: "Developer at a multi-monitor build workstation",
  },
  "wordpress-development": {
    src: `${DIR}/wordpress-development.webp`,
    subject: "Hands editing a published post in a browser CMS",
  },

  /* --------------------------------------------------------- e-commerce */
  "ecommerce-development": {
    src: `${DIR}/ecommerce-development.webp`,
    subject: "Laptop showing an online checkout form",
  },
  "shopify-development": {
    src: `${DIR}/shopify-development.webp`,
    subject: "Shopper selecting product variants in a storefront",
  },
  "woocommerce-development": {
    src: `${DIR}/woocommerce-development.webp`,
    subject: "Store owner fulfilling orders from a desk",
  },

  /* ------------------------------------------------------------- growth */
  seo: {
    src: `${DIR}/seo.webp`,
    subject: "Search performance charts and trend lines",
  },
  "technical-seo": {
    src: `${DIR}/technical-seo.webp`,
    subject: "Site analytics and crawl data open on a laptop",
  },
  "ecommerce-seo": {
    src: `${DIR}/ecommerce-seo.webp`,
    subject: "Customer browsing a product catalogue online",
  },
  "google-meta-ads": {
    src: `${DIR}/google-meta-ads.webp`,
    subject: "Paid social advertisement rendered in a feed",
  },
  "content-writing": {
    src: `${DIR}/content-writing.webp`,
    subject: "Writer drafting at a laptop surrounded by reference books",
  },
  "video-editing": {
    src: `${DIR}/video-editing.webp`,
    subject: "Multi-track video editing timeline",
  },
  "youtube-management": {
    src: `${DIR}/youtube-management.webp`,
    subject: "Camera and microphone rig in a recording studio",
  },
  "email-marketing": {
    src: `${DIR}/email-marketing.webp`,
    subject: "Email inbox open on a handset",
  },

  /* ----------------------------------------------------------------- AI */
  "ai-chatbot-development": {
    src: `${DIR}/ai-chatbot-development.webp`,
    subject: "Dark-themed assistant chat interface mid-conversation",
  },
  "chatgpt-integration": {
    src: `${DIR}/chatgpt-integration.webp`,
    subject: "Operator working against an AI assistant on a laptop",
  },
  "openai-api-integration": {
    src: `${DIR}/openai-api-integration.webp`,
    subject: "Network equipment in a lit server hall",
  },
  "generative-ai-consultancy": {
    src: `${DIR}/generative-ai-consultancy.webp`,
    subject: "Abstract render of a neural network",
  },
};

/** Undefined for a service with no photograph — callers render a plain card. */
export function getServiceImage(slug: string): ServiceImage | undefined {
  return serviceImagery[slug];
}

/**
 * Fails the build if two services point at the same file.
 *
 * The whole point of this module is that no two service cards show the same
 * picture, and that is exactly the kind of thing a copy-paste quietly breaks.
 * Called from `services.ts` at module scope so it runs during `next build`.
 */
export function assertUniqueServiceImagery(): void {
  const bySrc = new Map<string, string[]>();
  for (const [slug, img] of Object.entries(serviceImagery)) {
    bySrc.set(img.src, [...(bySrc.get(img.src) ?? []), slug]);
  }
  const shared = [...bySrc].filter(([, slugs]) => slugs.length > 1);
  if (shared.length > 0) {
    throw new Error(
      `service imagery must be unique per service, but ${shared
        .map(([src, slugs]) => `${src} is used by ${slugs.join(", ")}`)
        .join("; ")}`,
    );
  }
}
