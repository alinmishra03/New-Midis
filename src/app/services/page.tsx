import Link from "next/link";
import { ArrowRight } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { getAllServices, serviceGroups } from "@/content/services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services",
  description:
    "Website design and development, e-commerce, SEO, paid media, content and AI — everything MIDIS does to help businesses grow online.",
  path: "/services",
});

export default function ServicesPage() {
  const all = getAllServices();

  return (
    <>
      <PageHero
        eyebrow="What we do"
        headlineLines={["Everything you need", "to build, launch", "and grow."]}
        accentWords={["grow."]}
        intro="Website design and development is our core offering. Everything else exists to make what we build perform once it's live — you can take one service or an end-to-end stack."
        visualSeed="services-hub"
        variant="signal"
crumbs={[{ label: "Services", href: "/services" }]}
      />

      {serviceGroups.map((group, gi) => {
        const inGroup = all.filter((s) => s.group === group.id);
        if (inGroup.length === 0) return null;

        return (
          <Section
            key={group.id}
            tone={gi % 2 === 0 ? "surface" : "paper"}
            aria-labelledby={`group-${group.id}`}
          >
            <SectionHeader
              id={`group-${group.id}`}
              eyebrow={`0${gi + 1}`}
              title={group.label}
            />

            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-3">
              {inGroup.map((s, i) => (
                <Reveal
                  key={s.slug}
                  as="li"
                  delay={(i % 3) * 70}
                  className={gi % 2 === 0 ? "bg-surface" : "bg-paper"}
                >
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex h-full flex-col p-8 transition-colors duration-[var(--dur-base)] hover:bg-paper/60"
                  >
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                      {s.problem}
                    </p>
                    <h3 className="mt-4 text-xl tracking-tight text-ink">{s.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
                    <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-ink">
                      Learn more
                      <ArrowRight />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </Section>
        );
      })}

      <CtaBand
        eyebrow="Not sure where to start?"
        title="Tell us the problem, not the service."
        body="Most clients arrive describing a symptom rather than a solution. Tell us what isn't working and we'll tell you what would actually fix it."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "Book a strategy call", href: "/contact/call" }}
      />
    </>
  );
}
