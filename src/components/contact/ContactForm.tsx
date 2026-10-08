"use client";

import { useRef, useState } from "react";
import { ArrowRight, Button } from "@/components/ui/Button";
import { site } from "@/content/site";
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

const BUDGET_OPTIONS = [
  "Not sure yet",
  "Under ₹1,00,000",
  "₹1,00,000 – ₹3,00,000",
  "₹3,00,000 – ₹8,00,000",
  "₹8,00,000+",
];

const TIMELINE_OPTIONS = ["As soon as possible", "1–3 months", "3–6 months", "Just exploring"];

type Status = "idle" | "submitting" | "success" | "error";

const fieldBase =
  "w-full rounded-xl border bg-surface px-4 py-3.5 text-[0.9375rem] text-ink " +
  "placeholder:text-muted transition-colors focus:border-accent focus:outline-none " +
  "focus-visible:outline-none";

function Field({
  label,
  children,
  error,
  htmlFor,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-sm text-[#B4231A]">
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
    setStatus("submitting");
    setErrors({});
    setFormError(null);
    trackEvent(isCall ? "call_booking_start" : "enquiry_submit");

    const form = event.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company: String(fd.get("company") ?? ""),
      website: String(fd.get("website") ?? ""),
      service: String(fd.get("service") ?? ""),
      budget: String(fd.get("budget") ?? ""),
      timeline: String(fd.get("timeline") ?? ""),
      message: String(fd.get("message") ?? ""),
      consent: fd.get("consent") === "on",
      companyWebsite: String(fd.get("companyWebsite") ?? ""),
    };

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      /* Success is shown only when the server confirms the lead was stored. */
      if (res.ok && json.ok) {
        /* Only counted once the server confirms the lead was stored. */
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
      <div
        role="status"
        className="rounded-2xl border border-line bg-surface p-10 text-center"
      >
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
          className="mt-6 text-sm text-accent-ink underline underline-offset-4"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={handleFirstInput}
      noValidate
      className="space-y-6"
    >
      {formError && (
        <div role="alert" className="rounded-xl border border-[#E8C4C0] bg-[#FDF3F2] p-4 text-sm text-[#B4231A]">
          {formError}
        </div>
      )}

      {isCall && (
        <input type="hidden" name="service" value="Something else" />
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(fieldBase, errors.name ? "border-[#B4231A]" : "border-line")}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cn(fieldBase, errors.email ? "border-[#B4231A]" : "border-line")}
          />
        </Field>

        <Field label="Phone or WhatsApp" htmlFor="phone" optional error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={cn(fieldBase, "border-line")}
          />
        </Field>

        <Field label="Business name" htmlFor="company" optional error={errors.company}>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            className={cn(fieldBase, "border-line")}
          />
        </Field>

        <Field label="Current website" htmlFor="website" optional error={errors.website}>
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            placeholder="yourcompany.com"
            autoComplete="url"
            className={cn(fieldBase, "border-line")}
          />
        </Field>

        {!isCall && (
          <Field label="What do you need?" htmlFor="service" optional>
            <select id="service" name="service" className={cn(fieldBase, "border-line")} defaultValue="">
              <option value="">Select a service</option>
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Budget range" htmlFor="budget" optional>
          <select id="budget" name="budget" className={cn(fieldBase, "border-line")} defaultValue="">
            <option value="">Select a range</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Timeline" htmlFor="timeline" optional>
          <select id="timeline" name="timeline" className={cn(fieldBase, "border-line")} defaultValue="">
            <option value="">Select a timeline</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={isCall ? "What would you like to talk about?" : "Tell us about the project"}
        htmlFor="message"
        error={errors.message}
      >
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="What are you trying to achieve, and what's getting in the way?"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(fieldBase, "resize-y", errors.message ? "border-[#B4231A]" : "border-line")}
        />
      </Field>

      {/* Honeypot. Hidden from users, left empty by humans, filled by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="companyWebsite">Do not fill this in</label>
        <input id="companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="consent" className="flex items-start gap-3 text-sm text-muted">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={Boolean(errors.consent)}
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
          <p role="alert" className="mt-2 text-sm text-[#B4231A]">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"}>
          {status === "submitting" ? (
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
        <p aria-live="polite" className="text-xs text-muted">
          {status === "submitting" ? "Sending your enquiry…" : "We read every enquiry personally."}
        </p>
      </div>
    </form>
  );
}
