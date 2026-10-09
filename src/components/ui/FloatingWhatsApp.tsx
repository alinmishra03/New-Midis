"use client";

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
 * TWO DELIBERATE PIECES OF BEHAVIOUR:
 *
 * 1. It waits for the cookie banner. That banner is `fixed inset-x-0
 *    bottom-0` at z-60 — the same corner, full width, and a different height
 *    on every breakpoint. Offsetting the button above it would mean
 *    hard-coding a height that is wrong the moment the banner's copy
 *    changes, so the button simply does not appear until the visitor has
 *    answered. That is one dismissal, once, and it is the only way the two
 *    genuinely cannot collide.
 *
 * 2. It sits at z-35, below the mobile drawer at z-40. A floating button
 *    hovering on top of an open navigation menu is the usual outcome here,
 *    and the lower index means the drawer covers it instead. Everything in
 *    the page flow is unpositioned, so z-35 is still above all content.
 *
 * Nothing about it is rendered on the server: the consent state is
 * localStorage, so `useConsent` reports "unset" during SSR and the button
 * fades in after hydration. It is an affordance, not content, and the
 * contact details are reachable from the announcement bar and the footer
 * regardless.
 */

/* WhatsApp's own green. Scoped to this button rather than added to the
   palette — it belongs to WhatsApp's brand, not to MIDIS's. */
const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_GREEN_DARK = "#1DA851";

const MESSAGE = "Hello MIDIS, I'd like to discuss a project with your team.";

export function FloatingWhatsApp() {
  const consent = useConsent();

  /* The cookie banner owns this corner until it is answered. */
  if (consent === "unset") return null;

  const href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <div className="floating-whatsapp pointer-events-none fixed bottom-0 right-0 z-[35] p-5 sm:p-6">
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
