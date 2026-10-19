# Service card imagery

Provenance and licensing for the photographs used as service card backgrounds.

## Why there is photography on this site at all

The rest of the site deliberately avoids stock photography — `src/content/evidence.ts`
and `src/components/ui/AbstractVisual.tsx` both record why, and that reasoning still
stands for anything that represents MIDIS's own work. **Client logos, project
screenshots and team photographs are real assets and must never be replaced with
stock.**

These 23 files are a different category. They are decorative grounds behind service
card copy, chosen and added at the client's explicit request to give every service a
distinct visual identity. None of them is presented as MIDIS's work, a MIDIS project,
a MIDIS client or a MIDIS employee.

## Licence

All files are from [Pexels](https://www.pexels.com) under the
[Pexels licence](https://www.pexels.com/license/): free for commercial use,
modification permitted, attribution not required.

Attribution is not required, so none is rendered. The photo ids below are recorded so
the provenance of every file in `public/images/services/` can be traced, and so the
licence of any individual file can be re-checked at
`https://www.pexels.com/photo/<id>/`.

> **Before launch:** confirm MIDIS is content to use third-party stock photography on
> their production site. The Pexels licence permits it; this is a brand decision, not
> a legal one, and it runs against the no-stock-photography stance the rest of the
> site was built on.

## Files

Regenerate with `npm run imagery` (add `--force` to re-download). The script crops
every photograph to the same 1600x1000 frame and encodes WebP under a 120KB budget.

| Service | File | Pexels id | Subject |
| --- | --- | --- | --- |
| Website Design | `web-design.webp` | 326514 | Monitor displaying a web design layout in a studio workspace |
| UI/UX Design | `ui-ux-design.webp` | 196646 | Sketchpad of interface wireframes beside a phone and keyboard |
| Website Redesign | `website-redesign.webp` | 3471423 | Designer sketching a replacement layout at a desk |
| Graphic Design | `graphic-design.webp` | 6474450 | Fan of printed colour swatches held open |
| Website Development | `web-development.webp` | 1102797 | Syntax-highlighted source code filling a monitor |
| React Development | `react-development.webp` | 4578665 | JavaScript component code on a laptop screen |
| Next.js Development | `nextjs-development.webp` | 16129728 | Developer at a multi-monitor build workstation |
| WordPress Development | `wordpress-development.webp` | 261662 | Hands editing a published post in a browser CMS |
| E-commerce Development | `ecommerce-development.webp` | 7190944 | Laptop showing an online checkout form |
| Shopify Development | `shopify-development.webp` | 7667442 | Shopper selecting product variants in a storefront |
| WooCommerce Development | `woocommerce-development.webp` | 7289725 | Store owner fulfilling orders from a desk |
| Search Engine Optimisation | `seo.webp` | 97080 | Search performance charts and trend lines |
| Technical SEO | `technical-seo.webp` | 139387 | Site analytics and crawl data open on a laptop |
| E-commerce SEO | `ecommerce-seo.webp` | 6608880 | Customer browsing a product catalogue online |
| Google & Meta Ads | `google-meta-ads.webp` | 4048095 | Paid social advertisement rendered in a feed |
| Content Writing | `content-writing.webp` | 8036328 | Writer drafting at a laptop surrounded by reference books |
| Video Editing | `video-editing.webp` | 695730 | Multi-track video editing timeline |
| YouTube Management | `youtube-management.webp` | 34518967 | Camera and microphone rig in a recording studio |
| Email Marketing | `email-marketing.webp` | 5744250 | Email inbox open on a handset |
| AI Chatbot Development | `ai-chatbot-development.webp` | 30530409 | Dark-themed assistant chat interface mid-conversation |
| ChatGPT Integration | `chatgpt-integration.webp` | 16094047 | Operator working against an AI assistant on a laptop |
| OpenAI API Integration | `openai-api-integration.webp` | 17323801 | Network equipment in a lit server hall |
| Generative AI Consultancy | `generative-ai-consultancy.webp` | 17483873 | Abstract render of a neural network |

## Rules

1. **One photograph per service, never shared.** This replaced a set of hand-built SVG
   compositions in which one `web` illustration served six development pages and one
   `ecommerce` illustration served three store pages — Website Design and Website
   Development looked identical, as did Shopify and E-commerce. `services.ts` calls
   `assertUniqueServiceImagery()` at module scope, so a repeat fails `next build`.
2. **Backgrounds only.** They render through `CardMedia`, behind the card's existing
   content. They are never placed above a heading, beside the copy, or in a column of
   their own, and they add no height to any card.
3. **Readability wins.** `npm run imagery:contrast` recreates the rendered stack for
   all 23 files and fails if any text on an image-backed card drops below its WCAG
   floor. Run it after changing a photograph, an opacity or a scrim value.
4. **Not every card.** Main service cards, the services hub grid, the lead card of
   each "What we offer" bento and the related-services cards carry imagery. Process
   steps, pricing, testimonials, challenge cards and the small bento cards stay
   typographic on purpose.
