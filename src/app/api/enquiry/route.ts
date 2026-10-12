import { NextResponse } from "next/server";
import { z } from "zod";
import { site } from "@/content/site";
import { SERVICE_OPTIONS, type ServiceOption } from "@/lib/service-options";
import {
  CONTACT_INVALID_MESSAGE,
  CONTACT_MAX_LENGTH,
  CONTACT_REQUIRED_MESSAGE,
  classifyContact,
  type ContactKind,
} from "@/lib/contact-value";

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
 * The form collects one combined contact value that may be either an email
 * address or a phone number, and it is routed to whichever column fits: an
 * address to `email`, a number to `phoneNumber`. A phone-only enquiry
 * therefore carries no `email`, so that value is also written into
 * `message` — the lead's only means of contact cannot then be lost to a
 * column Strapi decides to ignore.
 *
 * UNVERIFIED: whether Strapi marks `email` as required. Establishing it means
 * POSTing to the live production CMS, so it has not been assumed either way.
 * If it is required, phone-only submissions are rejected upstream and this
 * route reports that honestly — a 502 and "email us instead" — rather than
 * showing success for a lead that never landed.
 *
 * The other fields this form collects (website, service) have no column in
 * that schema, so they are appended to `message` as a structured block.
 * Nothing the client types is discarded.
 */

/*
 * The live `services` enumeration, quoted verbatim from the ValidationError
 * Strapi returns when given a value outside it:
 *
 *   "services must be one of the following values: Web development ,
 *    Graphic designing , Digital Marketing, Seo Optimisation,
 *    Content Writing , Brand Identity, "
 *
 * Two things in there are easy to get wrong. The trailing spaces in some
 * values are part of the stored value and must be sent as-is. And the list
 * ends with the EMPTY STRING, not with "Other" — "Other" is rejected, which
 * is why it is not here. The empty value is the correct catch-all, and the
 * visitor's actual request is never lost: it is written into `message`.
 */
const STRAPI_SERVICE_VALUES = [
  "Web development ",
  "Graphic designing ",
  "Digital Marketing",
  "Seo Optimisation",
  "Content Writing ",
  "Brand Identity",
  "",
] as const;

/** The catch-all Strapi actually accepts for anything unmapped. */
const STRAPI_SERVICE_FALLBACK = "" as const;

type StrapiService = (typeof STRAPI_SERVICE_VALUES)[number];

const ALLOWED_SERVICES: ReadonlySet<string> = new Set(STRAPI_SERVICE_VALUES);

/**
 * Guards against a mapping drifting out of sync with the CMS enumeration.
 * Strapi rejects the WHOLE submission on an unknown enum value — it is not
 * lenient and it does not ignore the field — so anything unmapped becomes the
 * empty value it does accept, and the precise request survives in `message`.
 */
function toStrapiService(value: string | undefined): StrapiService {
  /* The incoming value is whatever was posted, so it is looked up as a plain
     string rather than a ServiceOption — an unknown one must resolve to the
     fallback, not fail to compile. */
  const lookup: Record<string, StrapiService | undefined> = SERVICE_MAP;
  const mapped = lookup[value ?? ""];

  return mapped !== undefined && ALLOWED_SERVICES.has(mapped)
    ? mapped
    : STRAPI_SERVICE_FALLBACK;
}

/** Maps the form's service options onto the values Strapi will accept. */
const SERVICE_MAP: Record<ServiceOption, StrapiService> = {
  "Website design": "Web development ",
  "Website development": "Web development ",
  "Website redesign": "Web development ",
  "UI/UX design": "Web development ",
  "E-commerce development": "Web development ",
  "Shopify development": "Web development ",
  "Search engine optimisation": "Seo Optimisation",
  "Google & Meta Ads": "Digital Marketing",
  "Graphic design": "Graphic designing ",
  "Content writing": "Content Writing ",
  Branding: "Brand Identity",
  /* No column fits these, so they ride along in `message` instead. */
  "AI chatbot development": STRAPI_SERVICE_FALLBACK,
  "AI & automation": STRAPI_SERVICE_FALLBACK,
  "Something else": STRAPI_SERVICE_FALLBACK,
};

/**
 * The option list and this map are the same contract seen from two sides, and
 * an option with no mapping would silently file a lead under the empty
 * catch-all. `Record<ServiceOption, …>` makes TypeScript require an entry for
 * every option; this checks the same thing at runtime, in case the list is
 * ever widened from data rather than a literal.
 */
const unmappedOptions = SERVICE_OPTIONS.filter((option) => !(option in SERVICE_MAP));
if (unmappedOptions.length > 0) {
  throw new Error(
    `api/enquiry: no Strapi mapping for ${unmappedOptions.join(", ")}. ` +
      `Add entries to SERVICE_MAP or remove them from lib/service-options.`,
  );
}

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
  /**
   * One field accepting either an email address or a phone number, validated
   * with the same rule the browser uses (lib/contact-value) so a value the
   * form accepted is never rejected here for a different reason.
   */
  contact: text(
    z
      .string()
      .trim()
      .min(1, CONTACT_REQUIRED_MESSAGE)
      .max(CONTACT_MAX_LENGTH, CONTACT_INVALID_MESSAGE)
      .refine((v) => classifyContact(v) !== null, CONTACT_INVALID_MESSAGE),
  ),
  website: optionalText(300),
  service: optionalText(80),
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

function buildMessage(
  d: z.infer<typeof EnquirySchema>,
  contactKind: ContactKind,
  contactValue: string,
): string {
  const extras = [
    /* Phone-only enquiries carry no address in `email`, so the number is
       repeated here as the backstop that keeps the lead contactable. */
    contactKind === "phone" && `Contact number: ${contactValue}`,
    d.website && `Website: ${d.website}`,
    d.service && `Service requested: ${d.service}`,
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

  /* Non-null: the schema already refused anything classifyContact rejects. */
  const contact = classifyContact(data.contact)!;

  const body = {
    data: {
      name: data.name,
      /* Omitted rather than invented for a phone-only enquiry. A synthetic
         address would sit in the team's inbox looking like a real one. */
      ...(contact.kind === "email" ? { email: contact.value } : {}),
      phoneNumber: contact.kind === "phone" ? contact.value : "Not provided",
      services: toStrapiService(data.service),
      message: buildMessage(data, contact.kind, contact.value),
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
