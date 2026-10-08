import Link from "next/link";
import { ArrowRight, Button } from "@/components/ui/Button";
import { industries } from "@/content/industries";
import { services } from "@/content/services";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Custom 404.
 *
 * Offers real routes out rather than a dead end — most 404s here will come
 * from old midis.in URLs that aren't covered by the redirect map, so the
 * useful response is to show what does exist.
 */
export default function NotFound() {
  const popular = [
    { label: "Website design", href: "/services/web-design" },
    { label: "Website development", href: "/services/web-development" },
    { label: "E-commerce development", href: "/services/ecommerce-development" },
    { label: "SEO", href: "/services/seo" },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[30rem] w-[30rem] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, #EF8716 0%, transparent 68%)" }}
      />

      <div className="container-site relative py-24 lg:py-36">
        <p className="flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">
          <span className="h-px w-8 bg-accent" aria-hidden="true" />
          Error 404
        </p>

        <h1 className="mt-8 max-w-[16ch] text-[length:var(--text-display-lg)] font-semibold leading-[0.92] tracking-[-0.04em]">
          This page doesn&apos;t exist.
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          The link may be out of date, or the page may have moved. Here&apos;s where most people
          are heading.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="primary" size="lg">
            Back to home
            <ArrowRight />
          </Button>
          <Button href="/contact" variant="outline" size="lg">
            Contact us
          </Button>
        </div>

        <div className="rule mt-16 grid gap-10 pt-10 sm:grid-cols-3">
          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Popular services
            </h2>
            <ul className="mt-4 space-y-2">
              {popular.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink transition-colors hover:text-accent-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Industries
            </h2>
            <ul className="mt-4 space-y-2">
              {industries.slice(0, 4).map((i) => (
                <li key={i.slug}>
                  <Link
                    href={`/industries/${i.slug}`}
                    className="text-sm text-ink transition-colors hover:text-accent-ink"
                  >
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Company
            </h2>
            <ul className="mt-4 space-y-2">
              {[
                { label: "About MIDIS", href: "/about" },
                { label: "Why MIDIS", href: "/why-midis" },
                { label: "Our process", href: "/process" },
                { label: `All ${services.length} services`, href: "/services" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink transition-colors hover:text-accent-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
