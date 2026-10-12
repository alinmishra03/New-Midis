import { SOCIAL_ICON_PATHS, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { site } from "@/content/site";

/**
 * Slim contact bar above the main navigation.
 *
 * Deliberately a server component with no client JavaScript: every element
 * is a plain anchor and every interaction is a CSS transition, so the bar
 * costs nothing on the critical path and works before — and without — any
 * bundle. It also sits in normal document flow rather than being sticky, so
 * it scrolls away and leaves the navigation to pin on its own.
 *
 * Numbers come from content/site.ts and nothing here derives one from
 * another. In particular the WhatsApp link uses `site.whatsapp`, which is a
 * separately recorded field — the US number is not assumed to be reachable
 * on WhatsApp just because it is published next to the Indian one.
 *
 * LAYOUT
 *
 *   < sm   two rows: the numbers, then email and Chat With Us. Four items on
 *          one line do not fit a 320px screen without either shrinking the
 *          smallest type on the site further or hiding a number behind its
 *          country code, and the brief asks for both numbers readable.
 *   sm     one row, contact group centred.
 *   md     socials appear on the left, contact group moves right.
 *   lg     the centred message appears.
 *   xl     the email address spells itself out next to its icon.
 *
 * Each step is a fixed height rather than a wrapping row, because
 * --announce-h in globals.css is the constant the hero subtracts from the
 * viewport. A bar that silently reflowed would put the hero's first screen
 * out by a row's worth of pixels.
 */

/* Shared so every target behaves identically and nothing drifts. */
const linkBase =
  "inline-flex items-center justify-center rounded-full text-surface/65 " +
  "transition-[color,background-color,transform] duration-[var(--dur-fast)] " +
  "ease-[var(--ease-out-expo)] hover:text-accent hover:bg-surface/[0.07] " +
  "focus-visible:text-accent";

/*
 * The accent action. An outline that fills on hover rather than a solid
 * block, so it reads as the primary action in the bar without competing with
 * the solid orange button in the navigation directly below it.
 */
const accentPill =
  "group/wa inline-flex items-center gap-2 rounded-full border border-accent/45 px-3.5 " +
  "text-xs font-medium text-accent transition-[background-color,color,border-color] " +
  "duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
  "hover:border-accent hover:bg-accent hover:text-ink focus-visible:bg-accent focus-visible:text-ink";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.3 9.5h17.4M3.3 14.5h17.4" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2.5" />
      <path d="m3.5 7.5 7.3 5.1a2 2 0 0 0 2.4 0l7.3-5.1" />
    </svg>
  );
}

export function AnnouncementBar() {
  const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    site.whatsappMessage,
  )}`;

  return (
    <div className="announce-bar relative z-[60] border-b border-white/[0.08] bg-ink text-surface">
      <div className="container-site">
        <div className="relative flex h-16 items-center justify-center gap-3 sm:h-11 md:h-10 md:justify-between">
          {/* --------------------------------------------------- socials */}
          {/*
            Hidden below md so the contact actions keep comfortable tap
            targets on a 320px screen. Nothing is lost: the same profiles are
            in the footer on every page.
          */}
          <ul className="hidden items-center gap-0.5 md:flex">
            {site.socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${site.name} on ${s.name}`}
                  className={`${linkBase} h-8 w-8 hover:-translate-y-px`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                    className="h-[0.9rem] w-[0.9rem]"
                    fill="currentColor"
                  >
                    {SOCIAL_ICON_PATHS[s.name]}
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          {/*
            THE BREAKPOINT HERE IS MEASURED, NOT CHOSEN.

            The line is 394px wide and it is centred on the container, so the
            space it needs on the right is half its own width plus the whole
            contact group: 197 + 493 = 690px in each half, meaning 1380px of
            content and about 1520px of viewport. Adding the second phone
            number put the group up from 155px to 493px, which is why this
            used to clear at lg and no longer does — below the threshold the
            two overlapped by as much as 224px.

            Hiding it under the threshold rather than letting it collide is
            the trade the content forces: the numbers are contact actions and
            this is a tagline. See also the email label below, which waits
            even longer for its own reason.
          */}
          <p className="group/globe absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap min-[1540px]:flex">
            <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-accent transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover/globe:rotate-[18deg]" />
            <span className="text-xs leading-none text-surface/70 transition-colors duration-[var(--dur-fast)] group-hover/globe:text-surface/90">
              Based in India. Building Digital Experiences for Clients Worldwide.
            </span>
          </p>

          {/* -------------------------------------------- contact actions */}
          {/* One group, so `justify-between` on the row above puts the whole
              lot opposite the socials instead of spreading it across the
              centred message. */}
          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3 md:gap-4">
            {/* ------------------------------------------------- numbers */}
            <ul className="flex items-center gap-1">
              {site.phoneNumbers.map((number, i) => (
                <li key={number.e164} className="flex items-center">
                  {/* Hairline between the two, not around them. */}
                  {i > 0 && (
                    <span aria-hidden="true" className="mr-1 h-3 w-px bg-surface/15" />
                  )}
                  <a
                    href={`tel:${number.e164}`}
                    aria-label={`Call ${site.name} in ${number.regionName} on ${number.display}`}
                    className={`${linkBase} h-8 gap-1.5 px-2 text-xs`}
                  >
                    {/* A compact dialling label rather than a flag: no image
                        to load, and it stays legible at 10px. */}
                    <span
                      aria-hidden="true"
                      className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-accent/85"
                    >
                      {number.region}
                    </span>
                    <span className="whitespace-nowrap tabular-nums">{number.display}</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* ------------------------------------------ email + WhatsApp */}
            <div className="flex items-center gap-2 sm:gap-1.5">
              <a
                href={`mailto:${site.email}`}
                aria-label={`Email ${site.name} at ${site.email}`}
                className={`${linkBase} h-9 w-9 border border-surface/15 md:h-8 md:w-auto md:gap-2 md:border-transparent md:px-2.5`}
              >
                <MailIcon className="h-4 w-4" />
                {/* Spelling the address out costs another 92px, which the
                    centred line above cannot spare until there is a good deal
                    more room. The icon is labelled either way. */}
                <span className="sr-only text-xs font-medium min-[1800px]:not-sr-only">{site.email}</span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${accentPill} h-9 md:h-7`}
              >
                <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--dur-fast)] group-hover/wa:scale-110" />
                <span className="whitespace-nowrap">Chat With Us</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
