/**
 * Google PageSpeed Insights integration for the free website audit.
 *
 * The brief and the report are both explicit: never publish simulated
 * results as real analysis. This module therefore has exactly two outcomes —
 * genuine Lighthouse data returned by Google, or a declared failure. There is
 * no code path that estimates, approximates or invents a score, an issue
 * count, a traffic figure or a ranking.
 *
 * PAGESPEED_API_KEY is optional. The API is callable without one but is
 * aggressively rate-limited, so a free key makes the tool reliable rather
 * than making it possible.
 */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type AuditStrategy = "mobile" | "desktop";

export interface AuditCategory {
  id: string;
  label: string;
  /** 0–100, as reported by Lighthouse. */
  score: number;
}

export interface AuditMetric {
  id: string;
  label: string;
  display: string;
  /** Lighthouse's own classification of the value. */
  rating: "good" | "needs-improvement" | "poor" | "unknown";
  explanation: string;
}

export interface AuditOpportunity {
  title: string;
  description: string;
  display: string;
}

export interface AuditSuccess {
  ok: true;
  url: string;
  finalUrl: string;
  strategy: AuditStrategy;
  fetchedAt: string;
  categories: AuditCategory[];
  metrics: AuditMetric[];
  opportunities: AuditOpportunity[];
}

export interface AuditFailure {
  ok: false;
  /** Shown to the visitor verbatim. Always honest about what happened. */
  reason: string;
  /** True when a retry might succeed (rate limit, transient error). */
  retryable: boolean;
}

export type AuditResult = AuditSuccess | AuditFailure;

/**
 * Validates and normalises user input into a public http(s) URL.
 * Returns null when the input cannot be trusted.
 */
export function normaliseAuditUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2000) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();

  // Must look like a real public hostname.
  if (!host.includes(".") || host.endsWith(".")) return null;

  // Reject loopback, private ranges and internal TLDs. Google would refuse
  // these anyway, but failing fast gives a clearer message and avoids
  // bouncing internal hostnames off a third-party service.
  const blocked =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".test") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(":");

  if (blocked) return null;

  url.hash = "";
  return url.toString();
}

const CATEGORY_LABELS: Record<string, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best practices",
  seo: "SEO",
};

const METRIC_EXPLANATIONS: Record<string, string> = {
  "largest-contentful-paint":
    "How long until the main content appears. Visitors judge speed on this one.",
  "cumulative-layout-shift":
    "How much the page jumps around while loading. Causes mis-taps and frustration.",
  "total-blocking-time":
    "How long the page is unresponsive to taps and clicks while scripts run.",
  "first-contentful-paint": "How long until anything at all appears on screen.",
  "speed-index": "How quickly the page visibly fills in.",
  interactive: "How long until the page reliably responds to input.",
};

function ratingFor(score: number | null | undefined): AuditMetric["rating"] {
  if (typeof score !== "number") return "unknown";
  if (score >= 0.9) return "good";
  if (score >= 0.5) return "needs-improvement";
  return "poor";
}

interface LighthouseAudit {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  displayValue?: string;
  details?: { overallSavingsMs?: number; type?: string };
}

export async function runAudit(
  rawUrl: string,
  strategy: AuditStrategy = "mobile",
): Promise<AuditResult> {
  const url = normaliseAuditUrl(rawUrl);
  if (!url) {
    return {
      ok: false,
      retryable: false,
      reason:
        "That doesn't look like a public website address. Enter a full domain, for example yourcompany.com.",
    };
  }

  const params = new URLSearchParams({ url, strategy });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", c);
  }
  if (process.env.PAGESPEED_API_KEY) {
    params.set("key", process.env.PAGESPEED_API_KEY);
  }

  let res: Response;
  try {
    res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      // Lighthouse runs take a while; don't cache a slow analysis per-request.
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(75_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      ok: false,
      retryable: true,
      reason: timedOut
        ? "The analysis took too long to complete. Large or slow sites sometimes time out — it's worth trying again."
        : "We couldn't reach Google's PageSpeed service just now.",
    };
  }

  if (!res.ok) {
    if (res.status === 429) {
      return {
        ok: false,
        retryable: true,
        reason:
          "Google's PageSpeed service is rate-limiting requests right now. Please try again in a few minutes, or request a manual audit below.",
      };
    }
    if (res.status === 400 || res.status === 404) {
      return {
        ok: false,
        retryable: false,
        reason:
          "Google couldn't load that page. Check the address is correct and publicly reachable — sites behind a login or firewall can't be analysed.",
      };
    }
    return {
      ok: false,
      retryable: true,
      reason: "Google's PageSpeed service returned an error. Please try again shortly.",
    };
  }

  let json: {
    lighthouseResult?: {
      finalUrl?: string;
      requestedUrl?: string;
      categories?: Record<string, { id?: string; score?: number | null }>;
      audits?: Record<string, LighthouseAudit>;
    };
  };
  try {
    json = await res.json();
  } catch {
    return { ok: false, retryable: true, reason: "We received an unreadable response from Google." };
  }

  const lh = json.lighthouseResult;
  if (!lh?.categories) {
    return {
      ok: false,
      retryable: true,
      reason: "Google returned no analysis for that page. It may not be publicly reachable.",
    };
  }

  const categories: AuditCategory[] = Object.entries(lh.categories)
    .filter(([, c]) => typeof c.score === "number")
    .map(([id, c]) => ({
      id,
      label: CATEGORY_LABELS[id] ?? id,
      score: Math.round((c.score as number) * 100),
    }));

  // No categories scored means nothing real to show.
  if (categories.length === 0) {
    return {
      ok: false,
      retryable: true,
      reason: "Google completed the request but returned no scores for that page.",
    };
  }

  const audits = lh.audits ?? {};
  const metricIds = [
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "total-blocking-time",
    "first-contentful-paint",
  ];

  const metrics: AuditMetric[] = metricIds
    .map((id) => audits[id])
    .filter((a): a is LighthouseAudit => Boolean(a?.displayValue))
    .map((a) => ({
      id: a.id ?? "",
      label: a.title ?? "",
      display: a.displayValue ?? "",
      rating: ratingFor(a.score),
      explanation: METRIC_EXPLANATIONS[a.id ?? ""] ?? a.description?.split(".")[0] ?? "",
    }));

  // Only real, scored opportunities Lighthouse actually flagged.
  const opportunities: AuditOpportunity[] = Object.values(audits)
    .filter(
      (a) =>
        a.details?.type === "opportunity" &&
        typeof a.score === "number" &&
        a.score < 0.9 &&
        Boolean(a.displayValue),
    )
    .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
    .slice(0, 6)
    .map((a) => ({
      title: a.title ?? "",
      // Lighthouse descriptions carry markdown links; strip to plain text.
      description: (a.description ?? "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim(),
      display: a.displayValue ?? "",
    }));

  return {
    ok: true,
    url,
    finalUrl: lh.finalUrl ?? lh.requestedUrl ?? url,
    strategy,
    fetchedAt: new Date().toISOString(),
    categories,
    metrics,
    opportunities,
  };
}
