import Image from "next/image";
import Link from "next/link";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { RevealImage } from "@/components/motion/RevealImage";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { leadership, team } from "@/content/company";
import { industries } from "@/content/industries";
import { featuredServiceSlugs, getService } from "@/content/services";
import { ServiceRows } from "./ServiceRows";

/* ----------------------------------------------------------- §6 Services */

export function ServicesSection() {
  const featured = featuredServiceSlugs
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <Section tone="paper" aria-labelledby="services-heading">
      <SectionHeader
        id="services-heading"
        eyebrow="What we do"
        title="Everything your business needs to build, launch and grow."
        intro="Website design and development is our core offering. Everything else exists to make what we build perform once it's live."
        action={
          <Button href="/services" variant="outline">
            All services
            <ArrowRight />
          </Button>
        }
      />

      <ServiceRows services={featured} />
    </Section>
  );
}

/* --------------------------------------------------------- §7 Industries */

export function IndustriesSection() {
  return (
    <Section tone="surface" aria-labelledby="industries-heading">
      <SectionHeader
        id="industries-heading"
        eyebrow="Industries"
        title="Different businesses need different websites."
        intro="A SaaS product and a healthcare practice are not solving the same problem. We start from what's specific to your sector rather than a template."
      />

      <StaggerGroup as="ul" step={45} className="mt-14 rule">
        {industries.map((ind) => (
          <li key={ind.slug} className="border-b border-line">
            <Link
              href={`/industries/${ind.slug}`}
              className="group flex flex-col gap-3 py-7 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-10"
            >
              <div className="flex items-baseline gap-5">
                <span
                  aria-hidden="true"
                  className="h-px w-6 shrink-0 bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:w-10"
                />
                <h3 className="text-2xl tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 sm:text-3xl">
                  {ind.name}
                </h3>
              </div>

              <div className="flex items-center gap-6 pl-13 sm:pl-0">
                <p className="hidden max-w-md text-sm leading-relaxed text-muted lg:block">
                  {ind.challenges[0]}
                </p>
                <ArrowRight className="shrink-0 text-muted transition-colors group-hover:text-accent-ink" />
              </div>
            </Link>
          </li>
        ))}
      </StaggerGroup>
    </Section>
  );
}

/* ---------------------------------------------------------- §11 The team */

export function TeamSection() {
  const everyone = [...leadership, ...team];

  return (
    <Section tone="paper" aria-labelledby="team-heading">
      <SectionHeader
        id="team-heading"
        eyebrow="The team"
        title="The people behind the work."
        intro="You work directly with the designers and developers building your site — not an account manager relaying messages."
        action={
          <Button href="/team" variant="outline">
            Meet the team
            <ArrowRight />
          </Button>
        }
      />

      <StaggerGroup
        as="ul"
        step={55}
        className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
      >
        {everyone.map((m) => (
          <li key={m.name}>
            <RevealImage className="relative aspect-[4/5] rounded-lg bg-line">
              <Image
                src={m.photo}
                alt={`${m.name}, ${m.role} at MIDIS`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover object-top grayscale transition-all duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] hover:grayscale-0"
              />
            </RevealImage>
            <h3 className="mt-4 text-sm font-semibold tracking-tight text-ink">{m.name}</h3>
            <p className="text-sm text-muted">{m.role}</p>
            {/* Optional fields render only when MIDIS supplies them. */}
            {m.specialism && <p className="mt-1.5 text-xs leading-relaxed text-muted">{m.specialism}</p>}
            {m.linkedin && (
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-accent-ink underline-offset-4 hover:underline"
              >
                LinkedIn
              </a>
            )}
          </li>
        ))}
      </StaggerGroup>
    </Section>
  );
}
