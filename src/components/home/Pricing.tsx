import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import {
  formatServicePrice,
  getServicePrice,
  hasPublishedPricing,
  pricingServiceSlugs,
} from "@/content/pricing";
import { getService, serviceGroups } from "@/content/services";
import { site } from "@/content/site";
import { JsonLd } from "@/lib/seo";
import { contactHrefForService } from "@/lib/service-options";
import { PricingGrid, type PricingCard } from "./PricingGrid";

/**
 * Services and pricing.
 *
 * Everything on a card is read from the service catalogue, so this section
 * cannot describe an offering differently from the page it links to. The one
 * thing the catalogue does not have is a price, and none is invented: see the
 * header comment in content/pricing.ts for why, and what to add when MIDIS
 * confirms real figures.
 *
 * The section is a server component. Only the grid is interactive, and even
 * that renders its cards and their links in the server HTML — the dialog is
 * the only part that needs JavaScript, and it is an enhancement over a link
 * to the full service page rather than the only route to the detail.
 */

const GROUP_LABELS = new Map(serviceGroups.map((g) => [g.id, g.label]));

function buildCards(): PricingCard[] {
  return pricingServiceSlugs.flatMap((slug) => {
    const service = getService(slug);
    /* pricing.ts throws at module load if a slug is missing, so this is a
       type narrowing rather than a real branch. */
    if (!service) return [];

    const price = getServicePrice(slug);

    return [
      {
        slug: service.slug,
        title: service.title,
        group: GROUP_LABELS.get(service.group) ?? "Services",
        problem: service.problem,
        summary: service.summary,
        deliverables: service.deliverables,
        audience: service.audience,
        price: price ? formatServicePrice(price) : null,
        contactHref: contactHrefForService(service.slug),
      },
    ];
  });
}

/**
 * Offer markup for the services that have a confirmed price.
 *
 * Renders nothing today, because nothing is priced. That is deliberate:
 * Google treats an Offer whose price is not visible on the page as spam, and
 * the figure has to come from MIDIS before it can appear in either place.
 * Adding entries to `servicePricing` turns on the visible price and this
 * markup together, from the same source, so the two cannot disagree.
 */
function PricingSchema({ cards }: { cards: readonly PricingCard[] }) {
  if (!hasPublishedPricing()) return null;

  const priced = cards.flatMap((card) => {
    const price = getServicePrice(card.slug);
    return price ? [{ card, price }] : [];
  });

  if (priced.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "MIDIS services and pricing",
        itemListElement: priced.map(({ card, price }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: card.title,
            description: card.summary,
            url: `${site.url}/services/${card.slug}`,
            provider: { "@type": "Organization", name: site.name, url: site.url },
            offers: {
              "@type": "Offer",
              price: price.from,
              priceCurrency: price.currency,
              url: `${site.url}/services/${card.slug}`,
              availability: "https://schema.org/InStock",
            },
          },
        })),
      }}
    />
  );
}

export function PricingSection() {
  const cards = buildCards();

  return (
    <Section tone="paper" aria-labelledby="pricing-heading">
      <PricingSchema cards={cards} />

      <SectionHeader
        id="pricing-heading"
        eyebrow="Our services & pricing"
        title="Find the right service for your business."
        intro="Every project is different. Explore what we offer, see what's included, and talk to our team about the right approach for your business."
      />

      {/* Eight cards all reading "Custom Quote" would look like something
          was missing. This says once, up front, why there is no price list —
          which is the same answer the FAQ gives, in the same words. */}
      <Reveal delay={80}>
        <p className="mt-8 max-w-3xl border-l-2 border-accent pl-5 text-sm leading-relaxed text-muted sm:text-base">
          We don&apos;t publish a price list because scope drives the number, not page count.
          A focused marketing site sits at the lower end; a store, a multi-language build or a
          custom application sits considerably higher. Tell us what the work has to achieve and
          you&apos;ll get a realistic range before you commit to anything.
        </p>
      </Reveal>

      <PricingGrid cards={cards} />

      {/* ------------------------------------------- custom proposal CTA */}
      <Reveal delay={60}>
        <div className="rule mt-[var(--space-block)] flex flex-col gap-6 pt-[var(--space-block)] lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <p className="max-w-xl text-[length:var(--text-display-sm)] leading-tight tracking-tight text-ink">
            Need something more specific? Let&apos;s talk about your project.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
            <Button
              href="/contact"
              variant="primary"
              size="lg"
              magnetic
              trackAs="pricing_custom_proposal"
            >
              Request a Custom Proposal
              <ArrowRight />
            </Button>
            <Button href="/services" variant="outline" size="lg">
              All services
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
