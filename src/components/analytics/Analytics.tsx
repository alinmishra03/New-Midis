"use client";

import Script from "next/script";
import { CONSENT_KEY, writeConsent } from "@/lib/analytics";
import { useConsent } from "@/lib/use-consent";
import { site } from "@/content/site";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Loads GA4 and the Meta Pixel, but only once consent has been granted.
 *
 * Both scripts are mounted conditionally rather than loaded-and-disabled, so
 * a visitor who declines never contacts Google or Meta at all. GA4 Consent
 * Mode is also initialised denied-by-default, which covers the window before
 * the visitor chooses and means a later grant is handled correctly.
 */
export function Analytics() {
  const consent = useConsent();

  if (consent !== "granted") return null;

  return (
    <>
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied'
              });
              gtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

/**
 * Consent banner.
 *
 * Declining is as easy as accepting — the two buttons carry equal weight, and
 * dismissing without choosing leaves tracking off. No dark patterns.
 */
export function ConsentBanner() {
  const consent = useConsent();

  // Nothing to configure means nothing to consent to.
  if (!GA4_ID && !PIXEL_ID) return null;
  if (consent !== "unset") return null;

  function choose(state: "granted" | "denied") {
    writeConsent(state);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-5 shadow-[0_8px_40px_rgba(23,25,28,0.12)] sm:p-6">
          <h2 id="consent-title" className="text-base font-semibold tracking-tight text-ink">
            Can we measure how this site is used?
          </h2>
          <p id="consent-body" className="mt-2 text-sm leading-relaxed text-muted">
            We&apos;d like to use Google Analytics and the Meta Pixel to understand which pages
            are useful. Decline and we won&apos;t load them at all — the site works exactly the
            same either way. See our{" "}
            <a href="/privacy" className="text-accent-ink underline underline-offset-4">
              privacy policy
            </a>
            .
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => choose("granted")}
              className="h-11 rounded-full bg-accent px-6 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-ink hover:text-surface"
            >
              Accept analytics
            </button>
            <button
              type="button"
              onClick={() => choose("denied")}
              className="h-11 rounded-full border border-ink/20 px-6 text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-surface"
            >
              Decline
            </button>
          </div>

          <p className="mt-4 text-xs text-muted">
            Essential functionality — including the enquiry form — never requires cookies. Questions:{" "}
            <a href={`mailto:${site.email}`} className="underline underline-offset-4">
              {site.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Lets visitors change their mind later. Rendered in the footer. */
export function ConsentReset() {
  const consent = useConsent();

  if (!GA4_ID && !PIXEL_ID) return null;
  if (consent === "unset") return null;

  return (
    <button
      type="button"
      onClick={() => {
        try {
          window.localStorage.removeItem(CONSENT_KEY);
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent("midis:consent", { detail: "unset" }));
        // Declining after accepting must actually stop collection.
        window.location.reload();
      }}
      /* Matches the footer bottom bar it renders in: AA contrast (6.06:1)
         and a >=24px tap target. */
      className="inline-block py-1.5 text-xs text-surface/55 underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-accent hover:underline"
    >
      Cookie settings
    </button>
  );
}
