# Security & Privacy Notes

Findings from the audit that sit outside the website rebuild itself but need MIDIS's attention.

---

## 🔴 Priority: the Strapi `enquiries` collection is publicly readable

**Finding.** An unauthenticated `GET` to the live CMS endpoint returns stored enquiry records — including enquirer **names, email addresses, phone numbers and message bodies**. No token or session is required. The endpoint is discoverable from the public JavaScript bundle on the current site, which hardcodes the CMS base URL.

**Why it matters.** This is a personal-data exposure. Every lead who has ever used the contact form on midis.in has had their contact details readable by anyone who looks at the site's JavaScript. Depending on where your enquirers are located, this may carry obligations under India's DPDP Act and under GDPR for any EU enquirers.

**It is not caused by this rebuild** — it is the configuration of the existing Strapi instance, and it affects the current live site today.

**How to fix it.** In Strapi admin → *Settings → Users & Permissions → Roles → Public*, for the `Enquiry` collection:

| Permission | Should be |
|---|---|
| `create` | ✅ enabled — the contact form needs it |
| `find` | ❌ **disable** |
| `findOne` | ❌ **disable** |
| `update` / `delete` | ❌ disabled |

Leaving only `create` enabled keeps the contact form working while making the stored records unreadable from outside the admin panel.

**After fixing**, consider whether any enquirers should be notified, and review access logs if Strapi Cloud provides them.

**This rebuild is already compatible with the fix.** Submissions go through a server-side route handler (`src/app/api/enquiry/route.ts`), not from the browser, so if you later restrict `create` as well, adding a `STRAPI_API_TOKEN` to the environment is the only change required — the token stays server-side and never reaches the client.

> I deliberately did not enumerate, download or store the contents of that collection. I confirmed the exposure from the first fragment of a single response and stopped.

---

## Article HTML is sanitised before rendering

Article bodies are stored as raw HTML in Strapi and rendered into the page. Rather than trusting whatever the CMS returns, `src/lib/sanitize.ts` runs every article body through an allow-list server-side before it is injected: normal editorial markup is kept, anything executable is removed, and `javascript:` / `data:` URLs are blocked. External links get `rel="noopener noreferrer"` automatically.

This matters more than usual here because of the permissions finding above — an instance that serves its enquiries collection to anonymous requests is not an instance whose output should be treated as fully trusted. Sanitising is cheap and removes the question. It stays correct after you fix the permissions.

---

## Enquiry form: verify the live submission path before launch

The form posts `{ data: { name, email, phoneNumber, services, message } }` to the existing `enquiries` collection, matching the shape the current site uses. `services` is a strict Strapi enumeration and **some of its values contain trailing spaces** (`"Web development "`, `"Graphic designing "`, `"Content Writing "`); these are sent verbatim because Strapi rejects the whole submission on an unrecognised value.

I validated every failure path locally — missing fields, invalid email, missing consent, honeypot, and rate limiting — but **I did not send a valid test submission**, because that would have created a real lead record in your production inbox.

**Before launch:** submit one genuine test enquiry, confirm it appears in Strapi admin, then delete it.

The form collects more than Strapi stores (business name, website, budget, timeline). Those have no column in the existing schema, so they are appended to `message` as a labelled block — nothing a client types is lost. If you would rather they became proper fields, add them to the Strapi collection and I'll map them directly.

---

## Spam and abuse controls in place

| Control | Behaviour |
|---|---|
| Honeypot | A hidden `companyWebsite` field. If filled, the API returns a success response **without forwarding** — a bot gets no signal that it was detected. |
| Rate limit | 5 submissions per IP per 10 minutes. In-memory, so it resets on redeploy and is per-instance — a speed bump, not a guarantee. Move to a shared store if abuse appears. |
| Validation | Server-side via Zod. The client cannot bypass it, since the browser never talks to Strapi directly. |
| Consent | Explicit checkbox, enforced server-side. |

**No success state is ever shown unless the server confirms the record was stored.** A failed submission shows the error and directs the visitor to email `hello@midis.in` instead.

---

## Privacy pages still to write

`/privacy` and `/terms` are linked from the footer and the contact consent notice but **do not exist yet** (queued for Phase 8). These need real legal content before launch, covering at minimum: what the enquiry form collects, where it is stored (Strapi Cloud), how long it is retained, who it is shared with, and how to request deletion.

Analytics (GA4 and Meta Pixel) are carried over from the current site but are **not yet loaded** in this rebuild — they are wired in Phase 8 behind a consent gate, which is the correct order given the Meta Pixel's tracking profile.
