import type { Differentiator, Faq, ProcessStep, TeamMember } from "./types";

/* ==========================================================================
   THE MIDIS METHOD
   Report §7: name the methodology so MIDIS sells a system, not "a website".
   Presented as the proposed method, pending confirmation it reflects how the
   company actually operates (see docs/02-evidence-intake.md, item 11).
   ========================================================================== */

export const processSteps: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    summary: "Understand the business before touching design.",
    detail:
      "We start with the commercial picture: what the business sells, who buys it, what the sales conversation sounds like today, and where it breaks down. We review competitors, analytics and existing search performance so decisions rest on evidence rather than taste.",
    outputs: ["Business and audience brief", "Competitor review", "Analytics and search baseline"],
  },
  {
    number: "02",
    title: "Strategise",
    summary: "Decide what the site has to achieve, and how.",
    detail:
      "We define positioning, the pages the site needs, how visitors move through them, and the specific actions each page is responsible for. This is where conversion paths and search architecture are planned together rather than bolted on later.",
    outputs: ["Positioning and messaging", "Sitemap and URL architecture", "Conversion and keyword plan"],
  },
  {
    number: "03",
    title: "Design",
    summary: "Turn the strategy into something people want to use.",
    detail:
      "Wireframes first, so structure is agreed before visuals. Then a visual system — type, colour, spacing, components — designed to scale across every page rather than a set of one-off screens.",
    outputs: ["Wireframes", "Visual design system", "Responsive page designs"],
  },
  {
    number: "04",
    title: "Build",
    summary: "Develop it properly, with performance built in.",
    detail:
      "Semantic, accessible front-end code, server-rendered for search engines, connected to a CMS your team can actually use. Integrations, forms and tracking are implemented as part of the build, not afterwards.",
    outputs: ["Production front-end", "CMS and integrations", "Forms, tracking and analytics"],
  },
  {
    number: "05",
    title: "Launch",
    summary: "Ship it without losing what you already had.",
    detail:
      "Cross-browser and device testing, performance and accessibility passes, redirect mapping so existing search visibility carries over, and a staged deployment with monitoring.",
    outputs: ["QA and accessibility pass", "301 redirect map", "Deployment and monitoring"],
  },
  {
    number: "06",
    title: "Grow",
    summary: "Treat launch as the start, not the finish.",
    detail:
      "Ongoing measurement against the goals set in Discover: search performance, conversion rates, page speed. Improvements are prioritised by commercial impact and shipped continuously.",
    outputs: ["Performance reporting", "Conversion improvements", "Content and SEO programme"],
  },
];

/* ==========================================================================
   WHY MIDIS — report §18
   ========================================================================== */

export const differentiators: readonly Differentiator[] = [
  {
    number: "01",
    title: "Strategy before pixels",
    body: "We don't start by opening Figma. We start by understanding what the business needs the website to do, because a beautiful site pointed at the wrong goal is an expensive mistake.",
  },
  {
    number: "02",
    title: "Business-first design",
    body: "Every layout decision has a commercial reason behind it — what the visitor needs to understand, believe and do next. Aesthetics serve that, rather than competing with it.",
  },
  {
    number: "03",
    title: "Design and development under one roof",
    body: "The people designing the site and the people building it work together. Nothing is lost in translation between a static mockup and a shipped page.",
  },
  {
    number: "04",
    title: "Performance is a requirement",
    body: "Fast, responsive and technically sound is the baseline, not an upgrade. Slow sites lose customers and rankings, so speed is designed in from the first decision.",
  },
  {
    number: "05",
    title: "Search-ready from day one",
    body: "Server-rendered pages, clean URL architecture, proper metadata and structured data are part of the build. SEO isn't bolted on after launch when it's expensive to retrofit.",
  },
  {
    number: "06",
    title: "A transparent process",
    body: "You know what we're working on, why, and what comes next. The six stages of our method each have defined outputs, so progress is visible rather than described.",
  },
  {
    number: "07",
    title: "Direct access to the team",
    body: "You talk to the people doing the work. No disappearing into an account-management layer that relays messages between you and the people who actually build your site.",
  },
  {
    number: "08",
    title: "Built to grow with you",
    body: "Content models, component systems and CMS structure are designed so the site can expand — new services, new markets, new pages — without a rebuild in eighteen months.",
  },
];

/* ==========================================================================
   "YOUR WEBSITE HAS ONE JOB" — report §8
   ========================================================================== */

export const websiteJobs = [
  { job: "Generate qualified enquiries", detail: "Turn interest into a conversation with someone who can actually buy." },
  { job: "Sell products", detail: "Move people from browsing to checkout without friction or doubt." },
  { job: "Explain something complex", detail: "Make a technical product or service understandable in under a minute." },
  { job: "Build enough trust to be shortlisted", detail: "Give a cautious buyer reasons to believe you can handle the work." },
  { job: "Convert paid traffic", detail: "Stop leaking the budget you're already spending on ads." },
  { job: "Support the sales team", detail: "Answer the objections that come up before anyone picks up the phone." },
  { job: "Attract talent", detail: "Show candidates a company worth leaving their current job for." },
  { job: "Raise investment", detail: "Present the business with the credibility that funding conversations require." },
] as const;

/* ==========================================================================
   TEAM — verified from the live site. Photographs are the real team's.
   Optional fields (specialism, LinkedIn, project count) render only when
   supplied; see docs/02-evidence-intake.md item 10.
   ========================================================================== */

export const leadership: readonly TeamMember[] = [
  {
    name: "Sagar Bakshi",
    role: "Managing Director",
    photo: "/team/sagar-bakshi.webp",
    photoWidth: 3329,
    photoHeight: 3332,
    bio: "Sagar leads strategy, operations and digital growth at MIDIS, with a particular focus on AI, automation and brand building. He brings hands-on experience from several e-commerce ventures across home decor, wellness and streetwear.",
  },
  {
    name: "Gaurav Sharma",
    role: "CEO & Director",
    /* Trimmed derivative: the original carries 42% transparent padding,
       which forced any fixed-ratio frame to crop the subject. Same
       photograph, blank canvas removed — see scripts/prepare-team-photos.mjs */
    photo: "/team/gaurav-sharma-trimmed.png",
    photoWidth: 739,
    photoHeight: 923,
    bio: "Gaurav sets the direction at MIDIS and works across branding, marketing and web development. He also works with Mining Discovery, overseeing content strategy, platform growth and insights delivery for the global mining industry.",
  },
];

/*
 * PHOTOGRAPHS
 *
 * MIDIS supplied a new set on 2026-10-14, named after the people in them, and
 * renamed the previous numbered files to "old 3 (N).webp" in the same move —
 * which left every path here pointing at a file that no longer existed. The
 * paths below are the new named derivatives (see scripts/prepare-team-photos).
 *
 * Nine people. Alok Yadav (Video Editor) was removed on 2026-10-14: he no
 * longer works at MIDIS. He was the only person without a new photograph,
 * which is consistent with the set MIDIS supplied.
 */
export const team: readonly TeamMember[] = [
  { name: "Alin Mishra", role: "Web Developer", photo: "/team/alin-mishra.webp", photoWidth: 1200, photoHeight: 1500 },
  { name: "Shivani Dixit", role: "Frontend Developer", photo: "/team/shivani-dixit.webp", photoWidth: 1200, photoHeight: 1500 },
  { name: "Ojasvinny Saini", role: "Graphic Designer", photo: "/team/ojasvinny-saini.webp", photoWidth: 1200, photoHeight: 1500 },
  { name: "Swayam Gandhi", role: "Backend Developer", photo: "/team/swayam-gandhi.webp", photoWidth: 1200, photoHeight: 1500 },
  { name: "Rahul Gehlot", role: "Graphic Designer", photo: "/team/rahul-gehlot.webp", photoWidth: 1200, photoHeight: 1500 },
  /* Was "SEO Expert"; changed on MIDIS's instruction of 2026-10-14. */
  { name: "Navkirat Bhogal", role: "Digital Marketer", photo: "/team/navkirat-bhogal.webp", photoWidth: 1200, photoHeight: 1500 },
  { name: "Chanda Angral", role: "Graphic Designer", photo: "/team/chanda-angral.webp", photoWidth: 1200, photoHeight: 1500 },
  /*
   * Added 2026-10-14. Both roles are read from the photographs themselves,
   * which carry the title set above the subject — the same series as everyone
   * above, where every printed title matches the role already recorded here.
   * Nothing is inferred from the faces.
   *
   * "Simar" is the whole name MIDIS supplied; the file is Simar.jpg and no
   * surname was given, so none is invented.
   */
  { name: "Mritunjai Upadhyay", role: "Full Stack Developer", photo: "/team/mritunjai-upadhyay.webp", photoWidth: 1200, photoHeight: 1500 },
  { name: "Simar", role: "UX/UI Designer", photo: "/team/simar.webp", photoWidth: 1200, photoHeight: 1500 },
];

/* ==========================================================================
   FAQ — migrated from the current site and expanded. Answers are written to
   be consistent with stated MIDIS practice; those marked below should be
   confirmed before launch.
   ========================================================================== */

export const faqs: readonly Faq[] = [
  {
    question: "How much does a business website cost?",
    answer:
      "It depends on scope rather than page count. A focused marketing site for a small business sits at the lower end; a multi-language site, an e-commerce build or a custom web application sits considerably higher. We scope properly before quoting, and the proposal breaks down what drives the number so you can adjust scope rather than guess. Tell us what the site needs to achieve and we'll give you a realistic range before you commit to anything.",
  },
  {
    question: "How long does a website project take?",
    answer:
      "A straightforward marketing website typically runs from discovery to launch over a number of weeks; e-commerce and custom application work takes longer. The timeline is agreed during the Strategise stage and tied to the six stages of our method, each with defined outputs, so you can see progress rather than wait for a reveal at the end.",
  },
  {
    question: "What does your process actually look like?",
    answer:
      "Six stages: Discover, Strategise, Design, Build, Launch and Grow. Each has specific outputs — a business brief, a sitemap, wireframes, a production front-end, a redirect map, performance reporting. You know what is being worked on and what comes next at every point.",
  },
  {
    question: "Who will be working on my project?",
    answer:
      "A dedicated team of designers and developers working with you directly. You talk to the people building your site rather than through an account-management layer.",
  },
  {
    question: "Do you work with Shopify and WooCommerce?",
    answer:
      "Yes. We work across Shopify, WooCommerce and custom e-commerce builds. The right platform depends on your catalogue size, how much you need to customise the buying experience, and how your operations and fulfilment work — we recommend based on those, not on a platform preference.",
  },
  {
    question: "Should I choose a custom build or WordPress?",
    answer:
      "WordPress suits content-heavy sites where non-technical staff publish frequently and requirements are conventional. A custom build suits sites needing specific functionality, unusual integrations or very high performance. We make the recommendation during Strategise, based on who will maintain the site and what it has to do.",
  },
  {
    question: "Can you redesign our existing website without losing our search rankings?",
    answer:
      "Yes, and preserving them is an explicit part of our launch process. Before launch we audit your indexed URLs, identify pages with existing search value, map 301 redirects for anything that moves, and validate canonical URLs. Losing rankings during a redesign is avoidable, and it's usually caused by skipping this step.",
  },
  {
    question: "Is SEO included, or is it separate?",
    answer:
      "The technical foundation is included in every build: server-rendered pages, clean URLs, correct metadata, structured data, performance and crawlable navigation. Ongoing SEO — content, keyword targeting, link building and continuous optimisation — is a separate engagement, because it's continuous work rather than a one-off deliverable.",
  },
  {
    question: "Do you provide support after launch?",
    answer:
      "Yes. We offer maintenance and support arrangements covering updates, security, performance monitoring and content changes. The Grow stage of our method covers ongoing measurement and improvement for clients who want the site to keep developing rather than sit still.",
  },
  {
    question: "Can you integrate with our existing tools?",
    answer:
      "Usually, yes — CRMs, booking systems, payment providers, analytics platforms, email tools and internal systems with an available API. Integrations are scoped during Strategise so the work is understood before the build starts rather than discovered halfway through.",
  },
  {
    question: "How do you handle project communication?",
    answer:
      "You get direct access to the team working on your project, with regular check-ins and visibility of progress against the six stages. We'd rather over-communicate than have you wonder what's happening.",
  },
  {
    question: "What do you need from us to get started?",
    answer:
      "An understanding of your business goals, access to any existing analytics and search data, your brand assets if you have them, and a point of contact who can make decisions. We handle the rest, and we'll tell you clearly if we need something before we can proceed.",
  },
  {
    question: "Do you work with clients outside India?",
    answer:
      "Yes. We work with businesses internationally as well as across India, and we're set up for remote collaboration across time zones.",
  },
  {
    question: "What happens if we need changes after launch?",
    answer:
      "Small changes are usually covered by a support arrangement. Larger additions — new sections, new functionality, a new campaign — are scoped as their own piece of work. Because we build on component systems and a CMS, additions generally don't require rebuilding what already exists.",
  },
];

/* ==========================================================================
   ABOUT — migrated from the current midis.in About page.
   Facts unchanged; phrasing tightened for a business reader.
   ========================================================================== */

export const aboutNarrative: readonly string[] = [
  "If you have been looking around for a digital agency, you already know the challenge: everyone says they can build websites, run ads and deliver growth. The promises start to sound identical.",
  "What we do about that is fairly unglamorous. We agree what the site has to achieve before anyone opens a design tool. Each stage of the work has outputs written down in advance, so you can see where a project actually is rather than waiting for a reveal. And we measure the finished site against the goals we set at the start, which is the only way to find out whether it did its job.",
  "We have worked with businesses in different corners of the world. Some were startups trying to get noticed. Others were established companies looking for smarter growth. Different goals, different markets — but the same outcome: measurable results that make sense for the business.",
  "We would rather report a number that changed what the business can do than one that looks impressive in a slide.",
];

export const aboutPrinciples = [
  {
    title: "Return on investment",
    body: "We don't celebrate likes or impressions. We celebrate leads, sales and revenue growth — the numbers that change what your business can afford to do next.",
  },
  {
    title: "Real collaboration",
    body: "We don't disappear after sending a report. We work alongside you and adjust the strategy when the market shifts.",
  },
  {
    title: "Ideas balanced with data",
    body: "We like creative campaigns, but the numbers keep us grounded. Instinct proposes; measurement decides.",
  },
  {
    title: "Context that travels",
    body: "We understand how people behave online in different cultures, so our strategies adapt rather than being copied from one market to another.",
  },
] as const;

export const whatYouGain = [
  {
    title: "Experience across borders",
    body: "We have worked with businesses in several markets and know what translates between them and what doesn't.",
  },
  {
    title: "All-in-one delivery",
    body: "Strategy, design, development, content and growth under one roof. No need to brief and coordinate five different agencies.",
  },
  {
    title: "Clear communication",
    body: "No jargon. We explain what we are doing and why, in language you can repeat to your board.",
  },
  {
    title: "Strategies built to scale",
    body: "What we build is designed to grow with the business rather than need replacing once it works.",
  },
] as const;
