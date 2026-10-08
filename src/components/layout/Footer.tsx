import Link from "next/link";
import { ConsentReset } from "@/components/analytics/Analytics";
import { Logo } from "@/components/ui/Logo";
import { industries } from "@/content/industries";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { hasPortfolio } from "@/content/work";

/* Evaluated once at module load, not during render, so the component stays
   statically cacheable under Next 16 cacheComponents. */
const YEAR = new Date().getFullYear();

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

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-dark">
        {heading}
      </h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-sm text-surface/70 transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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

  return (
    <footer className="bg-ink text-surface">
      <div className="container-site py-20 lg:py-24">
        {/* ------------------------------------------------------- top */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="max-w-sm">
            <Logo variant="wordmark" className="h-9" />
            <p className="mt-6 text-sm leading-relaxed text-surface/60">{site.positioning}</p>

            <address className="mt-8 space-y-3 text-sm not-italic text-surface/70">
              <p className="leading-relaxed">
                {site.address.street}
                <br />
                {site.address.locality}, {site.address.region}
                <br />
                {site.address.countryName}
              </p>
              <p>
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-accent">
                  {site.email}
                </a>
              </p>
              <p>
                <a href={`tel:${site.phoneE164}`} className="transition-colors hover:text-accent">
                  {site.phone}
                </a>
              </p>
            </address>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {site.socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-surface/70 underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            <FooterColumn heading="Services" links={serviceLinks} />
            <FooterColumn heading="Industries" links={industryLinks} />
            {hasPortfolio && <FooterColumn heading="Work" links={workLinks} />}
            <div className="space-y-12">
              <FooterColumn heading="Company" links={companyLinks} />
              <FooterColumn heading="Free Tools" links={toolLinks} />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------- bottom */}
        <div className="rule-dark mt-16 flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-surface/45">
            © {YEAR} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Sitemap", href: "/sitemap.xml" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-xs text-surface/45 transition-colors hover:text-accent">
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
