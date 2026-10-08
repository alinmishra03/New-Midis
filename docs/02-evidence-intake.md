# MIDIS — Evidence Intake Checklist

**Why this document exists**

The 36-page report's central finding is that MIDIS sells capability where competitors sell certainty. The Phase 1 audit confirmed the gap is wider than the report assumed: the previous site's case studies were placeholders ("Client A/B/C/D"), its portfolio imagery was stock photography, it carried no attributed testimonials, and its headline metrics had no client, baseline or measurement period attached.

The rebuild does not invent any of this. Instead, every proof-bearing section is **built and working but hidden**, driven by content files. The moment you supply the material below, the corresponding section appears — no development work required.

**How to supply it:** fill in the content files listed against each item, or send the raw material and we'll populate them.

---

## Priority 1 — Unlocks the entire portfolio, Results, and the homepage trust strip

These four items transform the site from well-structured to genuinely persuasive. They are worth more than every other item combined.

**As of Phase 6, populating `projects` alone switches on eight things at once:**

1. The "Our Work" item in the main navigation
2. The footer's Work column and its five category links
3. `/work` — from a noindexed empty state to an indexable, filterable portfolio grid
4. A full case-study page per project at `/work/[slug]`
5. The homepage **Featured Work** section
6. The homepage **Results** section (where metrics carry their context)
7. The homepage **Testimonials** section (where quotes are attributed)
8. `/work` and every case study in `sitemap.xml`

All of it is built and has been verified rendering against a test fixture. None of it requires development work — only content.

| # | What's needed | Why | Populates |
|---|---|---|---|
| 1 | **Real project list.** For each: client name (or an anonymisation they've approved, e.g. "a D2C wellness brand"), industry, services delivered, year, and the live URL if you're permitted to link it. | Report §4 — the Work section is both a sales asset and an SEO asset. | `src/content/evidence.ts` → `projects` |
| 2 | **Full-page screenshots of each live project**, desktop and mobile. Actual captures of the delivered work. | Report §4. Replaces stock photography. Screenshots must not be cropped so tightly that the interface becomes unrecognisable. | `projects[].thumbnail` |
| 3 | **Written permission** to name each client and display their logo. | Required before any client mark can legally appear. | `evidence.ts` → `clientLogos[].permissionOnFile` |
| 4 | **Substantiation for each metric.** For *3.4× ROI*, *120% organic traffic*, *40% support cost saving* and *+25% CSAT*: which client, the baseline figure, the measurement period, the measurement method, and a link to supporting data (GA4 export, Search Console, a support-desk report). | Report §13 — *"because there is no accompanying evidence, they can actually create scepticism"*. | `evidence.ts` → `results` |

> **Any metric without all five supporting fields stays suppressed.** This is enforced by the TypeScript type: `ResultMetric` cannot be constructed without `client`, `baseline`, `period`, `measurement` and `caseStudy`. That is deliberate.

### What a case study needs

The template renders the brief's full structure. Every field below is optional except the first four — a project with only those still appears in the portfolio grid, just without a written study behind it.

| Field | Required | Notes |
|---|---|---|
| `name`, `client`, `industry`, `year` | ✅ | `client` may be an approved anonymisation |
| `category` | ✅ | websites / ecommerce / web-apps / branding / seo-growth |
| `summary` | ✅ | One business-focused sentence |
| `thumbnail` + `thumbnailAlt` | ✅ | Real screenshot, 16:10 crop |
| `services` | ✅ | What you actually delivered |
| `location` | — | Shown when relevant |
| `liveUrl` | — | Only if the client permits linking |
| `caseStudy.overview` | — | Opening paragraphs |
| `caseStudy.challenge` / `approach` / `design` / `development` | — | The four narrative chapters |
| `caseStudy.stack` | — | Technology used |
| `caseStudy.results` | — | Each needs baseline, period, measurement |
| `caseStudy.testimonial` | — | Attributed quote |
| `caseStudy.images` | — | Additional screenshots with alt text, optional captions |
| `caseStudy.relatedProjects` | — | Falls back to same-category work automatically |

The report recommends building towards 8–15 substantial case studies over time. Three good ones is a transformative start — the structure is already there.

---

## Priority 2 — Unlocks Testimonials and review proof

| # | What's needed | Notes |
|---|---|---|
| 5 | **Attributed testimonials**: name, role, company, the quote, and permission to use a photo. | Report §19. Never a stock portrait standing in for a real client. |
| 6 | **Review-platform profiles** carrying genuine reviews — Google Business, Clutch, ProvenExpert. | The report notes a ProvenExpert profile exists but carries little substance. Once real reviews exist, `Review`/`AggregateRating` schema can be added; until then it is deliberately omitted, as fabricating it violates Google's structured-data policy. |
| 7 | **Video testimonials** where clients agree. | Report §19 — one happy client can yield 6–8 marketing assets. |

**Suggested collection questions** (report §19): What problem did MIDIS solve? Why did you choose MIDIS? What changed after working with us? Would you recommend MIDIS, and why?

---

## Priority 3 — Unlocks counters and authority signals

| # | What's needed | Replaces |
|---|---|---|
| 8 | **Actual counts**: projects delivered, years operating, clients served, repeat-business rate. | The old site's "15+ experts" (while listing 8 people), "over 15 years of experience" and "More than 25k Client Reviews" — all removed as unsupportable. |
| 9 | **Genuine awards, certifications or partnerships**, with issuing body and date. | The self-awarded "TOP RATED GLOBAL DIGITAL AGENCY" badge, removed per report §12. |
| 10 | **Per team member**: a one-line specialism, project count, and LinkedIn URL. | Report §20 — turns a staff directory into proof of capability. Fields already exist and render automatically when filled. |

The trust strip currently needs **at least two verified figures, or one permitted client logo**, before it appears. A single headcount is not proof.

---

## Priority 4 — Confirmations needed before launch

| # | Confirm |
|---|---|
| 11 | **The six-stage method** (Discover → Strategise → Design → Build → Launch → Grow) reflects how MIDIS genuinely works. It is currently presented as the proposed methodology. |
| 12 | **Which tech-specific services MIDIS genuinely delivers.** Pages for React, Next.js, WordPress, WooCommerce development, Website Redesign and UI/UX Design are built but flagged `verifiedOffering: false`. Any MIDIS does not deliver must be removed before launch. |
| 13 | **Business WhatsApp number** and your real expected response time. |
| 14 | **Google PageSpeed Insights API key** (free). Tested in Phase 7: Google now returns `429` immediately for unkeyed requests, so without a key **every audit falls back** to the manual-request path. The tool works correctly either way — it simply can't produce real scores without the key, and it will never invent them. Get one from [Google's docs](https://developers.google.com/speed/docs/insights/v5/get-started) and set `PAGESPEED_API_KEY`. |
| 17 | **An author field in the Strapi `blogs` collection.** Articles currently have no author, so no byline is shown and no `author` is emitted in the Article schema — inventing one would be fabricating authorship. The report (§17, §19) treats named expertise as a core authority signal, so this is worth adding. |
| 18 | **Article categories**, if you want the Insights taxonomy the report suggests (Articles, Guides, Website Teardowns, Industry Insights, Technical Resources). The CMS has no category field today, so the index is a single chronological list. |
| 15 | **Whether pricing guidance may be published**, and the ranges. Report §9 lists pricing transparency as part of the authority stack. |
| 16 | **A dark-ink version of the horizontal "midis" wordmark.** The supplied wordmark is white-on-transparent, so it only works on dark surfaces. A dark version would let the full wordmark appear in the header instead of the circular icon lockup. |

---

## What has already been removed, and why

Per report §12 and §13, and the brief's prohibition on unsupported claims:

| Removed | Reason |
|---|---|
| "TOP RATED GLOBAL DIGITAL AGENCY" | Self-awarded with no third-party source. |
| "over 15 years of experience" | Inconsistent with the company's apparent history. |
| "More than 25k Client Reviews" | No review profile supports this. |
| "15+ experts" | The published team lists 10 people including leadership. |
| "Why Top Brands Trust Our Expertise" | No brands were shown. Replaced with "Why clients come back." |
| 3.4× / 120% / 40% / +25% | Suppressed pending item 4 above — not deleted, awaiting substantiation. |
| "Client A/B/C/D" case studies | Placeholders, not redacted real engagements. |
| Stock portfolio imagery | Misrepresented as project work. |

Nothing factual was discarded. Every verified statement from the old site has a home in the new one.
