import { NextResponse } from "next/server";
import { z } from "zod";
import { site } from "@/content/site";

/**
 * Enquiry submission proxy.
 *
 * Posts to the EXISTING MIDIS Strapi instance so leads land in the same inbox
 * the team already monitors. Proxying server-side rather than calling Strapi
 * from the browser lets us validate input, apply a honeypot and rate limit,
 * and keep any future API token off the client.
 *
 * The Strapi `enquiries` collection accepts exactly five fields:
 *   name, email, phoneNumber, services, message
 * and `services` is a strict enumeration. Both were confirmed against the
 * live endpoint during the audit — note the trailing spaces in some enum
 * values; they are part of the stored value and must be sent verbatim.
 *
 * The richer fields this form collects (company, website, budget, timeline)
 * have no column in that schema, so they are appended to `message` as a
 * structured block. Nothing the client types is discarded.
 */

const STRAPI_SERVICE_VALUES = [
  "Web development ",
  "Graphic designing ",
  "Digital Marketing",
  "Seo Optimisation",
  "Content Writing ",
  "Brand Identity",
  "Other",
] as const;

type StrapiService = (typeof STRAPI_SERVICE_VALUES)[number];

const ALLOWED_SERVICES: ReadonlySet<string> = new Set(STRAPI_SERVICE_VALUES);

/**
 * Guards against a mapping drifting out of sync with the CMS enumeration.
 * Strapi rejects the whole submission on an unknown enum value, so an unknown
 * value falls back to "Other" and the precise request survives in `message`.
 */
function toStrapiService(value: string | undefined): StrapiService {
  const mapped = SERVICE_MAP[value ?? ""];
  return mapped && ALLOWED_SERVICES.has(mapped) ? mapped : "Other";
}

/** Maps the form's service options onto the values Strapi will accept. */
const SERVICE_MAP: Record<string, StrapiService> = {
  "Website design": "Web development ",
  "Website development": "Web development ",
  "Website redesign": "Web development ",
  "UI/UX design": "Web development ",
  "E-commerce development": "Web development ",
  "Search engine optimisation": "Seo Optimisation",
  "Google & Meta Ads": "Digital Marketing",
  "Graphic design": "Graphic designing ",
  "Content writing": "Content Writing ",
  "Branding": "Brand Identity",
  "AI & automation": "Other",
  "Something else": "Other",
};

export const SERVICE_OPTIONS = Object.keys(SERVICE_MAP);

/**
 * Normalises a missing value to an empty string before validating, so an
 * absent field produces the same human-readable message as an empty one
 * rather than leaking a raw type error like
 * "Invalid input: expected string, received undefined".
 */
const text = (schema: z.ZodType<string>) =>
  z.preprocess((v) => (v == null ? "" : v), schema);

const optionalText = (max: number) =>
  z.preprocess((v) => (v == null ? "" : v), z.string().trim().max(max));

const EnquirySchema = z.object({
  name: text(z.string().trim().min(2, "Please enter your name").max(120)),
  email: text(
    z
      .string()
      .trim()
      .min(1, "Please enter your email address")
      .email("Please enter a valid email address")
      .max(200),
  ),
  phone: optionalText(40),
  company: optionalText(160),
  website: optionalText(300),
  service: optionalText(80),
  budget: optionalText(80),
  timeline: optionalText(80),
  message: text(
    z.string().trim().min(10, "Please tell us a little about the project").max(5000),
  ),
  consent: z.literal(true, { message: "Please accept the privacy notice" }),
  /**
   * Honeypot. Accepted by the schema so that a filled value reaches the
   * handler, which then returns a success response WITHOUT forwarding —
   * giving a bot no signal that it was detected. Rejecting here with a 400
   * would tell it exactly which field gave it away.
   */
  companyWebsite: optionalText(500),
});

/**
 * Minimal in-memory rate limit. Resets on redeploy and is per-instance, so it
 * is a speed bump rather than a guarantee — adequate alongside the honeypot
 * for a marketing form. Swap for a shared store if abuse becomes an issue.
 */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function buildMessage(d: z.infer<typeof EnquirySchema>): string {
  const extras = [
    d.company && `Business: ${d.company}`,
    d.website && `Website: ${d.website}`,
    d.service && `Service requested: ${d.service}`,
    d.budget && `Budget: ${d.budget}`,
    d.timeline && `Timeline: ${d.timeline}`,
  ].filter(Boolean);

  return extras.length ? `${d.message}\n\n---\n${extras.join("\n")}` : d.message;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again shortly, or email us directly." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = EnquirySchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  // Silently accept bot submissions so they get no signal, but never forward.
  if (data.companyWebsite) {
    return NextResponse.json({ ok: true });
  }

  const body = {
    data: {
      name: data.name,
      email: data.email,
      phoneNumber: data.phone || "Not provided",
      services: toStrapiService(data.service),
      message: buildMessage(data),
    },
  };

  try {
    const res = await fetch(`${site.cms.baseUrl}${site.cms.enquiries}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(process.env.STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      // Never report success for a submission that did not land.
      console.error("Strapi enquiry rejected:", res.status, await res.text().catch(() => ""));
      return NextResponse.json(
        {
          ok: false,
          error: `We couldn't send that just now. Please email ${site.email} and we'll pick it up straight away.`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Enquiry submission failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: `We couldn't send that just now. Please email ${site.email} and we'll pick it up straight away.`,
      },
      { status: 502 },
    );
  }
}
