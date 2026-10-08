/**
 * Legal page configuration.
 *
 * The body text of /privacy and /terms describes what this website actually
 * does with data — the enquiry form, where submissions are stored, the audit
 * tool's third-party call, which cookies are set and when. Those are facts
 * about the implementation and are stated accurately.
 *
 * The values below are NOT facts I can establish. They are business and legal
 * decisions only MIDIS can make. Each has a placeholder that is honest about
 * being unconfirmed, and `reviewed` keeps both pages out of the search index
 * until someone at MIDIS has actually checked them.
 *
 * Before launch: fill these in, set `reviewed: true`, and have the result
 * reviewed by someone qualified. See docs/04-legal-checklist.md.
 */
export const legal = {
  /**
   * Set to true only after MIDIS has reviewed both pages. While false, they
   * render (so the consent link is not broken) but are noindexed.
   */
  reviewed: false,

  /** Registered company name, if it differs from the trading name. */
  legalEntityName: "MIDIS",

  /** How long enquiry submissions are kept. A business decision. */
  retentionPeriod: "for as long as we are in contact about your enquiry, and for our business records afterwards",

  /** Where to send privacy requests. Defaults to the general address. */
  privacyContactEmail: "hello@midis.in",

  /** Jurisdiction whose law governs the terms. */
  governingLaw: "India",

  /** Last substantive update. Update when the text changes. */
  lastUpdated: "8 October 2026",
} as const;

/**
 * Third parties that receive data from this website, and why.
 * This list is derived from what the code actually does — if an integration
 * is added or removed, update it here.
 */
export const dataProcessors = [
  {
    name: "Strapi Cloud",
    purpose: "Stores enquiry form submissions and hosts article content.",
    data: "Everything you type into the enquiry form.",
    when: "When you submit the enquiry form.",
  },
  {
    name: "Google PageSpeed Insights",
    purpose: "Runs the free website audit against the address you enter.",
    data: "Only the website address you type into the audit tool. No personal details are sent.",
    when: "When you run a website audit.",
  },
  {
    name: "Google Analytics 4",
    purpose: "Tells us which pages are useful and where people lose interest.",
    data: "Pages viewed, approximate location, device and browser, and actions such as starting an enquiry.",
    when: "Only after you accept analytics cookies.",
  },
  {
    name: "Meta Pixel",
    purpose: "Measures whether our advertising reaches people it should.",
    data: "Pages viewed and actions taken, linked to your Meta account if you have one.",
    when: "Only after you accept analytics cookies.",
  },
] as const;

export const cookieList = [
  {
    name: "midis_consent",
    type: "Essential",
    purpose: "Remembers whether you accepted or declined analytics cookies, so we stop asking.",
    duration: "Stored in your browser until you clear it.",
  },
  {
    name: "_ga, _ga_*",
    type: "Analytics",
    purpose: "Google Analytics — distinguishes visitors and sessions.",
    duration: "Up to 2 years.",
  },
  {
    name: "_fbp",
    type: "Analytics / advertising",
    purpose: "Meta Pixel — measures advertising performance.",
    duration: "Up to 3 months.",
  },
] as const;
