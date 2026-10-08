# Launch Checklist & Deployment

Phase 10. What has been verified, what still blocks launch, and how to deploy.

---

## 🔴 Blocking — must be done before launch

| # | Item | Owner | Why it blocks |
|---|---|---|---|
| 1 | **Fix Strapi `enquiries` permissions** (disable public `find`/`findOne`) | MIDIS | Live personal-data exposure. See [03](03-security-and-privacy.md) |
| 2 | **Review `/privacy` and `/terms`, set `legal.reviewed: true`** | MIDIS + adviser | Consent is collected against these pages. See [04](04-legal-checklist.md) |
| 3 | **Send one real test enquiry**, confirm it reaches Strapi admin, delete it | MIDIS | The success path has never been exercised against production |
| 4 | **Confirm the 5 unverified service pages** or remove them | MIDIS | Pages exist for services MIDIS may not deliver. See below |
| 5 | **Set `PAGESPEED_API_KEY`** | MIDIS | Without it every audit falls back to the manual path |
| 6 | **Point DNS / confirm `site.url`** | MIDIS | Canonicals, sitemap and OG tags all derive from it |

### The 5 unverified services

Built and indexable, but **not advertised on midis.in today** — flagged `verifiedOffering: false` in `src/content/services.ts`:

`website-redesign` · `react-development` · `nextjs-development` · `wordpress-development` · `woocommerce-development`

Confirm MIDIS genuinely delivers each. To remove one: delete its entry from `services.ts` **and** its content from `service-content.ts` — a build-time guard enforces that the two stay in sync, so a half-removal fails the build rather than shipping an empty page.

---

## ✅ Verified in Phase 10

Run the audit yourself any time: `node scripts/qa.mjs http://localhost:3000`

| Check | Result |
|---|---|
| All routes return 200 | ✓ 46 HTML pages crawled, none failing |
| Internal links | ✓ **0 broken** of 55 |
| Unknown URLs return 404 | ✓ Not soft 200s |
| `<title>` on every page, all unique | ✓ |
| Meta description on every page, all unique, within length | ✓ |
| Canonical on every page | ✓ |
| Exactly one `<h1>` per page | ✓ |
| Every `<img>` has an `alt` attribute | ✓ |
| All JSON-LD parses and carries `@type` | ✓ |
| **No fabricated `Review` / `aggregateRating` schema** | ✓ Asserted by the QA script, not just by inspection |
| `lang` and viewport meta present | ✓ |
| Sitemap valid, all URLs 200, none noindexed | ✓ |
| Every indexable page listed in the sitemap | ✓ |
| robots.txt references the sitemap, doesn't disallow the site | ✓ |
| **Logo byte-identical to the live originals** | ✓ MD5 verified against midis.in |
| Accent is exactly `#EF8716` | ✓ |
| No fabricated claims in the built HTML | ✓ Checked for every flagged phrase |
| No `lorem` / `TODO` / "coming soon" | ✓ |
| No server-only code in the client bundle | ✓ `sanitize-html`, `zod`, PageSpeed logic all absent |
| TypeScript | ✓ Clean |
| ESLint | ✓ Clean |
| Production build | ✓ No errors |

### Fixed during this phase

- `/insights` and `/tools/website-audit` were **indexable but missing from the sitemap** — now included, along with every article
- Five meta descriptions were **172–184 characters** and would have truncated in search results — shortened to 119–136

---

## ⚠️ Not verified — and honestly can't be here

| Gap | Why | How to close it |
|---|---|---|
| **Visual appearance** | No browser available in this environment | Run `npm run dev` and look at every page |
| **Real device rendering** | Same | Check 320 / 375 / 768 / 1024 / 1440 / 1920 widths |
| **Browser console errors** | Same | Open DevTools on a few pages |
| **Consent "Accept" path** | Needs JS execution | Accept, confirm GA4 and the Pixel then load |
| **Lighthouse / Core Web Vitals** | Needs a browser | Run Lighthouse once deployed |
| **Keyboard navigation feel** | Needs interaction | Tab through the nav, mega-menu, forms, FAQ |
| **Screen-reader experience** | Needs AT | Test with NVDA or VoiceOver |

Semantics, landmarks, focus styles, labels and contrast are all implemented and statically verified — but *implemented correctly* and *works well for someone using it* are different claims, and only the first has been established.

---

## Deployment

### Vercel (recommended — zero config for Next.js)

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Set environment variables in the Vercel dashboard (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `PAGESPEED_API_KEY` | Your free Google key |
| `NEXT_PUBLIC_GA4_ID` | `G-EPDDCR21K0` |
| `NEXT_PUBLIC_META_PIXEL_ID` | `1731274227883408` |
| `STRAPI_API_TOKEN` | Only if you restrict Strapi `create` |

### Any Node host

```bash
npm ci
npm run build
npm start        # serves on PORT, default 3000
```

Needs Node 20+. Put it behind a reverse proxy terminating TLS.

### Static export is not possible

`/api/enquiry` and `/tools/website-audit` are server-rendered by necessity — one handles form submissions, the other calls the PageSpeed API per request. Everything else prerenders, but the site needs a Node runtime.

---

## Go-live sequence

1. Fix the Strapi permissions (blocker 1)
2. Complete and review the legal pages, set `legal.reviewed: true` (blocker 2)
3. Confirm or remove the 5 unverified services (blocker 4)
4. Deploy to a preview URL and walk every page visually
5. Run Lighthouse on mobile; confirm LCP, INP and CLS
6. Send a real test enquiry end to end, then delete it (blocker 3)
7. Run one real audit with the API key in place (blocker 5)
8. Point DNS, confirm `site.url` matches (blocker 6)
9. **Verify the 301s resolve on the live domain** — `/services2`, `/case-study`, `/blogs`, `/blogs/:id`, `/ai`
10. Submit `sitemap.xml` in Google Search Console
11. Watch Search Console coverage and rankings for 2–4 weeks

### Right after launch

- Keep the old URLs' rankings under observation. The 301 map is in `next.config.ts`; if an old URL was earning traffic and isn't covered, add it.
- The sitemap is generated from the content layer, so new services, industries and articles appear automatically. No manual step.

---

## The thing that matters most after launch

Everything above is mechanical. The report's actual finding was that MIDIS sells capability where competitors sell certainty — and the fix for that is not in this codebase.

`src/content/evidence.ts` is still empty. Populating it switches on eight surfaces at once with no development work: the Work navigation item, the footer's work column, `/work`, case-study pages, and the homepage's Featured Work, Results and Testimonials sections, plus the sitemap entries.

That is the single highest-value thing MIDIS can do with this site. See [02-evidence-intake.md](02-evidence-intake.md).
