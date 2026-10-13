import type { ServiceDetail } from "./types";

/**
 * Keyword-researched page content for the content, video, email and AI
 * services. Merged into the catalogue entry by getService().
 *
 * No statistics, client results, awards, certifications or prices — see the
 * header of evidence.ts. The AI pages state their limits plainly on purpose.
 */
export const mediaAiDetails: Record<string, ServiceDetail> = {
  /* ------------------------------------------------------------- content */

  "content-writing": {
    h1: "Content Writing Services for Websites and Search",
    keywords: {
      primary: "content writing services",
      secondary: ["seo content writing", "website copywriting", "b2b content writing", "content strategy services"],
      longTail: [
        "content writing agency for b2b companies",
        "website copywriting for service businesses",
        "seo blog writing services for small business",
        "hire a content writer for technical topics",
      ],
    },
    seoTitle: "Content Writing Services for B2B & Growing Brands",
    seoDescription:
      "Content writing services for websites, articles and campaigns. Search-informed copy written for your buyer, edited properly and published to a steady plan.",
    visual: "content",
    challenges: [
      {
        title: "Every page sounds like your competitors",
        body: "Generic claims like quality, service and value appear on every site in your sector. Buyers skim past them because they give no reason to choose you over the next tab.",
      },
      {
        title: "The blog has gone quiet",
        body: "Publishing started with good intentions and stalled when the person writing it got busy. An irregular blog signals neglect to visitors and gives search engines little to work with.",
      },
      {
        title: "Content ranks for nothing useful",
        body: "Articles were written on topics that interested the team rather than questions buyers search for. They bring visits that never turn into enquiries.",
      },
    ],
    offerings: [
      {
        title: "Website copywriting",
        body: "Homepage, service and landing page copy structured around what a buyer needs to believe before they enquire, with one clear action per page.",
      },
      {
        title: "SEO articles and guides",
        body: "Long-form pieces planned from real search demand and written to answer the question fully, so they earn links and time on page rather than a quick bounce.",
      },
      {
        title: "Content strategy and calendar",
        body: "A topic map that ties each piece to a stage of the buying journey, and a publishing calendar sized to what your team can review and approve.",
      },
      {
        title: "Tone of voice guide",
        body: "A practical guide to how your brand writes, with examples of what to say and what to avoid, so anyone producing copy stays consistent.",
      },
      {
        title: "Campaign and ad copy",
        body: "Headlines, ad variations, email copy and social captions written to a single message so a campaign reads as one argument across channels.",
      },
      {
        title: "Content refresh and consolidation",
        body: "A review of existing pages and posts to update, merge or retire what has gone stale, which often helps more than publishing something new.",
      },
    ],
    process: [
      {
        title: "Brief and research",
        body: "We interview your team, read your sales material and study search demand and competing pages to understand what buyers ask and what is already said.",
      },
      {
        title: "Outline and approval",
        body: "Each piece starts as an outline with angle, structure and target query, so direction is agreed before any full draft is written.",
      },
      {
        title: "Writing and editing",
        body: "A writer drafts and a separate editor checks accuracy, clarity and voice. Subject-matter questions go back to your experts rather than being guessed.",
      },
      {
        title: "Publish and review",
        body: "We format for the web with headings, internal links and metadata, then review performance in Search Console and feed it into the next round of topics.",
      },
    ],
    tech: ["Google Docs", "Grammarly", "Surfer", "Clearscope", "Google Search Console", "Google Analytics 4", "Ahrefs", "WordPress", "Notion"],
    extraFaqs: [
      {
        question: "Can you write content that matches our existing brand voice?",
        answer:
          "Yes. We start by reading what you have already published and noting what works, then agree a short voice guide with you. Early drafts get closer review until the voice settles.",
      },
      {
        question: "Do you upload the content to our website as well?",
        answer:
          "We can. We work in most common content management systems and will format headings, images, internal links and meta descriptions so the page is ready to publish rather than pasted in as a block of text.",
      },
    ],
  },

  /* --------------------------------------------------------------- video */

  "video-editing": {
    h1: "Video Editing Services for Social, Ads and Web",
    keywords: {
      primary: "video editing services",
      secondary: ["short form video editing", "social media video editing", "corporate video editing", "motion graphics services"],
      longTail: [
        "video editing for instagram reels and tiktok",
        "outsource video editing for business",
        "repurpose long form video into short clips",
        "video ad editing for meta and youtube ads",
      ],
    },
    seoTitle: "Video Editing Services for Social, Ads & Web",
    seoDescription:
      "Professional video editing services for social media, paid ads and websites. Short-form edits, motion graphics and captions cut for each platform's format.",
    visual: "video",
    challenges: [
      {
        title: "Raw footage piling up unused",
        body: "Interviews, events and product shoots sit on drives because nobody has the time or software skills to turn them into something finished.",
      },
      {
        title: "One edit posted everywhere",
        body: "A landscape video cropped for vertical feeds loses its subject, and a long edit posted as an ad loses viewers before the point arrives.",
      },
      {
        title: "Inconsistent look from video to video",
        body: "Different editors, fonts and colour treatments make a channel or feed look patched together, which weakens recognition of the brand.",
      },
    ],
    offerings: [
      {
        title: "Short-form social edits",
        body: "Vertical edits for Reels, Shorts and TikTok with a strong opening, on-screen text and pacing built for viewers who scroll.",
      },
      {
        title: "Ad creative editing",
        body: "Multiple cuts and hooks from the same footage so your paid team can test variations rather than relying on a single version.",
      },
      {
        title: "Long-form and interview editing",
        body: "Webinars, podcasts, interviews and explainers tightened for clarity, with b-roll, lower thirds and clean audio.",
      },
      {
        title: "Motion graphics and titles",
        body: "Animated titles, logo stings, charts and explainer sequences that match your brand system rather than stock templates.",
      },
      {
        title: "Colour and sound finishing",
        body: "Colour correction across mixed cameras, audio levelling and noise reduction so footage shot on different days sits together.",
      },
      {
        title: "Captions and repurposing",
        body: "Accurate burned-in or file-based captions, and clips cut from longer recordings so one shoot supplies weeks of posts.",
      },
    ],
    process: [
      {
        title: "Brief and footage review",
        body: "We confirm where each video will run, its aim and its length, then review the footage to see what story it can actually support.",
      },
      {
        title: "Style frame and rough cut",
        body: "A style reference for type, colour and graphics is agreed first, followed by a rough cut that settles structure before any polish.",
      },
      {
        title: "Revisions and finishing",
        body: "Feedback is gathered with time-stamped comments, then the edit gets colour, sound, motion graphics and captions.",
      },
      {
        title: "Export and delivery",
        body: "We deliver platform-specific exports with the right aspect ratios, codecs and file sizes, plus thumbnails or poster frames where needed.",
      },
    ],
    tech: ["Adobe Premiere Pro", "Adobe After Effects", "DaVinci Resolve", "Adobe Audition", "CapCut", "Frame.io", "Adobe Photoshop", "Descript"],
    extraFaqs: [
      {
        question: "What do you need from us to start a video edit?",
        answer:
          "The raw footage, any brand assets such as logos and fonts, and a short brief covering where the video will run and who it is for. Examples of videos you like help us agree the style quickly.",
      },
      {
        question: "How do you share drafts and collect feedback?",
        answer:
          "We share drafts through a review link where you can leave comments pinned to the exact moment in the video. That keeps feedback precise and avoids long email threads.",
      },
    ],
  },

  "youtube-management": {
    h1: "YouTube Channel Management for Businesses",
    keywords: {
      primary: "youtube channel management",
      secondary: ["youtube seo services", "youtube content strategy", "youtube thumbnail design", "youtube growth strategy"],
      longTail: [
        "youtube channel management for small business",
        "youtube video seo optimisation service",
        "how to grow a business youtube channel",
        "outsource youtube channel management",
      ],
    },
    seoTitle: "YouTube Channel Management for Brands & Founders",
    seoDescription:
      "YouTube channel management for businesses and founders: topic research, titles, thumbnails, video SEO, publishing and analytics reviewed every month.",
    visual: "video",
    challenges: [
      {
        title: "Videos that nobody finds",
        body: "Titles describe the content instead of matching what people search or click on, so even good videos get few impressions.",
      },
      {
        title: "No plan for what to publish next",
        body: "Topics are chosen week by week, so the channel never builds a body of related videos that keeps viewers watching.",
      },
      {
        title: "Analytics checked but not used",
        body: "Views are glanced at, but retention, traffic sources and click-through rate are not turned into decisions about the next video.",
      },
    ],
    offerings: [
      {
        title: "Channel audit and positioning",
        body: "A review of your channel, competitors and audience to define who the channel is for and what it should be known for.",
      },
      {
        title: "Topic research and content plan",
        body: "A plan built from search demand and suggested-video patterns in your niche, grouped into series that encourage binge viewing.",
      },
      {
        title: "Titles, thumbnails and metadata",
        body: "Thumbnail concepts and title options for each upload, with descriptions, chapters, tags and end screens set up properly.",
      },
      {
        title: "Publishing and channel setup",
        body: "Scheduling, playlists, channel art, the trailer and the about section maintained so the channel looks active and organised.",
      },
      {
        title: "Shorts strategy",
        body: "Shorts planned to support the long-form channel, cut from existing videos or produced alongside them, rather than posted at random.",
      },
      {
        title: "Monthly analytics review",
        body: "A plain-language review of retention, click-through and traffic sources, with specific changes for the next round of videos.",
      },
    ],
    process: [
      {
        title: "Audit and goals",
        body: "We review the channel and agree what it is meant to achieve for the business, whether that is enquiries, trust or audience building.",
      },
      {
        title: "Plan and packaging",
        body: "We build the content plan and develop title and thumbnail approaches before production, since packaging shapes what gets filmed.",
      },
      {
        title: "Production support and publishing",
        body: "We brief recordings, coordinate the edit and handle uploads, metadata and scheduling on a cadence you can maintain.",
      },
      {
        title: "Review and adjust",
        body: "Each month we read the analytics, compare videos against each other and adjust topics, openings and packaging accordingly.",
      },
    ],
    tech: ["YouTube Studio", "YouTube Analytics", "TubeBuddy", "vidIQ", "Adobe Photoshop", "Canva", "Adobe Premiere Pro", "Google Trends"],
    extraFaqs: [
      {
        question: "Do we need to give you access to our YouTube channel?",
        answer:
          "We ask to be added as a manager or editor through YouTube's channel permissions. You keep ownership, and access can be removed at any time without sharing your Google account password.",
      },
      {
        question: "Can you manage a channel if we record the videos ourselves?",
        answer:
          "Yes, and that is a common arrangement. We plan topics and give you a brief for each recording, then take it from there with editing, packaging and publishing.",
      },
    ],
  },

  /* --------------------------------------------------------------- email */

  "email-marketing": {
    h1: "Email Marketing Services That Put Your List to Work",
    keywords: {
      primary: "email marketing services",
      secondary: ["email marketing automation", "klaviyo email marketing", "email newsletter services", "email list segmentation"],
      longTail: [
        "abandoned cart email flow setup",
        "email marketing agency for ecommerce brands",
        "welcome email sequence for new subscribers",
        "klaviyo setup and management for shopify",
      ],
    },
    seoTitle: "Email Marketing Services & Automation Flows",
    seoDescription:
      "Email marketing services covering automation flows, campaigns, segmentation and deliverability, built in Klaviyo, Mailchimp or HubSpot for your customers.",
    visual: "email",
    challenges: [
      {
        title: "Subscribers sign up and hear nothing",
        body: "New subscribers arrive with interest that fades quickly, and without a welcome sequence that moment passes unused.",
      },
      {
        title: "Every email goes to everyone",
        body: "Sending the same promotion to new leads, loyal customers and lapsed buyers trains people to ignore you and pushes up unsubscribes.",
      },
      {
        title: "Emails landing in spam",
        body: "Missing authentication records, old unengaged contacts and inconsistent sending can quietly move your messages out of the inbox.",
      },
    ],
    offerings: [
      {
        title: "Automation flows",
        body: "Welcome, abandoned cart, browse abandonment, post-purchase, win-back and lead nurture sequences that run on their own once set.",
      },
      {
        title: "Campaign planning and copy",
        body: "A campaign calendar for launches, offers and news, with subject lines and copy written to a clear single action.",
      },
      {
        title: "Template design",
        body: "Branded, mobile-first email templates built as reusable modules so your team can assemble new campaigns without breaking the layout.",
      },
      {
        title: "Segmentation and personalisation",
        body: "Segments based on purchase history, engagement and lead stage, with content that changes for each group.",
      },
      {
        title: "Deliverability setup",
        body: "SPF, DKIM and DMARC configuration, list hygiene and sending practices that protect your sender reputation.",
      },
      {
        title: "Platform setup and migration",
        body: "Account setup, store or CRM integration and careful migration of lists and consent records when you move between platforms.",
      },
    ],
    process: [
      {
        title: "Account and list audit",
        body: "We review your platform, existing flows, list health, sign-up forms and authentication records to find the gaps.",
      },
      {
        title: "Flow and segment plan",
        body: "We map the automations and segments that matter most for your business model and agree the order to build them in.",
      },
      {
        title: "Build and test",
        body: "Templates, flows and segments are built, then tested across email clients and devices with real trigger conditions before going live.",
      },
      {
        title: "Optimise and report",
        body: "We test subject lines, timing and content, and report on revenue or leads attributed to email alongside engagement.",
      },
    ],
    tech: ["Klaviyo", "Mailchimp", "HubSpot", "Brevo", "ActiveCampaign", "Shopify", "Litmus", "Google Postmaster Tools", "Zapier"],
    extraFaqs: [
      {
        question: "Can you move our email list from one platform to another?",
        answer:
          "Yes. We migrate contacts, consent status and useful custom fields, rebuild key flows on the new platform and warm up sending gradually so deliverability isn't disrupted by the switch.",
      },
      {
        question: "Should a small business focus on automations or newsletters first?",
        answer:
          "Automations, in most cases. A welcome sequence and, for online stores, an abandoned cart flow run continuously once built, while newsletters need fresh effort every time you send.",
      },
    ],
  },

  /* ------------------------------------------------------------------ AI */

  "ai-chatbot-development": {
    h1: "AI Chatbot Development With Real Human Handover",
    keywords: {
      primary: "ai chatbot development",
      secondary: ["conversational ai development", "customer support chatbot", "custom ai chatbot", "rag chatbot development"],
      longTail: [
        "ai chatbot trained on company documents",
        "customer service chatbot with human handoff",
        "whatsapp ai chatbot for business",
        "ai chatbot for website lead generation",
      ],
    },
    seoTitle: "AI Chatbot Development Grounded in Your Content",
    seoDescription:
      "AI chatbot development for support and pre-sales: grounded in your own content, with clear human handover, privacy controls and testing before launch.",
    visual: "ai",
    challenges: [
      {
        title: "Support queues full of repeat questions",
        body: "Order status, opening hours, returns and pricing questions take up agent time that complex cases need.",
      },
      {
        title: "Enquiries arriving out of hours",
        body: "Visitors who land in the evening or at weekends leave without an answer, and some of them don't come back.",
      },
      {
        title: "A previous bot frustrated customers",
        body: "Rule-based or poorly scoped bots that loop and refuse to escalate leave people less willing to try self-service again.",
      },
    ],
    offerings: [
      {
        title: "Knowledge-grounded answers",
        body: "Retrieval-augmented generation over your help articles, policies and product data, so answers come from your sources rather than the model's general knowledge.",
      },
      {
        title: "Conversation design",
        body: "Scope, tone, greeting, fallback and escalation behaviour defined in writing before build, including what the bot should never attempt.",
      },
      {
        title: "Human handover",
        body: "Escalation to your helpdesk or live chat with the full transcript attached, triggered by topic, customer request or low confidence.",
      },
      {
        title: "Website, WhatsApp and app channels",
        body: "Deployment on your website widget, WhatsApp Business, in-app chat or internal tools such as Slack and Microsoft Teams.",
      },
      {
        title: "System integrations",
        body: "Connections to order, booking or CRM systems so the bot can look up specific records, with access limited to what each task needs.",
      },
      {
        title: "Monitoring and improvement",
        body: "Conversation review, flagged failures and content gap reports so you can see where answers fall short and fix the source.",
      },
    ],
    process: [
      {
        title: "Ticket and content analysis",
        body: "We review historical conversations and your knowledge base to find which questions are safe to automate and where content is missing.",
      },
      {
        title: "Scope and design",
        body: "We document what the bot will handle, what it hands over, what data it can access and how personal information is treated.",
      },
      {
        title: "Build and test",
        body: "We build the retrieval pipeline and integrations, then test against real past questions, including awkward and adversarial ones.",
      },
      {
        title: "Staged launch and review",
        body: "The bot goes live on a limited scope first, with conversations reviewed closely before it takes on more.",
      },
    ],
    tech: ["OpenAI API", "Claude API", "LangChain", "Pinecone", "pgvector", "Python", "Node.js", "Next.js", "WhatsApp Business Platform", "Intercom"],
    extraFaqs: [
      {
        question: "Can an AI chatbot be trained on our own documents and FAQs?",
        answer:
          "Yes. Rather than retraining the model, we index your documents and have the chatbot retrieve the relevant passages for each question. When those documents change, the answers update without a rebuild.",
      },
      {
        question: "Will the chatbot always give correct answers?",
        answer:
          "No AI system is right every time; language models can produce confident but wrong answers. We reduce that risk by grounding answers in your content, limiting scope and escalating when unsure, and we recommend reviewing conversations regularly.",
      },
    ],
  },

  "chatgpt-integration": {
    h1: "ChatGPT Integration Services for Existing Products",
    keywords: {
      primary: "chatgpt integration services",
      secondary: ["ai integration services", "integrate chatgpt into website", "ai assistant for business", "chatgpt for customer support"],
      longTail: [
        "integrate chatgpt into existing app",
        "chatgpt integration with crm",
        "add ai assistant to saas product",
        "chatgpt plugin for internal knowledge base",
      ],
    },
    seoTitle: "ChatGPT Integration for Websites, Apps & CRMs",
    seoDescription:
      "ChatGPT integration services that add AI assistants to your website, app or CRM, with scoped data access, brand voice settings and human review built in.",
    visual: "ai",
    challenges: [
      {
        title: "Staff pasting data into public AI tools",
        body: "Teams already use ChatGPT informally, often copying customer or company information into consumer accounts with no oversight.",
      },
      {
        title: "AI on the roadmap with no clear brief",
        body: "Leadership wants AI in the product, but nobody has defined what the assistant should do or how success will be judged.",
      },
      {
        title: "Generic answers that ignore context",
        body: "A plain chatbot cannot see your account data or documentation, so it replies in generalities your users already know.",
      },
    ],
    offerings: [
      {
        title: "In-product assistants",
        body: "AI features inside your existing web or mobile app, such as guided help, search over your docs or drafting tools for users.",
      },
      {
        title: "Website assistants",
        body: "On-site assistants that answer product questions and capture qualified leads into your CRM with the conversation summary attached.",
      },
      {
        title: "Internal knowledge assistants",
        body: "A private assistant over policies, manuals and past work, available in Slack, Teams or an internal portal.",
      },
      {
        title: "CRM and helpdesk integration",
        body: "Connections to tools such as HubSpot, Salesforce or Zendesk for summaries, suggested replies and record updates.",
      },
      {
        title: "Brand voice and guardrails",
        body: "System instructions, approved phrasing, banned topics and output checks so responses stay on-brand and within scope.",
      },
      {
        title: "Privacy and access controls",
        body: "Business API accounts, scoped permissions, redaction of sensitive fields and logging, set up to fit your data protection obligations.",
      },
    ],
    process: [
      {
        title: "Use case and data mapping",
        body: "We agree the job the assistant does, who uses it and which systems and data it needs to reach.",
      },
      {
        title: "Prototype",
        body: "A working prototype inside a staging copy of your product lets your team try real tasks before full build.",
      },
      {
        title: "Integration and hardening",
        body: "We connect it properly to your stack, add authentication, rate limits, error handling and cost controls, and test edge cases.",
      },
      {
        title: "Rollout and tuning",
        body: "Release to a small group first, review conversations and feedback, then tune instructions and retrieval before wider launch.",
      },
    ],
    tech: ["OpenAI API", "Azure OpenAI", "Claude API", "Node.js", "Python", "Next.js", "HubSpot", "Zendesk", "Slack API", "pgvector"],
    extraFaqs: [
      {
        question: "Is using the ChatGPT API different from staff using ChatGPT directly?",
        answer:
          "Yes. Through the API we control what data is sent, how it is logged and who can access it, and OpenAI's business terms state that API data is not used to train its models by default. Consumer use gives you none of that control.",
      },
      {
        question: "Can we switch to a different AI model later?",
        answer:
          "We build integrations with a thin layer between your product and the model provider, so moving to another model or provider is a contained change rather than a rewrite.",
      },
    ],
  },

  "openai-api-integration": {
    h1: "OpenAI API Integration for Business Automation",
    keywords: {
      primary: "openai api integration",
      secondary: ["ai automation solutions", "ai workflow automation", "document processing with ai", "gpt api development"],
      longTail: [
        "automate document summarisation with openai",
        "extract data from pdfs using gpt",
        "openai api integration with zapier or n8n",
        "ai email classification and routing",
      ],
    },
    seoTitle: "OpenAI API Integration & AI Workflow Automation",
    seoDescription:
      "OpenAI API integration for document processing, classification, summaries and drafting, built into your systems with evaluation, guardrails and monitoring.",
    visual: "ai",
    challenges: [
      {
        title: "Hours spent reading and re-keying documents",
        body: "Invoices, forms, contracts and reports are read by hand and their details typed into another system.",
      },
      {
        title: "Inboxes that need constant triage",
        body: "Shared mailboxes and enquiry forms rely on someone sorting each message before the right person can act on it.",
      },
      {
        title: "AI experiments that never reached production",
        body: "A promising test in a playground stalled because nobody built the integration, error handling or quality checks around it.",
      },
    ],
    offerings: [
      {
        title: "Document extraction",
        body: "Structured data pulled from PDFs, emails and scans into your database or spreadsheet, validated against expected formats.",
      },
      {
        title: "Classification and routing",
        body: "Incoming messages, tickets or leads tagged by type, urgency and sentiment, then routed to the right queue automatically.",
      },
      {
        title: "Summarisation and reporting",
        body: "Long documents, call transcripts and meeting notes condensed into consistent summaries your team can scan.",
      },
      {
        title: "Drafting assistance",
        body: "First drafts of routine replies, product descriptions or reports, produced for a person to review and approve before sending.",
      },
      {
        title: "No-code and custom pipelines",
        body: "Lighter workflows in Zapier, Make or n8n, and custom Python or Node.js services where volume, cost or complexity demands it.",
      },
      {
        title: "Evaluation and monitoring",
        body: "Test sets of known-correct examples, structured output checks, cost tracking and alerts when quality drifts.",
      },
    ],
    process: [
      {
        title: "Process mapping",
        body: "We document the current workflow step by step and identify exactly where a model adds value and where it should not decide.",
      },
      {
        title: "Evaluation set",
        body: "We collect real examples with correct answers, which become the benchmark every prompt and model change is measured against.",
      },
      {
        title: "Build and integrate",
        body: "We build the pipeline into your systems with structured outputs, retries, logging and human review queues where errors matter.",
      },
      {
        title: "Run and refine",
        body: "After launch we watch accuracy, cost and exceptions, and refine prompts or model choice as your volumes and requirements change.",
      },
    ],
    tech: ["OpenAI API", "Claude API", "Python", "Node.js", "LangChain", "n8n", "Make", "Zapier", "PostgreSQL", "pgvector"],
    extraFaqs: [
      {
        question: "Can the OpenAI API read scanned documents and PDFs?",
        answer:
          "Yes, with the right preparation. Text-based PDFs can be processed directly, and scanned pages can be handled with vision-capable models or an OCR step first. Quality depends on the scans, so we test on your real documents early.",
      },
      {
        question: "Should we use Zapier or a custom-built integration?",
        answer:
          "No-code tools are a sensible start for low volumes and simple steps. A custom service makes more sense when you need tighter control over data, error handling, cost or complex logic, and we can begin with one and move to the other.",
      },
    ],
  },

  "generative-ai-consultancy": {
    h1: "Generative AI Consulting Before You Commit to a Build",
    keywords: {
      primary: "generative ai consulting",
      secondary: ["ai strategy consulting", "custom ai solutions for business", "ai readiness assessment", "ai implementation roadmap"],
      longTail: [
        "how to identify ai use cases in my business",
        "generative ai consultant for small business",
        "ai proof of concept development",
        "ai governance and policy for companies",
      ],
    },
    seoTitle: "Generative AI Consulting & AI Strategy",
    seoDescription:
      "Generative AI consulting that finds where AI is worth building in your business, tests it on your data with a prototype and plans a safe, costed rollout.",
    visual: "ai",
    challenges: [
      {
        title: "Pressure to do something with AI",
        body: "Boards, investors or competitors are asking about AI, and there is a risk of funding a visible project instead of a useful one.",
      },
      {
        title: "Too many vendor pitches",
        body: "Every software supplier now claims AI features, and it is hard to compare them or know what to build versus buy.",
      },
      {
        title: "Unclear risk and governance",
        body: "Questions about data privacy, accuracy, intellectual property and staff use of AI tools have no agreed answers yet.",
      },
    ],
    offerings: [
      {
        title: "Use case discovery",
        body: "Workshops with your teams to collect candidate use cases from the work they actually do, not from vendor marketing.",
      },
      {
        title: "Opportunity scoring",
        body: "Each idea assessed on value, data readiness, risk and build effort, producing a shortlist you can defend.",
      },
      {
        title: "Build versus buy advice",
        body: "Independent comparison of off-the-shelf tools against a custom build for each shortlisted use case.",
      },
      {
        title: "Proof of concept",
        body: "A working prototype on your real data for the strongest candidate, tested against agreed success criteria.",
      },
      {
        title: "AI policy and governance",
        body: "A practical usage policy covering approved tools, data handling, human review and accountability for AI-assisted work.",
      },
      {
        title: "Implementation roadmap",
        body: "A sequenced plan covering build, integration, training and running costs, with checkpoints to stop if value doesn't appear.",
      },
    ],
    process: [
      {
        title: "Discovery",
        body: "We interview stakeholders and the people doing the work, and review the systems and data involved.",
      },
      {
        title: "Assessment and shortlist",
        body: "We score opportunities, flag limits such as hallucination risk or missing data, and agree a shortlist with you.",
      },
      {
        title: "Prototype and test",
        body: "We build a small proof of concept for the top candidate and measure it against criteria agreed before the build.",
      },
      {
        title: "Roadmap and handover",
        body: "You receive a written roadmap and governance recommendations, with the option for us to deliver the build or support your team.",
      },
    ],
    tech: ["OpenAI API", "Claude API", "Google Gemini API", "Azure OpenAI", "LangChain", "Python", "Pinecone", "n8n", "Microsoft Copilot"],
    extraFaqs: [
      {
        question: "How do we choose between ChatGPT, Claude and other AI models?",
        answer:
          "It depends on the task, your data handling requirements and running cost. We test shortlisted models on your own examples and compare the results side by side, rather than relying on general benchmarks.",
      },
      {
        question: "Do we need an AI policy for our staff?",
        answer:
          "If staff use AI tools at work, and most already do, a short written policy is worthwhile. It should cover which tools are approved, what data must never be entered and when a person must check the output.",
      },
    ],
  },
};
