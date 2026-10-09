"use client";

import { useRef, useState } from "react";
import { ArrowRight, Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import {
  CONTACT_INVALID_MESSAGE,
  CONTACT_REQUIRED_MESSAGE,
  classifyContact,
} from "@/lib/contact-value";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const SERVICE_OPTIONS = [
  "Website design",
  "Website development",
  "Website redesign",
  "UI/UX design",
  "E-commerce development",
  "Search engine optimisation",
  "Google & Meta Ads",
  "Graphic design",
  "Content writing",
  "Branding",
  "AI & automation",
  "Something else",
];

type Status = "idle" | "submitting" | "success" | "error";

const ERROR_INK = "#B4231A";

/*
 * One control surface for every field.
 *
 * Height is fixed rather than derived from padding, because a `select` and an
 * `input` with identical padding do not end up the same height — that
 * mismatch was the main thing making the old form look uneven. The textarea
 * opts out of the fixed height and sets its own padding instead.
 *
 * The global :focus-visible outline is suppressed here only because a
 * stronger, field-specific state replaces it: an orange border plus a 3px
 * orange ring, which reads clearly against a white input.
 */
const controlBase =
  "w-full rounded-xl border bg-surface px-4 text-[0.9375rem] text-ink " +
  "placeholder:text-muted/90 transition-[border-color,box-shadow] duration-[var(--dur-fast)] " +
  "ease-[var(--ease-out-expo)] focus:outline-none focus-visible:outline-none " +
  "focus:border-accent focus:ring-[3px] focus:ring-accent/25 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const inputBase = cn(controlBase, "h-12");
const textareaBase = cn(controlBase, "min-h-[9.5rem] resize-y py-3.5 leading-relaxed");

/* Native select arrows differ per platform and break the uniform look, so the
   control is reset and one chevron is drawn in as a background image. */
const selectBase = cn(
  inputBase,
  "cursor-pointer appearance-none bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-11",
);
const SELECT_CHEVRON = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23777777' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
};

const borderFor = (error?: string) => (error ? "border-[#B4231A]" : "border-line");

function Field({
  label,
  children,
  error,
  htmlFor,
  optional,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-2.5 flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-ink"
      >
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-2 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-2 text-sm leading-relaxed"
          style={{ color: ERROR_INK }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm({ defaultIntent }: { defaultIntent?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  /* Fires once, when someone actually starts filling the form in — the
     denominator for the enquiry completion rate. */
  const startedRef = useRef(false);

  function handleFirstInput() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("enquiry_start", { form: isCall ? "strategy_call" : "project" });
  }

  const isCall = defaultIntent === "call";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* Guards against a double submit from a fast second click or an Enter
       keypress landing while the first request is still open. */
    if (status === "submitting") return;

    const form = event.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      contact: String(fd.get("contact") ?? ""),
      website: String(fd.get("website") ?? ""),
      service: String(fd.get("service") ?? ""),
      message: String(fd.get("message") ?? ""),
      consent: fd.get("consent") === "on",
      companyWebsite: String(fd.get("companyWebsite") ?? ""),
    };

    /* Immediate feedback on the one field with a rule a visitor cannot guess.
       The route handler re-validates everything regardless — this only saves
       a round trip, it is never the authority. */
    const contactValue = payload.contact.trim();
    if (!contactValue || !classifyContact(contactValue)) {
      setErrors({
        contact: contactValue ? CONTACT_INVALID_MESSAGE : CONTACT_REQUIRED_MESSAGE,
      });
      setFormError(null);
      setStatus("error");
      form.querySelector<HTMLInputElement>("#contact")?.focus();
      return;
    }

    setStatus("submitting");
    setErrors({});
    setFormError(null);
    trackEvent(isCall ? "call_booking_start" : "enquiry_submit");

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      /* Success is shown only when the server confirms the lead was stored. */
      if (res.ok && json.ok) {
        trackEvent("enquiry_success", { form: isCall ? "strategy_call" : "project" });
        setStatus("success");
        form.reset();
        return;
      }

      trackEvent("enquiry_error", { status: res.status });
      if (json.fieldErrors) setErrors(json.fieldErrors);
      setFormError(json.error ?? "Please check the highlighted fields and try again.");
      setStatus("error");
    } catch {
      trackEvent("enquiry_error", { status: 0 });
      setFormError(
        `We couldn't send that just now. Please email ${site.email} and we'll pick it up straight away.`,
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-8 text-center sm:p-10">
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-ink" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-6 text-2xl tracking-tight text-ink">Enquiry received.</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Thanks — that&apos;s landed with the team. We&apos;ll read it properly and come back to
          you. If it&apos;s urgent, reach us on WhatsApp or call {site.phone}.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-sm text-sm text-accent-ink underline underline-offset-4"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} onInput={handleFirstInput} noValidate>
      {formError && (
        <div
          role="alert"
          className="mb-7 rounded-xl border border-[#E8C4C0] bg-[#FDF3F2] p-4 text-sm leading-relaxed"
          style={{ color: ERROR_INK }}
        >
          {formError}
        </div>
      )}

      {isCall && <input type="hidden" name="service" value="Something else" />}

      {/* Who you are. Two genuinely related fields, so a pair on desktop. */}
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <Field label="Your name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your full name"
            disabled={submitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(inputBase, borderFor(errors.name))}
          />
        </Field>

        {/*
         * One field for either an email address or a phone number, so
         * deliberately NOT type="email" — that would have the browser reject
         * a perfectly good phone number before the form ever sees it.
         * inputMode is left at the default so the keyboard offers both
         * letters and digits.
         */}
        <Field
          label="Email / Phone"
          htmlFor="contact"
          error={errors.contact}
          hint="Either is fine — whichever you'd rather we used."
        >
          <input
            id="contact"
            name="contact"
            type="text"
            required
            autoComplete="email"
            placeholder="Enter your email address or phone number"
            disabled={submitting}
            aria-invalid={Boolean(errors.contact)}
            aria-describedby={errors.contact ? "contact-error" : "contact-hint"}
            className={cn(inputBase, borderFor(errors.contact))}
          />
        </Field>
      </div>

      {/* Context. The service select is absent on the call variant, so the
          website field takes the full row rather than leaving a gap. */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-6">
        <Field
          label="Current website"
          htmlFor="website"
          optional
          error={errors.website}
          className={isCall ? "sm:col-span-2" : undefined}
        >
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            placeholder="yourcompany.com"
            autoComplete="url"
            disabled={submitting}
            aria-invalid={Boolean(errors.website)}
            aria-describedby={errors.website ? "website-error" : undefined}
            className={cn(inputBase, borderFor(errors.website))}
          />
        </Field>

        {!isCall && (
          <Field label="What do you need?" htmlFor="service" optional>
            <select
              id="service"
              name="service"
              defaultValue=""
              disabled={submitting}
              style={SELECT_CHEVRON}
              className={cn(selectBase, "border-line")}
            >
              <option value="">Select a service</option>
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field
        label={isCall ? "What would you like to talk about?" : "Tell us about the project"}
        htmlFor="message"
        error={errors.message}
        className="mt-5 sm:mt-6"
      >
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="What are you trying to achieve, and what's getting in the way?"
          disabled={submitting}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(textareaBase, borderFor(errors.message))}
        />
      </Field>

      {/* Honeypot. Hidden from users, left empty by humans, filled by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="companyWebsite">Do not fill this in</label>
        <input id="companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-7 border-t border-line pt-7">
        <label htmlFor="consent" className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            disabled={submitting}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-[#EF8716]"
          />
          <span>
            I&apos;m happy for MIDIS to use these details to respond to my enquiry. See our{" "}
            <a href="/privacy" className="text-accent-ink underline underline-offset-4">
              privacy policy
            </a>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="mt-2 text-sm" style={{ color: ERROR_INK }}>
            {errors.consent}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
                />
                Sending…
              </>
            ) : (
              <>
                {isCall ? "Request a call" : "Send enquiry"}
                <ArrowRight />
              </>
            )}
          </Button>
          <p aria-live="polite" className="text-xs leading-relaxed text-muted">
            {submitting ? "Sending your enquiry…" : "We read every enquiry personally."}
          </p>
        </div>
      </div>
    </form>
  );
}
