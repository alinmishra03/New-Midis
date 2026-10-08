import type { Faq } from "./types";

/**
 * Long-form content for each industry page.
 *
 * The brief is explicit that these must not be the same page with the sector
 * name swapped. Each entry below names problems that are specific to that
 * industry — the approach, the features that matter and the questions buyers
 * in that sector actually ask differ meaningfully between them.
 */
export interface IndustryContent {
  intro: string[];
  approach: string[];
  features: string[];
  faqs: Faq[];
}

export const industryContent: Record<string, IndustryContent> = {
  saas: {
    intro: [
      "SaaS websites carry an unusual burden: they have to make something abstract feel concrete, to two audiences at once. The engineer evaluating whether it will work and the executive approving the spend are asking different questions, and a site that answers only one loses the other.",
      "The common failure is explaining the product in the company's own vocabulary — feature names, internal concepts, terminology a prospect hasn't learned yet. Visitors don't translate it; they leave and try the competitor whose homepage made sense in ten seconds.",
    ],
    approach: [
      "Lead with the outcome and the problem it removes, then let people descend into technical depth at their own pace rather than forcing everyone through the same path.",
      "Separate the evaluator's route from the decision-maker's: integration detail, security and documentation for one, business case and pricing clarity for the other.",
      "Treat the trial or demo as the product's first screen, not a form. Most drop-off happens between intent and activation.",
    ],
    features: [
      "Product tours or interactive demos that work without signup",
      "Pricing presented so people can self-qualify",
      "Integration and API documentation that's genuinely findable",
      "Security and compliance information for procurement review",
      "Changelog and roadmap signalling the product is alive",
      "Comparison pages for the competitors you're actually evaluated against",
    ],
    faqs: [
      {
        question: "Should we show pricing publicly?",
        answer:
          "Usually yes, at least a range or structure. Hiding it entirely filters out people who would have bought and wastes sales time on people who were never in budget. Enterprise tiers can reasonably stay on request — but something should anchor expectations.",
      },
      {
        question: "How technical should the website be?",
        answer:
          "Layered. The surface should be understandable by someone who has never used a product like yours; the depth should be one click away for the engineer who needs it. Forcing either audience through the other's content costs you both.",
      },
      {
        question: "Do we need a separate marketing site and app?",
        answer:
          "Usually, yes — they have different requirements. The marketing site needs to be fast and indexable; the app needs to be interactive and is typically behind authentication. They should feel like one product, which is a design-system question rather than a hosting one.",
      },
    ],
  },

  healthcare: {
    intro: [
      "Healthcare websites are judged in seconds, and mostly on trust. A patient deciding whether to book is weighing whether this practice seems competent and whether they will be treated well — and a dated or confusing site answers both questions unfavourably, fairly or not.",
      "There is also a practical constraint most sectors don't face: a meaningful proportion of visitors are older, anxious, in pain, or using assistive technology. Design decisions that are merely annoying elsewhere are genuinely exclusionary here.",
    ],
    approach: [
      "Make credentials, registrations and clinical experience visible without making the site read like a CV.",
      "Design booking for the least confident user rather than the most capable — generous targets, plain language, no unexplained jargon, and a clear route to a phone number.",
      "Treat accessibility as a clinical obligation rather than a compliance checkbox, because the people it excludes are disproportionately your patients.",
    ],
    features: [
      "Online appointment booking with a visible phone alternative",
      "Clear service and treatment explanations in plain language",
      "Practitioner profiles with genuine qualifications",
      "Location, parking and accessibility information",
      "Patient forms available before the appointment",
      "Readable type and contrast that works for older eyes",
    ],
    faqs: [
      {
        question: "How do we present patient testimonials appropriately?",
        answer:
          "With explicit written consent, and within whatever your professional body permits — rules on testimonials vary considerably by regulator and jurisdiction. Where testimonials are restricted, anonymised outcome information and clear credentials carry similar weight.",
      },
      {
        question: "What accessibility standard should we meet?",
        answer:
          "WCAG 2.2 AA as a baseline. For healthcare it's worth going further on the fundamentals — text size, contrast, focus visibility, form labelling — because your audience includes more people relying on them than a typical site's does.",
      },
      {
        question: "Can the site integrate with our practice management system?",
        answer:
          "Usually, if it offers an API or a booking widget. We'll check what yours supports during scoping — integration depth varies a lot between systems, and it's better to know before design than after.",
      },
    ],
  },

  "real-estate": {
    intro: [
      "Property sites have a hard technical problem disguised as a design one. Inventory changes constantly, each listing carries dozens of attributes, and visitors want to filter across several of them simultaneously — on a phone, often standing outside the building.",
      "Most property sites are slow precisely where speed matters most: the search results page. People comparing properties run many searches in a session, and a two-second delay on each one is the difference between browsing and leaving.",
    ],
    approach: [
      "Build search and filtering as the core product rather than a feature bolted onto a brochure site.",
      "Optimise ruthlessly for mobile on real networks, because property browsing happens in transit and outside buildings.",
      "Capture interest at the moment it peaks — on the listing — rather than routing people to a generic contact page where intent evaporates.",
    ],
    features: [
      "Fast, multi-criteria property search with map view",
      "Image galleries, floor plans and virtual tours that load quickly",
      "Saved searches and alerts for new matching listings",
      "Per-listing enquiry and viewing requests",
      "Agent profiles with direct contact",
      "Area and neighbourhood guides that earn local search traffic",
    ],
    faqs: [
      {
        question: "Can you integrate our property feed or CRM?",
        answer:
          "Yes — most property CRMs expose a feed, and we'll build an import that keeps listings synchronised so nobody is updating two systems by hand. Stale listings are among the fastest ways to lose a prospect's trust.",
      },
      {
        question: "What happens to sold listings?",
        answer:
          "Don't delete them. Mark them sold and keep the page — it holds search value, demonstrates activity, and gives you a natural place to offer similar properties. Deleting ranking pages throws away earned authority.",
      },
      {
        question: "Are area guides worth producing?",
        answer:
          "Often they're the best organic opportunity available. People research a neighbourhood long before they search for an agent, and a genuinely useful guide reaches them at that point — provided it's written from real knowledge rather than assembled from statistics.",
      },
    ],
  },

  ecommerce: {
    intro: [
      "The structural problem in D2C is that your store, your competitor's store and a marketplace listing can all sell the identical product. If the experience is also identical, the decision comes down to price, and that is a race you probably can't win.",
      "The second problem is less visible: most stores leak revenue at predictable points. Costs appearing late in checkout, an account demanded before the order, and product pages that don't answer the one question actually blocking the purchase.",
    ],
    approach: [
      "Differentiate through the buying experience, not just the branding — the information a shopper needs to feel confident is category-specific and usually under-supplied.",
      "Instrument the funnel properly, then fix the specific steps where people leave rather than redesigning everything on instinct.",
      "Build for repeat purchase from the start, because acquiring the same customer twice through ads destroys the margin you earned the first time.",
    ],
    features: [
      "Product pages answering fit, sizing, materials and returns up front",
      "Total cost including shipping shown before checkout",
      "Guest checkout, with accounts offered afterwards",
      "Abandoned cart and post-purchase email automation",
      "Fast search and filtering that survives catalogue growth",
      "Original product content rather than supplier copy",
    ],
    faqs: [
      {
        question: "Why is our cart abandonment so high?",
        answer:
          "Most commonly unexpected shipping costs, a forced account creation step, or a checkout that feels unsafe. Analytics will tell you which step loses people — the fix is usually specific and much cheaper than a redesign.",
      },
      {
        question: "Should we sell on marketplaces as well?",
        answer:
          "They bring volume and take margin, customer relationship and data. A common approach is using them for discovery while making your own store the better place to buy repeatedly — which only works if your store genuinely is better.",
      },
      {
        question: "How do we compete with larger retailers on price?",
        answer:
          "Generally you don't. You compete on knowing the product properly, on service, and on an experience built for your specific category. Shoppers pay a premium for confidence, and confidence is something a generic listing can't provide.",
      },
    ],
  },

  startups: {
    intro: [
      "Early-stage companies have a credibility problem that has nothing to do with the quality of their product. Prospects, partners and candidates all use the website as a proxy for whether the company is real — and an obviously improvised site answers that question badly.",
      "The opposite mistake is just as costly: over-building before the proposition has settled. Spending heavily on a site describing a positioning you'll revise in four months is a waste twice over.",
    ],
    approach: [
      "Build credibility early with restraint and clarity rather than scale — a small, well-made site reads as more serious than a large, inconsistent one.",
      "Keep the messaging layer easy to change, because early-stage positioning moves and the site has to move with it without a rebuild.",
      "Make the site work for the several audiences a startup serves at once: customers, investors and candidates.",
    ],
    features: [
      "A clear proposition understandable in one screen",
      "A messaging layer that can be rewritten without a developer",
      "Proof surfaces ready for logos, metrics and testimonials as they arrive",
      "Careers content that attracts the people you need",
      "Analytics from day one, so decisions follow evidence",
      "An architecture that extends rather than needs replacing",
    ],
    faqs: [
      {
        question: "How much should a startup spend on its website?",
        answer:
          "Enough to look credible to the people you're asking for money or trust, and not so much that you're locked into a positioning you haven't validated. For most early-stage companies that's a focused site done well rather than a large one done adequately.",
      },
      {
        question: "Should we wait until the product is finished?",
        answer:
          "No. You need somewhere to send people long before the product is complete, and the site is often what makes early conversations possible. Build something honest about where you are now and designed to grow.",
      },
      {
        question: "Does the website matter for fundraising?",
        answer:
          "It matters more than founders expect. Investors look before meetings, and a site that clearly explains the problem, the approach and the team makes the conversation easier before it starts.",
      },
    ],
  },

  education: {
    intro: [
      "Education websites serve audiences with conflicting needs on the same pages. A prospective student wants to know whether the course is right for them; a parent wants to know about cost, safety and outcomes; a current student wants a timetable. Designing for one group tends to frustrate the others.",
      "Traffic is also intensely seasonal. A site that performs adequately in February can fall over during enrolment, which is precisely when failure is most expensive.",
    ],
    approach: [
      "Separate the routes clearly — prospective, current and parent — so each audience finds their path without wading through someone else's content.",
      "Present course information with the detail people actually decide on: entry requirements, dates, cost, format and what happens afterwards.",
      "Build and test for peak load, because enrolment periods are when capacity problems cost you students.",
    ],
    features: [
      "Course listings with filters for level, format, start date and location",
      "Entry requirements and fees stated plainly",
      "Enquiry and application forms that handle volume",
      "Prospectus downloads that capture contact details",
      "Staff and faculty profiles",
      "Accessibility meeting public-sector expectations",
    ],
    faqs: [
      {
        question: "How do we serve prospective and current students on one site?",
        answer:
          "Give each a clear entry point from the homepage and keep their journeys largely separate. Current students want fast access to a few specific things; prospective students need persuasion and detail. Mixing the two serves neither well.",
      },
      {
        question: "Can the site handle enrolment traffic spikes?",
        answer:
          "With static generation and appropriate caching, yes. Most pages don't change during a spike and can be served pre-built, which removes the load from the parts that genuinely need to be dynamic.",
      },
      {
        question: "What accessibility requirements apply to us?",
        answer:
          "Public-sector education providers in many jurisdictions have legal obligations beyond general good practice. WCAG 2.2 AA is the usual baseline, and we'd recommend treating it as a requirement regardless of whether it's enforced where you operate.",
      },
    ],
  },

  "professional-services": {
    intro: [
      "Professional services firms face a near-universal problem: every competitor describes themselves in the same words. Experienced, trusted, client-focused, partner-led. When every firm's site says the same thing, the site stops being a reason to choose anyone.",
      "The complication is that the most persuasive evidence — the work itself — is usually confidential. Firms conclude they can't demonstrate expertise and default to adjectives, which is exactly what makes them interchangeable.",
    ],
    approach: [
      "Demonstrate expertise through thinking rather than claims: how you approach a problem is publishable even when the matter isn't.",
      "Design for the long research phase, since most buyers read extensively and anonymously before they ever make contact.",
      "Make individuals visible — people hire people in this sector, and a firm presented as a faceless entity gives nobody a reason to call.",
    ],
    features: [
      "Service pages addressing specific situations, not broad categories",
      "Insight and commentary showing genuine expertise",
      "Individual profiles with real specialisms",
      "Anonymised matter summaries where confidentiality allows",
      "Low-commitment enquiry routes for cautious researchers",
      "Sector pages for the industries you actually serve",
    ],
    faqs: [
      {
        question: "How do we show expertise when our work is confidential?",
        answer:
          "Write about the problem rather than the client. A piece explaining how a particular situation is typically approached demonstrates the same capability as a case study without disclosing anything — and is often more useful to the reader.",
      },
      {
        question: "Should we publish fees?",
        answer:
          "Some indication helps more than it costs. People assume the worst in the absence of information, and vague pricing filters out good-fit clients while attracting enquiries you'll decline. A structure or starting point is usually enough.",
      },
      {
        question: "Does publishing content actually generate work?",
        answer:
          "For considered professional purchases it's one of the most reliable channels, because buyers research extensively before contacting anyone. The return is slow and compounding rather than immediate.",
      },
    ],
  },

  manufacturing: {
    intro: [
      "Manufacturing websites tend to be built for the company rather than its buyers. Products are organised by internal division, specifications live in PDFs, and finding whether a component meets a requirement means downloading a catalogue and searching it manually.",
      "Meanwhile the buyers — engineers, procurement teams, distributors — are searching for very specific technical terms. Those searches have low volume and extremely high intent, and they are routinely missed because the specifications that would match them are locked inside documents.",
    ],
    approach: [
      "Bring specifications out of PDFs and into structured, filterable, indexable pages, so the detail that wins the search is actually on the web.",
      "Serve each audience differently — engineers need specifications, procurement needs lead times and terms, distributors need trade information.",
      "Target precise technical language rather than broad category terms, because that is what your buyers actually type.",
    ],
    features: [
      "Filterable product catalogue by technical specification",
      "Specifications as page content, with PDFs as a supplement",
      "CAD files and technical documentation available to download",
      "Quote requests tied to specific products",
      "Distributor and trade account information",
      "Certifications and compliance documentation",
    ],
    faqs: [
      {
        question: "Our specifications are all in PDFs. Is that a problem?",
        answer:
          "It's one of the most common and most costly issues in the sector. Specifications inside PDFs are poorly indexed and awkward to search, so you miss precisely the high-intent technical searches your buyers make. The data should live on pages, with the PDF offered alongside.",
      },
      {
        question: "Should we show pricing on technical products?",
        answer:
          "Often it isn't practical with configuration and volume variables. Indicative ranges or a straightforward quote request still beat a bare contact form — what buyers need is a sense of whether you're in their bracket before investing time.",
      },
      {
        question: "Is organic search worth it for niche industrial products?",
        answer:
          "Frequently yes, precisely because the volumes are low. Few competitors bother optimising for highly specific technical terms, and the people searching them are usually ready to specify or buy.",
      },
    ],
  },
};
