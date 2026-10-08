import sanitizeHtml from "sanitize-html";

/**
 * Sanitises article HTML coming from the CMS before it is injected.
 *
 * Article bodies are stored as raw HTML in Strapi and rendered with
 * dangerouslySetInnerHTML, which trusts whatever the CMS returns. The audit
 * found the enquiries collection on that same instance is writable and
 * readable by unauthenticated requests (docs/03-security-and-privacy.md), so
 * treating CMS output as fully trusted would be unwise. Sanitising server-side
 * is cheap and removes the question entirely.
 *
 * The allow-list covers normal editorial markup and nothing executable.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "h5", "h6",
    "p", "blockquote", "figure", "figcaption",
    "ul", "ol", "li",
    "strong", "em", "b", "i", "u", "s", "code", "pre",
    "a", "img", "br", "hr", "span",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["id"],
  },
  // Block javascript:, data: and anything else unexpected.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  transformTags: {
    // Any external link that survives gets safe rel attributes.
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
        },
      };
    },
  },
  // Strapi's editor emits these; keeping them adds nothing and bloats output.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
};

export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, options);
}

/** Rough reading time from the text content of sanitised HTML. */
export function readingTime(html: string): number {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}
