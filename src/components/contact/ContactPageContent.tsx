import { TrackedLink } from "@/components/analytics/Track";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { site } from "@/content/site";
import type { Crumb } from "@/lib/seo";

const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
  "Hi MIDIS, I'd like to talk about a project.",
)}`;

function ContactDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rule pt-5">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <div className="mt-2 text-base text-ink">{children}</div>
    </div>
  );
}

/**
 * Shared body for both contact routes.
 *
 * The strategy-call variant lives at its own static path rather than behind a
 * `?intent=` query string: reading searchParams would make the whole route
 * dynamic, costing the prerender on the page that matters most for
 * conversion. `/contact/call` carries a canonical back to `/contact` and is
 * noindexed, so the split costs nothing in search.
 */
export function ContactPageContent({
  variant = "project",
  crumbs,
}: {
  variant?: "project" | "call";
  crumbs: Crumb[];
}) {
  const isCall = variant === "call";

  return (
    <>
      <PageHero
        eyebrow={isCall ? "Book a strategy call" : "Start a project"}
        keyword={isCall ? "Book a free strategy call" : "Contact MIDIS to start your website project"}
        headlineLines={
          isCall
            ? ["Let's talk about", "where you're going."]
            : ["Let's build something", "worth building."]
        }
        accentWords={["going.", "building."]}
        intro={
          isCall
            ? "A call, not a pitch. Tell us where the business is now and where you want it to be in six months."
            : "Tell us what you're trying to achieve. If we're not the right people for it, we'll say so — and usually point you to someone who is."
        }
        crumbs={crumbs}
      />

      {/* A modest top pad rather than none at all, so the white panel has
          some air above the first label instead of the form butting straight
          into the colour change at the hero's edge. */}
      <Section
        tone="surface"
        className="!pt-[clamp(2.5rem,4.5vw,4.5rem)]"
        aria-labelledby="contact-heading"
      >
        <h2 id="contact-heading" className="sr-only">
          Contact MIDIS
        </h2>

      {/* The aside is capped rather than proportional: a fractional track
          let it stretch past a comfortable measure on wide screens, and the
          shorter form no longer needs to be given two thirds of the row. */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:gap-16 xl:gap-20">
          <Reveal className="min-w-0">
            <ContactForm defaultIntent={isCall ? "call" : undefined} />
          </Reveal>

          <Reveal delay={120} className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-ink">
                Prefer to talk right now?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                WhatsApp is usually the fastest way to reach us.
              </p>
              <TrackedLink
                event="whatsapp_click"
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 items-center gap-2.5 rounded-full bg-ink px-6 text-[0.9375rem] font-medium text-surface transition-colors hover:bg-accent hover:text-ink"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-1-2.2c-.2-.6-.4-.5-.6-.5H7.9c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.5 1.9.8 2.7.9 3.6.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3Z" />
                  <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
                </svg>
                Message us on WhatsApp
              </TrackedLink>
            </div>

            <ContactDetail label="Email">
              <TrackedLink
                event="email_click"
                href={`mailto:${site.email}`}
                className="transition-colors hover:text-accent-ink"
              >
                {site.email}
              </TrackedLink>
            </ContactDetail>

            <ContactDetail label="Phone">
              <TrackedLink
                event="phone_click"
                href={`tel:${site.phoneE164}`}
                className="transition-colors hover:text-accent-ink"
              >
                {site.phone}
              </TrackedLink>
            </ContactDetail>

            <ContactDetail label="Studio">
              <address className="text-base not-italic leading-relaxed text-ink">
                {site.address.street}
                <br />
                {site.address.locality}, {site.address.region} {site.address.postalCode}
                <br />
                {site.address.countryName}
              </address>
            </ContactDetail>

            <ContactDetail label="Follow">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {site.socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-ink underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </ContactDetail>

            <div className="rule pt-5">
              <p className="text-sm leading-relaxed text-muted">
                We work with clients across India and internationally, and we&apos;re set up for
                remote collaboration across time zones.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
