# MIDIS Resources — Website Rebuild

A complete rebuild of [midis.in](https://www.midis.in/) as a server-rendered, evidence-led agency site.

**Status: all 10 phases complete.** Research and audit, the design system, the homepage, the company pages, the full service + industry architecture, the portfolio + case-study system, the Insights section, the free audit tool, consent-gated analytics with legal pages, the motion layer, and the QA pass are built and verified. **Zero broken internal links, zero QA problems.**

> **Before launch, read [docs/05-launch-checklist.md](docs/05-launch-checklist.md).** Six items block go-live, and two of them are on the existing live site rather than this build.

> ⚠️ **Read [docs/03-security-and-privacy.md](docs/03-security-and-privacy.md) first.** The audit found the existing Strapi `enquiries` collection is publicly readable, exposing lead names, emails and phone numbers on the current live site. That is a configuration issue on the existing CMS, not something introduced here, and it needs fixing.

> The live midis.in site has **not** been touched. This is a separate application.

---

## Why this rebuild exists

The 36-page report diagnosed MIDIS as selling *capability* where competitors sell *certainty*. The Phase 1 audit confirmed that and surfaced a technical cause the report didn't cover:

**midis.in is a client-rendered Vite SPA.** Every route returns the same 2,353-byte HTML shell with no content, no per-page metadata, no canonical tags, no Open Graph tags and no structured data. That is the root cause of its weak organic visibility, and no amount of content strategy fixes it.

This rebuild returns **~255 KB of fully server-rendered HTML** on the homepage, with per-page metadata and valid structured data.

See [`docs/01-audit-and-plan.md`](docs/01-audit-and-plan.md) for the full audit, and [`docs/02-evidence-intake.md`](docs/02-evidence-intake.md) for what MIDIS needs to supply.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

Requires Node 20+. No environment variables are needed to run locally — every feature either works without configuration or degrades honestly (see below).

### Checks

```bash
npm run lint
npx tsc --noEmit

# With the site running on :3000
npm run qa      -- http://localhost:3000   # metadata, canonicals, schema, sitemap, headings, alt text
npm run links   -- http://localhost:3000   # every internal link
```

`npm run qa` exits non-zero on any blocking problem, so it drops straight into CI.

---

## Environment variables

Copy `.env.example` to `.env.local`. All are optional; the site builds and runs without them.

| Variable | Purpose | Behaviour when absent |
|---|---|---|
| `PAGESPEED_API_KEY` | Google PageSpeed Insights key for the free website audit tool. **Effectively required** — see below. | Every audit fails with an honest rate-limit message and offers a manual audit instead. **It never shows invented scores.** |
| `NEXT_PUBLIC_GA4_ID` | GA4 measurement ID. Existing: `G-EPDDCR21K0` | Analytics not loaded. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel. Existing: `1731274227883408` | Pixel not loaded. |
| `STRAPI_API_TOKEN` | Auth for the existing Strapi CMS, if write access becomes restricted. | Public read continues to work. |

---

## Architecture

```
src/
  app/              routes, metadata, global CSS
  components/
    layout/         header (mega-menu + mobile drawer), footer
    home/           the 16 homepage sections
    ui/             button, logo, section, reveal, split headline
  content/          TYPED CONTENT — separated from presentation
    site.ts         verified company facts + navigation
    services.ts     service catalogue
    industries.ts   industry pages
    company.ts      method, differentiators, team, FAQs
    evidence.ts     proof — currently empty by design (see below)
    types.ts        content model
  lib/
    cms.ts          client for the existing Strapi instance
    utils.ts        cn() + hasEvidence()
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · existing Strapi Cloud CMS. **No animation library** — see the motion section below.

---

## Two conventions worth knowing before you edit

### 1. Evidence gating

`src/content/evidence.ts` holds `projects`, `results`, `testimonials` and `clientLogos`, and they are **intentionally empty**.

Every proof section calls `hasEvidence()` and **renders nothing** when its data is absent. No placeholder copy, no sample numbers, no stock imagery standing in for client work — the audit found exactly that pattern on the old site, and the report identifies it as the main reason serious buyers don't convert.

The types enforce this. `ResultMetric` cannot be constructed without `client`, `baseline`, `period`, `measurement` and `caseStudy`, so a number can't reach the page without its supporting context.

Fill the arrays and the sections appear. No component changes needed.

### 2. The accent colour is measured, not chosen

`#EF8716` was extracted from the original logo files, not sampled by eye. The horizontal wordmark is a clean two-colour PNG containing only `#FFFFFF` and `#EF8716`.

Computed contrast ratios drive two hard rules in `globals.css`:

| Pair | Ratio | Rule |
|---|---|---|
| `#EF8716` on white | 2.55:1 | **Never** body text on light surfaces |
| `#17191C` on `#EF8716` | 6.83:1 | Accent buttons use **charcoal** text, never white |
| `#EF8716` on `#17191C` | 6.83:1 | Fine for text on dark surfaces |
| `#AA5A0A` on `#F7F7F5` | 4.69:1 | Use `--color-accent-ink` for orange *text* on light |

### Logo usage

The original logo files are preserved byte-for-byte in `public/brand/`. `scripts/prepare-brand-assets.mjs` only trims blank canvas and resizes — it never recolours, redraws or reproportions the mark.

Two official lockups, each with a surface it belongs on:

- **`icon`** — circular black mark with the white *m* and orange cut. Used on **light** surfaces.
- **`wordmark`** — full "midis" wordmark, white with orange accents. Used on **dark** surfaces (the footer).

A dark-ink wordmark has been requested so the full wordmark can also appear on light surfaces (intake item 16).

---

## Accessibility and progressive enhancement

Target: WCAG 2.2 AA.

- **Nothing is hidden behind JavaScript.** Scroll reveals are gated on an `html.js` class set by a synchronous head script, so a visitor without JS sees every section immediately — with no flash.
- A 2.5-second failsafe adds `html.reveal-all`, so content appears even if the bundle never hydrates.
- `prefers-reduced-motion: reduce` forces full parity; the hero canvas paints one static frame.
- The FAQ uses native `<details>`, so it works with no JS at all.
- The audit form is a plain GET form — functional without JS.
- Skip link, visible focus rings, semantic landmarks, labelled fields throughout.

## Performance

- Homepage prerenders as static HTML with a 30-minute revalidate.
- The hero canvas caps DPR at 2, halves its column count on small or low-core devices, and stops rendering entirely when scrolled out of view or the tab is backgrounded.
- Portfolio thumbnails use a fixed 16:10 ratio so the grid cannot shift as images load.
- `next/font` self-hosts both typefaces; `next/image` handles AVIF/WebP.

## SEO

Per-page metadata and canonicals, Open Graph and Twitter cards, `Organization` / `WebSite` / `FAQPage` structured data, and a 301 map in `next.config.ts` covering every old URL (`/services2`, `/case-study`, `/blogs`, `/blogs/:id`, `/ai`) so no existing search equity is dropped.

**No `Review` or `AggregateRating` schema is emitted**, because MIDIS has no verified reviews yet and fabricating them would breach Google's structured-data policy.

---

## Routes built so far

**All content routes prerendered; only the audit tool and the enquiry handler are dynamic, as they must be.**

| Route | Count | Notes |
|---|---|---|
| `/` | 1 | Homepage, 16 sections |
| `/services` + `/services/[slug]` | 24 | Hub + 23 service pages |
| `/industries` + `/industries/[slug]` | 9 | Hub + 8 sector pages |
| `/about`, `/why-midis`, `/process`, `/team`, `/faq` | 5 | Company pages |
| `/contact`, `/contact/call` | 2 | Call variant noindexed, canonical → `/contact` |
| `/work`, `/work/[slug]` | 1 + n | Portfolio index + case studies. **Currently gated — see below** |
| `/insights`, `/insights/[slug]` | 1 + n | Index + articles from the existing Strapi CMS |
| `/tools/website-audit` | 1 | Real Lighthouse audit, dynamic |
| `/privacy`, `/terms` | 2 | Noindexed until reviewed — see [docs/04](docs/04-legal-checklist.md) |
| `/sitemap.xml`, `/robots.txt` | 2 | Generated from the content layer |
| `not-found` | 1 | Custom 404 with real routes out |
| `/api/enquiry` | 1 | Dynamic route handler |

Redirects for `/services2`, `/case-study`, `/blogs`, `/blogs/:id` and `/ai` are live as explicit **301**s, and every destination now exists.

### Internal links

A crawl of all 56 internal links finds **every one resolving**. Re-run it any time with `node scripts/linkcheck.mjs http://localhost:3000` while the site is running.

> ⚠️ `/privacy` and `/terms` exist but are **noindexed until you review them**. See [docs/04-legal-checklist.md](docs/04-legal-checklist.md) — the processing description is accurate, but retention period, governing law and entity name are decisions only you can make.

### Motion: no animation library

The brief recommended GSAP, ScrollTrigger and Motion, and listed them alongside "only include libraries that serve a clear purpose" and "avoid unnecessary dependencies."

I installed GSAP and Motion in Phase 2, then built the whole motion layer without needing either — CSS transitions, `IntersectionObserver` and a handful of rAF loops cover all of it. Rather than reach for them decoratively to justify the install, **I removed them** (7.2 MB of `node_modules`). The shipped bundle was unchanged, because unimported code was never bundled — the win is maintenance surface, install time and one less thing to keep patched.

If a future section genuinely needs timeline orchestration — a scrubbed, pinned sequence, say — GSAP is one `npm install` away. Nothing here is built in a way that would resist it.

**What the motion layer does:**

| Piece | Behaviour |
|---|---|
| `lib/motion.ts` | Central policy: `minimal` / `reduced` / `full`, from reduced-motion preference, pointer type, viewport and device capability |
| `Reveal` | Scroll-triggered fade-up. Travel distance shortens on `reduced` |
| `SplitHeadline` | Word-by-word rise; a single line rise on `reduced` |
| `HeroVisual` | Canvas bar field echoing the logo's growth motif. Pauses off-screen and when the tab is hidden; one static frame under reduced motion |
| `ScrollProgress` | Accent progress line. `scaleX` only, one rAF-coalesced listener |
| `Cursor` | Trailing ring on capable pointer devices only. **Does not hide the native cursor** |
| `Parallax` | Transform-only image drift, gated behind a shared IntersectionObserver |
| `MethodSteps` | The step nearest the viewport centre gains emphasis. No pinning, no scroll hijacking |

**The rules it holds to:**

- **No content depends on animation.** All six method steps, all 70 reveal targets and every headline are in the server-rendered HTML. Verified by reading the HTML, not by assumption.
- **No layout shift.** Everything animates `transform` and `opacity` only.
- **Reduced motion is honoured completely** — not softened.
- **Mobile motion is different, not smaller.** `data-motion` on `<html>` drives genuinely different CSS; the cursor, parallax and continuous canvas work simply don't run.
- **Nothing runs off-screen.** Every continuous animation is behind an IntersectionObserver or visibility check.

### Analytics only run with consent

GA4 and the Meta Pixel are **conditionally mounted**, not loaded-and-disabled. A visitor who declines never contacts Google or Meta — verified: zero references to `googletagmanager`, `connect.facebook` or `fbevents` appear in the HTML before consent. Ignoring the banner counts as declining, and blocked `localStorage` is treated as undecided.

The current midis.in loads both unconditionally on every page with no consent mechanism, so this is a material change.

Consent state is read through `useSyncExternalStore` (`lib/use-consent.ts`) rather than an effect — it gives a defined server snapshot, keeps every consumer in sync and stays correct across tabs.

Conversion events: `cta_click`, `enquiry_start`, `enquiry_submit`, `enquiry_success`, `enquiry_error`, `call_booking_start`, `audit_submit`, `whatsapp_click`, `phone_click`, `email_click`, `project_view`, `article_view`. `enquiry_start` fires on first interaction and `enquiry_success` only when the server confirms storage, so the rate between them is real rather than estimated.

`trackEvent()` is a no-op without consent, so components never need to check first.

### The audit tool needs a PageSpeed API key

`/tools/website-audit` calls Google's PageSpeed Insights API, which runs Lighthouse against the visitor's live site and returns genuine scores.

**Tested during Phase 7: Google now returns `429 Too Many Requests` immediately for unkeyed requests.** The key is therefore not an optimisation — without it, every audit falls back. Get a free one from the [PageSpeed Insights API docs](https://developers.google.com/speed/docs/insights/v5/get-started) and set `PAGESPEED_API_KEY`.

The module has exactly two outcomes by design: real Lighthouse data, or a declared failure. There is no code path that estimates, approximates or invents a score, an issue count, a traffic figure or a ranking. On failure the visitor sees what went wrong and is offered a manual audit — which is a real offer, not a consolation screen.

Input is validated before anything is sent to Google: non-public hosts (`localhost`, `.local`, `.internal`, raw IPs, private ranges) are rejected outright rather than bounced off a third-party service.

**Both paths were verified.** The failure path was tested live against real rate limiting; the success path was rendered against a temporary local fixture — score dials, ratings, core metrics and opportunities — which was then removed. `pagespeed.ts` is byte-identical to its pre-test state.

### The portfolio is gated on having a portfolio

`/work` and the case-study template are built and verified, but `projects` in `evidence.ts` is empty, so a single flag (`hasPortfolio`) currently closes four things at once:

| While empty | Once projects are added |
|---|---|
| "Our Work" is hidden from the main nav | Nav item appears |
| The footer's Work column is hidden | Column appears |
| `/work` is `noindex` and shows an honest empty state | Becomes indexable, shows the filterable grid |
| `/work` and case studies are absent from the sitemap | All appear automatically |

Sending a prospect to an empty portfolio costs more confidence than a missing nav item does — and publishing placeholder projects is what the audit found on the old site. So the section simply isn't advertised until it's real. Populate `projects` and all four reverse with no code changes.

**The template was verified before being shipped empty.** It was built and rendered against a temporary local fixture — three projects, one with a full case study — confirming the narrative chapters, results with baselines and periods, testimonial, gallery, tech stack, live link, related projects, category filters, deep links and 404s all work. The fixture was then removed; nothing from it is in the repository.

### Two conventions in the content layer

**Services and industries are split across two files each** — a catalogue (`services.ts`, `industries.ts`) and long-form page content (`service-content.ts`, `industry-content.ts`), merged by `getService()` / `getIndustry()`. A build-time guard throws if the two drift apart, because a service published without body copy would be exactly the thin page the report warns against.

**`cacheComponents` (partial prerendering) is deliberately off.** It was serving unknown slugs as prerendered 200 shells — `notFound()` cannot change the status once streaming has started — which produces soft 404s, and it forbids the `dynamicParams` flag that fixes them. Every page here is static content, so it bought very little and cost correctness.

## Documentation

| Doc | What's in it |
|---|---|
| [01-audit-and-plan.md](docs/01-audit-and-plan.md) | The Phase 1 audit of midis.in and the full implementation plan |
| [02-evidence-intake.md](docs/02-evidence-intake.md) | **What MIDIS must supply** to switch on the proof sections |
| [03-security-and-privacy.md](docs/03-security-and-privacy.md) | The Strapi exposure, sanitisation, spam controls |
| [04-legal-checklist.md](docs/04-legal-checklist.md) | What the legal pages still need |
| [05-launch-checklist.md](docs/05-launch-checklist.md) | **Blockers, what was verified, deployment** |

---

## Visual enhancement pass

A later brief asked for a premium visual and motion upgrade with a hard rule against changing content. That pass added:

| Area | Change |
|---|---|
| Surface | Fine SVG grain at 3.5% opacity, layered accent washes, hairline grid in the hero |
| Hero | Line-by-line masked headline reveal, staggered entrance, pointer-reactive bar field, travelling scroll cue |
| Section headers | Every `SectionHeader` title reveals line-by-line out of clipping masks |
| Services | Editorial rows replacing the card grid — animated numbering, neighbours recede on hover, focus produces the same state |
| Imagery | Clip-path wipe reveals with scale settle on portfolio, team and article images |
| Process | Scroll-linked progress track across the six stages |
| Navigation | Accent indicator sweeping in on hover/focus, staggered mega-menu columns and mobile drawer |
| Artwork | Original generated SVG compositions, seeded per page |

### Content integrity is verified, not assumed

`scripts/content-snapshot.mjs` captures the visible text, headings, links and metadata of every page, and `--verify` asserts the strict requirement for a visual pass: **nothing removed**. Every original word must still appear in order, and every heading, link, title, description and canonical must survive.

```bash
npm run snapshot -- http://localhost:3000 before.json
# ...make visual changes...
npm run snapshot -- http://localhost:3000 after.json
npm run snapshot -- --verify before.json after.json
```

Result across 47 pages: **nothing removed.** The only addition is +54 characters on the homepage — the duplicated digits in the animated service numbering, which the brief explicitly asked for.

It caught a real regression: the editorial service rows initially dropped the "Learn more" label from each card. That is CTA text, which the brief forbids changing, and it was restored.

### Why there is no stock photography

The brief asked for relevant imagery throughout. This pass adds **original generated artwork** (`AbstractVisual`) rather than licensed photographs, for two reasons:

1. The Phase 1 audit found the previous site using stock photos and hash-named files in place of project work — the specific thing that undermined its credibility. Adding more generic business photography would work against the positioning the rest of the site is built on.
2. Licensing third-party imagery into a production site is not something that can be done responsibly without the rights being established first.

The artwork is an abstract field derived from the ascending-bar growth motif in the MIDIS logo, seeded from each page's slug so every page is distinct but visibly part of one system. It is inline SVG — a few hundred bytes, no network request, crisp at any size, no layout shift.

**If you want real photography, supply licensed assets (or confirm a source) and it drops into the same slots.** Real project screenshots remain the priority — see [docs/02](docs/02-evidence-intake.md).

### GSAP is back, and lazy-loaded

Phase 9 removed GSAP because nothing used it. This brief asks for masked text, scroll-linked transitions and interactive timelines, which genuinely need timeline orchestration — so it is back.

It is **dynamically imported inside effects**, never bundled into the initial payload. GSAP + ScrollTrigger is ~45 KB gzipped, a third of the JS budget, and none of it is needed for first paint because every animated element is server-rendered and readable before any script runs.

Measured: 197 KB gzipped before this pass → 242 KB with GSAP bundled → **199 KB with it deferred.**

---

## Full-width + cinematic hero pass

A later brief asked for a full-width layout, a hero background on every page, and the removal of decorative numerical design.

### Full-width layout

Section backgrounds already spanned the viewport; what boxed the site in was the container's 86rem cap. The container now scales with the viewport:

```css
@utility container-site {
  max-width: 118rem;                       /* was 86rem */
  padding-inline: clamp(1.25rem, 4.5vw, 6rem);
}
```

Readable measure is enforced per text block (`max-w-2xl`, `measure`), never by squeezing the whole page — so the site reads edge-to-edge without paragraphs stretching. Two supporting utilities: `container-bleed` (padding, no cap) and `full-bleed` (breaks a child to viewport width without the `100vw` scrollbar bug). Section vertical rhythm is now fluid — `clamp(4.5rem, 8vw, 10rem)` — so proportions hold on large screens.

### Hero backgrounds: generated, not stock

Every page hero has a `HeroBackground` — a slow aurora of soft gradient fields drifting behind the content, seeded per page and drawn to canvas.

Four compositions, assigned by subject: `signal` (ascending energy — home, services, insights), `weave` (interlocking — industries, work), `depth` (layered calm — about, team, process, why), `focus` (converging — contact, FAQ, tools, legal).

This was a deliberate choice over licensed photography or video, agreed with the client:

- **No licensing exposure** on a production site
- **A few KB of canvas instead of multi-megabyte video.** Measured cost of the whole pass: +1 KB gzipped
- **Controlled contrast.** A fixed overlay gradient means headline contrast is constant wherever the fields drift — a photograph's contrast is inherited, not chosen

By motion profile: `minimal` paints one static frame; `reduced` drifts slowly with fewer fields; `full` adds pointer parallax. Pauses off-screen and when the tab is hidden. DPR capped at 1.5 — gradient fields are soft enough that a lower backing store is invisible and roughly halves fill cost.

### Decorative numbering removed

The brief rules out oversized numerals, number-based cards, large process numbers and animated counters. Every `01`–`08` in the interface was replaced with an accent rule that extends on hover — including the animated service numbering an earlier brief had asked for.

Verified: the **only** tokens removed anywhere on the site are `01`–`08`. Zero headings, links, titles, descriptions or canonicals changed.

### A bug this found in the verification tooling

The first run reported "/ lost 2292 words" — alarming, and wrong. The word check walked tokens in order with a moving cursor; when a token is genuinely removed, `indexOf(word, cursor)` finds a later occurrence elsewhere on the page, the cursor jumps past everything between, and hundreds of present words get reported as lost.

`--verify` now compares word **multisets**, which is order-insensitive but exact about what actually disappeared. The heading sequence check already covers ordering. Worth knowing if you rely on this script: the old version would have been misleading on any pass that intentionally removed something.
