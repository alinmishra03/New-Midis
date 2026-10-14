import Link from "next/link";
import { FinalCta } from "@/components/home/Conversion";
import { ServiceVisual } from "@/components/services/ServiceVisual";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { ArrowRight } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getAllServices, serviceGroups } from "@/content/services";
import { site } from "@/content/site";
import { JsonLd, buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Web Design, Development, SEO & AI Services",
  description:
    "Website design and development, Shopify and e-commerce, SEO, Google and Meta ads, content and AI chatbot development — every MIDIS service in one place.",
  path: "/services",
});

/** One line per practice group, shown beside its heading. */
const groupIntro: Record<(typeof serviceGroups)[number]["id"], string> = {
  "strategy-design": "Deciding what the site has to achieve, then designing the structure and visual system that achieves it.",
  development: "Fast, accessible, server-rendered builds on platforms your team can maintain after launch.",
  ecommerce: "Storefronts built around how your customers buy, from the product page to a checkout that converts.",
  growth: "Search, paid media, content and email that bring the right people to the site once it is live.",
  ai: "Assistants and integrations grounded in your own content, with honest limits and a human handover.",
};

export default function ServicesPage() {
  const all = getAllServices();

  return (
    <>
      {/* The hub's own catalogue, so search engines see every service it
          links to as one coherent list. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${site.name} services`,
          itemListElement: all.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
            url: `${site.url}/services/${s.slug}`,
          })),
        }}
      />

      <PageHero
        keyword="Web design, development, SEO & AI services"
        aside={<ServiceVisual kind="hub" className="mx-auto max-w-lg lg:max-w-none" />}
        eyebrow="What we do"
        headlineLines={["Everything you need", "to build, launch", "and grow."]}
        accentWords={["grow."]}
        intro="Design and development is the core of what we do. The rest of this list exists to make what we build perform once it is live, and you can take one piece of it or the whole thing."
        visualSeed="services-hub"
        variant="signal"
        crumbs={[{ label: "Services", href: "/services" }]}
      >
        {/* Jump links to each practice group. */}
        <nav aria-label="Service groups" className="mt-9">
          <ul className="flex flex-wrap gap-2">
            {serviceGroups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-sm text-ink backdrop-blur transition-colors duration-[var(--dur-fast)] hover:border-ink hover:bg-ink hover:text-surface"
                >
                  {g.label}
                  <span className="text-xs text-muted">{all.filter((s) => s.group === g.id).length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      {serviceGroups.map((group, gi) => {
        const inGroup = all.filter((s) => s.group === group.id);
        if (inGroup.length === 0) return null;
        const tone = gi % 2 === 0 ? "surface" : "paper";

        return (
          <Section key={group.id} id={group.id} tone={tone} className="scroll-mt-24" aria-labelledby={`group-${group.id}`}>
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <SectionHeader id={`group-${group.id}`} eyebrow={`0${gi + 1}`} title={group.label} intro={groupIntro[group.id]} />
              </div>

              {/* Separate cards rather than a hairline grid, so an odd
                  number of services never leaves an empty filler cell. */}
              <StaggerGroup as="ul" step={65} className="grid gap-4 sm:grid-cols-2">
                {inGroup.map((s, i) => (
                  <li
                    key={s.slug}
                    className={cn(inGroup.length % 2 === 1 && i === 0 && "sm:col-span-2")}
                  >
                    <Link
                      href={`/services/${s.slug}`}
                      className={cn(
                        "group flex h-full flex-col rounded-2xl border p-5 sm:p-6 transition-[transform,border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_24px_60px_-30px_rgba(23,25,28,0.35)] lg:p-8",
                        tone === "surface" ? "border-line bg-paper/60" : "border-line bg-surface",
                      )}
                    >
                      <p className="text-[0.6875rem] font-semibold uppercase leading-relaxed tracking-[0.16em] text-accent-ink">
                        {s.problem}
                      </p>
                      <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">{s.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
                      <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-ink">
                        Explore {s.navLabel}
                        <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </li>
                ))}
              </StaggerGroup>
            </div>
          </Section>
        );
      })}

      <FinalCta
        title="Not sure which service you need?"
        intro="Most projects start with one problem and turn out to need two or three things done well. Tell us the problem and we’ll recommend the smallest set of services that solves it."
      />
    </>
  );
}
