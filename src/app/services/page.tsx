import Link from "next/link";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { ArrowRight } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
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
        intro="Design and development is the core of what we do. The rest of this list exists to make what we build perform once it is live, and you can take one piece of it or the whole thing."
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

            <StaggerGroup
              as="ul"
              step={65}
              className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-3"
            >
              {inGroup.map((s) => (
                <li key={s.slug} className={gi % 2 === 0 ? "bg-surface" : "bg-paper"}>
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
                </li>
              ))}
            </StaggerGroup>
          </Section>
        );
      })}
    </>
  );
}
