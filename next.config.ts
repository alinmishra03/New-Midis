import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * cacheComponents (partial prerendering) is deliberately OFF.
   *
   * Every page on this site is static content, so it bought very little,
   * and it actively broke two things: unknown slugs were served as
   * prerendered 200 shells because notFound() cannot change the status
   * once streaming has started (a soft 404), and it forbids the
   * dynamicParams flag that fixes them. Correct status codes matter more
   * here than streaming a page that was already going to be instant.
   */
  cacheComponents: false,

  images: {
    // Article imagery served by the existing MIDIS Strapi Cloud instance.
    remotePatterns: [
      { protocol: "https", hostname: "jubilant-sparkle-2f7bfe100e.strapiapp.com" },
      { protocol: "https", hostname: "**.strapiapp.com" },
      { protocol: "https", hostname: "**.media.strapiapp.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Preserves the search equity of the existing midis.in URL structure.
   * Every route on the old Vite SPA either keeps its path or redirects here.
   * Explicit 301s rather than Next's default 308: both are treated as
   * permanent by search engines, but 301 is the convention for migrations
   * and what the migration plan documents.
   * See docs/01-audit-and-plan.md §1.2.
   */
  async redirects() {
    return [
      { source: "/services2", destination: "/services", statusCode: 301 },
      { source: "/case-study", destination: "/work", statusCode: 301 },
      { source: "/blogs", destination: "/insights", statusCode: 301 },
      { source: "/blogs/:id", destination: "/insights/:id", statusCode: 301 },
      { source: "/ai", destination: "/services/ai-chatbot-development", statusCode: 301 },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
