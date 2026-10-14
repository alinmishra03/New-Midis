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
 * separately recorded field — a line is never assumed to be reachable on
 * WhatsApp just because it is published in this bar.
 *
 * LAYOUT
 *
 *   < sm   one row spanning the bar: the email icon and the number paired
 *          at the left edge, and the WhatsApp icon pushed to the right one.
 *          The pair reads as the two ways to reach MIDIS directly and the
 *          accent square sits apart from them as the one action.
 *   sm     one row, contact group centred, WhatsApp back to a labelled pill.
 *   md     socials appear on the left, contact group moves right.
 *   xl     the centred message appears.
 *   1800   the email address spells itself out next to its icon.
 *
 * Each step is a fixed height rather than a wrapping row, because
 * --announce-h in globals.css is the constant the hero subtracts from the
 * viewport. A bar that silently reflowed would put the hero's first screen
 * out by a row's worth of pixels.
 */

/*
 * What the bar publishes.
 *
 * The Indian line only: the US number is withheld at every width for now, on
 * instruction from MIDIS (2026-10-14). It stays in content/site.ts, which is
 * the record of every published line — this filter is the single place that
 * decides what the bar shows, so putting the number back is one line here
 * and nothing to re-source. It matches on `site.phoneE164` rather than on the
 * region label, which keeps it tied to the same primary line the schema, the
 * footer and the contact page quote.
 */
const barNumbers = site.phoneNumbers.filter((n) => n.e164 === site.phoneE164);

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
 *
 * Horizontal padding and radius are set at the call site rather than here,
 * because below sm this is a box rather than a pill and wants both of them
 * different.
 */
const accentPill =
  "group/wa inline-flex items-center gap-2 rounded-full border border-accent/45 " +
  "text-xs font-medium leading-none text-accent " +
  "transition-[background-color,color,border-color] " +
  "duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] " +
  "hover:border-accent hover:bg-accent hover:text-ink focus-visible:bg-accent focus-visible:text-ink";

/*
 * The three boxes below sm.
 *
 * This is what makes them read as boxes rather than as loose icons: one
 * height and one radius shared by all three, so the two square ones and the
 * wide one in the middle sit on the same line and look like one set. Width
 * and padding differ per box and are set at each call site. Above sm none of
 * it applies and the bar is the pill row it has always been.
 */
const BOX_MOBILE = "max-sm:h-9 max-sm:rounded-[0.625rem]";

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

/*
 * Stands in for the dialling label below sm, where the number has a row to
 * itself and a bare "IN" beside it reads as a stray fragment rather than as
 * a call action.
 */
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
      <path d="M7.05 3.75H5.4a1.65 1.65 0 0 0-1.65 1.8 18.6 18.6 0 0 0 4.62 10.23 17.1 17.1 0 0 0 5.4 3.66 1.65 1.65 0 0 0 1.95-.45l1.08-1.29a1.2 1.2 0 0 0-.21-1.74l-2.19-1.56a1.2 1.2 0 0 0-1.56.15l-.78.78a13.8 13.8 0 0 1-4.08-4.08l.78-.78a1.2 1.2 0 0 0 .15-1.56L7.95 4.2a1.2 1.2 0 0 0-.9-.45Z" />
    </svg>
  );
}

export function AnnouncementBar() {
  const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    site.whatsappMessage,
  )}`;

  return (
    <div className="announce-bar relative z-[60] border-b border-white/[0.08] bg-ink text-surface">
      {/* 12px of gutter below sm rather than the container's 20px. The two
          boxes need 276px of the 320px screen at their smallest, and the
          8px they win back on each side is the difference between slack and
          none. From sm the site gutter applies as it does everywhere else. */}
      <div className="container-site max-sm:px-3">
        <div className="relative flex h-12 items-center justify-center gap-3 sm:h-11 md:h-10 md:justify-between">
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
            room it needs on the right is half its own width plus the whole
            contact group: 197 + 303 = 500px in each half. At xl each half is
            582px; at the step below it only 466px, which is why this clears
            at xl and not at lg.

            It used to wait until 1540px because the US number put the
            contact group up to 493px. Dropping that number is what lets the
            tagline come back down two steps, and the number returning is
            what would push it back up.
          */}
          <p className="group/globe absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap xl:flex">
            <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-accent transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover/globe:rotate-[18deg]" />
            <span className="text-xs leading-none text-surface/70 transition-colors duration-[var(--dur-fast)] group-hover/globe:text-surface/90">
              Based in India. Building Digital Experiences for Clients Worldwide.
            </span>
          </p>

          {/* -------------------------------------------- contact actions */}
          {/*
            One group, so `justify-between` on the row above puts the whole
            lot opposite the socials instead of spreading it across the
            centred message.

            THE THREE TARGETS ARE SIBLINGS, AND THE SPACING IS REBUILT FROM
            THAT RATHER THAN FROM NESTING.

            The email used to share a nested box with WhatsApp, which is
            fine while they sit together but cannot produce the mobile row,
            where the email leads and WhatsApp is pushed away from it to the
            far edge. `order` cannot lift an element out of its own flex
            container, so the nesting goes and the three become siblings
            that `order` can arrange below sm.

            Flattening costs the inner 6px gap, so it is rebuilt here: the
            group's own gap is that 6px, and the email adds the rest of the
            step before it as a margin — 6 more at sm and 10 more at md, for
            the 12px and 16px the desktop bar has always had. Below sm those
            margins are off, the gap opens to 8px, and the auto margin on
            WhatsApp takes every remaining pixel so the email and the number
            stay paired at the left however wide the screen gets.
          */}
          <div className="flex items-center gap-1.5 max-sm:w-full max-sm:gap-2">
            {/* ------------------------------------------------- numbers */}
            <ul className="flex items-center gap-1 max-sm:order-2">
              {barNumbers.map((number, i) => (
                <li key={number.e164} className="flex items-center">
                  {/* Hairline between numbers, not around them. Dormant while
                      the bar publishes a single line, and correct again the
                      moment it publishes two. */}
                  {i > 0 && (
                    <span aria-hidden="true" className="mr-1 h-3 w-px bg-surface/15" />
                  )}
                  <a
                    href={`tel:${number.e164}`}
                    aria-label={`Call ${site.name} in ${number.regionName} on ${number.display}`}
                    /* The base values are the desktop ones and BOX_MOBILE
                       overrides them below sm. The lifted background is what
                       separates this box from the bar behind it at 4.5%
                       white — enough to read as a surface, not enough to
                       become a second colour in a two-colour bar. */
                    className={
                      `${linkBase} ${BOX_MOBILE} h-8 gap-1.5 border border-transparent px-2 text-xs ` +
                      `max-sm:border-surface/15 max-sm:bg-surface/[0.045] max-sm:px-3 max-sm:text-surface/85`
                    }
                  >
                    {/* The dialling label is an icon below sm: on its own in
                        a box, a bare "IN" reads as a fragment rather than as
                        a call action. From sm the number is back in a
                        horizontal group and the label applies again. */}
                    <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-accent/85 sm:hidden" />
                    {/* A compact dialling label rather than a flag: no image
                        to load, and it stays legible at 10px. */}
                    <span
                      aria-hidden="true"
                      className="hidden text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-accent/85 sm:inline"
                    >
                      {number.region}
                    </span>
                    <span className="whitespace-nowrap leading-none tabular-nums">
                      {number.display}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* --------------------------------------------------- email */}
            {/* Already a 36px square from `h-9 w-9`, so below sm it needs
                only the shared radius and its place at the head of the row.
                `sm:ml-1.5 md:ml-2.5` is the rebuilt step described above. */}
            <a
              href={`mailto:${site.email}`}
              aria-label={`Email ${site.name} at ${site.email}`}
              className={
                `${linkBase} ${BOX_MOBILE} h-9 w-9 border border-surface/15 max-sm:order-1 ` +
                `sm:ml-1.5 md:ml-2.5 md:h-8 md:w-auto md:gap-2 md:border-transparent md:px-2.5`
              }
            >
              <MailIcon className="h-4 w-4" />
              {/* Spelling the address out costs another 92px, which the
                  centred line above cannot spare until there is a good deal
                  more room. The icon is labelled either way. */}
              <span className="sr-only text-xs font-medium min-[1800px]:not-sr-only">{site.email}</span>
            </a>

            {/* ------------------------------------------------ WhatsApp */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              /*
                A square at the tail of the mobile row, matching the email
                box at the head of it. `ml-auto` is what holds it there: it
                absorbs all the free space, so the email and the number stay
                paired at the left edge instead of being spread across the
                bar, at every width.

                The label goes below sm rather than the box shrinking around
                it: the accent border and the brand mark already say what
                this is, and three labelled targets cannot share a 320px row.
                `px-0` is needed because the pill's own padding plus the icon
                would overflow a 36px box, and `justify-center` because the
                pill has no justification of its own — with the label gone
                the icon would otherwise sit against the left edge.

                The label is hidden with `sr-only`, not `hidden`. The icon is
                aria-hidden, so `display: none` on the only text would leave
                the link with no accessible name at all on a phone; sr-only
                takes it out of the layout while keeping it the link's name,
                which is also how the email address beside it is handled.
              */
              className={
                `${accentPill} ${BOX_MOBILE} h-9 px-3.5 md:h-7 ` +
                `max-sm:order-3 max-sm:ml-auto max-sm:w-9 max-sm:justify-center max-sm:px-0 max-sm:border-accent/60`
              }
            >
              {/* 16px below sm to match the mail icon in the square at the
                  other end of the row, 14px from sm where it sits against a
                  label and is sized to the type instead. The phone icon
                  keeps 14px at every width for that same reason. */}
              <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--dur-fast)] group-hover/wa:scale-110 max-sm:h-4 max-sm:w-4" />
              <span className="whitespace-nowrap max-sm:sr-only">Chat With Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
