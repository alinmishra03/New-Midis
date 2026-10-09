/**
 * Structured decision data for each industry.
 *
 * `industry-content.ts` holds the prose — what makes the sector hard and how
 * we respond. This file holds the part a buyer actually uses to decide: who
 * has to be convinced, what the site has to talk to, what we would build it
 * on and why, what is worth measuring afterwards, what tends to move the
 * date, and the symptoms that say the current site is the constraint.
 *
 * Everything here is either an industry norm (the systems a sector's site
 * genuinely has to integrate with) or MIDIS's own professional
 * recommendation. Nothing in it is a claim about work delivered, a client, a
 * result or a figure — those belong in content/evidence.ts, and only once
 * they can be verified. A platform recommendation also carries the case
 * against itself, because a default presented as universal is advice nobody
 * can act on.
 */

export interface IndustryBuyer {
  /** The person in the room, by role rather than job title. */
  role: string;
  /** What they need the site to settle before they will move. */
  needs: string;
}

export interface IndustryPlatform {
  /**
   * Three or four words, for places that compare sectors side by side. The
   * full recommendation is a sentence and will not fit in a table cell.
   */
  label: string;
  /** What we would typically build on for this sector. */
  recommendation: string;
  rationale: string;
  /** Where this default stops being the right answer. */
  exception: string;
}

export interface IndustryTimeline {
  /** Where this sector sits relative to a straightforward marketing build. */
  shape: string;
  /** What actually moves the date, in practice rather than on paper. */
  drivers: string[];
}

export interface IndustryProfile {
  buyers: IndustryBuyer[];
  /** Systems a site in this sector usually has to work with. */
  integrations: string[];
  platform: IndustryPlatform;
  /** What is worth measuring once it is live. */
  metrics: string[];
  timeline: IndustryTimeline;
  /** Symptoms that the current site has become the constraint. */
  rebuildSignals: string[];
}

export const industryProfiles: Record<string, IndustryProfile> = {
  saas: {
    buyers: [
      {
        role: "Founder or head of growth",
        needs:
          "A site that says what the product does in a sentence they would actually use on a call, and that converts without a salesperson attached.",
      },
      {
        role: "Technical evaluator",
        needs:
          "Integration list, API surface and limits, findable without a signup, before they will recommend it internally.",
      },
      {
        role: "Finance or procurement",
        needs:
          "Pricing structure, security posture and enough substance to justify a new vendor to someone who has never heard of you.",
      },
    ],
    integrations: [
      "Billing and subscriptions (Stripe, Paddle, Razorpay)",
      "CRM and pipeline (HubSpot, Salesforce, Pipedrive)",
      "Product analytics for activation, not just page views",
      "Support and in-app messaging",
      "Authentication for trial and demo signup",
      "Documentation platform and a public status page",
    ],
    platform: {
      label: "Next.js, split from the app",
      recommendation: "A Next.js marketing site, deliberately separate from the product app.",
      rationale:
        "The two have opposite requirements. The marketing site has to be fast and indexable; the app has to be interactive and sits behind authentication. Shared design tokens keep them feeling like one product without forcing one stack to serve both badly.",
      exception:
        "Pre-launch, with one page and no content cadence yet, a single simple site is the honest answer — splitting it early buys nothing.",
    },
    metrics: [
      "Trial or demo starts, segmented by the source that produced them",
      "Activation — the first genuinely useful action, not the signup",
      "Pricing page to signup rate",
      "Documentation searches that return nothing",
      "Organic entries on problem-led queries rather than brand ones",
    ],
    timeline: {
      shape:
        "Close to a straightforward marketing build, provided the product story is already settled.",
      drivers: [
        "How much of the positioning is still undecided — this is usually the long pole, and it is a strategy problem rather than a build one",
        "Whether documentation lives inside the site or on a separate platform",
        "How many comparison and integration pages need to exist at launch to be competitive in search",
      ],
    },
    rebuildSignals: [
      "Sales calls open by re-explaining what the homepage was supposed to say",
      "Trials from the site activate at a noticeably lower rate than trials from sales",
      "Engineers reach your documentation through a search engine rather than your navigation",
      "Publishing a new page requires a developer",
    ],
  },

  healthcare: {
    buyers: [
      {
        role: "Practice owner or clinical lead",
        needs:
          "Confidence that nothing on the site overstates a clinical claim, and that the tone reads as a practice rather than a brand.",
      },
      {
        role: "Practice manager",
        needs:
          "A booking and enquiry flow that reduces phone volume instead of adding a second queue to manage.",
      },
      {
        role: "Patient",
        needs:
          "To know whether you treat their particular problem, how soon they can be seen, and what it will cost.",
      },
    ],
    integrations: [
      "Practice management or appointment system",
      "Calendar availability, where the system will expose it",
      "Payment for self-pay consultations",
      "Enquiry handling that keeps health information out of plain email",
      "Google Business Profile and local listings",
      "Accessibility testing as part of the release, not after it",
    ],
    platform: {
      label: "Editable CMS, hardened",
      recommendation: "A CMS the practice team can edit themselves, on a hardened template.",
      rationale:
        "Clinicians, hours, services and fees change constantly, and every one of those changes is urgent to someone. If updating them needs a developer, the site drifts out of date and reception absorbs the difference.",
      exception:
        "Multi-site groups sharing one service catalogue are better served by a structured content model, so a change to a treatment propagates rather than being re-typed per location.",
    },
    metrics: [
      "Bookings completed against bookings started — the gap is the flow's real cost",
      "Calls that self-service absorbed",
      "Mobile abandonment on the appointment page specifically",
      "Accessibility checks passing on the booking path, not just the homepage",
      "Local search impressions by treatment rather than by practice name",
    ],
    timeline: {
      shape: "Longer than the page count suggests — review cycles set the date, not build time.",
      drivers: [
        "Clinical sign-off on every word that touches a treatment claim",
        "Whether the practice management system offers a real integration or only an embed",
        "Accessibility testing, which should be scheduled from the start rather than discovered at the end",
      ],
    },
    rebuildSignals: [
      "Reception answers, all day, the question the website should have answered",
      "Patients ring to book because the online flow asks for too much too early",
      "A keyboard or screen-reader user cannot complete a booking",
      "Service pages were written for other clinicians rather than for patients",
    ],
  },

  "real-estate": {
    buyers: [
      {
        role: "Agency principal",
        needs:
          "Listings that present better on your own site than they do on the portals you pay for.",
      },
      {
        role: "Sales or lettings lead",
        needs:
          "Enquiries that arrive fast and already say which property they are about.",
      },
      {
        role: "Buyer or tenant",
        needs:
          "To filter a large inventory on a phone, quickly, and to reach a human while they are still interested.",
      },
    ],
    integrations: [
      "CRM or listing feed, via API or scheduled XML",
      "Maps and location search",
      "Virtual tour and floorplan embeds",
      "Mortgage or affordability calculators",
      "WhatsApp and call tracking for enquiry attribution",
      "Portal syndication, so one listing update reaches everywhere",
    ],
    platform: {
      label: "Next.js + live listing feed",
      recommendation:
        "Next.js with incremental regeneration driven by the listing feed.",
      rationale:
        "Inventory changes hourly, and listing pages have to be both instant and indexable. Rebuilding the whole site per change does not scale, and a search that only exists client-side is invisible to search engines — which is exactly the traffic a portal is taking from you.",
      exception:
        "A small, slow-moving portfolio does not need the pipeline. A handful of properties updated monthly is a content problem, not an architecture one.",
    },
    metrics: [
      "Enquiry rate per listing view, by property type",
      "Search abandonment — filters applied, no result opened",
      "Time to first result on a mid-range phone",
      "Indexed listing pages against live listings",
      "Saved searches and alert signups, which are repeat demand",
    ],
    timeline: {
      shape: "Driven by the feed rather than the design.",
      drivers: [
        "Whether the CRM exposes a dependable feed, or data has to be entered twice",
        "How many property types need genuinely distinct templates",
        "Filter and map performance tuning on mid-range devices, which is real work",
      ],
    },
    rebuildSignals: [
      "Your listings appear on the portals before they appear on your own site",
      "Filtering is slow enough that people give up and go back to the portal",
      "Sold and let properties linger, get indexed, and waste enquiries",
      "Enquiries arrive with no indication of which property prompted them",
    ],
  },

  ecommerce: {
    buyers: [
      {
        role: "Founder or e-commerce manager",
        needs: "Conversion rate and average order value to move, and to be able to see why.",
      },
      {
        role: "Operations",
        needs:
          "Stock, delivery promises and returns to be accurate on the page, because they absorb it when they are not.",
      },
      {
        role: "Shopper",
        needs: "Total cost and delivery date before committing, without a surprise at checkout.",
      },
    ],
    integrations: [
      "Store platform (Shopify, WooCommerce)",
      "Payments (Razorpay, Stripe, PayPal, and local methods that matter)",
      "Shipping rates, labels and tracking",
      "Inventory or ERP, so stock on the page is real",
      "Email and SMS flows (Klaviyo, Mailchimp)",
      "Reviews, and analytics with server-side events that survive ad blockers",
    ],
    platform: {
      label: "Shopify, custom theme",
      recommendation: "Shopify for most stores — with a custom theme, not a marketplace one.",
      rationale:
        "Payments, tax, fraud and PCI scope are solved problems, and rebuilding them is risk without reward. The differentiation belongs in the buying experience instead, and a custom theme gives full control of that without inheriting a marketplace theme's compromises.",
      exception:
        "Deep configurators, B2B pricing tiers, or an existing WordPress content operation can genuinely justify WooCommerce or a headless build.",
    },
    metrics: [
      "Add to cart, then checkout, then purchase — each step separately, because the leak has a location",
      "The gap between mobile and desktop conversion",
      "On-site searches returning nothing, which is a merchandising instruction",
      "Returns by reason, which usually points at a product page",
      "Revenue per session by channel, rather than traffic by channel",
    ],
    timeline: {
      shape:
        "Longer than a marketing site. Catalogue and payment work sit on the critical path, and neither compresses well.",
      drivers: [
        "Product data quality — images, variants and copy; reliably the slowest part",
        "Payment, tax and shipping configuration, and testing it properly",
        "Migrating existing orders, customers and URLs without losing search equity",
      ],
    },
    rebuildSignals: [
      "Mobile converts at a fraction of desktop and nobody knows which step is losing it",
      "Abandonment concentrates on the shipping step",
      "Theme customisations have made platform upgrades risky",
      "Discount codes are the only thing that reliably moves revenue",
    ],
  },

  startups: {
    buyers: [
      {
        role: "Founder",
        needs:
          "To look credible to investors and to first customers at the same time, usually sooner than is comfortable.",
      },
      {
        role: "Investor reading before the meeting",
        needs: "The problem, the approach and the team, inside a minute.",
      },
      {
        role: "First customer",
        needs: "A reason to believe you will still be here in a year.",
      },
    ],
    integrations: [
      "Email capture or waitlist",
      "Calendar booking, so interest converts to a conversation immediately",
      "Analytics good enough to tell which message is landing",
      "Payments, as soon as there is anything to charge for",
      "A CMS the founder can edit without asking anyone",
    ],
    platform: {
      label: "Small Next.js site, light CMS",
      recommendation: "A small Next.js site with a light CMS, built to be replaced.",
      rationale:
        "Positioning will change more than once before product-market fit. The site should be cheap to rewrite rather than architected for a scale that does not exist yet — building for the company you hope to be is how startups end up maintaining something they have outgrown in a different direction.",
      exception:
        "Once positioning holds steady and a content cadence starts, it is worth rebuilding properly instead of extending this one indefinitely.",
    },
    metrics: [
      "Qualified conversations booked — not traffic",
      "Which value proposition variant actually gets replies",
      "Visit to meeting rate, by source",
      "Waitlist signups that go on to activate, rather than the list's size",
    ],
    timeline: {
      shape: "The shortest of any sector here, deliberately.",
      drivers: [
        "How settled the positioning is — an unsettled story is a strategy problem that a build cannot solve",
        "Whether a brand identity exists or has to be created alongside",
        "How much has to be live for the next fundraise or launch date",
      ],
    },
    rebuildSignals: [
      "You describe the company differently on calls than the site does",
      "The site was built for a product you no longer sell",
      "Changing a headline needs a developer",
      "Investors ask questions the homepage was supposed to have answered",
    ],
  },

  education: {
    buyers: [
      {
        role: "Principal or head of institution",
        needs: "Enrolment numbers, and a site that reflects the institution's standing.",
      },
      {
        role: "Admissions or marketing lead",
        needs:
          "An enquiry-to-application funnel that works and can be measured, through an intake window.",
      },
      {
        role: "Parent or prospective student",
        needs:
          "Fees, outcomes, location and whether the course is right for them — while comparing you against three others.",
      },
    ],
    integrations: [
      "Application and enquiry forms feeding a CRM or student information system",
      "Fee payment",
      "Open day and event registration",
      "Prospectus download with a source attached",
      "Notice and results publishing the admin team can run",
      "Multilingual content where the intake needs it",
    ],
    platform: {
      label: "CMS, structured courses",
      recommendation:
        "A CMS with structured content types for courses, staff and notices.",
      rationale:
        "Courses, dates, fees and staff change every intake and have to be editable by the admissions team. Structured content keeps every course page consistent as it changes, rather than letting fifty pages drift apart over three years.",
      exception:
        "A single-programme institute does not need the content model, and will move faster without it.",
    },
    metrics: [
      "Enquiry, then application, then enrolment — each step, so the drop is locatable",
      "Course page to enquiry rate, per course",
      "Open day registrations by source",
      "Prospectus downloads that go on to apply",
      "Application form completion on mobile, which is where most of it happens",
    ],
    timeline: {
      shape: "Set by the academic calendar more than by the scope.",
      drivers: [
        "Intake deadlines — launch usually has to land before an admissions window, which is immovable",
        "How many courses need individual pages, and who is writing them",
        "Approvals across both academic and administrative stakeholders",
      ],
    },
    rebuildSignals: [
      "Parents telephone admissions to ask about fees",
      "Course pages and the prospectus disagree",
      "Notices are published as scanned PDFs",
      "The site is awkward on the phone most applicants are using",
    ],
  },

  "professional-services": {
    buyers: [
      {
        role: "Partner or principal",
        needs:
          "Authority on the page without claiming results they are not permitted to disclose.",
      },
      {
        role: "Business development lead",
        needs: "Enquiries that arrive already qualified and already in the right practice area.",
      },
      {
        role: "Prospective client",
        needs:
          "Usually arriving on a referral — checking you are real, specialised, and the right size for them.",
      },
    ],
    integrations: [
      "Enquiry routing by practice area",
      "Consultation booking against real availability",
      "Secure document and file intake",
      "Newsletter and article distribution",
      "Event and seminar registration",
      "CRM, so a referral is not tracked in an inbox",
    ],
    platform: {
      label: "Content-led CMS build",
      recommendation: "A content-led build where publishing is a first-class workflow.",
      rationale:
        "In this sector the site earns work by publishing thinking over time. If publishing is awkward it stops within a quarter, and the site's main mechanism dies quietly — so the editor matters more than the homepage.",
      exception:
        "A firm that wins everything by referral and genuinely will never publish is better served by a smaller, sharper site than by a content platform nobody uses.",
    },
    metrics: [
      "Enquiries by practice area, against the areas you want to grow",
      "Which articles are read immediately before an enquiry",
      "Consultation bookings, not form fills",
      "Return visits before first contact — this sector has a long consideration window",
      "Search visibility on problem-led queries rather than on the firm's name",
    ],
    timeline: {
      shape: "Close to a straightforward build. The writing is the long pole.",
      drivers: [
        "Who writes the practice-area content, and how much partner time is genuinely available",
        "Compliance or regulatory review of claims and disclaimers",
        "Whether existing articles need migrating with their search equity intact",
      ],
    },
    rebuildSignals: [
      "Enquiries ask whether you do something you have done for fifteen years",
      "The most recent article is two years old",
      "Every practice area page reads identically",
      "A referred prospect cannot work out which partner to approach",
    ],
  },

  manufacturing: {
    buyers: [
      {
        role: "Owner or managing director",
        needs: "A site that opens distributor and export conversations rather than closing them.",
      },
      {
        role: "Sales engineer",
        needs:
          "Specifications and drawings on the page, so they stop emailing the same datasheet every week.",
      },
      {
        role: "Procurement or specifying engineer",
        needs:
          "To find a part or capability by specification, with certifications and tolerances visible.",
      },
    ],
    integrations: [
      "Structured product and specification catalogue",
      "Datasheet and CAD downloads",
      "RFQ forms that accept drawings and files",
      "ERP or product data source, so specifications are entered once",
      "Distributor or stockist locator",
      "Multilingual content and unit conventions for export markets",
    ],
    platform: {
      label: "Structured product catalogue",
      recommendation: "A structured product catalogue with search over real specifications.",
      rationale:
        "Buyers in this sector search by specification, not by marketing language. A catalogue with genuine attributes is findable and quotable; a PDF is neither — it cannot be searched, filtered, linked to, or indexed.",
      exception:
        "A contract manufacturer selling capability rather than products needs a capability-led site; a catalogue would be the wrong shape entirely.",
    },
    metrics: [
      "RFQ submissions, and how many were worth quoting",
      "Datasheet downloads by product, which tells you what to stock",
      "Specification searches returning nothing",
      "Export enquiries by country",
      "Indexed product pages against the catalogue's real size",
    ],
    timeline: {
      shape: "Dominated by product data rather than by design.",
      drivers: [
        "Getting specifications, certifications and images out of spreadsheets and PDFs and into structured content",
        "Whether the ERP can supply product data, or it has to be entered by hand once",
        "Translation and unit conventions for each export market",
      ],
    },
    rebuildSignals: [
      "Sales engineers email the same datasheet every week",
      "A buyer cannot find a product they already know you make",
      "Certifications live in a folder rather than on the product page",
      "The catalogue is a PDF with a date on it",
    ],
  },
};
