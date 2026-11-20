import Link from "next/link";
import { ConsentReset } from "@/components/analytics/Analytics";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SOCIAL_ICON_PATHS } from "@/components/ui/SocialIcons";
import { Reveal } from "@/components/ui/Reveal";
import { industries } from "@/content/industries";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { hasPortfolio } from "@/content/work";

/* Evaluated once at module load, not during render, so the component stays
   statically cacheable under Next 16 cacheComponents. */
const YEAR = new Date().getFullYear();

/* The only new copy in this footer. Held as constants rather than inline JSX
   text so the apostrophes stay plain characters. */
const CTA_HEADING = "Have a project in mind? Let's make it happen.";
const CTA_BODY = "Tell us what you're building. We'd love to hear about it.";

const workLinks = [
  { label: "All Projects", href: "/work" },
  { label: "Website Projects", href: "/work?category=websites" },
  { label: "E-commerce Projects", href: "/work?category=ecommerce" },
  { label: "Web Applications", href: "/work?category=web-apps" },
  { label: "Branding Projects", href: "/work?category=branding" },
  { label: "SEO & Growth", href: "/work?category=seo-growth" },
];

const companyLinks = [
  { label: "About MIDIS", href: "/about" },
  { label: "Why MIDIS", href: "/why-midis" },
  { label: "Our Process", href: "/process" },
  { label: "Our Team", href: "/team" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

const toolLinks = [
  { label: "Free Website Audit", href: "/tools/website-audit" },
  { label: "FAQ", href: "/faq" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

/* A plain Google Maps search for the verified address — no invented place ID,
   and nothing about the address itself changes. */
const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  [
    site.address.street,
    site.address.locality,
    // Region and PIN read as one line in an Indian address.
    `${site.address.region} ${site.address.postalCode}`,
    site.address.countryName,
  ].join(", "),
)}`;

/**
 * Footer navigation link.
 *
 * The orange dash slides in from the left while the label slides right — both
 * are transforms on absolutely-positioned or self-contained boxes, so a hover
 * never reflows the column or shifts a neighbouring link. Pure CSS, so it
 * works with no JavaScript and is neutralised by the global
 * prefers-reduced-motion rule.
 */
function FooterLink({ href, label }: { href: string; label: string }) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[0.65em] h-px w-2.5 -translate-x-3 bg-accent opacity-0 transition-[opacity,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100"
      />
      <span className="block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] group-hover/link:translate-x-[1.125rem] group-focus-visible/link:translate-x-[1.125rem]">
        {label}
      </span>
    </>
  );

  return (
    <Link
      href={href}
      className="group/link relative block py-0.5 text-[0.9375rem] leading-snug text-surface/65 transition-colors duration-[var(--dur-fast)] hover:text-surface focus-visible:text-surface"
    >
      {inner}
    </Link>
  );
}

/**
 * Email / phone link. Padded to a >=24px tap target (WCAG 2.5.8) with the
 * underline anchored to the text itself, so the padding never leaves the rule
 * floating below the glyphs.
 */
function ContactLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group/c block w-fit py-1 text-surface/80 transition-colors duration-[var(--dur-fast)] hover:text-accent focus-visible:text-accent"
    >
      <span className="relative">
        {label}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] group-hover/c:scale-x-100 group-focus-visible/c:scale-x-100"
        />
      </span>
    </a>
  );
}

/** One labelled navigation group. The heading is the group's accessible name. */
function FooterNav({
  id,
  heading,
  links,
}: {
  id: string;
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <nav aria-labelledby={id}>
      <h3
        id={id}
        className="text-xs font-semibold uppercase tracking-[0.16em] text-surface"
      >
        {heading}
      </h3>
      <span
        aria-hidden="true"
        className="footer-rule mt-4 block h-px w-full bg-line-dark"
      />
      <ul className="mt-5 space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <FooterLink href={l.href} label={l.label} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const serviceLinks = services
    .filter((s) => s.verifiedOffering)
    .slice(0, 8)
    .map((s) => ({ label: s.navLabel, href: `/services/${s.slug}` }));

  const industryLinks = industries.map((i) => ({
    label: i.name,
    href: `/industries/${i.slug}`,
  }));

  /* Work is still gated on there being a portfolio, exactly as before — an
     empty filtered view costs more confidence than a missing column. */
  const navGroups = [
    { id: "footer-services", heading: "Services", links: serviceLinks },
    { id: "footer-industries", heading: "Industries", links: industryLinks },
    ...(hasPortfolio ? [{ id: "footer-work", heading: "Work", links: workLinks }] : []),
  ];

  /* Company and Free Tools share the last column, so the grid is always
     exactly filled. The old fixed 4-column grid left a quarter of the row
     empty whenever Work was hidden, which is what read as dead space. */
  const navColumns = hasPortfolio ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <footer className="relative isolate overflow-hidden bg-ink text-surface">
      {/* Ambient accent behind the CTA. Restrained, static, non-interactive. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-56 right-[-10%] h-[34rem] w-[34rem] rounded-full opacity-[0.13] blur-3xl"
        style={{ background: "radial-gradient(circle, #EF8716 0%, transparent 70%)" }}
      />

      {/* ============================================================ CTA */}
      <section aria-labelledby="footer-cta-heading" className="container-site relative">
        <div className="grid gap-x-12 gap-y-8 py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:py-16">
          <h2
            id="footer-cta-heading"
            className="max-w-[24ch] text-[length:var(--text-display-md)] text-surface"
          >
            <MaskedLines stagger={0.07}>{CTA_HEADING}</MaskedLines>
          </h2>

          <Reveal delay={80} className="lg:pb-2">
            <p className="max-w-md text-base leading-relaxed text-surface/60">{CTA_BODY}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="/contact"
                variant="primary"
                size="lg"
                magnetic
                trackAs="footer_start_project"
                className="w-full sm:w-auto"
              >
                Start a Project
                <ArrowRight />
              </Button>
              <Button
                href="/contact/call"
                variant="outline-light"
                size="lg"
                trackAs="footer_get_in_touch"
                className="w-full sm:w-auto"
              >
                Get in Touch
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Divider with a slow travelling accent highlight. */}
        <Reveal>
          <div className="footer-rule relative h-px w-full overflow-hidden bg-line-dark">
            <span
              aria-hidden="true"
              className="footer-sheen absolute inset-y-0 left-0 w-1/3"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(239,135,22,0.85), transparent)",
              }}
            />
          </div>
        </Reveal>
      </section>

      {/* ==================================================== main columns */}
      <div className="container-site relative">
        <div className="grid gap-x-12 gap-y-8 py-12 lg:grid-cols-[minmax(17rem,23rem)_minmax(0,1fr)] lg:gap-x-14 lg:py-16 xl:gap-x-20">
          {/* ------------------------------------------------ identity */}
          <Reveal>
            <Link
              href="/"
              aria-label="MIDIS — home"
              className="inline-flex rounded-sm transition-opacity duration-[var(--dur-fast)] hover:opacity-80"
            >
              <Logo variant="wordmark" className="h-10" />
            </Link>

            <p className="mt-7 max-w-sm text-[0.9375rem] leading-relaxed text-surface/60">
              {site.positioning}
            </p>

            <address className="mt-8 space-y-4 text-[0.9375rem] not-italic">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${site.name} office address on Google Maps`}
                className="group/map block leading-relaxed text-surface/65 transition-colors duration-[var(--dur-fast)] hover:text-surface"
              >
                {site.address.street}
                <br />
                {site.address.locality}, {site.address.region} {site.address.postalCode}
                <br />
                {site.address.countryName}
                <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-accent">
                  View on map
                  <ArrowRight className="h-3 w-3 group-hover/map:translate-x-1" />
                </span>
              </a>

              <div className="space-y-0.5">
                <ContactLink href={`mailto:${site.email}`} label={site.email} />
                <ContactLink href={`tel:${site.phoneE164}`} label={site.phone} />
              </div>
            </address>

            <ul aria-label="MIDIS on social media" className="mt-8 flex flex-wrap gap-2.5">
              {site.socials.map((s) => {
                const icon = SOCIAL_ICON_PATHS[s.name];
                return (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${site.name} on ${s.name}`}
                      className={
                        icon
                          ? "flex h-11 w-11 items-center justify-center rounded-full border border-surface/15 text-surface/70 transition-[color,border-color,background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-accent hover:bg-accent/10 hover:text-accent"
                          : "flex h-11 items-center rounded-full border border-surface/15 px-4 text-sm text-surface/70 transition-colors duration-[var(--dur-fast)] hover:border-accent hover:text-accent"
                      }
                    >
                      {icon ? (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                          className="h-[1.1rem] w-[1.1rem]"
                          fill="currentColor"
                        >
                          {icon}
                        </svg>
                      ) : (
                        s.name
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {/* ---------------------------------------------- navigation */}
          <div className={`grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 ${navColumns}`}>
            {navGroups.map((group, i) => (
              <Reveal key={group.id} delay={60 + i * 60}>
                <FooterNav {...group} />
              </Reveal>
            ))}

            <Reveal delay={60 + navGroups.length * 60} className="space-y-10">
              <FooterNav id="footer-company" heading="Company" links={companyLinks} />
              <FooterNav id="footer-tools" heading="Free Tools" links={toolLinks} />
            </Reveal>
          </div>
        </div>
      </div>

      {/* ====================================================== bottom bar */}
      <div className="container-site relative">
        <div className="rule-dark flex flex-col-reverse gap-3 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <p className="text-xs text-surface/55">
            © {YEAR} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-block py-1.5 text-xs text-surface/55 underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-accent hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <ConsentReset />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
