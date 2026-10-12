import { clientLogos } from "./client-logos";

/* ==========================================================================
   CLIENTS
   --------------------------------------------------------------------------
   The 18 clients from the MIDIS Client Portfolio & Delivery Overview, as
   supplied by MIDIS on 2026-10-12. Names, URLs and the active/inactive
   markings are from that report; nothing here is inferred from anywhere else.

   TWO SEPARATE FACTS ARE RECORDED PER CLIENT, AND THEY DISAGREE TWICE.

   `reportStatus` is what the report says about the engagement.
   `reachable` is what the URL actually did when it was requested on
   2026-10-12. The brief says not to assume a listed URL is live and not to
   link to a broken site, so the link is driven by `reachable`, not by the
   report — and the two disagreements are recorded rather than reconciled:

     - The Menopause Relief Store is marked Not Active, but the site answers
       200 and serves its own logo. Linked.
     - Mounting Backend Service answers 200, but the page it returns is
       titled "Not Found". Not linked.

   `services` is populated only where the report states it. Four of eighteen
   do, so the rest carry nothing rather than a guess — which is also why
   there is no category filter on the section.

   Logos live in content/client-logos.ts, downloaded from each client's own
   site. A client with no entry there renders as a text treatment, which the
   brief asks for in place of a substitute mark. Nobody is omitted.

   PERMISSION: displaying a client's mark normally needs their written
   permission on file — the ClientLogo type in content/types.ts carries a
   `permissionOnFile` flag for exactly that reason. These are published here
   on MIDIS's instruction of 2026-10-12. Worth confirming before launch.
   ========================================================================== */

export type ClientReportStatus = "active" | "not-active" | "no-website";

export interface Client {
  name: string;
  slug: string;
  /** The URL as given in the report, or null when none was listed. */
  website: string | null;
  /** What the report says about the engagement. */
  reportStatus: ClientReportStatus;
  /** Whether the URL served a usable page on 2026-10-12. */
  reachable: boolean;
  /** Only where the report states it. */
  services?: string;
  /** Recorded where the report and the live check disagree. */
  note?: string;
}

export const clients: readonly Client[] = [
  {
    name: "Mobile Tyre Champions",
    slug: "mobile-tyre-champions",
    website: "https://mobiletyrechampions.com/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "High Spirits",
    slug: "high-spirits",
    website: "https://www.highspirits.au/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "Aureus Hospitality",
    slug: "aureus-hospitality",
    website: "https://www.aureus-hospitality.com/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "Gulf Connect Consultancy",
    slug: "gulf-connect-consultancy",
    website: "https://www.gulfconnectconsultancy.com/",
    reportStatus: "active",
    reachable: true,
    services: "Website Development, Design & Branding",
  },
  {
    name: "Country Kids",
    slug: "country-kids",
    website: "https://www.countrykids.au/",
    reportStatus: "active",
    reachable: true,
    services: "Website Development & Design",
  },
  {
    name: "Solar Spectrum",
    slug: "solar-spectrum",
    website: "https://www.solarspectrum.com.au/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "Cozy&Comfy",
    slug: "cozy-and-comfy",
    website: "https://www.cozyndcomfy.com/",
    reportStatus: "not-active",
    reachable: false,
    note: "Returned HTTP 402 on 2026-10-12 — the store is suspended, so it is not linked.",
  },
  {
    name: "Alinkriti",
    slug: "alinkriti",
    website: "https://alinkriti.com/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "HQB Pro Solutions",
    slug: "hqb-pro-solutions",
    website: "https://hqbprosolutions.com/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "The Menopause Relief Store",
    slug: "menopause-relief-store",
    website: "https://www.themenopausereliefstore.com/",
    reportStatus: "not-active",
    reachable: true,
    note: "Marked Not Active in the report, but the site answered 200 on 2026-10-12 and serves its own logo.",
  },
  {
    name: "SofiSam",
    slug: "sofisam",
    website: "https://sofisam.com/",
    reportStatus: "active",
    reachable: true,
  },
  {
    name: "Mounting Backend Service",
    slug: "mounting-backend-service",
    website: "https://www.mountingbackendservices.com/",
    reportStatus: "active",
    reachable: false,
    note: 'Answers 200 but returns a page titled "Not Found" on 2026-10-12, so it is not linked.',
  },
  {
    name: "Yogshala",
    slug: "yogshala",
    website: null,
    reportStatus: "no-website",
    reachable: false,
  },
  {
    name: "TIV",
    slug: "tiv",
    website: null,
    reportStatus: "no-website",
    reachable: false,
    services: "Logo Design",
  },
  {
    name: "Mars Home Centre",
    slug: "mars-home-centre",
    website: null,
    reportStatus: "not-active",
    reachable: false,
  },
  {
    name: "The Thali Tales",
    slug: "the-thali-tales",
    website: null,
    reportStatus: "no-website",
    reachable: false,
    services: "Social Media & Graphic Design",
  },
  {
    name: "Samrit",
    slug: "samrit",
    website: null,
    reportStatus: "not-active",
    reachable: false,
  },
  {
    name: "Nexus Fundings",
    slug: "nexus-fundings",
    website: "https://www.nexusfundings.com.au/",
    reportStatus: "active",
    reachable: true,
  },
];

/** The mark for a client, or undefined when no authentic asset exists yet. */
export function clientLogo(slug: string) {
  return clientLogos[slug];
}

/** Only linked where the URL actually answered. */
export function clientHref(client: Client): string | null {
  return client.reachable && client.website ? client.website : null;
}

/**
 * Guards the manifest against the client list: a logo installed for a slug
 * nobody lists would never render, and would sit in the repo unexplained.
 */
const orphanLogos = Object.keys(clientLogos).filter((slug) => !clients.some((c) => c.slug === slug));
if (orphanLogos.length > 0) {
  throw new Error(`clients.ts: logo installed for unknown client ${orphanLogos.join(", ")}.`);
}
