# MIDIS Resources — Phase 1: Audit & Implementation Plan

**Prepared:** 2026-10-08
**Sources:** live audit of `https://www.midis.in/`, the 36-page report *"Midis functional site.pdf"*, and strategic review of `https://www.seodiscovery.com/`.
**Status:** Phase 1 deliverable. Phases 2–3 (design system + homepage) in progress.

---

## 0. Executive summary

The report's one-line diagnosis is correct and is the organising principle of this rebuild:

> *SEO Discovery sells certainty. MIDIS currently sells capability.*

My independent audit confirms the diagnosis and finds the evidence gap is **wider than the report states**. The report assumed MIDIS's headline metrics merely lacked context. In fact:

- The published case studies are **anonymised placeholders** — "Client A", "Client B", "Client C", "Client D" — not redacted real clients.
- The portfolio imagery is **stock photography and hash-named files** (`photo-1504868584819…`, `afshin-t2y-…-unsplash.webp`), not project screenshots.
- There are **zero attributed testimonials**. One quote exists, attributed only to "Support lead, Client B".
- The Insights section has **one** published article.
- The site simultaneously claims *"over 15 years of experience"* and *"More than 25k Client Reviews"*, neither of which is supportable and which contradict the company's apparent age.

**Therefore the single highest-value outcome of this project is not the visual design.** It is building an evidence system that MIDIS can populate, and removing unsupported claims that are actively costing credibility with the $5k–$50k buyer the report describes.

A second, purely technical finding the report did not cover: **midis.in is a client-side-rendered Vite SPA with no server rendering.** Every page returns the same 2.3 KB HTML shell containing only a title and description; all content is injected by JavaScript. This is the root cause of MIDIS's weak organic visibility and it cannot be fixed by content strategy alone. The Next.js rebuild resolves it structurally.

---

## 1. Current MIDIS content inventory

### 1.1 Technical profile

| Property | Finding |
|---|---|
| Stack | Vite + React 18 SPA, React Router, GSAP, TanStack Query |
| Rendering | **100% client-side.** No SSR/SSG. HTML shell is 2,353 bytes |
| CMS | Strapi Cloud — `jubilant-sparkle-2f7bfe100e.strapiapp.com` |
| CMS endpoints | `/api/blogs`, `/api/blogs/:id`, `/api/blogs?populate=*`, `/api/enquiries` |
| Analytics | GA4 `G-EPDDCR21K0` |
| Ads pixel | Meta Pixel `1731274227883408` |
| Search Console | Verified (`google-site-verification` meta present) |
| robots.txt | Present, permissive, references sitemap |
| sitemap.xml | Present, 9 URLs, `lastmod` 2026-06-18 |
| Favicon | `/images/midis final 2.png` |
| Structured data | **None found** |
| Open Graph / Twitter cards | **None found** |
| Canonical tags | **None found** |
| Per-page metadata | **None** — all 9 routes share one title and description |

### 1.2 Existing URL inventory (all must be preserved or redirected)

| URL | Purpose | Disposition in new site |
|---|---|---|
| `/` | Homepage | Rebuilt, same URL |
| `/about` | About | Rebuilt, same URL |
| `/services` | Services list (13 services, tabbed) | Rebuilt as services hub, same URL |
| `/services2` | Alternate services page — **duplicate content** | **301 → `/services`** |
| `/work` | Portfolio (currently near-empty) | Rebuilt, same URL |
| `/case-study` | Case studies (placeholder content) | **301 → `/work`**; individual studies at `/work/[slug]` |
| `/ai` | AI services | Rebuilt as `/services/ai` + **301 from `/ai`**, or retained — see §4 |
| `/blogs` | Blog index | Rebuilt as `/insights` + **301 from `/blogs`** |
| `/blogs/:id` | Blog detail | **301 → `/insights/[slug]`** |
| `/contact` | Contact | Rebuilt, same URL |

### 1.3 Verified company facts (carry forward unchanged)

| Field | Value |
|---|---|
| Legal/brand name | MIDIS (stylised "Midis") |
| Current tagline | "Innovative Solutions for Modern Challenges" *(report recommends replacing)* |
| Email | `hello@midis.in` |
| Phone | `+91 97793 20626` |
| Address | 1st Floor, E 279, Industrial Area, Sector 75, S.A.S Nagar (Mohali), Punjab, India |
| Instagram | `instagram.com/officialmidis` |
| LinkedIn | `linkedin.com/company/midismarket` |
| Facebook | `facebook.com/people/Midis/61579354660327/` |
| YouTube | `youtube.com/@MidisOfficial` |

### 1.4 Brand assets

| Asset | File | Notes |
|---|---|---|
| Icon lockup | `/images/midis final 2.png` (4501×4500) | Black circle, white lowercase "m", final stroke cut diagonally and filled orange |
| Horizontal mark | `/images/midis final logo-01.png` (8000×4500) | Orange-only ascending bars + swoosh (growth motif) |
| **Brand orange** | **`#EF8716`** | **Measured, not estimated.** The horizontal logo is a clean two-colour file containing only `#FFFFFF` (71.77%) and `#EF8716` (28.23%). The icon lockup independently confirms `#EF8716` as its only chromatic colour. |

Both files are preserved byte-for-byte. The logo is not redrawn, recoloured, reproportioned or replaced anywhere in the rebuild.

### 1.5 Service inventory (as currently advertised)

**Digital & Creative:** Web Development · Web Designing · Graphic Design · Content Writing · Video Editing · YouTube Management · Search Engine Optimization · Email Marketing · E-Commerce Strategy (Shopify, WooCommerce, Wix) · Google & Meta Ads

**AI & Automation:** ChatGPT Integration · OpenAI API Integration · Generative AI Consultancy · AI Chatbot Development

Existing service copy is substantive and worth migrating (see §4).

### 1.6 People (as currently published)

**Leadership:** Gaurav Sharma — CEO & Director · Sagar Bakshi — Managing Director

**Team (exact name/role pairings read from the site source, not inferred):** Alin Mishra (Shopify Developer) · Shivani (Frontend Developer) · Ojaswini Saini (Graphic Designer) · Swayam Gandhi (Backend Developer) · Rahul Gehlot (Graphic Designer) · Navkirat Bhogal (SEO Expert) · Chanda Angral (Graphic Designer) · Alok Yadav (Video Editor)

Real photographs exist for all of the above and will be reused. Roles are retained; the report's recommendation to add a specialism line, project count and LinkedIn link per person is implemented as optional fields that render only when supplied.

### 1.7 Projects named on the current site

`Loyalist Exploration` · `Mining Discovery` · `Harvins Elevate`

These are the only named projects found. No screenshots, scope, dates, outcomes or client confirmation accompany them.

### 1.8 Claims register — items requiring substantiation or removal

| Claim | Where | Assessment | Action |
|---|---|---|---|
| "TOP RATED GLOBAL DIGITAL AGENCY" | Homepage | Self-awarded, no third-party source | **Remove** (report §12) |
| "3.4× Client ROI Increase" | Homepage | No client, period or baseline | Suppress until documented |
| "120% Organic Traffic Growth" | Homepage | No client, period or baseline | Suppress until documented |
| "40% Support Cost Savings" | Homepage | No client, period or baseline | Suppress until documented |
| "+25% CSAT Improvement" | Homepage | No client, period or baseline | Suppress until documented |
| "over 15 years of experience" | `/services2` | Inconsistent with company profile | **Remove** |
| "More than 25k Client Reviews" | `/services2` | No review profile supports this | **Remove** |
| "15+ experts" | Homepage | Published team totals 10 incl. leadership | Replace with actual headcount |
| "Projects Delivered / Years Experience / Client Satisfaction / Happy Clients" counters | `/about` | Unsourced counters | Render only when real values supplied |
| "Why Top Brands Trust Our Expertise" | Homepage | No brands shown | Replace with "Why clients come back to MIDIS" (report §12) |

Per your decision, none of these are replaced with invented substitutes. Each becomes a content-file field that renders only when a verified value is present.

---

## 2. Report recommendations checklist

All 25 recommendations plus the roadmap and the "first 10 actions", mapped to implementation.

| # | Recommendation | Page / Component | Priority | Status |
|---|---|---|---|---|
| 1 | Sell an outcome, not a service | Homepage hero, all service heroes | P0 | Phase 3 |
| 2 | Accumulate visible proof | Proof strip, logos, results, case studies | P0 | Architecture Phase 3; content gated |
| 3 | Show the story behind each result | Case-study template | P0 | Phase 6 |
| 4 | Build a serious Work section w/ categories | `/work` + filters + `/work/[slug]` | P0 | Phase 6 |
| 5 | Study SEO Discovery's long-tail machine | SEO architecture §5 | P1 | Phase 5 |
| 6 | Long-tail landing pages for web dev | `/services/*`, `/industries/*` | P0 | Phase 5 |
| 7 | Create a named MIDIS methodology | `/process` + homepage §8 | P0 | Phase 3/4 |
| 8 | Demonstrate business understanding | Homepage "Your website has one job" | P0 | Phase 3 |
| 9 | Build the Authority Stack (5 layers) | Site-wide | P0 | Phases 3–8 |
| 10 | Build a free tool | `/tools/website-audit` | P1 | Phase 7 |
| 11 | Stronger homepage structure | Homepage, 16 sections | P0 | Phase 3 |
| 12 | Remove "TOP RATED GLOBAL DIGITAL AGENCY" | Homepage | P0 | Phase 3 |
| 13 | Make numbers believable (context + source) | `ResultStat` component | P0 | Phase 3 |
| 14 | Lean into the broader positioning story | Positioning, About | P1 | Phase 4 |
| 15 | Don't imitate SEO Discovery's scale | Strategy | P0 | Applied |
| 16 | Build the MIDIS flywheel | Internal linking model | P1 | Phase 8 |
| 17 | Change content strategy (teardowns, research) | `/insights` taxonomy | P1 | Phase 7 |
| 18 | Create a "Why MIDIS?" page | `/why-midis` (8 numbered reasons) | P0 | Phase 4 |
| 19 | Reviews are a missing asset | Testimonial system + intake doc | P0 | Architecture Phase 3 |
| 20 | Team section should sell expertise | `/team` + `TeamCard` | P1 | Phase 4 |
| 21 | Build the MIDIS ecosystem navigation | Mega-menu | P0 | Phase 3 |
| 22 | 3-layer SEO architecture | §5 below | P0 | Phase 5/8 |
| 23 | Don't overlook AI search | AEO content patterns, schema | P1 | Phase 8 |
| 24 | What NOT to copy | Guardrails | P0 | Applied |
| 25 | Biggest strategic change — positioning | Site-wide | P0 | Phase 3 |
| R-P1 | Reposition (ICP, offer, voice) | §3 | P0 | This doc |
| R-P2 | Rebuild website | Phases 2–8 | P0 | In progress |
| R-P3 | Build authority (publishing cadence) | `/insights` infrastructure | P2 | Phase 7 |
| R-P4 | Build the search machine | Phase 8 + post-launch | P1 | Phase 8 |
| A-1…A-10 | First 10 actions | Distributed above | — | Tracked |

**Deliberately not implemented**, per report §24 and your brief: excessive claims, "#1/Best" language, big numbers without context, thin location pages, bulk AI-generated articles, keyword stuffing, fabricated structured data.

---

## 3. Positioning

**Primary (report §1, adapted):**
> **We design and build websites that make businesses look as serious as they actually are.**

**Supporting:**
> Strategy, design, development and digital growth for ambitious businesses that need more than another website.

**Hero headline (per brief §6):**
> Digital Experiences. Built to Make Business Move.

**Hero sub:**
> We combine strategy, design, technology and digital growth to help ambitious businesses create stronger brands and better online experiences.

**Hero offer hierarchy:** Website Design + Development is the hero offer. SEO, Ads, Branding, Content and AI are supporting services (report Phase 1).

**ICP:** funded startups, established SMEs, and international businesses commissioning £/$5k–50k+ digital projects.

**Voice:** specific, calm, commercially literate. No superlatives without evidence attached.

---

## 4. Content migration plan

| Current asset | Action | Destination |
|---|---|---|
| Service descriptions (13) | **Migrate, rewrite for business outcome** — facts unchanged | `/services/[slug]` |
| AI service copy (4, detailed) | **Migrate** — strongest existing copy | `/services/ai-*` |
| About narrative ("Not just another digital agency") | **Migrate, tighten** | `/about` |
| "Why Midis and not someone else" (4 points) | **Expand** to report §18's 8 reasons | `/why-midis` |
| "What you'll gain with Midis" (4 points) | Migrate | `/why-midis` |
| 5-step process (Discovery→Review) | **Replace** with report §7's 6-step named methodology | `/process` |
| FAQ (4 questions, About) | **Migrate + expand** to 12–15 | `/faq` + per-page FAQ blocks |
| Team names, roles, photos | **Migrate unchanged** | `/team` |
| Leadership (Gaurav Sharma, Sagar Bakshi) | **Migrate unchanged** | `/team`, `/about` |
| Contact details, socials, address | **Migrate unchanged** | Footer, `/contact`, schema |
| Blog post (1, from Strapi) | **Migrate** via Strapi | `/insights/[slug]` |
| Project names (3) | Migrate as stubs pending assets | `/work` |
| "Client A–D" case studies | **Do not migrate** — placeholders | Replaced by intake checklist |
| Stock portfolio imagery | **Do not migrate** as project work | — |
| Unsupported claims (§1.8) | **Do not migrate** | Claims register |

**Nothing factual is lost.** Every verified statement on the current site has a destination above.

---

## 5. SEO architecture

### Layer 0 — Technical foundation (the actual fix)

SSR/SSG via Next.js App Router replaces the CSR SPA. Plus: unique title/description/canonical per route, Open Graph + Twitter cards, generated `sitemap.xml` and `robots.ts`, breadcrumbs, semantic headings, image optimisation, 301 map, custom 404.

### Layer 1 — Commercial pages

`/services/web-design` · `/services/web-development` · `/services/ecommerce-development` · `/services/shopify-development` · `/services/wordpress-development` · `/services/woocommerce-development` · `/services/react-development` · `/services/nextjs-development` · `/services/website-redesign` · `/services/ui-ux-design` · `/services/seo` · `/services/technical-seo` · `/services/ecommerce-seo` · `/services/google-meta-ads` · `/services/graphic-design` · `/services/content-writing` · `/services/video-editing` · `/services/youtube-management` · `/services/email-marketing` · `/services/ai-chatbot-development` · `/services/chatgpt-integration` · `/services/openai-api-integration` · `/services/generative-ai-consultancy`

> ⚠️ **Confirmation required.** You selected "verified + tech-specific SEO pages". The tech-specific pages (React, Next.js, WordPress, WooCommerce, Shopify, website redesign, UI/UX) are **not currently advertised on midis.in**. I will build them with genuinely distinct, useful content, but please confirm MIDIS actually delivers each one before launch. Any you don't deliver, I remove — publishing a page for a service you can't fulfil is both a credibility and a commercial risk.

### Layer 2 — Industry pages

`/industries/saas` · `/healthcare` · `/real-estate` · `/ecommerce` · `/startups` · `/education` · `/professional-services` · `/d2c-brands`

Each with distinct challenges, relevant features, technology fit, related services, FAQs. No duplicated boilerplate.

### Layer 3 — Educational content

`/insights/[slug]` across Articles · Guides · Website Teardowns · Industry Insights · Technical Resources · Case Study Breakdowns.

### Internal linking model (report §16 flywheel)

```
Insight → Service → Case Study → Contact
Industry → Service → Case Study → Enquiry
Work → Case Study → Strategy call
```
Implemented as a typed `related` graph in content files, so links are data-driven and cannot rot silently.

### Structured data

`Organization`, `WebSite`, `BreadcrumbList`, `Service`, `Article`, `Person`, `FAQPage` — each emitted **only** when the page genuinely contains that content. No `AggregateRating` or `Review` schema until real reviews exist.

### Migration safety

301s for `/services2`, `/case-study`, `/blogs`, `/blogs/:id`, `/ai`. All nine existing URLs either retained or redirected — no existing search equity is dropped.

---

## 6. Conversion strategy

**Primary CTAs, used contextually (not all on every section):** Start a Project · Book a Strategy Call · Get a Free Website Audit · Explore Our Work · WhatsApp

**Enquiry system:** multi-step form (Name, Business, Email, Phone/WhatsApp, Website, Service, Goals, Budget, Timeline, Description) with validation, accessible errors, honeypot + rate limiting, loading and success states, consent notice. Posts to the **existing Strapi `/api/enquiries`** endpoint, so leads land where MIDIS already receives them. No success state is shown unless the submission genuinely succeeded.

**Free Website Growth Audit:** real PageSpeed Insights API integration (performance, accessibility, SEO, best-practices — all genuine Lighthouse metrics). If no API key is configured, the tool **degrades to an honest manual-audit request form** rather than displaying invented scores. No fabricated scores, issue counts, traffic figures or rankings under any condition.

**Analytics:** GA4 `G-EPDDCR21K0` and Meta Pixel `1731274227883408` carried over, with events for CTA clicks, enquiry start/completion, audit submissions, portfolio interaction and call bookings. Consent gate included.

---

## 7. Design system proposal

**Palette** — 85% neutral, orange as signature accent only.

| Token | Value | Use |
|---|---|---|
| `--midis-orange` | **`#EF8716`** | Accent only — CTAs, active nav, focus rings, step indicators, hover states |
| `--ink` | `#17191C` | Primary text, contrast sections |
| `--paper` | `#F7F7F5` | Page background |
| `--white` | `#FFFFFF` | Surfaces |
| `--line` | `#E8E8E6` | Hairline borders |
| `--muted` | `#777777` | Secondary text |

Orange on white is ~2.6:1 — **insufficient for body text**. Rule enforced: orange is used for large display type, fills and non-text indicators only; where orange text is needed on light surfaces, a darkened `#B4600A` variant is used to clear 4.5:1. Orange fills always carry `#17191C` or `#FFFFFF` foreground, whichever passes.

**Typography:** one editorial display face for headlines, one neutral grotesque for UI/body, fluid `clamp()` scale, tabular numerals for metrics.

**Motion language:** GSAP + ScrollTrigger for scroll storytelling; Framer Motion for component state; one shared easing and duration scale. Every animation is enhancement-only — all content renders and is readable with JS disabled or `prefers-reduced-motion: reduce`. No mandatory loading screen.

**Components:** button (3 variants + magnetic), nav + mega-menu + mobile drawer, section header, service card, project card (fixed 16:10 ratio, no crop of UI), `ResultStat` (value + context + source + case-study link — *renders nothing without context*), testimonial card, team card, process step, FAQ accordion, CTA band, form controls, breadcrumb, footer.

---

## 8. Homepage section plan

All 16 sections from the brief, with evidence-gated behaviour marked.

| # | Section | Evidence-gated |
|---|---|---|
| 1 | Immersive hero — editorial type, restrained motion, dual CTA | No |
| 2 | Trust & credibility — logos, proof strip | **Yes — hidden until assets** |
| 3 | Business problems — "Your website should do more than exist" | No |
| 4 | Featured work — 6–9 projects, 16:10, hover reveal | **Yes** |
| 5 | Real results — `ResultStat` w/ client, period, source | **Yes — hidden entirely until verified** |
| 6 | Services — hero offer first, supporting services after | No |
| 7 | Industries — editorial grid | No |
| 8 | The MIDIS methodology — 6 steps, scroll storytelling | No |
| 9 | Why MIDIS — 8 differentiators | No |
| 10 | Testimonials | **Yes — hidden until real, attributed quotes** |
| 11 | Meet the team — real photos only | No (photos exist) |
| 12 | Free website growth audit — URL input | No |
| 13 | Insights — real dates/authors | Partial (1 post) |
| 14 | FAQ — 12–15 questions | No |
| 15 | Final conversion | No |
| 16 | Footer — full sitemap, verified details | No |

Gated sections are driven by content files; when a collection is empty the section does not render, and the page's rhythm closes up cleanly. The site never shows an empty shelf.

---

## 9. Technical architecture

- **Next.js (App Router) + TypeScript + Tailwind CSS**, server components by default
- **GSAP + ScrollTrigger**, **Framer Motion**; Three.js only if a section genuinely earns it
- **Content layer:** typed TS/MDX content modules for services, industries, projects, case studies, testimonials, team, FAQs, results, site settings — separated from presentation
- **Strapi (existing)** retained for blogs and enquiry submission; no second CMS introduced
- `next/image`, `next/font`, generated sitemap + robots, metadata and JSON-LD utilities
- Route handlers for enquiry proxy and the PageSpeed audit
- Env vars documented in `.env.example`

**Performance targets:** LCP < 2.5s, INP < 200ms, CLS < 0.1, Lighthouse ≥ 90 across the board on mobile.

**Accessibility target:** WCAG 2.2 AA — keyboard nav, visible focus, landmarks, labelled fields, contrast enforced by token rules, reduced-motion honoured.

---

## 10. Development phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Research, audit, planning | ✅ **This document** |
| 2 | Design system + tokens + components | ▶ In progress |
| 3 | Homepage (all 16 sections, responsive) | ▶ In progress |
| — | **🛑 Review checkpoint — your sign-off on visual direction** | ⏸ |
| 4 | About, Why MIDIS, Process, Team, Contact | Queued |
| 5 | Services + industries pages | Queued |
| 6 | Portfolio + case-study system | Queued |
| 7 | Insights + free audit tool | Queued |
| 8 | SEO, schema, redirects, analytics, forms | Queued |
| 9 | Animation refinement | Queued |
| 10 | QA + launch readiness | Queued |

The live midis.in site is **not** touched. This builds as a separate application for your approval.

---

## 11. Evidence intake checklist — what MIDIS must supply

This is the highest-leverage list in the document. Each item unlocks a section that is currently built but hidden.

### Priority 1 — unlocks Work, Results and the homepage proof strip
1. For each real project: client name (or approved anonymisation), industry, services delivered, dates, live URL if permitted.
2. **Full-page screenshots** of each live project (desktop + mobile). These replace stock imagery.
3. Written client permission to name each client and display their logo.
4. For each of 3.4× ROI / 120% traffic / 40% support cost / +25% CSAT: which client, baseline, measurement period, measurement method, and a link to supporting data. **Any metric without these stays suppressed.**

### Priority 2 — unlocks Testimonials and reviews
5. Attributed testimonials: name, role, company, quote, photo permission.
6. Review-platform profiles with genuine reviews (Google, Clutch, ProvenExpert).
7. Video testimonials where clients agree.

### Priority 3 — unlocks counters and authority
8. Actual counts: projects delivered, years operating, team headcount, clients served, repeat-business rate.
9. Any genuine awards, certifications or partnerships, with issuing body and date.
10. Per team member: specialism line, project count, LinkedIn URL.

### Priority 4 — confirmations
11. Confirm the 6-step methodology reflects how MIDIS actually works.
12. Confirm which tech-specific services (React, Next.js, WordPress, WooCommerce, Shopify, redesign, UI/UX) MIDIS genuinely delivers.
13. Confirm business WhatsApp number and expected response time.
14. Supply Google PageSpeed Insights API key (free) to enable the real audit tool.
15. Confirm pricing guidance may be published, and the ranges.

---

## 12. Open risks

| Risk | Impact | Mitigation |
|---|---|---|
| Evidence never supplied | Site stays structurally excellent but thin on proof — the report's core problem persists | Intake checklist above; sections ship hidden, not fake |
| Tech-specific service pages unconfirmed | Pages for undelivered services | Flagged in §5; removal before launch is trivial |
| Orange contrast misuse | WCAG failure | Enforced token rules in §7 |
| Existing search equity lost | Ranking drop | Full 301 map; no URL dropped |
| Strapi schema unknown for enquiries | Form submissions rejected | Verify field contract against live endpoint before launch |
