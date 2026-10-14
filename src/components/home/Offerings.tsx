import Image from "next/image";
import Link from "next/link";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { RevealImage } from "@/components/motion/RevealImage";
import { ArrowRight, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { team } from "@/content/company";
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

      <StaggerGroup as="ul" step={45} className="mt-[var(--space-block)] rule">
        {industries.map((ind) => (
          <li key={ind.slug} className="border-b border-line">
            {/*
              Columns rather than justify-between. Pushing the heading and
              the description to opposite ends of the row left a void
              between them and set every description ragged against the
              arrow, so each one started at a different place down the list.
              A grid gives the descriptions a shared left edge and the same
              width, which is the pattern ServiceRows already uses. The
              description column simply drops out below lg, where it is
              hidden, leaving heading and arrow.
            */}
            <Link
              href={`/industries/${ind.slug}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 py-7 transition-colors lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_auto] lg:gap-x-8"
            >
              <h3 className="text-2xl tracking-tight text-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 sm:text-3xl">
                {ind.name}
              </h3>

              <p className="hidden text-sm leading-relaxed text-muted lg:block">
                {ind.challenges[0]}
              </p>

              <ArrowRight className="shrink-0 justify-self-end text-muted transition-colors group-hover:text-accent-ink" />
            </Link>
          </li>
        ))}
      </StaggerGroup>
    </Section>
  );
}

/* ---------------------------------------------------------- §11 The team */

export function TeamSection() {
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

      {/*
        The eight people who do the work. Leadership is deliberately not here:
        the section's promise is that you work with the designers and
        developers rather than through a manager, and two director cards at
        the front of the grid argued against it. Both still appear on /about
        and in full on /team, which the "Meet the team" button leads to.

        A centred flex row rather than a grid, because the headcount keeps
        moving: it was ten on 2026-10-14 and is nine now. A grid left-aligns
        a part-filled last row, so nine cards in fives left a gap the width of
        a card at the end — which is what reads as "unfinished". Wrapping and
        centring puts five on the first row and four centred under it, and
        any future count lands the same way without picking new column counts.

        The widths are column counts expressed as a share of the row: two on a
        phone, three from sm, five from lg. Five waits for lg because at 768px
        they would be 126px wide, which wraps the longer names onto two lines.
      */}
      <StaggerGroup
        as="ul"
        step={55}
        className="mt-[var(--space-block)] flex flex-wrap justify-center gap-x-6 gap-y-8"
      >
        {team.map((m) => (
          /* n per row, allowing for the 1.5rem gap between them. */
          <li
            key={m.name}
            className="w-[calc((100%-1.5rem)/2)] sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-6rem)/5)]"
          >
            <RevealImage className="relative aspect-[4/5] rounded-lg bg-line">
              <Image
                src={m.photo}
                alt={`${m.name}, ${m.role} at MIDIS`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
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
