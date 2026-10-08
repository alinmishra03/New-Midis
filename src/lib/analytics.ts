/**
 * Consent-gated analytics.
 *
 * Nothing is loaded and no event is sent until the visitor explicitly accepts.
 * The default is "denied" — declining is the privacy-preserving option and is
 * what happens if the visitor ignores the banner entirely.
 *
 * `trackEvent` is safe to call from anywhere: without consent it is a no-op,
 * so components never need to check first.
 */

export const CONSENT_KEY = "midis_consent";

export type ConsentState = "granted" | "denied" | "unset";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
  }
}

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unset";
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    // Private mode, blocked storage — treat as undecided, track nothing.
    return "unset";
  }
}

export function writeConsent(state: Exclude<ConsentState, "unset">) {
  try {
    window.localStorage.setItem(CONSENT_KEY, state);
  } catch {
    /* Storage unavailable — the choice applies to this page view only. */
  }
  window.dispatchEvent(new CustomEvent("midis:consent", { detail: state }));
}

/**
 * Conversion and interaction events.
 *
 * Named for what they mean commercially rather than where they sit, so the
 * reporting answers business questions: how many people started an enquiry,
 * how many finished, which CTAs produced them.
 */
export type TrackedEvent =
  | "cta_click"
  | "enquiry_start"
  | "enquiry_submit"
  | "enquiry_success"
  | "enquiry_error"
  | "call_booking_start"
  | "audit_submit"
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "project_view"
  | "article_view";

export function trackEvent(event: TrackedEvent, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted") return;

  try {
    window.gtag?.("event", event, params);

    // Meta's standard event for a completed enquiry; everything else is custom.
    if (event === "enquiry_success") {
      window.fbq?.("track", "Lead", params);
    } else {
      window.fbq?.("trackCustom", event, params);
    }
  } catch {
    /* Analytics must never break the page. */
  }
}
