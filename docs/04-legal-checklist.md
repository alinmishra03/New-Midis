# Legal & Compliance Checklist

`/privacy` and `/terms` now exist, so the contact form's consent link is no longer broken. **Both are `noindex` until you confirm them.**

## Why these pages were written this way

I said earlier I wouldn't invent legal text on your behalf, and I haven't. The distinction that resolved it:

- **What this website does with data is a fact**, and I'm the best-placed party to describe it accurately — I built every integration. The processing description, the third-party list and the cookie table are all derived from what the code actually does.
- **Retention periods, governing law and the registered entity name are business decisions.** I cannot assert those, so they live in `src/content/legal.ts` with honest placeholders for you to set.

The result is a policy that is accurate about the implementation and explicit about what still needs your input — rather than either a 404 or a generic template that describes a website you don't have.

---

## Before launch

### 1. Fill in the business decisions

In `src/content/legal.ts`:

| Field | Current value | What it needs |
|---|---|---|
| `legalEntityName` | `"MIDIS"` | Your registered company name, if different from the trading name |
| `retentionPeriod` | A general description | How long you actually keep enquiry data. Pick a period you can defend and honour |
| `privacyContactEmail` | `hello@midis.in` | A dedicated address if you prefer |
| `governingLaw` | `"India"` | Confirm, especially if you contract with overseas clients |
| `lastUpdated` | `8 October 2026` | Update when the text changes |

### 2. Fix the Strapi permissions first

See [`03-security-and-privacy.md`](03-security-and-privacy.md). Publishing a privacy policy while the enquiries collection is readable by anyone would be stating something that isn't true. **Fix the permissions, then publish the policy.**

### 3. Have someone qualified review both pages

I'm not a lawyer and this is not legal advice. The pages are a well-informed, accurate starting point — they still need review by someone who can advise on your obligations, particularly:

- India's **DPDP Act** requirements, including whether you need a published grievance officer
- **GDPR**, if you have EU clients or visitors — lawful basis, data-subject rights, international transfer basis for Strapi Cloud / Google / Meta
- Whether your client contracts require anything specific in the public terms

### 4. Set `reviewed: true`

This single flag:

- Removes `noindex` from both pages
- Adds them to `sitemap.xml`

Leave it `false` until step 3 is genuinely done.

---

## What the consent system does

| Behaviour | Status |
|---|---|
| Default state | **Denied.** Nothing loads until the visitor accepts |
| Declining | Equal visual weight to accepting. No dark patterns |
| Ignoring the banner | Treated as declined |
| If declined | GA4 and Meta Pixel are **never requested** — verified: zero references in the HTML |
| GA4 Consent Mode v2 | Initialised denied, updated on grant |
| Changing their mind | "Cookie settings" in the footer, which reloads to stop collection |
| Blocked localStorage | Treated as undecided; nothing is tracked |
| Other tabs | Kept in sync via the `storage` event |

This is a material change from the current midis.in, which loads **both** GA4 and the Meta Pixel unconditionally on every page with no consent mechanism at all.

### Events tracked (only with consent)

`cta_click` · `enquiry_start` · `enquiry_submit` · `enquiry_success` · `enquiry_error` · `call_booking_start` · `audit_submit` · `whatsapp_click` · `phone_click` · `email_click` · `project_view` · `article_view`

`enquiry_start` fires on first interaction with the form and `enquiry_success` only when the server confirms the lead was stored — so the completion rate between them is a real number, not an estimate. `enquiry_success` is also sent to Meta as the standard `Lead` event.

---

## Still outstanding

| Item | Why it matters |
|---|---|
| Fix Strapi `enquiries` permissions | Active personal-data exposure on the live site |
| Confirm retention period | Required by the policy, and you need to actually honour it |
| Legal review of both pages | See step 3 |
| Decide on a grievance officer | May be required under the DPDP Act |
| `PAGESPEED_API_KEY` | Unrelated to legal, but still blocking the audit tool |
