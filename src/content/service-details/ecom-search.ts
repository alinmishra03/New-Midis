import type { ServiceDetail } from "./types";

/**
 * Keyword-researched detail content for the e-commerce and search/ads
 * services. No statistics, client results, awards or certifications are
 * asserted here — see the evidence policy in src/content/evidence.ts.
 */
export const ecomSearchDetails: Record<string, ServiceDetail> = {
  /* ---------------------------------------------------------------- e-commerce */
  "ecommerce-development": {
    h1: "E-commerce Website Development That Sells",
    keywords: {
      primary: "e-commerce website development",
      secondary: [
        "online store development",
        "e-commerce development company",
        "custom e-commerce website",
        "checkout optimisation",
      ],
      longTail: [
        "e-commerce website development for small businesses",
        "how to reduce cart abandonment on an online store",
        "migrate an online store without losing seo",
        "e-commerce website with payment gateway integration",
      ],
    },
    seoTitle: "E-commerce Website Development Company",
    seoDescription:
      "E-commerce website development built around how shoppers decide: clear product pages, a short checkout, and payments, shipping and stock connected properly.",
    visual: "ecommerce",
    challenges: [
      {
        title: "Shoppers leave at checkout",
        body: "Surprise delivery costs, forced account creation and long forms push people out just before they pay. We find which of these your store has and remove them.",
      },
      {
        title: "The catalogue is hard to browse",
        body: "Categories that mirror internal stock codes rather than how customers think make products hard to find. We restructure navigation and filters around real buying decisions.",
      },
      {
        title: "Operations happen by hand",
        body: "Orders copied into spreadsheets and stock updated manually create errors and slow dispatch. We connect the store to the systems that already run your fulfilment.",
      },
    ],
    offerings: [
      {
        title: "Storefront design and build",
        body: "Home, category, product and cart templates designed for mobile first, since that is where most browsing happens.",
      },
      {
        title: "Product page structure",
        body: "Sizing, specifications, delivery times and returns information placed where the shopper needs it, not hidden in tabs or the footer.",
      },
      {
        title: "Checkout and payments",
        body: "Guest checkout, local and international payment gateways, and clear totals that include tax and shipping before the final step.",
      },
      {
        title: "Shipping and fulfilment integration",
        body: "Courier rates, order routing and inventory sync with your warehouse, ERP or accounting software, so orders flow without re-keying.",
      },
      {
        title: "Platform migration",
        body: "Products, customers, orders and URLs moved from your current platform, with redirects mapped so existing search visibility carries across.",
      },
      {
        title: "Analytics and conversion tracking",
        body: "GA4 e-commerce events set up so you can see where shoppers drop out of the funnel and measure the effect of each change.",
      },
    ],
    process: [
      {
        title: "Discovery and platform choice",
        body: "We review your catalogue, order volumes and operational tools, then recommend the platform that fits rather than the one we prefer to build on.",
      },
      {
        title: "Catalogue and journey design",
        body: "We map categories, filters and the product-to-checkout journey, and design the key templates before any development starts.",
      },
      {
        title: "Build and integrate",
        body: "The store is built, connected to payments, shipping and inventory, and tested with real orders across devices and payment methods.",
      },
      {
        title: "Launch and refine",
        body: "After launch we watch funnel data closely and fix the specific steps where shoppers abandon, rather than redesigning on guesswork.",
      },
    ],
    tech: [
      "Shopify",
      "WooCommerce",
      "Next.js",
      "Stripe",
      "Razorpay",
      "PayPal",
      "GA4",
      "Google Tag Manager",
      "Klaviyo",
    ],
    extraFaqs: [
      {
        question: "How long does it take to build an e-commerce website?",
        answer:
          "It depends mainly on catalogue size, how much custom design is involved, and the number of integrations with payment, shipping and stock systems. We give you a timeline after discovery, once those factors are known, rather than a figure that ignores them.",
      },
      {
        question: "Can you add new payment methods or currencies to an existing store?",
        answer:
          "Usually, yes. Most platforms support additional gateways and multi-currency selling, though some options depend on your plan, your region and the payment provider's own approval process. We check what your setup allows before recommending a route.",
      },
    ],
  },

  "shopify-development": {
    h1: "Shopify Development Agency for Growing Brands",
    keywords: {
      primary: "shopify development agency",
      secondary: [
        "shopify store design",
        "shopify theme customization",
        "custom shopify theme development",
        "shopify speed optimization",
      ],
      longTail: [
        "hire a shopify developer for a custom theme",
        "how to make a shopify store load faster",
        "migrate from woocommerce to shopify",
        "shopify online store 2.0 theme development",
      ],
    },
    seoTitle: "Shopify Development Agency for Custom Stores",
    seoDescription:
      "Shopify development agency building custom themes, store design and app integrations for brands that need a distinct, fast store rather than a stock template.",
    visual: "ecommerce",
    challenges: [
      {
        title: "A theme that looks like every other store",
        body: "Popular themes are popular for a reason, but they leave your store indistinguishable from competitors. We design sections around what makes your products different.",
      },
      {
        title: "Too many apps, too little speed",
        body: "Each app adds scripts and requests until pages crawl on mobile. We audit the app stack and replace what we can with lighter theme code.",
      },
      {
        title: "Merchandising needs a developer",
        body: "When every landing page or promotion needs code changes, the team stops experimenting. We build flexible sections your team can arrange in the theme editor.",
      },
    ],
    offerings: [
      {
        title: "Custom Shopify theme development",
        body: "Online Store 2.0 themes built in Liquid with reusable sections and blocks, designed specifically for your catalogue and brand.",
      },
      {
        title: "Shopify theme customisation",
        body: "Targeted changes to an existing theme, such as new product templates, custom collection filters or a redesigned cart drawer, without a full rebuild.",
      },
      {
        title: "Shopify store design",
        body: "Visual design and UX for product, collection and landing pages, prototyped before build so decisions are made early.",
      },
      {
        title: "App integration and custom apps",
        body: "Reviews, subscriptions, search and loyalty apps integrated cleanly, or small custom apps where an off-the-shelf one would be heavier than needed.",
      },
      {
        title: "Speed optimisation",
        body: "Image handling, script loading and Liquid rendering improved, with results checked against Core Web Vitals data rather than a single lab score.",
      },
      {
        title: "Migration to Shopify",
        body: "Moves from WooCommerce, Magento or other platforms, including products, customers, order history and URL redirects.",
      },
    ],
    process: [
      {
        title: "Store and theme audit",
        body: "We review your current theme, apps, speed and analytics to see what is worth keeping and what is holding the store back.",
      },
      {
        title: "Design key templates",
        body: "Product, collection and home templates are designed and agreed, with a library of sections defined for future pages.",
      },
      {
        title: "Develop on a preview theme",
        body: "Work happens on an unpublished theme, so your live store keeps trading while we build and test.",
      },
      {
        title: "Publish and hand over",
        body: "We publish, monitor the first orders closely, and show your team how to manage sections and content in the theme editor.",
      },
    ],
    tech: [
      "Shopify",
      "Shopify Plus",
      "Liquid",
      "Online Store 2.0",
      "Shopify CLI",
      "Shopify Functions",
      "Hydrogen",
      "GA4",
      "Klaviyo",
    ],
    extraFaqs: [
      {
        question: "Will our store go offline while the new theme is being built?",
        answer:
          "No. We build on a duplicate or unpublished theme, so customers keep using the current store throughout. Switching over is a single publish, and the previous theme stays available to roll back to if anything needs attention.",
      },
      {
        question: "Can you migrate our WooCommerce store to Shopify without losing rankings?",
        answer:
          "We map every product, collection and content URL to its new Shopify address and set up redirects before launch, which protects most of the search equity you have built. Some short-term movement in rankings is normal during any migration, and we monitor Search Console closely afterwards to catch issues early.",
      },
    ],
  },

  "woocommerce-development": {
    h1: "WooCommerce Development Services for Custom Selling",
    keywords: {
      primary: "woocommerce development services",
      secondary: [
        "woocommerce store development",
        "custom woocommerce plugin development",
        "woocommerce b2b store",
        "woocommerce speed optimization",
      ],
      longTail: [
        "woocommerce wholesale pricing by customer role",
        "how to speed up a slow woocommerce store",
        "woocommerce integration with erp or inventory system",
        "woocommerce maintenance and security updates",
      ],
    },
    seoTitle: "WooCommerce Development Services",
    seoDescription:
      "WooCommerce development services for stores that need custom pricing, product logic or integrations, built on WordPress with hosting and security planned in.",
    visual: "ecommerce",
    challenges: [
      {
        title: "Selling rules a hosted platform cannot handle",
        body: "Trade pricing, quote requests and conditional bundles often need workarounds on hosted platforms. WooCommerce lets us build that logic directly into the store.",
      },
      {
        title: "A store slowed by plugins",
        body: "Years of added plugins and an underpowered host make WooCommerce sluggish. We trim the plugin list, tune the database and move to suitable hosting.",
      },
      {
        title: "Updates nobody wants to run",
        body: "Stores left unpatched because updates might break something become a security risk. We set up staging, backups and a routine update process.",
      },
    ],
    offerings: [
      {
        title: "WooCommerce store build",
        body: "A custom or carefully extended theme with product, shop and checkout templates designed for your catalogue.",
      },
      {
        title: "Custom plugin development",
        body: "Bespoke functionality written as maintainable plugins using WooCommerce hooks, rather than edits to core files that break on update.",
      },
      {
        title: "B2B and wholesale features",
        body: "Role-based pricing, trade account registration, minimum order quantities and quote-to-order workflows.",
      },
      {
        title: "Payment and shipping setup",
        body: "Gateways, tax rules and shipping zones configured for the regions you sell to, with clear totals at checkout.",
      },
      {
        title: "System integrations",
        body: "Connections to ERP, inventory, CRM and accounting systems through the WooCommerce REST API or established connectors.",
      },
      {
        title: "Performance and maintenance",
        body: "Caching, query optimisation, HPOS order storage and a managed update schedule with staging and tested backups.",
      },
    ],
    process: [
      {
        title: "Requirements and stack review",
        body: "We document your pricing, product and fulfilment rules, and assess existing plugins and hosting.",
      },
      {
        title: "Architecture decisions",
        body: "We decide what uses established plugins and what needs custom code, choosing well-supported options to keep long-term maintenance manageable.",
      },
      {
        title: "Build on staging",
        body: "Development and testing happen on a staging copy, including real checkout tests across payment methods and customer roles.",
      },
      {
        title: "Launch and maintain",
        body: "We deploy, confirm orders and integrations are flowing, then either maintain the store or hand it over with documentation.",
      },
    ],
    tech: [
      "WooCommerce",
      "WordPress",
      "PHP",
      "MySQL",
      "WooCommerce REST API",
      "Stripe",
      "Razorpay",
      "WP-CLI",
      "Redis",
      "GA4",
    ],
    extraFaqs: [
      {
        question: "Can you take over an existing WooCommerce store built by someone else?",
        answer:
          "Yes. We start with an audit of the theme, plugins, custom code and hosting, so we know what we are inheriting before making changes. That usually surfaces outdated plugins and fragile customisations, which we prioritise by risk.",
      },
      {
        question: "Should we use a page builder for our WooCommerce store?",
        answer:
          "It depends on how often your team edits layouts. Page builders make editing easy but can add significant page weight. Where speed matters, we often use the WordPress block editor with custom blocks, which gives editing flexibility with less overhead.",
      },
    ],
  },

  /* ---------------------------------------------------------------- growth */
  seo: {
    h1: "SEO Services Focused on Buyers, Not Just Traffic",
    keywords: {
      primary: "seo services",
      secondary: [
        "search engine optimization agency",
        "on-page seo optimization",
        "local seo services",
        "seo audit services",
        "keyword research services",
      ],
      longTail: [
        "seo services for small businesses",
        "how long does seo take to show results",
        "seo agency for service businesses",
        "how to rank on google maps for local searches",
      ],
    },
    seoTitle: "SEO Services for Commercial Search Intent",
    seoDescription:
      "SEO services covering keyword research, technical fixes, on-page optimisation and local SEO, aimed at the searches that bring enquiries rather than traffic.",
    visual: "seo",
    challenges: [
      {
        title: "Ranking for terms that never convert",
        body: "Broad informational keywords can bring visitors with no intent to buy. We redirect effort towards the specific searches your customers make before they get in touch.",
      },
      {
        title: "Invisible in local results",
        body: "For businesses serving an area, an incomplete or inconsistent Google Business Profile keeps you out of map results. We fix the profile and the location signals around it.",
      },
      {
        title: "No clear view of what SEO delivers",
        body: "Reports full of rankings and impressions say little about revenue. We tie organic visits to the enquiries and sales they produce.",
      },
    ],
    offerings: [
      {
        title: "SEO audit",
        body: "A prioritised review of technical health, content quality, site structure and backlinks, ranked by likely impact and effort.",
      },
      {
        title: "Keyword research and mapping",
        body: "Commercial and supporting keywords grouped by intent and assigned to specific pages, so each page has a clear job.",
      },
      {
        title: "On-page SEO optimisation",
        body: "Titles, headings, copy, internal links and images improved so each page clearly answers the search it targets.",
      },
      {
        title: "Local SEO",
        body: "Google Business Profile optimisation, consistent business details across directories, and location pages where you genuinely serve an area.",
      },
      {
        title: "Content strategy",
        body: "A plan for new pages and articles that fill real gaps in your coverage, informed by what your buyers search before choosing a supplier.",
      },
      {
        title: "Reporting tied to outcomes",
        body: "Monthly reporting on target rankings, organic traffic to key pages and resulting conversions, with plain notes on what changed and why.",
      },
    ],
    process: [
      {
        title: "Audit and research",
        body: "We audit the site and research the searches that matter commercially, including what is currently ranking for them and why.",
      },
      {
        title: "Prioritised roadmap",
        body: "Findings become a roadmap ordered by impact, so the first months go on fixes and pages most likely to move enquiries.",
      },
      {
        title: "Implement",
        body: "We fix technical issues, optimise existing pages and create new content, working directly in your CMS or alongside your developers.",
      },
      {
        title: "Measure and adjust",
        body: "We track rankings, traffic and conversions against the plan and shift effort to what is working.",
      },
    ],
    tech: [
      "Google Search Console",
      "GA4",
      "Ahrefs",
      "Semrush",
      "Screaming Frog",
      "Google Business Profile",
      "PageSpeed Insights",
      "Looker Studio",
      "Schema.org",
    ],
    extraFaqs: [
      {
        question: "Is SEO still worth it now that search results include AI answers?",
        answer:
          "For commercial searches, yes. When someone is choosing a supplier they still compare websites, and the same signals that help you rank — clear, specific, well-structured pages — also make your content more likely to be cited in AI-generated summaries. What changes is that thin, generic content earns less than it used to.",
      },
      {
        question: "Do we need to keep paying for SEO once we rank?",
        answer:
          "Not necessarily at the same level. Competitors keep publishing and search engines keep updating, so some ongoing work is needed to hold positions. Many businesses move to a lighter maintenance arrangement once the main fixes and core pages are in place.",
      },
    ],
  },

  "technical-seo": {
    h1: "Technical SEO Services to Get Your Pages Indexed",
    keywords: {
      primary: "technical seo services",
      secondary: [
        "technical seo audit",
        "core web vitals optimization",
        "crawlability and indexing fixes",
        "structured data implementation",
      ],
      longTail: [
        "why are my pages not indexed by google",
        "javascript seo for react and next.js sites",
        "how to fix crawled currently not indexed",
        "seo checklist for a website migration",
      ],
    },
    seoTitle: "Technical SEO Services and Site Audits",
    seoDescription:
      "Technical SEO services that fix crawling, indexing, rendering, site speed and structured data, so search engines can find and understand your content.",
    visual: "seo",
    challenges: [
      {
        title: "Pages that never get indexed",
        body: "Search Console fills up with crawled-but-not-indexed and duplicate warnings. We trace each status to its cause and fix the pattern rather than the single URL.",
      },
      {
        title: "A JavaScript site search engines struggle with",
        body: "Content assembled in the browser may not be seen by every crawler. We move critical content into server-rendered HTML.",
      },
      {
        title: "A migration that lost visibility",
        body: "Redesigns and platform moves often break URLs, redirects and canonicals. We audit what changed and restore the signals that were lost.",
      },
    ],
    offerings: [
      {
        title: "Technical SEO audit",
        body: "A full crawl and log-aware review of indexation, canonicals, redirects, status codes and duplication, with fixes ranked by impact.",
      },
      {
        title: "Rendering and JavaScript SEO",
        body: "Assessment of how your framework delivers content, with server-side rendering or static generation recommended where content is missing from HTML.",
      },
      {
        title: "Core Web Vitals optimisation",
        body: "Diagnosis and fixes for slow loading, layout shift and poor responsiveness, checked against field data in Search Console.",
      },
      {
        title: "Structured data",
        body: "Schema.org markup for organisations, products, articles, FAQs and breadcrumbs, emitted only where the page genuinely supports it.",
      },
      {
        title: "Site architecture and internal linking",
        body: "Flatter structures, sensible URL patterns and internal links that point authority towards your most important pages.",
      },
      {
        title: "Migration support",
        body: "Redirect mapping, pre-launch crawls of staging and post-launch monitoring for redesigns, domain changes and replatforming.",
      },
    ],
    process: [
      {
        title: "Crawl and data collection",
        body: "We crawl the site, pull Search Console and analytics data, and review server logs where available.",
      },
      {
        title: "Diagnose root causes",
        body: "Issues are grouped by cause, such as a template, a CMS setting or a rendering pattern, so one fix resolves many URLs.",
      },
      {
        title: "Fix with your developers",
        body: "We write clear tickets with acceptance criteria, or implement fixes directly where we have access to the codebase.",
      },
      {
        title: "Validate and monitor",
        body: "We confirm fixes in Search Console and recrawls, then monitor for regressions after future releases.",
      },
    ],
    tech: [
      "Google Search Console",
      "Screaming Frog",
      "Sitebulb",
      "PageSpeed Insights",
      "Chrome DevTools",
      "Lighthouse",
      "Schema.org",
      "Rich Results Test",
      "GA4",
      "Ahrefs",
    ],
    extraFaqs: [
      {
        question: "How do we avoid losing rankings when we redesign or migrate our website?",
        answer:
          "Involve SEO before the new site is built, not after launch. That means mapping every ranking URL to its new address, carrying over titles and content that perform, crawling the staging site before launch, and monitoring Search Console daily for the first weeks. Most migration losses come from redirects and content that were simply missed.",
      },
      {
        question: "Can you fix technical SEO issues on a Shopify, WordPress or Next.js site?",
        answer:
          "Yes. Each platform has its own common problems, such as duplicate collection paths on Shopify, plugin-generated archives on WordPress, or client-side rendering on JavaScript frameworks. Some fixes are settings changes and some need template or code work, and we tell you which before starting.",
      },
    ],
  },

  "ecommerce-seo": {
    h1: "E-commerce SEO Services for Online Stores",
    keywords: {
      primary: "e-commerce seo services",
      secondary: [
        "shopify seo services",
        "product page seo",
        "category page optimisation",
        "online store seo agency",
      ],
      longTail: [
        "how to rank product pages on google",
        "faceted navigation seo best practices",
        "seo for out of stock products",
        "how to write unique product descriptions for seo",
      ],
    },
    seoTitle: "E-commerce SEO Services for Shopify and WooCommerce",
    seoDescription:
      "E-commerce SEO services for Shopify, WooCommerce and custom stores: category structure, product page optimisation, faceted navigation and product schema.",
    visual: "seo",
    challenges: [
      {
        title: "Marketplaces outrank you on your own products",
        body: "Large retailers win on generic product terms. We find the category and long-tail searches where a specialist store can realistically compete.",
      },
      {
        title: "Filters creating crawl waste",
        body: "Colour, size and price filters can generate huge numbers of near-duplicate URLs. We decide which filtered pages deserve indexing and keep the rest out.",
      },
      {
        title: "Thin category and product pages",
        body: "A grid of products with no supporting copy gives search engines little to rank. We add content that helps shoppers choose and helps the page rank.",
      },
    ],
    offerings: [
      {
        title: "E-commerce SEO audit",
        body: "A store-specific review of indexation, duplicate content, variant handling, internal linking and product data.",
      },
      {
        title: "Category page optimisation",
        body: "Keyword-targeted titles, useful buying guidance and internal links on the category pages that target your highest-intent terms.",
      },
      {
        title: "Product page SEO",
        body: "Unique descriptions, structured specifications and image optimisation for priority products, replacing copied manufacturer text.",
      },
      {
        title: "Faceted navigation strategy",
        body: "Rules for which filter combinations become indexable landing pages and which are blocked or canonicalised.",
      },
      {
        title: "Product structured data",
        body: "Product, Offer and breadcrumb schema with accurate price and availability, plus product feed consistency for Google Merchant Center.",
      },
      {
        title: "Seasonal and out-of-stock handling",
        body: "Policies for returning, seasonal and discontinued products, so ranking pages are kept, redirected or retired deliberately.",
      },
    ],
    process: [
      {
        title: "Store audit and keyword map",
        body: "We audit the store and map keywords to categories, subcategories and products according to search intent.",
      },
      {
        title: "Fix the structure",
        body: "Canonicals, filters, pagination and internal links are corrected first, because content work compounds once the structure is sound.",
      },
      {
        title: "Improve priority pages",
        body: "We optimise the categories and products that matter most commercially, starting with your best margins and sellers.",
      },
      {
        title: "Track revenue from search",
        body: "Reporting connects organic sessions to orders and revenue in GA4, broken down by category.",
      },
    ],
    tech: [
      "Google Search Console",
      "Google Merchant Center",
      "GA4",
      "Screaming Frog",
      "Ahrefs",
      "Semrush",
      "Schema.org",
      "Shopify",
      "WooCommerce",
    ],
    extraFaqs: [
      {
        question: "Can e-commerce SEO help our products appear in Google Shopping for free?",
        answer:
          "Yes. Google shows free product listings alongside paid Shopping ads, using data from Merchant Center. Accurate product feeds and matching structured data on your product pages are what make a store eligible, and both are part of our e-commerce SEO work.",
      },
      {
        question: "How should we handle product variants like size and colour for SEO?",
        answer:
          "Usually one indexable page per product with variants selectable on it, so ranking signals are not split across near-identical URLs. Where a variant is searched for separately, such as a specific colour of a popular item, it can justify its own page. The decision should follow real search demand rather than a blanket rule.",
      },
    ],
  },

  "google-meta-ads": {
    h1: "Google and Meta Ads Management Built on Tracking",
    keywords: {
      primary: "google and meta ads management",
      secondary: [
        "google ads management services",
        "facebook and instagram ads agency",
        "ppc management services",
        "conversion tracking setup",
      ],
      longTail: [
        "google ads management for small businesses",
        "how to track conversions from meta ads",
        "performance max campaign management",
        "why are my google ads not getting conversions",
      ],
    },
    seoTitle: "Google and Meta Ads Management Services",
    seoDescription:
      "Google and Meta ads management with conversion tracking set up first, so Search, Shopping and social campaigns are judged on enquiries and sales, not clicks.",
    visual: "ads",
    challenges: [
      {
        title: "Spend with no clear return",
        body: "When conversions are not tracked or are counted twice, it is impossible to tell good campaigns from bad. We rebuild measurement before changing spend.",
      },
      {
        title: "Automated campaigns left unchecked",
        body: "Performance Max and Advantage+ campaigns optimise towards whatever signal they are given. We feed them accurate conversion data and review where budget goes.",
      },
      {
        title: "Ads and landing pages that do not match",
        body: "An ad that promises one thing and lands on a generic page wastes the click. We align messaging and landing pages campaign by campaign.",
      },
    ],
    offerings: [
      {
        title: "Google Search and Shopping campaigns",
        body: "Keyword-led Search campaigns and Shopping or Performance Max for product catalogues, with negative keywords maintained to cut irrelevant spend.",
      },
      {
        title: "Meta ads on Facebook and Instagram",
        body: "Prospecting and retargeting campaigns with audiences, placements and creative tested deliberately rather than all at once.",
      },
      {
        title: "Conversion tracking setup",
        body: "GA4, Google Tag Manager, enhanced conversions and the Meta Pixel with Conversions API, configured and tested end to end.",
      },
      {
        title: "Ad creative and copy",
        body: "Ad copy, static and short video creative produced in formats suited to each placement, refreshed before it fatigues.",
      },
      {
        title: "Landing page recommendations",
        body: "Specific changes to the pages your ads send traffic to, or new landing pages where existing ones do not fit the campaign.",
      },
      {
        title: "Reporting dashboards",
        body: "Looker Studio dashboards showing spend, conversions and cost per result across both platforms in one place.",
      },
    ],
    process: [
      {
        title: "Audit and tracking",
        body: "We audit existing accounts and tracking, then fix measurement so every campaign reports real enquiries or sales.",
      },
      {
        title: "Strategy and structure",
        body: "We agree goals, budgets and channel split, then structure campaigns around your products, services and audiences.",
      },
      {
        title: "Launch and test",
        body: "Campaigns go live with planned tests on targeting, creative and landing pages, each with enough budget to read the result.",
      },
      {
        title: "Optimise and report",
        body: "Budget moves towards what produces business, and regular reports explain what changed and what we are testing next.",
      },
    ],
    tech: [
      "Google Ads",
      "Meta Ads Manager",
      "Google Merchant Center",
      "GA4",
      "Google Tag Manager",
      "Meta Conversions API",
      "Looker Studio",
      "Google Ads Editor",
    ],
    extraFaqs: [
      {
        question: "Do we keep ownership of our ad accounts?",
        answer:
          "Yes. Campaigns run in ad accounts owned by your business, with us given access as a partner or user. If we stop working together, the accounts, their history and the audiences you have built stay with you.",
      },
      {
        question: "How soon can we expect results from Google and Meta ads?",
        answer:
          "Ads start delivering traffic as soon as they are approved, but platforms need a learning period and enough conversions before their bidding settles. How quickly campaigns become reliable depends on budget, conversion volume and how competitive your market is, and we explain what to expect for your account before launch.",
      },
    ],
  },
};
