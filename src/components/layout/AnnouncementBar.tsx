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
 * separately recorded field, rather than reusing the phone number on the
 * assumption that the line is WhatsApp-enabled.
 */

/* Shared so every target behaves identically and nothing drifts. */
const linkBase =
  "inline-flex items-center justify-center rounded-full text-surface/65 " +
  "transition-[color,background-color,transform] duration-[var(--dur-fast)] " +
  "ease-[var(--ease-out-expo)] hover:text-accent hover:bg-surface/[0.07] " +
  "focus-visible:text-accent";

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

function PhoneIcon({ className }: { className?: string }) {
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
      <path d="M6.3 3.5h3l1.5 3.8-2 1.4a12 12 0 0 0 5.5 5.5l1.4-2 3.8 1.5v3a1.8 1.8 0 0 1-2 1.8A15.8 15.8 0 0 1 4.5 5.5a1.8 1.8 0 0 1 1.8-2Z" />
    </svg>
  );
}

export function AnnouncementBar() {
  return (
    <div className="announce-bar relative z-[60] border-b border-white/[0.08] bg-ink text-surface">
      <div className="container-site">
        <div className="relative flex h-11 items-center justify-between gap-3 md:h-10">
          {/* --------------------------------------------------- socials */}
          {/*
            Hidden below sm so the three contact actions keep comfortable tap
            targets on a 320px screen. Nothing is lost: the same profiles are
            in the footer on every page, which is what the brief asks for.
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
            Held to lg. The line is 350px wide and the contact group needs
            its own space: at 768px the two measurably collide, and shrinking
            the type to force a fit would make the smallest text on the site
            smaller still. Below lg the bar carries the links alone.
          */}
          <p className="group/globe absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap lg:flex">
            <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-accent transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover/globe:rotate-[18deg]" />
            <span className="text-xs leading-none text-surface/70 transition-colors duration-[var(--dur-fast)] group-hover/globe:text-surface/90">
              Based in India. Building Digital Experiences for Clients Worldwide.
            </span>
          </p>

          {/* -------------------------------------------- contact actions */}
          <div className="flex w-full items-center justify-center gap-2 md:w-auto md:justify-end md:gap-1.5">
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${site.name} on WhatsApp`}
              className={`${linkBase} h-9 w-9 border border-surface/15 md:h-8 md:w-auto md:gap-2 md:border-transparent md:px-2.5`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="sr-only text-xs font-medium xl:not-sr-only">WhatsApp</span>
            </a>

            <a
              href={`mailto:${site.email}`}
              aria-label={`Email ${site.name} at ${site.email}`}
              className={`${linkBase} h-9 w-9 border border-surface/15 md:h-8 md:w-auto md:gap-2 md:border-transparent md:px-2.5`}
            >
              <MailIcon className="h-4 w-4" />
              <span className="sr-only text-xs font-medium xl:not-sr-only">{site.email}</span>
            </a>

            {/*
              A call, not a link to the contact page — the brief is explicit,
              and on a phone this is the shortest path to a human. The accent
              is an outline that fills on hover rather than a solid block, so
              it reads as the primary action here without competing with the
              orange button in the navigation directly below it.
            */}
            <a
              href={`tel:${site.phoneE164}`}
              aria-label={`Call ${site.name} on ${site.phone}`}
              className={
                "group/call inline-flex h-9 items-center gap-2 rounded-full border border-accent/45 px-3.5 " +
                "text-xs font-medium text-accent transition-[background-color,color,border-color] " +
                "duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
                "hover:border-accent hover:bg-accent hover:text-ink focus-visible:bg-accent focus-visible:text-ink md:h-7"
              }
            >
              <PhoneIcon className="h-3.5 w-3.5 transition-transform duration-[var(--dur-fast)] group-hover/call:-rotate-12" />
              <span className="whitespace-nowrap">Contact Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
