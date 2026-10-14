import Image from "next/image";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { clientHref, clientLogo, clients, type Client } from "@/content/clients";
import { cn } from "@/lib/utils";

/**
 * Client showcase.
 *
 * Every one of the 18 clients in MIDIS's portfolio report appears, whether or
 * not an authentic logo exists for it. Seven have marks downloaded from their
 * own websites; the other eleven are set as text, which the brief asks for in
 * place of a substitute. Two downloads were discarded on inspection — a
 * Maxxis tyre-brand logo scraped from a supplier strip, and a photograph of
 * the Burj Khalifa — because an unrelated image is worse than a name.
 *
 * Nothing here claims a result. The section says who MIDIS has worked with,
 * which the report supports, and stops there.
 *
 * A card links out only when the URL actually answered when it was last
 * checked; see the notes in content/clients.ts for the two cases where the
 * report and the live site disagree.
 *
 * Entirely server-rendered. The grid's entrance is StaggerGroup, which is a
 * CSS transition driven by one IntersectionObserver, so eighteen cards cost
 * no per-card JavaScript.
 */

/** Uniform frame for every mark, whatever shape it is. */
const CARD =
  "group relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-line " +
  "px-5 transition-[border-color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] " +
  "hover:border-accent/45 hover:shadow-[0_16px_40px_-30px_rgba(23,25,28,0.5)] " +
  "focus-visible:border-accent/45 motion-safe:hover:-translate-y-0.5 sm:h-[7.5rem]";

function CardInner({ client }: { client: Client }) {
  const logo = clientLogo(client.slug);

  return (
    <>
      {/* Accent rule that draws across the top on hover or keyboard focus. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-accent transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />

      {logo ? (
        /*
         * object-contain inside a fixed box, so a wordmark and a square crest
         * both sit correctly and neither is cropped or stretched. Sizes are
         * the real intrinsic ones from the manifest, so nothing shifts as the
         * images arrive.
         */
        <Image
          src={logo.src}
          alt={`${client.name} logo`}
          width={logo.width}
          height={logo.height}
          loading="lazy"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
          className="max-h-[4.25rem] w-auto max-w-full object-contain transition-opacity duration-[var(--dur-base)]"
        />
      ) : (
        /* No authentic mark yet. The name, set properly — not a stand-in
           graphic, and not a silent omission. */
        <span className="text-center text-[0.9375rem] font-medium leading-snug tracking-tight text-ink/80">
          {client.name}
        </span>
      )}
    </>
  );
}

function ClientCard({ client }: { client: Client }) {
  const href = clientHref(client);
  const logo = clientLogo(client.slug);

  /*
   * A mark drawn in white or pale gold for a dark header is invisible on
   * paper. Recolouring someone's logo is not ours to do, so the panel
   * changes instead and the mark is shown exactly as supplied.
   */
  const dark = Boolean(logo?.onDark);
  const surface = dark ? "bg-ink" : "bg-surface";

  /* The service line, where the report states one. */
  const label = client.services
    ? `${client.name} — ${client.services}`
    : client.name;

  /* The service if we have one; otherwise the name, but only when the card
     is showing a logo rather than that same name. */
  const overlay = client.services ?? (logo ? client.name : null);

  const content = (
    <>
      <CardInner client={client} />

      {/*
        Name and service on hover or focus. Hidden from assistive technology
        because the link's own label already carries both, and on a touch
        device it simply never appears — the alt text is the answer there.

        Skipped entirely on a text card with no stated service, where it
        would slide the client's name up over the client's name.
      */}
      {overlay && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 translate-y-full px-3 py-2 text-center text-[0.625rem] font-medium leading-tight",
            "transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
            "group-hover:translate-y-0 group-focus-visible:translate-y-0",
            dark ? "bg-surface/10 text-surface/80" : "bg-paper text-muted",
          )}
        >
          {overlay}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (opens in a new tab)`}
        className={cn(CARD, surface)}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cn(CARD, surface, "cursor-default")} role="img" aria-label={label}>
      {content}
    </div>
  );
}

export function ClientsSection() {
  return (
    <Section tone="surface" aria-labelledby="clients-heading">
      <SectionHeader
        id="clients-heading"
        eyebrow="Our clients & partnerships"
        title="Brands We've Helped Build & Grow."
        intro="From ambitious startups to established businesses, we've partnered with brands across industries to create websites, digital experiences, and marketing solutions that help them move forward."
      />

      {/*
        Eighteen clients: two columns on a phone, three on a tablet, six from
        xl. All three divide eighteen exactly, so no breakpoint ever leaves a
        ragged final row.
      */}
      <StaggerGroup
        as="ul"
        step={40}
        shift="1rem"
        className="mt-[var(--space-block)] grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6"
      >
        {clients.map((client) => (
          <li key={client.slug} className="min-w-0">
            <ClientCard client={client} />
          </li>
        ))}
      </StaggerGroup>

      <Reveal delay={60}>
        <p className="mt-8 text-sm leading-relaxed text-muted">
          Logos are shown as supplied by each brand. Where we don&apos;t yet hold an original
          asset, the client is named instead.
        </p>
      </Reveal>
    </Section>
  );
}
