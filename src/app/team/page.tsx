import Image from "next/image";
import { CtaBand } from "@/components/ui/CtaBand";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { leadership, team } from "@/content/company";
import { site } from "@/content/site";
import { JsonLd, buildMetadata } from "@/lib/seo";
import type { TeamMember } from "@/content/types";

export const metadata = buildMetadata({
  title: "Our Team",
  description:
    "Meet the designers, developers and specialists at MIDIS. You work directly with the people building your site, not an account manager relaying messages.",
  path: "/team",
});

/** Person schema for named, pictured individuals who genuinely work here. */
function TeamSchema({ people }: { people: readonly TeamMember[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: people.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Person",
            name: p.name,
            jobTitle: p.role,
            worksFor: { "@type": "Organization", name: site.name, url: site.url },
            ...(p.linkedin ? { sameAs: [p.linkedin] } : {}),
          },
        })),
      }}
    />
  );
}

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <Reveal as="li" delay={(index % 4) * 70}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-line">
        <Image
          src={member.photo}
          alt={`${member.name}, ${member.role} at MIDIS`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top grayscale transition-all duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] hover:grayscale-0"
        />
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{member.name}</h3>
      <p className="mt-0.5 text-sm text-muted">{member.role}</p>

      {/* Optional fields appear only when MIDIS supplies them — intake item 10. */}
      {member.specialism && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{member.specialism}</p>
      )}
      {typeof member.projectCount === "number" && (
        <p className="tabular mt-2 text-xs text-muted">{member.projectCount} projects</p>
      )}
      {member.linkedin && (
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs text-accent-ink underline-offset-4 hover:underline"
        >
          LinkedIn
        </a>
      )}
    </Reveal>
  );
}

export default function TeamPage() {
  const everyone = [...leadership, ...team];

  return (
    <>
      <TeamSchema people={everyone} />

      <PageHero
        eyebrow="The team"
        headlineLines={["The people", "behind the work."]}
        accentWords={["work."]}
        intro="You work directly with the designers and developers building your site. No account-management layer in between."
        visualSeed="team"
        variant="depth"
crumbs={[{ label: "Our Team", href: "/team" }]}
      />

      {/* ------------------------------------------------------ leadership */}
      <Section tone="surface" aria-labelledby="leadership-heading">
        <SectionHeader id="leadership-heading" eyebrow="Leadership" title="The visionaries." />

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {leadership.map((person) => (
            <Reveal key={person.name}>
              {/*
                4:5 rather than 3:2. Gaurav's trimmed portrait is exactly
                0.80, so this frame fits it with no crop at all, while
                keeping both leadership cards the same height. The previous
                3:2 frame cut roughly a third off a 4:5 photograph.
              */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-line">
                <Image
                  src={person.photo}
                  alt={`${person.name}, ${person.role} at MIDIS`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </div>
              <h3 className="mt-6 text-2xl tracking-tight text-ink">{person.name}</h3>
              <p className="mt-1 text-sm font-medium uppercase tracking-[0.15em] text-muted">
                {person.role}
              </p>
              {person.bio && (
                <p className="mt-5 text-base leading-relaxed text-muted">{person.bio}</p>
              )}
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ team */}
      <Section tone="paper" aria-labelledby="specialists-heading">
        <SectionHeader
          id="specialists-heading"
          eyebrow="Specialists"
          title="The people doing the work."
        />

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((member, i) => (
            <MemberCard key={member.name} member={member} index={i} />
          ))}
        </ul>
      </Section>

      <CtaBand
        eyebrow="Work with us"
        title="Talk to the people who'll build it."
        body="No pitch team that hands you over to someone else afterwards. The people you meet are the people who do the work."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "About MIDIS", href: "/about" }}
      />
    </>
  );
}
