import type { Faq } from "./types";

/**
 * Long-form content for each service page.
 *
 * Kept separate from the catalogue in `services.ts` so the catalogue stays
 * readable, and merged by `getService()` at read time.
 *
 * Every entry is written specifically for its service. The report (§6, §24)
 * is explicit that the long-tail strategy only works if each page carries
 * genuinely useful content — a set of near-identical pages with the service
 * name swapped is the failure mode to avoid, not the goal.
 */
export interface ServiceContent {
  body: string[];
  faqs: Faq[];
  relatedServices: string[];
  relatedIndustries: string[];
}

export const serviceContent: Record<string, ServiceContent> = {
  /* ------------------------------------------------------ strategy & design */

  "web-design": {
    body: [
      "Most websites are designed to look finished rather than to do a job. The result is a site that photographs well in a portfolio and underperforms in the market — attractive, forgettable, and unclear about what it wants the visitor to do.",
      "We design from the commercial question backwards. Who is arriving, what do they already believe, what do they need to see before they trust you, and what is the single action this page exists to produce? Those answers decide the structure, and the structure decides the visuals — not the other way round.",
      "What you get is a visual system rather than a set of screens: type, colour, spacing and components defined once and applied consistently, so the twentieth page looks as considered as the homepage and your team can add pages later without the design falling apart.",
    ],
    faqs: [
      {
        question: "Do you design from a template?",
        answer:
          "No. We build a design system specific to your business — type scale, colour, spacing, components. Templates are cheaper upfront and cost more later, because every exception you need has to be fought against the template's assumptions.",
      },
      {
        question: "Can you work with our existing brand guidelines?",
        answer:
          "Yes, and we prefer to when they exist and are working. We'll tell you honestly if something in them is actively hurting the site — colour contrast that fails accessibility is the most common example — and propose the smallest change that fixes it.",
      },
      {
        question: "Do we see designs before anything is built?",
        answer:
          "Yes. Wireframes come first so structure is agreed before anyone argues about colour, then visual designs for key page types. Build only starts once you've signed off on what it's building.",
      },
    ],
    relatedServices: ["ui-ux-design", "web-development", "website-redesign", "graphic-design"],
    relatedIndustries: ["saas", "startups", "professional-services"],
  },

  "web-development": {
    body: [
      "A website can look exactly like the design and still be a liability: slow on a mid-range phone, invisible to search engines, impossible to update without a developer, and fragile enough that every change risks breaking something else.",
      "We build server-rendered sites on component systems. Server rendering means search engines and social platforms receive real HTML rather than an empty shell waiting for JavaScript — which is the single most common technical reason a modern site fails to rank. Component systems mean a change made once applies everywhere it should.",
      "Performance, accessibility, metadata and analytics are part of the build rather than a later phase. Retrofitting any of them is substantially more expensive than doing them in the first place, and in the case of search architecture it sometimes means rebuilding.",
    ],
    faqs: [
      {
        question: "What do you build with?",
        answer:
          "Usually React with Next.js for server rendering, or WordPress where your team needs to publish independently and requirements are conventional. We recommend during the Strategise stage based on who maintains the site and what it has to do — not on what we feel like building.",
      },
      {
        question: "Will our team be able to update the site?",
        answer:
          "Yes. We connect a CMS so content changes don't require a developer, and we train your team on it. Where something genuinely needs code, you'll know in advance which parts those are.",
      },
      {
        question: "Do we own the code?",
        answer:
          "Yes. You get the repository and the ability to take it to another developer. We'd rather earn the next project than hold the code hostage.",
      },
    ],
    relatedServices: ["nextjs-development", "react-development", "web-design", "wordpress-development"],
    relatedIndustries: ["saas", "manufacturing", "education"],
  },

  "ui-ux-design": {
    body: [
      "When people arrive and leave without doing anything, it is rarely because the site was ugly. It is usually because they couldn't work out where they were, what to do next, or whether the thing they wanted was even here.",
      "We map the actual routes people take — not the route you wish they took — and find where they stall. That might be a navigation label that means something internally and nothing externally, a form asking for information people don't have yet, or a product page answering the fourth question before the first.",
      "The output is a tested interface: journeys mapped, prototypes you can click through before anything is built, and a component library that keeps behaviour consistent so people only learn your interface once.",
    ],
    faqs: [
      {
        question: "How is this different from website design?",
        answer:
          "Website design is largely about communication and credibility — what a visitor understands and believes. UI/UX design is about interaction — what they can successfully do. A marketing site leans on the first; a product, dashboard or booking flow leans heavily on the second.",
      },
      {
        question: "Do you do user research?",
        answer:
          "As far as the project supports. At minimum we review your analytics, search queries and support tickets, which usually reveal the friction points immediately. Where budget allows, we'll test prototypes with real users before committing to a build.",
      },
      {
        question: "Can you improve an existing product without a full redesign?",
        answer:
          "Often, yes. A usability review that identifies the three or four specific points where people give up is frequently better value than redesigning everything, and it's a sensible first engagement.",
      },
    ],
    relatedServices: ["web-design", "web-development", "react-development", "website-redesign"],
    relatedIndustries: ["saas", "healthcare", "real-estate"],
  },

  "website-redesign": {
    body: [
      "The fear that stops most redesigns isn't cost. It's the story everyone has heard — a company relaunches, traffic collapses, and nobody can explain why for six months.",
      "That outcome is avoidable and almost always caused by the same thing: URLs changing with no redirect map, pages with existing search value quietly dropped, or a server-rendered site replaced with one that renders only in the browser. We audit your indexed URLs before design starts, identify which pages actually earn traffic, and map every redirect before launch.",
      "Beyond protecting what works, a redesign is the opportunity to fix what the original build got wrong — structure that grew by accretion, messaging written when the business sold something slightly different, and performance that has degraded with every plugin added since.",
    ],
    faqs: [
      {
        question: "Will we lose our Google rankings?",
        answer:
          "Not if the migration is done properly. We audit indexed URLs, preserve pages with existing search value, map 301 redirects for anything that moves, validate canonicals, and monitor rankings after launch. Ranking loss during a redesign is a process failure, not an inevitability.",
      },
      {
        question: "Can you redesign in stages rather than all at once?",
        answer:
          "Yes. For larger sites a phased migration is often safer — templates move across in groups, with monitoring between phases so any problem is caught while it is still small.",
      },
      {
        question: "What if our content is out of date too?",
        answer:
          "Most redesigns need content work, and it's better to decide that early. We'll flag during the audit which pages should be rewritten, merged or removed, so you aren't paying to rebuild pages that shouldn't exist.",
      },
    ],
    relatedServices: ["web-design", "web-development", "seo", "technical-seo"],
    relatedIndustries: ["professional-services", "manufacturing", "education"],
  },

  "graphic-design": {
    body: [
      "Brands rarely drift on purpose. A deck gets made in a hurry, a social post uses a slightly different orange, a supplier redraws the logo to fit their template — and within a year the business looks like several businesses.",
      "We build a visual identity with enough definition to survive that: logo usage, colour with tested contrast values, type hierarchy, image treatment and layout rules, documented so anyone producing anything on your behalf can get it right without asking.",
      "Alongside the system we produce the assets you actually need day to day — campaign graphics, social templates, presentation layouts and print collateral — so the identity exists in practice and not just as a PDF nobody opens.",
    ],
    faqs: [
      {
        question: "Do you design logos?",
        answer:
          "Yes, as part of a wider identity. A logo on its own solves very little — what makes a brand recognisable is the consistency of everything around it.",
      },
      {
        question: "What do brand guidelines include?",
        answer:
          "Logo usage and clear space, the colour palette with accessible contrast pairings, type hierarchy, imagery direction, layout principles and worked examples. Enough for a third party to produce on-brand material unsupervised.",
      },
      {
        question: "Can you work with our existing logo?",
        answer:
          "Yes. Building a system around an established mark is often the right call — recognition has value, and replacing a logo people already know is a cost as well as a change.",
      },
    ],
    relatedServices: ["web-design", "content-writing", "video-editing"],
    relatedIndustries: ["startups", "ecommerce", "professional-services"],
  },

  /* ------------------------------------------------------------ development */

  "react-development": {
    body: [
      "Marketing sites and applications have different failure modes. An application fails when state gets out of sync, when the data layer leaks into the interface, and when the person who wrote it leaves and nobody else can safely change it.",
      "We build React applications with a clear separation between data, state and presentation, typed end to end so a change that breaks something fails at build time rather than in front of a customer. Components are documented and reusable rather than copy-pasted into variants that then drift.",
      "We build assuming someone else will maintain it. That means readable structure over clever abstraction, tests where logic is genuinely risky, and documentation covering the decisions that aren't obvious from reading the code.",
    ],
    faqs: [
      {
        question: "When is React the right choice?",
        answer:
          "When the interface is genuinely interactive — dashboards, configurators, booking flows, anything with meaningful client-side state. For a largely static marketing site, React alone adds weight without adding much; that's where Next.js server rendering matters.",
      },
      {
        question: "Can you join an existing React codebase?",
        answer:
          "Yes. We'll start with a review of the current structure and tell you honestly whether extending it or refactoring first is the better use of budget.",
      },
      {
        question: "How do you handle testing?",
        answer:
          "Proportionally. Business logic and anything involving money or data integrity gets tested properly. We don't write snapshot tests for presentational markup that changes every sprint — they cost more to maintain than they catch.",
      },
    ],
    relatedServices: ["nextjs-development", "web-development", "ui-ux-design"],
    relatedIndustries: ["saas", "startups", "real-estate"],
  },

  "nextjs-development": {
    body: [
      "A React site that renders only in the browser hands search engines an empty page and asks them to run your JavaScript to find the content. Some crawlers will. Many won't, and social platforms generating link previews generally won't either.",
      "Next.js solves this by rendering on the server: the HTML arrives complete, with real content, correct metadata and structured data, while the page still behaves like an application once it loads. You stop choosing between a fast modern interface and being findable.",
      "We use static generation wherever content allows, so most pages are served as pre-built files that respond almost instantly, falling back to server rendering only where genuinely dynamic data requires it. This site is built that way — every page you're reading was prerendered.",
    ],
    faqs: [
      {
        question: "Is Next.js better than WordPress?",
        answer:
          "Different, not better. Next.js wins on performance, flexibility and handling complex or interactive requirements. WordPress wins when non-technical staff need to publish constantly and the requirements are conventional. We recommend based on who maintains the site, not on preference.",
      },
      {
        question: "Can Next.js work with a CMS?",
        answer:
          "Yes — that's the usual setup. Your team edits in a CMS they find comfortable, and Next.js renders it. This site reads from a Strapi instance exactly that way.",
      },
      {
        question: "What does it cost to host?",
        answer:
          "Usually less than people expect. Statically generated pages are cheap to serve, and hosting scales with traffic rather than sitting at a fixed server cost. We'll give you a realistic figure during scoping.",
      },
    ],
    relatedServices: ["react-development", "web-development", "technical-seo", "web-design"],
    relatedIndustries: ["saas", "startups", "ecommerce"],
  },

  "wordpress-development": {
    body: [
      "WordPress has a deserved reputation problem, and it is almost entirely caused by how it is usually built: a purchased theme carrying features you'll never use, a dozen plugins that each add scripts to every page, and an editing experience so awkward that staff stop using it.",
      "We build custom themes containing only what your site needs, with editing blocks designed around the content your team actually publishes. A case study block that asks for the fields a case study has, rather than a page builder that lets anyone construct anything and inevitably break the layout.",
      "The result keeps what makes WordPress worth choosing — your team publishing without raising a ticket — without the performance and security cost that comes from the usual approach.",
    ],
    faqs: [
      {
        question: "Do you use page builders like Elementor or Divi?",
        answer:
          "Not usually. They make the first page fast to produce and every subsequent change slower, and they carry a significant performance cost. We build purpose-made blocks instead, which are easier for editors precisely because they offer fewer wrong options.",
      },
      {
        question: "Can you fix or speed up our existing WordPress site?",
        answer:
          "Often, yes. A performance and security audit identifying the specific plugins, images and queries causing problems is frequently better value than a rebuild, and we'll tell you which situation you're in.",
      },
      {
        question: "How do you handle WordPress security?",
        answer:
          "Minimal plugin footprint, managed hosting with automatic core updates, enforced strong authentication, regular backups and monitoring. Most WordPress compromises come through abandoned plugins, so the fewer you run the smaller the risk.",
      },
    ],
    relatedServices: ["web-development", "woocommerce-development", "content-writing", "seo"],
    relatedIndustries: ["education", "professional-services", "healthcare"],
  },

  /* ------------------------------------------------------------- e-commerce */

  "ecommerce-development": {
    body: [
      "Almost every store loses most of its revenue in the same few places: a product page that doesn't answer the question blocking the purchase, unexpected costs appearing at checkout, and a checkout that asks for an account before it asks for the order.",
      "We build stores around the decisions a shopper actually makes, in the order they make them. What is it, will it fit or suit me, what does it really cost, when does it arrive, and what happens if it's wrong. A product page that answers those confidently outperforms a prettier one that doesn't.",
      "Underneath, the catalogue is structured so it stays fast and navigable as it grows, and the store is connected properly to payments, shipping and whatever runs your fulfilment — because an operationally awkward store costs you margin every single day.",
    ],
    faqs: [
      {
        question: "Which platform should we use?",
        answer:
          "Shopify for most brands — it handles payments, security and scaling, so you spend on selling rather than infrastructure. WooCommerce when you need unusual pricing or fulfilment logic, or you're committed to WordPress. Custom only when the business model genuinely doesn't fit either.",
      },
      {
        question: "Can you migrate our existing store?",
        answer:
          "Yes, including products, customers, order history and URL structure. Preserving product URLs matters enormously — they are often the best-ranking pages on an e-commerce site, so they're mapped before anything moves.",
      },
      {
        question: "Do you work on conversion after launch?",
        answer:
          "Yes, and it's usually where the return is. Once real traffic is flowing we can see exactly where people drop out and fix those points specifically, rather than guessing in advance.",
      },
    ],
    relatedServices: ["shopify-development", "woocommerce-development", "ecommerce-seo", "email-marketing"],
    relatedIndustries: ["ecommerce", "startups"],
  },

  "shopify-development": {
    body: [
      "Shopify removes the hard infrastructure problems, which is exactly why so many stores on it look and feel the same. When your competitor runs the same theme with a different logo, there is nothing about the experience that makes you the obvious choice.",
      "We build custom Shopify themes shaped around how your products are actually chosen. A furniture brand needs room context and dimensions; a supplement brand needs ingredients, dosage and subscription logic; a fashion brand lives or dies on fit information. Those are different stores, not one store with different photography.",
      "We also treat speed as a feature. Stock themes accumulate apps, each injecting scripts into every page, until the store is slow on exactly the mid-range phones most of your customers use. We keep the app footprint deliberate and measure the cost of each one.",
    ],
    faqs: [
      {
        question: "Do you build custom themes or customise existing ones?",
        answer:
          "Both, depending on budget. A custom theme gives full control over the buying experience. Thoughtful customisation of a well-built base theme is a sensible middle path, and we'll be straight with you about which your budget actually supports.",
      },
      {
        question: "Can you work with Shopify Plus?",
        answer:
          "Yes, including the features Plus unlocks — scripts, custom checkout logic and B2B functionality where your plan supports them.",
      },
      {
        question: "Will adding apps slow our store down?",
        answer:
          "Most do, and the effect compounds. We audit what each app costs in load time and whether its function could be built into the theme instead. Removing three apps is often the cheapest speed improvement available.",
      },
    ],
    relatedServices: ["ecommerce-development", "ecommerce-seo", "email-marketing", "web-design"],
    relatedIndustries: ["ecommerce", "startups"],
  },

  "woocommerce-development": {
    body: [
      "WooCommerce makes sense when your selling model doesn't fit a hosted platform's assumptions — trade pricing by customer group, quote-based ordering, bundles with conditional logic, or a catalogue tied into systems you already run.",
      "Because it sits on WordPress, content and commerce live together. Guides, specifications and support material can sit alongside products rather than on a separate marketing site, which tends to help both search performance and the actual buying decision.",
      "The trade-off is that you own more of the stack: hosting, performance, security and updates are yours. We set those up properly from the start — because a WooCommerce store that's never maintained is a genuine liability, not just a slow website.",
    ],
    faqs: [
      {
        question: "Is WooCommerce suitable for a large catalogue?",
        answer:
          "Yes, with appropriate hosting and attention to database queries, indexing and caching. Large WooCommerce stores perform well when built for that scale and perform badly when a small-store setup is simply grown into.",
      },
      {
        question: "Can we do B2B pricing and trade accounts?",
        answer:
          "Yes. Customer-group pricing, quote requests, minimum order quantities and account-based catalogues are all achievable, and are a common reason to choose WooCommerce over a hosted platform.",
      },
      {
        question: "Who handles hosting and maintenance?",
        answer:
          "We can, or we'll set it up and hand it over documented. What we won't do is build a store and leave maintenance undefined — that's how WooCommerce sites end up compromised.",
      },
    ],
    relatedServices: ["ecommerce-development", "wordpress-development", "ecommerce-seo"],
    relatedIndustries: ["ecommerce", "manufacturing"],
  },

  /* ------------------------------------------------------------- growth */

  seo: {
    body: [
      "Most SEO disappointment comes from targeting the wrong things. Rankings for broad, high-volume terms look impressive in a report and often bring visitors with no intention of buying, while the specific phrases your actual customers type go uncontested.",
      "We start from commercial intent: the searches someone makes when they have a problem you solve and are close to paying someone to solve it. Those terms are usually less competitive, convert far better, and are achievable in a sensible timeframe.",
      "Then we fix the reasons you aren't ranking for them — technical issues preventing pages being crawled or understood, content that doesn't actually answer the query, and site structure that buries your commercially important pages several clicks deep.",
    ],
    faqs: [
      {
        question: "How long before we see results?",
        answer:
          "Technical fixes can show within weeks. Content and authority work typically takes months, and anyone promising rankings in thirty days is either targeting terms nobody searches for or doing something that will cost you later. We set expectations against your specific competition, not an industry average.",
      },
      {
        question: "Do you guarantee first-page rankings?",
        answer:
          "No, and we'd be wary of anyone who does. Nobody controls Google's results. What we can commit to is the work: fixing what's broken, targeting terms with genuine commercial intent, and reporting honestly on what moved and what didn't.",
      },
      {
        question: "What does your reporting cover?",
        answer:
          "Rankings for the terms we agreed to target, organic traffic to commercially relevant pages, and the enquiries or sales that came from them. Traffic that doesn't turn into business isn't a result, and we don't report it as one.",
      },
    ],
    relatedServices: ["technical-seo", "ecommerce-seo", "content-writing", "website-redesign"],
    relatedIndustries: ["professional-services", "healthcare", "manufacturing"],
  },

  "technical-seo": {
    body: [
      "Technical SEO is the part that determines whether your content gets a fair hearing at all. You can publish genuinely excellent material and rank for none of it if crawlers can't reach it, can't render it, or can't work out which version of a page is canonical.",
      "The most common blocker we find is client-side rendering: a site built so that the HTML arrives empty and the content is assembled by JavaScript afterwards. Some crawlers execute it, many don't, and link previews generally don't. Server rendering is the fix, and it's structural.",
      "Alongside that: crawl and index coverage, canonical correctness, redirect chains, Core Web Vitals, structured data that matches what's actually on the page, and an internal link structure that tells search engines which pages matter.",
    ],
    faqs: [
      {
        question: "How do we know if we have a technical SEO problem?",
        answer:
          "A reliable first test: view the page source and search for your main heading. If it isn't in the raw HTML, your content depends on JavaScript executing. Google Search Console's coverage report will also show pages excluded or not indexed, which is usually where the problem surfaces.",
      },
      {
        question: "Is structured data worth implementing?",
        answer:
          "Where it genuinely matches your content, yes — it helps search engines understand what a page is. It is not magic, and marking up ratings or reviews you don't have is a policy violation that can earn a manual penalty. We only emit schema the page actually supports.",
      },
      {
        question: "Do Core Web Vitals really affect rankings?",
        answer:
          "They're a ranking signal, but a modest one next to relevance. The stronger argument for fixing them is conversion — people abandon slow pages, and that costs you revenue regardless of what it does to rankings.",
      },
    ],
    relatedServices: ["seo", "nextjs-development", "website-redesign", "web-development"],
    relatedIndustries: ["saas", "ecommerce", "manufacturing"],
  },

  "ecommerce-seo": {
    body: [
      "E-commerce SEO has problems a marketing site never encounters. Thousands of near-identical product URLs, filters generating infinite crawlable combinations, seasonal lines disappearing and returning, and manufacturer descriptions duplicated across every retailer selling the same item.",
      "We fix the structural issues first — canonical handling for variants, crawl control on faceted navigation, and a category architecture that matches how people actually search rather than how your warehouse is organised. Category pages are usually the biggest untapped opportunity on a store.",
      "Then product content: pages written to answer the question blocking the purchase, rather than copied from the supplier sheet. This improves rankings and conversion simultaneously, which is rare enough to be worth prioritising.",
    ],
    faqs: [
      {
        question: "Our product pages are duplicates of the manufacturer's. Does it matter?",
        answer:
          "Yes. If fifty retailers publish identical copy, search engines pick whichever has the most authority — usually the manufacturer or a marketplace. Original product content is one of the clearest advantages a smaller store can build.",
      },
      {
        question: "Should category pages have written content?",
        answer:
          "Yes, and it should be genuinely useful rather than a keyword paragraph buried under the grid. Category pages typically target the highest-intent commercial terms on the whole store and are consistently under-invested in.",
      },
      {
        question: "What happens to SEO when a product goes out of stock?",
        answer:
          "Don't delete the page if the product is returning — keep it, mark availability correctly and offer alternatives. For permanently discontinued lines, redirect to the closest equivalent or the parent category. Deleting a ranking page and returning a 404 throws away earned authority.",
      },
    ],
    relatedServices: ["seo", "shopify-development", "ecommerce-development", "content-writing"],
    relatedIndustries: ["ecommerce"],
  },

  "google-meta-ads": {
    body: [
      "Advertising exposes the quality of your measurement. Without reliable conversion tracking you're optimising towards clicks, and clicks are the metric most easily bought and least connected to revenue.",
      "We set up tracking before spending anything, so campaigns optimise towards enquiries and sales rather than traffic. Where tracking is already in place we audit it first — misattributed or double-counted conversions are common, and they quietly push budget towards whatever is best at appearing to work.",
      "From there it's disciplined iteration: targeting, creative and landing pages tested against each other, budget moved towards what demonstrably produces business. Ads also fail when the landing page doesn't deliver what the ad promised, so we look at both.",
    ],
    faqs: [
      {
        question: "What budget do we need to start?",
        answer:
          "Enough to gather meaningful data within a reasonable period — too little and you spend months unable to tell what works. The figure depends on your cost per click and conversion rate, and we'll work out a realistic minimum before you commit.",
      },
      {
        question: "Google or Meta?",
        answer:
          "Google captures people already searching for a solution, so intent is higher and so is cost. Meta creates demand among people who weren't looking. If you sell something people actively search for, usually start with Google.",
      },
      {
        question: "Can you improve campaigns we're already running?",
        answer:
          "Yes, and an audit is often the sensible first step. Tracking problems, overlapping audiences and budget concentrated in underperforming campaigns are the usual findings, and fixing them can improve returns without raising spend.",
      },
    ],
    relatedServices: ["seo", "web-design", "content-writing", "email-marketing"],
    relatedIndustries: ["ecommerce", "real-estate", "education"],
  },

  "content-writing": {
    body: [
      "Most business copy describes what a company does. Very little explains why it matters to the person reading, which is the only reason they keep reading.",
      "We write for the buyer's actual question. Someone comparing suppliers wants to know what makes you a different choice; someone researching a problem wants help understanding it before they're sold anything. Those need different pieces, and conflating them produces copy that serves neither.",
      "Search demand informs what we write about, but it doesn't dictate how it reads. Content assembled to satisfy a keyword tool is obvious to the reader and increasingly obvious to search engines too.",
    ],
    faqs: [
      {
        question: "Do you use AI to write content?",
        answer:
          "We use it as a research and drafting aid where it helps, and the thinking, structure, claims and final writing are ours. Publishing volumes of generated content is the specific failure the report warns against — it doesn't rank, and when it does it doesn't convince anyone.",
      },
      {
        question: "Who writes about our technical subject matter?",
        answer:
          "We do, after interviewing the people who know it. The expertise is yours; our job is extracting it and making it readable. Technical content written without talking to a specialist is always recognisably thin.",
      },
      {
        question: "How much content do we need?",
        answer:
          "Fewer, better pieces almost always beat more, thinner ones. A small number of genuinely useful pages that get updated outperforms a monthly quota of posts nobody finishes.",
      },
    ],
    relatedServices: ["seo", "web-design", "graphic-design", "email-marketing"],
    relatedIndustries: ["professional-services", "saas", "education"],
  },

  "video-editing": {
    body: [
      "Footage isn't content. The gap between what a camera captured and something worth publishing is entirely in the edit — pacing, what gets cut, and whether the first two seconds earn the next ten.",
      "We cut for the platform the video will actually run on. A vertical social edit, a paid ad and a website explainer have different attention curves, different sound assumptions and different lengths. The same footage recut properly for each performs far better than one edit posted everywhere.",
      "That includes the details people skip: captions that work with the sound off, a thumbnail or poster frame chosen deliberately, and file sizes that don't slow down the page the video sits on.",
    ],
    faqs: [
      {
        question: "Do you film as well as edit?",
        answer:
          "Our core strength is post-production. We regularly work with footage clients have shot themselves and can advise on how to shoot it so the edit goes well — which is usually the cheapest improvement available.",
      },
      {
        question: "Can you repurpose one shoot into multiple videos?",
        answer:
          "Yes, and it's normally the best value in video. A single session can produce a long-form piece, several short social cuts and ad variants, provided it's planned that way beforehand.",
      },
      {
        question: "Do you add subtitles?",
        answer:
          "Yes. Most social video is watched muted, so captions aren't optional — and they make the content accessible to people who are deaf or hard of hearing, which matters independently.",
      },
    ],
    relatedServices: ["youtube-management", "graphic-design", "google-meta-ads"],
    relatedIndustries: ["ecommerce", "education", "startups"],
  },

  "youtube-management": {
    body: [
      "Most business YouTube channels fail for an unglamorous reason: they publish occasionally, on whatever topic came up, with titles that describe the video rather than give anyone a reason to click.",
      "We run channels as a programme. What subjects your audience actually searches for, what order to publish in, how each video opens, and how titles and thumbnails are built to earn the click — because a genuinely good video with a weak thumbnail simply doesn't get watched.",
      "Then we read the data properly. Retention curves show exactly where viewers leave, which tells you what to change in the next edit. Channels improve through that loop far more reliably than through producing more.",
    ],
    faqs: [
      {
        question: "How often should we publish?",
        answer:
          "Consistently matters more than frequently. A reliable fortnightly video beats weekly output that collapses after two months. We set a cadence you can genuinely sustain.",
      },
      {
        question: "Do thumbnails and titles really matter that much?",
        answer:
          "Yes — they decide whether the video is watched at all, and click-through rate then feeds how widely it's recommended. They deserve real effort, not a frame grab and the filename.",
      },
      {
        question: "Can YouTube actually generate business for us?",
        answer:
          "For considered purchases, often yes — video builds trust faster than text because people can see who they'd be working with. It's a medium-term investment rather than a lead tap you turn on.",
      },
    ],
    relatedServices: ["video-editing", "content-writing", "seo"],
    relatedIndustries: ["education", "saas", "professional-services"],
  },

  "email-marketing": {
    body: [
      "An email list is usually the most valuable marketing asset a business owns and the most neglected. These are people who already raised their hand, and reaching them costs almost nothing compared with buying the same attention again through ads.",
      "We build automated sequences that run continuously — welcoming new subscribers, recovering abandoned carts, following up after purchase, and re-engaging people who've gone quiet. Automation does the work once and keeps producing without anyone remembering to send anything.",
      "Segmentation is what separates email that works from email that gets ignored. A first-time visitor and a repeat customer should not receive the same message, and treating them identically is the fastest route to the unsubscribe link.",
    ],
    faqs: [
      {
        question: "Which platform do you work with?",
        answer:
          "Most mainstream platforms — Klaviyo for e-commerce, Mailchimp or similar for service businesses. The choice follows what you sell and what you already use rather than a preference of ours.",
      },
      {
        question: "How often should we email?",
        answer:
          "Frequently enough to be remembered, rarely enough to stay welcome. For most businesses that's every week or two, and it matters far less than whether each email is worth opening.",
      },
      {
        question: "What about consent and data rules?",
        answer:
          "We set up proper consent capture, clear unsubscribe handling and appropriate record-keeping. Buying lists or emailing people who never opted in damages deliverability for everything you send afterwards, so it isn't something we'll do.",
      },
    ],
    relatedServices: ["ecommerce-development", "shopify-development", "content-writing", "google-meta-ads"],
    relatedIndustries: ["ecommerce", "education", "professional-services"],
  },

  /* ------------------------------------------------------------------ AI */

  "ai-chatbot-development": {
    body: [
      "The reason most support chatbots are disliked is that they're deployed to deflect rather than to help. They answer confidently when they shouldn't, refuse to escalate, and trap people in loops — which costs more goodwill than the salary they saved.",
      "We build from your real support data. Actual tickets show which questions are genuinely repetitive and safe to automate, and which involve money, complaints or edge cases that should always reach a person. That boundary is the single most important design decision, and we set it deliberately.",
      "Handover is built in from the start, carrying the full conversation so the customer never repeats themselves. Analytics then show what the bot handled, where it struggled and what to improve — so it gets better rather than silently frustrating people.",
    ],
    faqs: [
      {
        question: "Will it hand over to a human?",
        answer:
          "Yes, and that's a core part of the design. We define explicitly which situations escalate — complaints, payment issues, anything where the bot is uncertain — and the conversation history goes with it.",
      },
      {
        question: "How do you stop it inventing answers?",
        answer:
          "We ground it in your actual content rather than letting it answer from general knowledge, constrain its scope, and have it say it doesn't know and escalate instead of guessing. We also test against real historical questions before launch.",
      },
      {
        question: "What does it cost to run?",
        answer:
          "There's a per-conversation cost that varies with volume and model. We'll model it against your actual ticket numbers so you can judge the return before committing, rather than discovering it later.",
      },
    ],
    relatedServices: ["chatgpt-integration", "openai-api-integration", "generative-ai-consultancy"],
    relatedIndustries: ["ecommerce", "saas", "healthcare"],
  },

  "chatgpt-integration": {
    body: [
      "Adding conversational AI to an existing product rarely needs a rebuild. What it needs is a clear decision about what the assistant is for, what it can see, and where its authority stops.",
      "We integrate into what you already run — your site, your app, your internal tools — connected to the systems that hold the answers so it can respond about this customer's order rather than in generalities. Tone is configured to match your brand rather than defaulting to a generic assistant voice.",
      "We're equally clear about what it shouldn't do. An assistant with access to customer data needs defined boundaries on what it can reveal and act on, and those are decided during design rather than discovered in production.",
    ],
    faqs: [
      {
        question: "Can it access our customer data securely?",
        answer:
          "Yes, with properly scoped access. The assistant should see what it needs for the task and nothing more, and every data-touching action is logged. We define those boundaries explicitly before building.",
      },
      {
        question: "Can it speak our brand's voice?",
        answer:
          "Yes. Tone, vocabulary, formality and the things it should never say are all configurable, and worth spending time on — a generic assistant voice undermines a carefully built brand.",
      },
      {
        question: "What if it gives a customer wrong information?",
        answer:
          "We reduce the risk by grounding it in your content, constraining its scope, and escalating on uncertainty — and we test against real questions before launch. We'd also recommend monitoring conversations initially rather than assuming it's right.",
      },
    ],
    relatedServices: ["ai-chatbot-development", "openai-api-integration", "generative-ai-consultancy"],
    relatedIndustries: ["saas", "ecommerce", "professional-services"],
  },

  "openai-api-integration": {
    body: [
      "The clearest returns from AI usually aren't customer-facing. They're in the repetitive internal work nobody enjoys — summarising documents, classifying enquiries, extracting structured data from unstructured files, drafting first versions of routine content.",
      "We build these as proper workflows inside your existing systems, not as a browser tab someone pastes into. That means the output lands where the work actually happens, and the process is reliable enough to depend on.",
      "Reliability is the hard part. We build in evaluation against known-correct examples, guardrails for when the model is uncertain, and human review at the points where being wrong actually costs something. An automation nobody trusts gets quietly abandoned.",
    ],
    faqs: [
      {
        question: "What kinds of processes are worth automating?",
        answer:
          "High-volume, rules-light, language-heavy work — triaging enquiries, summarising reports, extracting data from documents, drafting routine responses. Low-volume or high-stakes judgement work generally isn't worth it.",
      },
      {
        question: "How do you know the output is reliable?",
        answer:
          "We build an evaluation set from examples where you already know the right answer, measure against it, and keep measuring after launch. Without that you're guessing, and quality drifts without anyone noticing.",
      },
      {
        question: "Is our data used to train models?",
        answer:
          "Not under standard OpenAI API terms, which differ from consumer ChatGPT. We'll confirm the specifics for your configuration and can discuss arrangements with stricter data requirements.",
      },
    ],
    relatedServices: ["generative-ai-consultancy", "chatgpt-integration", "ai-chatbot-development"],
    relatedIndustries: ["saas", "professional-services", "manufacturing"],
  },

  "generative-ai-consultancy": {
    body: [
      "Most organisations aren't short of AI ideas. They're short of a way to tell which ones are worth money and which are expensive distractions that demo well.",
      "We assess opportunities against three questions: does this remove real cost or create real revenue, is the data to support it actually available and good enough, and can it be built at a cost proportional to the benefit? Many ideas fail the second question, and it's much cheaper to discover that in week one than in month six.",
      "Where a use case survives, we prototype it quickly against your real data. A rough working version answers questions that months of discussion cannot, and it's the fastest way to find out whether the value is real before committing to a full build.",
    ],
    faqs: [
      {
        question: "What does an engagement look like?",
        answer:
          "Typically a short assessment phase — understanding the business, identifying candidate use cases, checking data availability — followed by a prototype of the strongest one. You get a clear recommendation whether or not it leads to a build.",
      },
      {
        question: "What if you conclude AI isn't the answer?",
        answer:
          "Then we'll tell you. Sometimes the real problem is a process or data quality issue that AI would only obscure. We'd rather say so than sell you a build that disappoints.",
      },
      {
        question: "Do we need our data in order before starting?",
        answer:
          "Not before starting — assessing data readiness is part of the work. But be prepared for data quality to be the main constraint; it usually is, and it's better understood early.",
      },
    ],
    relatedServices: ["openai-api-integration", "ai-chatbot-development", "chatgpt-integration"],
    relatedIndustries: ["saas", "manufacturing", "professional-services"],
  },
};
