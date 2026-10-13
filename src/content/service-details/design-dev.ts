import type { ServiceDetail } from "./types";

/**
 * Keyword-researched detail content for the design and development services.
 *
 * Nothing here asserts a statistic, client result, award, certification or
 * price. Every claim describes how the work is done, not what it achieved.
 */
export const designDevDetails: Record<string, ServiceDetail> = {
  /* ------------------------------------------------------ strategy & design */

  "web-design": {
    h1: "Website Design Agency for Businesses Ready to Grow",
    keywords: {
      primary: "website design agency",
      secondary: ["custom website design", "business website design", "responsive web design", "website design company"],
      longTail: [
        "website design agency for small businesses",
        "custom website design for professional services",
        "responsive website design for b2b companies",
        "website design agency in mohali",
      ],
    },
    seoTitle: "Website Design Agency for Growing Businesses",
    seoDescription:
      "Website design agency creating custom, responsive sites built around how your buyers decide. Clear structure, a reusable design system and pages that convert.",
    visual: "web",
    challenges: [
      {
        title: "The site no longer matches the business",
        body: "Your services, prices and clients have moved on, but the website still describes the company you were when it launched. Prospects judge you on the older version.",
      },
      {
        title: "Visitors can't tell what to do next",
        body: "Pages explain plenty and ask for nothing. Without a clear next step on each page, interested visitors leave without enquiring.",
      },
      {
        title: "Every new page looks slightly different",
        body: "Without a defined system, each addition is designed from scratch or copied from the nearest page. Over time the site loses consistency and starts to look assembled rather than designed.",
      },
    ],
    offerings: [
      {
        title: "Sitemap and content structure",
        body: "We decide which pages should exist, what each one is for and how they link together before any visual work begins.",
      },
      {
        title: "Wireframes for key templates",
        body: "Low-fidelity layouts for the homepage, service pages and contact flow, so hierarchy and messaging are agreed without the distraction of colour.",
      },
      {
        title: "Visual design system",
        body: "Type scale, colour, spacing, buttons, cards and form styles defined once in Figma, ready to be reused on every page.",
      },
      {
        title: "Responsive page designs",
        body: "Designs for mobile, tablet and desktop widths, so the small-screen layout is a deliberate decision rather than whatever the browser produces.",
      },
      {
        title: "Accessibility built into the visuals",
        body: "Contrast, focus states, readable type sizes and tap-target spacing are checked against WCAG guidance at the design stage.",
      },
      {
        title: "Developer-ready handoff",
        body: "Annotated Figma files with components, states and spacing tokens, whether we build the site ourselves or pass it to your developers.",
      },
    ],
    process: [
      {
        title: "Discover",
        body: "We review your current site, analytics and competitors, and agree who the site is for and the action each page should produce.",
      },
      {
        title: "Structure",
        body: "Sitemap and wireframes are drafted and revised until the page order and messaging hold up without any styling.",
      },
      {
        title: "Design",
        body: "We build the visual system and apply it to the key templates, sharing interactive Figma prototypes for review.",
      },
      {
        title: "Hand over or build",
        body: "Signed-off designs move into development, either with our team or yours, with a design review before launch.",
      },
    ],
    tech: ["Figma", "FigJam", "Adobe Illustrator", "Adobe Photoshop", "Google Fonts", "Google Analytics 4", "Hotjar", "Next.js", "WordPress"],
    extraFaqs: [
      {
        question: "How long does a website design project take?",
        answer:
          "It depends on the number of distinct page templates, whether content is ready or still being written, and how quickly feedback comes back at each review. We give you a timeline after the discovery stage, once the scope is clear.",
      },
      {
        question: "What do you need from us to start a website design?",
        answer:
          "Access to your current site and analytics if you have them, any brand assets or guidelines, a short list of competitors or sites you admire, and a person on your side who can make decisions. Content can be developed alongside the design.",
      },
    ],
  },

  "ui-ux-design": {
    h1: "UI/UX Design Services for Products People Can Use",
    keywords: {
      primary: "ui/ux design services",
      secondary: ["ux design agency", "user interface design", "product design services", "usability review"],
      longTail: [
        "ui/ux design services for saas products",
        "ux audit for web applications",
        "dashboard ui design services",
        "clickable prototype design for startups",
      ],
    },
    seoTitle: "UI/UX Design Services for Web Apps and SaaS",
    seoDescription:
      "UI/UX design services for SaaS and web apps: journey mapping, clickable prototypes and interface systems that help people finish tasks rather than abandon them.",
    visual: "uiux",
    challenges: [
      {
        title: "Users drop out of key flows",
        body: "Sign-up, onboarding or checkout loses people at the same step, and the team can only guess why.",
      },
      {
        title: "The interface grew feature by feature",
        body: "Each release added its own patterns, so similar actions now look and behave differently across the product.",
      },
      {
        title: "Support answers the same usability questions",
        body: "When people repeatedly ask how to do something the interface already supports, the problem is discoverability rather than missing features.",
      },
    ],
    offerings: [
      {
        title: "UX audit",
        body: "A structured review of your product against usability heuristics, analytics and support data, with prioritised issues and suggested fixes.",
      },
      {
        title: "User journey and task mapping",
        body: "We document the steps people take to complete key tasks, including the detours and dead ends, to show where effort is being wasted.",
      },
      {
        title: "Information architecture",
        body: "Navigation, labelling and content grouping reorganised around how users think about the product rather than how it is built.",
      },
      {
        title: "Wireframes and clickable prototypes",
        body: "Interactive Figma prototypes that let you and your users try a flow before any development time is spent on it.",
      },
      {
        title: "Usability testing",
        body: "Moderated or unmoderated sessions with representative users, scoped to what the project supports, with findings fed back into the design.",
      },
      {
        title: "UI component library",
        body: "A documented set of components with states, variants and usage notes, aligned with how your front-end is structured.",
      },
    ],
    process: [
      {
        title: "Research",
        body: "We gather what already exists: analytics, session recordings, support tickets and stakeholder interviews, then identify the flows that matter most.",
      },
      {
        title: "Map and define",
        body: "Journeys and problem areas are mapped, and we agree which tasks the redesign must make easier.",
      },
      {
        title: "Prototype and test",
        body: "Solutions are prototyped in Figma and tested with users or reviewed against the agreed tasks, then refined.",
      },
      {
        title: "Specify and support",
        body: "Final screens and components are handed to developers with interaction notes, and we review the build against the design.",
      },
    ],
    tech: ["Figma", "FigJam", "Maze", "Hotjar", "Microsoft Clarity", "Google Analytics 4", "Storybook", "Miro"],
    extraFaqs: [
      {
        question: "Do you need access to our product to start a UX audit?",
        answer:
          "Yes. A test account with realistic data, read access to analytics and, ideally, a sample of support tickets. That is enough to begin; interviews with your team and users can follow once the first findings are in.",
      },
      {
        question: "Can your designs be built by our in-house developers?",
        answer:
          "Yes. We hand over Figma files with component specifications, states and spacing tokens, and stay available for questions during the build so the result matches what was tested.",
      },
    ],
  },

  "website-redesign": {
    h1: "Website Redesign Services That Protect Your Rankings",
    keywords: {
      primary: "website redesign services",
      secondary: ["website redesign agency", "seo-friendly website redesign", "website migration", "site redesign company"],
      longTail: [
        "how to redesign a website without losing seo",
        "website redesign with 301 redirect mapping",
        "redesign an old wordpress website",
        "website redesign checklist for established businesses",
      ],
    },
    seoTitle: "Website Redesign Services Without Losing SEO",
    seoDescription:
      "Website redesign services that modernise your site while protecting search visibility: URL audit, redirect mapping, content review and post-launch monitoring.",
    visual: "web",
    challenges: [
      {
        title: "The site is out of date but still earns traffic",
        body: "Some pages bring in steady organic visits, so a careless relaunch risks the one part of the site that is working.",
      },
      {
        title: "Years of additions without a plan",
        body: "Pages, plugins and sections have been bolted on over time, leaving navigation that no longer reflects what the business sells.",
      },
      {
        title: "Previous redesigns caused problems",
        body: "If an earlier relaunch led to broken links or lost enquiries, the team is understandably cautious about trying again.",
      },
    ],
    offerings: [
      {
        title: "Indexed URL and content inventory",
        body: "We crawl the current site and cross-check it with Search Console to list every page, its traffic and its backlinks.",
      },
      {
        title: "Keep, merge or retire decisions",
        body: "Each existing page gets a clear decision, so valuable content is carried forward and thin or duplicate pages are consolidated.",
      },
      {
        title: "New structure and design",
        body: "Updated navigation, templates and visual design that reflect the business as it is now, not as it was at the last launch.",
      },
      {
        title: "301 redirect map",
        body: "Every changed URL is mapped to its closest new equivalent and tested on staging before the switch.",
      },
      {
        title: "Technical parity checks",
        body: "Titles, meta descriptions, canonicals, structured data and internal links are compared between old and new before launch.",
      },
      {
        title: "Post-launch monitoring",
        body: "We watch crawl errors, indexing and rankings in the weeks after launch and fix issues as they appear.",
      },
    ],
    process: [
      {
        title: "Audit",
        body: "Crawl, analytics and Search Console data establish what the current site does well and what it is costing you.",
      },
      {
        title: "Plan",
        body: "We agree the new sitemap, the fate of every existing URL and which content needs rewriting.",
      },
      {
        title: "Redesign and rebuild",
        body: "New templates are designed and built on staging, with redirects and metadata migrated alongside the pages.",
      },
      {
        title: "Launch and monitor",
        body: "We launch with redirects live, submit updated sitemaps and monitor search performance closely afterwards.",
      },
    ],
    tech: ["Screaming Frog SEO Spider", "Google Search Console", "Google Analytics 4", "Ahrefs", "Figma", "Next.js", "WordPress", "Lighthouse"],
    extraFaqs: [
      {
        question: "Can you redesign our website on the same platform?",
        answer:
          "Yes. If your current platform, such as WordPress, still suits how your team works, we can redesign on it. If it is holding you back, we'll explain why and recommend a move as part of the plan.",
      },
      {
        question: "How long does a website redesign take?",
        answer:
          "It depends on the number of pages to migrate, how much content needs rewriting, whether the platform is changing and how many integrations the site relies on. The audit gives us enough information to set a realistic timeline.",
      },
    ],
  },

  "graphic-design": {
    h1: "Graphic Design Services for a Consistent Brand",
    keywords: {
      primary: "graphic design services",
      secondary: ["brand identity design", "logo and brand design", "marketing collateral design", "social media graphic design"],
      longTail: [
        "brand guidelines design for small businesses",
        "social media templates for brand consistency",
        "graphic design services for b2b marketing",
        "pitch deck and presentation design services",
      ],
    },
    seoTitle: "Graphic Design and Brand Identity Services",
    seoDescription:
      "Graphic design services covering brand identity, guidelines, social templates, presentations and print, so your business looks consistent wherever it appears.",
    visual: "design",
    challenges: [
      {
        title: "Assets are made by different people",
        body: "Agencies, freelancers and staff each interpret the brand their own way, so materials rarely look like they belong together.",
      },
      {
        title: "Nobody can find the right files",
        body: "Logos in the wrong format, outdated templates and missing fonts slow every piece of work and invite improvisation.",
      },
      {
        title: "The identity doesn't work in digital formats",
        body: "A logo or palette designed for print often breaks down on small screens, social avatars or dark backgrounds.",
      },
    ],
    offerings: [
      {
        title: "Logo refinement or creation",
        body: "A new mark or a careful refresh of your existing one, with versions for every size and background it needs to work on.",
      },
      {
        title: "Brand guidelines",
        body: "A practical reference covering logo use, colour, typography, imagery and layout, written for the people who will actually use it.",
      },
      {
        title: "Social media templates",
        body: "Editable templates in Canva or Figma for your regular post formats, so your team can publish on-brand without starting from scratch.",
      },
      {
        title: "Presentation and pitch decks",
        body: "Slide templates and designed decks for sales, investors or events that follow the same visual system as the rest of the brand.",
      },
      {
        title: "Print collateral",
        body: "Brochures, business cards, signage and event materials, supplied as print-ready files with the correct bleed and colour profiles.",
      },
      {
        title: "Campaign and ad creative",
        body: "Graphics for paid and organic campaigns, produced in the sizes each platform requires.",
      },
    ],
    process: [
      {
        title: "Brief and review",
        body: "We gather your existing materials, understand where the brand appears and identify where it is currently inconsistent.",
      },
      {
        title: "Concepts",
        body: "We present a small number of distinct directions applied to real examples, so you can judge them in context.",
      },
      {
        title: "Refine and systemise",
        body: "The chosen direction is developed into a complete system and documented in the brand guidelines.",
      },
      {
        title: "Produce and hand over",
        body: "Templates and assets are delivered in organised, labelled folders with source files and export formats your team needs.",
      },
    ],
    tech: ["Adobe Illustrator", "Adobe Photoshop", "Adobe InDesign", "Figma", "Canva", "Adobe Express", "Google Fonts"],
    extraFaqs: [
      {
        question: "Will we receive the source files for our brand assets?",
        answer:
          "Yes. You receive editable source files alongside exported formats, and the work is yours to use once the project is complete. Licensed fonts or stock images are documented so you know what needs its own licence.",
      },
      {
        question: "What do you need from us to start a brand identity project?",
        answer:
          "Your existing logo and materials if you have them, a description of your audience and competitors, and examples of design you like and dislike. The more honest the examples, the faster the first concepts land.",
      },
    ],
  },

  /* ------------------------------------------------------------ development */

  "web-development": {
    h1: "Custom Web Development Services Built for Speed",
    keywords: {
      primary: "custom web development services",
      secondary: ["website development company", "web development agency", "headless cms development", "website performance optimisation"],
      longTail: [
        "custom website development for b2b companies",
        "fast website development with core web vitals",
        "web development company in india for international clients",
        "website development with cms integration",
      ],
    },
    seoTitle: "Custom Web Development Services",
    seoDescription:
      "Custom web development services delivering fast, accessible, server-rendered websites with a CMS, integrations and analytics set up properly from the start.",
    visual: "web",
    challenges: [
      {
        title: "Pages load slowly on real devices",
        body: "Heavy scripts, unoptimised images and bloated themes make the site feel sluggish on the phones most of your visitors use.",
      },
      {
        title: "Small changes need a developer",
        body: "Updating a headline or adding a page means raising a request and waiting, so the site falls behind the business.",
      },
      {
        title: "Tools don't talk to each other",
        body: "Forms, CRM, analytics and booking systems sit side by side without proper integration, and leads get lost between them.",
      },
    ],
    offerings: [
      {
        title: "Front-end build",
        body: "Responsive, accessible pages built from a component system with React and Next.js, matched closely to the approved designs.",
      },
      {
        title: "CMS setup",
        body: "A headless CMS or WordPress configured around your content types, so editors work with structured fields rather than raw layouts.",
      },
      {
        title: "Integrations",
        body: "Forms, CRMs, booking tools, payment providers and marketing platforms connected through their APIs with error handling.",
      },
      {
        title: "Performance optimisation",
        body: "Image handling, code splitting, caching and font loading tuned against Core Web Vitals measured in Lighthouse and real-user data.",
      },
      {
        title: "Technical SEO foundations",
        body: "Server-rendered HTML, metadata, structured data, sitemaps and clean URLs implemented as part of the build.",
      },
      {
        title: "Analytics and tracking",
        body: "Google Analytics 4 and Tag Manager configured with the events that matter to you, with consent handling where required.",
      },
    ],
    process: [
      {
        title: "Scope",
        body: "We confirm requirements, integrations and content types, and choose the stack based on who will maintain the site.",
      },
      {
        title: "Build",
        body: "Components and templates are developed in a version-controlled repository, with a staging site you can review as work progresses.",
      },
      {
        title: "Test",
        body: "We check across browsers and devices, run accessibility and performance audits, and test forms and integrations end to end.",
      },
      {
        title: "Launch and hand over",
        body: "We deploy, verify tracking and search setup, then hand over access, documentation and CMS training.",
      },
    ],
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "WordPress", "Vercel", "GitHub", "Google Tag Manager", "Lighthouse"],
    extraFaqs: [
      {
        question: "Can you build from designs created by another agency?",
        answer:
          "Yes. We'll review the Figma or design files first and flag anything that would be difficult to build, inaccessible or missing states such as errors and empty pages, before development starts.",
      },
      {
        question: "Do you provide support after the website launches?",
        answer:
          "Yes. We can provide ongoing maintenance covering updates, monitoring, fixes and small improvements, or hand everything to your own team with documentation if you prefer to manage it in-house.",
      },
    ],
  },

  "react-development": {
    h1: "React Development Services for Web Applications",
    keywords: {
      primary: "react development services",
      secondary: ["react development company", "react js developers", "react web application development", "typescript react development"],
      longTail: [
        "hire react developers for a saas dashboard",
        "react application development with typescript",
        "react codebase refactoring services",
        "custom react component library development",
      ],
    },
    seoTitle: "React Development Services for Web Apps",
    seoDescription:
      "React development services for dashboards, portals and SaaS products. Typed, component-driven apps with a clean data layer another team can maintain.",
    visual: "web",
    challenges: [
      {
        title: "The codebase is hard to change safely",
        body: "Components are tightly coupled and untyped, so a small change in one place breaks something unexpected elsewhere.",
      },
      {
        title: "The interface feels slow as data grows",
        body: "Unnecessary re-renders and unmanaged data fetching make screens lag once real volumes of data arrive.",
      },
      {
        title: "Product work is waiting on developer capacity",
        body: "Your roadmap has more front-end work than your current team can deliver without cutting corners.",
      },
    ],
    offerings: [
      {
        title: "Web application development",
        body: "Dashboards, portals, configurators and internal tools built in React with TypeScript from the first commit.",
      },
      {
        title: "Component libraries",
        body: "Reusable, documented components in Storybook that keep the interface consistent as more people contribute to it.",
      },
      {
        title: "State and data fetching",
        body: "Server data, caching and client state handled with established libraries such as TanStack Query, rather than ad hoc patterns.",
      },
      {
        title: "API integration",
        body: "Connections to REST or GraphQL back ends with typed responses, loading and error states handled consistently.",
      },
      {
        title: "Refactoring and modernisation",
        body: "Incremental upgrades of older React code, such as class components or outdated tooling, without stopping feature work.",
      },
      {
        title: "Testing where it counts",
        body: "Unit and integration tests with Vitest or Jest and React Testing Library for business logic and critical user flows.",
      },
    ],
    process: [
      {
        title: "Technical discovery",
        body: "We review requirements, existing code and APIs, and agree the architecture and conventions before writing features.",
      },
      {
        title: "Foundations",
        body: "Project setup, linting, typing, routing and the core component set are put in place so feature work moves quickly.",
      },
      {
        title: "Iterative delivery",
        body: "Features ship in short cycles to a preview environment, with regular demos and code you can review in your repository.",
      },
      {
        title: "Hand over",
        body: "Documentation, architecture notes and a walkthrough with your developers, so the application can be maintained without us.",
      },
    ],
    tech: ["React", "TypeScript", "Vite", "TanStack Query", "Tailwind CSS", "Storybook", "Vitest", "React Testing Library", "GitHub Actions"],
    extraFaqs: [
      {
        question: "Can you work alongside our in-house development team?",
        answer:
          "Yes. We can work in your repository, follow your conventions and review process, and pair with your developers, or take ownership of a defined part of the application if that is more useful.",
      },
      {
        question: "What affects the timeline for a React application?",
        answer:
          "It depends on the number of screens and user roles, how complete and stable the back-end APIs are, the integrations involved and how settled the designs are. We break the work into phases so you see working software early.",
      },
    ],
  },

  "nextjs-development": {
    h1: "Next.js Development Agency for Fast, Findable Sites",
    keywords: {
      primary: "next.js development agency",
      secondary: ["next.js development services", "next.js developers", "headless next.js website", "server-side rendering react"],
      longTail: [
        "migrate react app to next.js for seo",
        "next.js website with headless cms",
        "next.js app router development",
        "next.js development company for saas marketing sites",
      ],
    },
    seoTitle: "Next.js Development Agency for SEO and Speed",
    seoDescription:
      "Next.js development agency building server-rendered and static sites with headless CMS integration, solid metadata and fast load times for users and crawlers.",
    visual: "web",
    challenges: [
      {
        title: "A client-rendered app that search can't read",
        body: "Your React site serves an almost empty page until JavaScript runs, so crawlers and link previews often miss the content.",
      },
      {
        title: "Marketing and product live on separate stacks",
        body: "A slow CMS-driven marketing site sits beside a modern app, and the two never quite look or behave alike.",
      },
      {
        title: "Content changes require a redeploy",
        body: "Editors can't publish without a developer rebuilding the site, so updates queue up behind other work.",
      },
    ],
    offerings: [
      {
        title: "Next.js websites and applications",
        body: "Builds on the App Router with React Server Components, choosing static, server or incremental rendering per route.",
      },
      {
        title: "React to Next.js migration",
        body: "Moving an existing client-rendered React app to Next.js route by route, with redirects and metadata handled.",
      },
      {
        title: "Headless CMS integration",
        body: "Content from Sanity, Strapi, Contentful or WordPress rendered by Next.js, with on-demand revalidation so edits appear without a full rebuild.",
      },
      {
        title: "Metadata and structured data",
        body: "Per-page titles, descriptions, canonical URLs, Open Graph images and JSON-LD generated from your content.",
      },
      {
        title: "Performance tuning",
        body: "Image optimisation, font loading, streaming and caching configured to keep Core Web Vitals in good shape.",
      },
      {
        title: "Deployment and environments",
        body: "Preview deployments for every change and a production pipeline on Vercel or your preferred host.",
      },
    ],
    process: [
      {
        title: "Architecture",
        body: "We map routes, data sources and rendering strategy, and decide which pages are static, dynamic or revalidated.",
      },
      {
        title: "Build",
        body: "Templates and components are built with TypeScript, with each change available on a preview URL for review.",
      },
      {
        title: "SEO and performance pass",
        body: "Metadata, sitemaps, structured data and Lighthouse results are checked page type by page type before launch.",
      },
      {
        title: "Launch",
        body: "We deploy, confirm indexing in Search Console and hand over documentation for your team or ongoing support.",
      },
    ],
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel", "Sanity", "Strapi", "Google Search Console", "Lighthouse"],
    extraFaqs: [
      {
        question: "Can you migrate our existing React app to Next.js gradually?",
        answer:
          "Usually, yes. Pages can be moved in stages, starting with those that most need to be indexed, while the rest of the application keeps running. We assess the codebase first to confirm the safest order.",
      },
      {
        question: "Does a Next.js site need a specific host?",
        answer:
          "No. Vercel is the simplest option and supports every feature, but Next.js also runs on other Node.js hosts, containers and platforms such as Netlify or AWS. We recommend based on your existing infrastructure and team.",
      },
    ],
  },

  "wordpress-development": {
    h1: "WordPress Development Company for Custom Builds",
    keywords: {
      primary: "wordpress development company",
      secondary: ["custom wordpress development", "wordpress theme development", "gutenberg block development", "wordpress website developer"],
      longTail: [
        "custom wordpress theme without page builder",
        "wordpress gutenberg custom block development",
        "wordpress speed optimisation services",
        "headless wordpress with next.js",
      ],
    },
    seoTitle: "Custom WordPress Development Company",
    seoDescription:
      "WordPress development company building custom themes and Gutenberg blocks, with fast pages, few plugins and an editor your team can use with confidence.",
    visual: "web",
    challenges: [
      {
        title: "A bought theme that fights every change",
        body: "The theme looked right in the demo, but every adjustment now needs overrides, extra plugins or custom CSS layered on top.",
      },
      {
        title: "Plugin sprawl",
        body: "Dozens of plugins add scripts, settings screens and update risks, and nobody is sure which ones are still needed.",
      },
      {
        title: "Editors avoid the CMS",
        body: "Page builders and cluttered admin screens make publishing feel risky, so content requests still end up with a developer.",
      },
    ],
    offerings: [
      {
        title: "Custom theme development",
        body: "Lightweight themes built for your design and content, with no unused features or demo bloat.",
      },
      {
        title: "Custom Gutenberg blocks",
        body: "Blocks designed around your content types, with only the fields and options editors need.",
      },
      {
        title: "Custom post types and fields",
        body: "Structured content for case studies, team members, locations or products using custom post types and Advanced Custom Fields.",
      },
      {
        title: "Speed and security hardening",
        body: "Plugin audits, caching, image optimisation, update policies and access controls to keep the site quick and safe.",
      },
      {
        title: "Headless WordPress",
        body: "WordPress as the editing back end with a Next.js front end, for teams that want familiar publishing and a faster site.",
      },
      {
        title: "Migration to WordPress",
        body: "Moving content from another CMS or an old WordPress install, with URLs, media and metadata carried across.",
      },
    ],
    process: [
      {
        title: "Content modelling",
        body: "We list the content your team publishes and design post types, fields and blocks to match it.",
      },
      {
        title: "Theme and block build",
        body: "The theme and blocks are developed in version control, with a staging site where editors can try them early.",
      },
      {
        title: "Content and QA",
        body: "Content is migrated or entered, and we test performance, accessibility, forms and editor workflows.",
      },
      {
        title: "Launch and training",
        body: "We launch on managed hosting, then train your editors with short guides written for your specific blocks.",
      },
    ],
    tech: ["WordPress", "PHP", "Gutenberg", "Advanced Custom Fields", "WooCommerce", "WP-CLI", "Yoast SEO", "Next.js", "Query Monitor"],
    extraFaqs: [
      {
        question: "Who owns the WordPress theme you build for us?",
        answer:
          "You do. The theme code, custom blocks and content are yours, and you can host the site wherever you like or bring in another developer later. Third-party plugins remain under their own licences.",
      },
      {
        question: "Can we keep our existing content when moving to a custom WordPress theme?",
        answer:
          "Yes. Existing posts, pages and media stay in the database, and we map them into the new templates and blocks. Where old page-builder layouts can't be converted cleanly, we'll identify those pages early and agree how to rebuild them.",
      },
    ],
  },
};
