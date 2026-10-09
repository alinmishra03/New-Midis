"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useConsent } from "@/lib/use-consent";
import { site } from "@/content/site";

/**
 * Floating WhatsApp button, bottom right of every page.
 *
 * The number comes from `site.whatsapp`, which is recorded separately from
 * the phone number precisely so a line is never assumed to be WhatsApp-
 * enabled just because it is the one on the contact page.
 *
 * THE COOKIE BANNER
 *
 * That banner is `fixed inset-x-0 bottom-0` at z-60 — the same corner, full
 * width, and a different height at every breakpoint. The button used to
 * wait for it to be dismissed, which was the wrong trade: the banner does
 * not time out, so a visitor who simply ignores it never saw the button at
 * all. It now rides above the banner instead, offset by the banner's
 * measured height and dropping back into the corner once it goes.
 *
 * The height is measured rather than hard-coded because the banner's is set
 * by its copy and wraps differently at every width — any constant written
 * here would be wrong the first time that copy changed. If the banner is
 * ever restructured and cannot be found, the offset stays zero and the
 * button simply sits in its usual place.
 *
 * THE MOBILE DRAWER
 *
 * The button sits at z-35, below the drawer at z-40. A floating button
 * hovering on top of an open navigation menu is the usual outcome here; the
 * lower index means the drawer covers it instead. Everything in the page
 * flow is unpositioned, so z-35 is still above all content.
 */

/* WhatsApp's own green. Scoped to this button rather than added to the
   palette — it belongs to WhatsApp's brand, not to MIDIS's. */
const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_GREEN_DARK = "#1DA851";

const MESSAGE = "Hello MIDIS, I'd like to discuss a project with your team.";

/** The banner names itself through this id for its own aria-labelledby. */
const CONSENT_BANNER = '[aria-labelledby="consent-title"]';

export function FloatingWhatsApp() {
  const consent = useConsent();
  const [bannerHeight, setBannerHeight] = useState(0);

  useEffect(() => {
    /* Only the unanswered banner occupies the corner. */
    if (consent !== "unset") return;

    const banner = document.querySelector<HTMLElement>(CONSENT_BANNER);
    if (!banner) return;

    /*
     * ResizeObserver reports the current size as soon as it starts
     * observing, so the first measurement arrives through the same callback
     * as every later one — no synchronous setState in the effect body, and
     * no separate code path for the initial read. The banner reflows when
     * the viewport changes width and its copy rewraps, which is why it is
     * watched rather than measured once.
     */
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.borderBoxSize?.[0];
        setBannerHeight(Math.ceil(box ? box.blockSize : entry.contentRect.height));
      }
    });
    observer.observe(banner);

    return () => observer.disconnect();
  }, [consent]);

  /* Derived rather than stored: once the banner is answered there is
     nothing to clear up, and the button drops back on the next render. */
  const lift = consent === "unset" ? bannerHeight : 0;

  const href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <div
      className="floating-whatsapp pointer-events-none fixed bottom-0 right-0 z-[35]"
      style={{ "--wa-lift": `${lift}px` } as CSSProperties}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${site.name} on WhatsApp`}
        className={
          "group/wa pointer-events-auto relative flex h-[3.25rem] w-[3.25rem] items-center justify-center " +
          "rounded-full text-white shadow-[0_6px_20px_-4px_rgba(23,25,28,0.35)] " +
          "transition-[transform,box-shadow,background-color] duration-[var(--dur-fast)] " +
          "ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:scale-[1.04] " +
          "hover:shadow-[0_12px_30px_-6px_rgba(23,25,28,0.45)] active:scale-[0.97] sm:h-14 sm:w-14"
        }
        style={{ backgroundColor: WHATSAPP_GREEN }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = WHATSAPP_GREEN_DARK)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = WHATSAPP_GREEN)}
      >
        <WhatsAppIcon className="h-7 w-7 sm:h-[1.85rem] sm:w-[1.85rem]" />

        {/*
          Desktop only. On a touch device there is no hover, so a tooltip
          would either never show or show stuck after a tap.
        */}
        <span aria-hidden="true" className="floating-whatsapp-tip hidden sm:block">
          Chat with us
        </span>
      </a>
    </div>
  );
}
