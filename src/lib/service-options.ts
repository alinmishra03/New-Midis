/**
 * The service options the contact form offers, and the map from a
 * `/services/<slug>` route onto the one that names it.
 *
 * This list used to exist twice — once in ContactForm.tsx for the `<select>`,
 * once as the keys of SERVICE_MAP in the enquiry route, which translates it
 * to the live Strapi enumeration. Two copies of the same strings, one of them
 * load-bearing for whether a lead is accepted at all. The route's drift guard
 * now checks this single list against its map at module load.
 *
 * Nothing here is user-visible copy that could be reworded freely: each
 * string is a submitted VALUE that the route looks up. Changing one means
 * changing SERVICE_MAP in the same commit, and the guard will say so.
 */
export const SERVICE_OPTIONS = [
  "Website design",
  "Website development",
  "Website redesign",
  "UI/UX design",
  "E-commerce development",
  "Shopify development",
  "Search engine optimisation",
  "Google & Meta Ads",
  "Graphic design",
  "Content writing",
  "Branding",
  "AI chatbot development",
  "AI & automation",
  "Something else",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

/** The query parameter the pricing cards and service pages hand to /contact. */
export const SERVICE_QUERY_KEY = "service";

/**
 * Catalogue slug to form option.
 *
 * Deliberately not exhaustive. Several services — video editing, YouTube
 * management, the consultancy offers — have no option that honestly names
 * them, and picking the nearest one would file the enquiry under work the
 * visitor did not ask about. Those resolve to null and the select is simply
 * left unset, which is the truthful outcome: they said nothing about service,
 * and the message field carries what they actually want.
 */
const OPTION_FOR_SLUG: Readonly<Record<string, ServiceOption>> = {
  "web-design": "Website design",
  "web-development": "Website development",
  "react-development": "Website development",
  "nextjs-development": "Website development",
  "wordpress-development": "Website development",
  "website-redesign": "Website redesign",
  "ui-ux-design": "UI/UX design",
  "ecommerce-development": "E-commerce development",
  "woocommerce-development": "E-commerce development",
  "shopify-development": "Shopify development",
  seo: "Search engine optimisation",
  "technical-seo": "Search engine optimisation",
  "ecommerce-seo": "Search engine optimisation",
  "google-meta-ads": "Google & Meta Ads",
  "graphic-design": "Graphic design",
  "content-writing": "Content writing",
  "ai-chatbot-development": "AI chatbot development",
  "chatgpt-integration": "AI & automation",
  "openai-api-integration": "AI & automation",
  "generative-ai-consultancy": "AI & automation",
};

const OPTION_SET: ReadonlySet<string> = new Set(SERVICE_OPTIONS);

/**
 * Resolves whatever arrived in `?service=` to a value the select can hold.
 *
 * Accepts a slug (what the pricing cards send) or an exact option value (so a
 * hand-written or previously shared link keeps working). Anything else —
 * including a crafted value — returns null, so the parameter can never put an
 * arbitrary string into a submitted field.
 */
export function serviceOptionForSlug(value: string | null | undefined): ServiceOption | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (OPTION_SET.has(trimmed)) return trimmed as ServiceOption;

  return OPTION_FOR_SLUG[trimmed.toLowerCase()] ?? null;
}

/** The /contact link for a service, or plain /contact when it has no option. */
export function contactHrefForService(slug: string): string {
  return serviceOptionForSlug(slug)
    ? `/contact?${SERVICE_QUERY_KEY}=${encodeURIComponent(slug)}`
    : "/contact";
}
