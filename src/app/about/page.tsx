import Image from "next/image";
import { StaggerGroup } from "@/components/motion/StaggerGroup";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { aboutNarrative, aboutPrinciples, leadership, whatYouGain } from "@/content/company";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About MIDIS",
  description:
    "MIDIS is a website design and development agency in Mohali, working with startups and established businesses worldwide.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About MIDIS"
        headlineLines={["Who we are,", "and how we work."]}
        accentWords={["work."]}
        intro="Everyone says they can build websites and run ads. This page covers how the work actually runs, what we measure, and who you would be dealing with."
        visualSeed="about"
        variant="depth"
crumbs={[{ label: "About", href: "/about" }]}
      />

      {/* ------------------------------------------------------- narrative */}
      <Section tone="surface" aria-labelledby="story-heading">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeader id="story-heading" eyebrow="Our story" title="Why we exist." />
          </div>

          <StaggerGroup className="max-w-2xl space-y-6" step={80}>
            {aboutNarrative.map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-muted sm:text-lg">
                {para}
              </p>
            ))}
          </StaggerGroup>
        </div>
      </Section>

      {/* ------------------------------------------------------ principles */}
      <Section tone="paper" aria-labelledby="principles-heading">
        <SectionHeader
          id="principles-heading"
          eyebrow="How we think"
          title="Why MIDIS and not someone else?"
          intro="Four things clients tell us make the difference."
        />

        <StaggerGroup as="ul" step={80} className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {aboutPrinciples.map((p) => (
            <li key={p.title} className="rule pt-6">
              <h3 className="text-xl font-semibold tracking-tight text-ink">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{p.body}</p>
            </li>
          ))}
        </StaggerGroup>
      </Section>

      {/* ------------------------------------------------------ leadership */}
      <Section tone="surface" aria-labelledby="leadership-heading">
        <SectionHeader
          id="leadership-heading"
          eyebrow="The directors"
          title="Who runs MIDIS."
        />

        <div className="mt-14 space-y-16 lg:space-y-20">
          {leadership.map((person, i) => (
            <Reveal
              key={person.name}
              /*
                Asymmetric columns: the portrait gets the narrower side so it
                fills its column instead of floating in half a screen of
                empty space on large displays. The split flips with the
                alternation so the image column is always the narrow one.
              */
              className={`grid items-center gap-8 lg:gap-16 ${
                i % 2 === 1
                  ? "lg:grid-cols-[1.2fr_0.8fr] lg:[&>figure]:order-2"
                  : "lg:grid-cols-[0.8fr_1.2fr]"
              }`}
            >
              {/*
                Each portrait is sized from its own intrinsic dimensions
                rather than forced into a fixed aspect frame.

                The previous version used a `fill` image inside an
                aspect-[4/3] / [3/2] / [4/5] container with object-cover.
                Gaurav's photograph is 4:5 once its padding is trimmed, so a
                4:3 or 3:2 frame cropped roughly a third of it — head and
                seated posture included. Passing width/height and letting the
                image set its own height removes the mismatch entirely: no
                crop, no distortion, and no layout shift, because the
                intrinsic ratio reserves the space.
              */}
              <figure className="mx-auto w-full max-w-[34rem] overflow-hidden rounded-xl bg-line lg:mx-0">
                <Image
                  src={person.photo}
                  alt={`${person.name}, ${person.role} at MIDIS`}
                  width={person.photoWidth ?? 1200}
                  height={person.photoHeight ?? 1500}
                  sizes="(max-width: 1024px) min(100vw, 34rem), 34rem"
                  className="h-auto w-full"
                />
              </figure>

              <div>
                <span aria-hidden="true" className="block h-px w-10 bg-accent" />
                <h3 className="mt-4 text-[length:var(--text-display-sm)] tracking-tight text-ink">
                  {person.name}
                </h3>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.15em] text-muted">
                  {person.role}
                </p>
                {person.bio && (
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">{person.bio}</p>
                )}
                {person.linkedin && (
                  <a
                    href={person.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block text-sm text-accent-ink underline-offset-4 hover:underline"
                  >
                    Connect on LinkedIn
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- gains */}
      <Section tone="ink" aria-labelledby="gain-heading">
        <SectionHeader
          id="gain-heading"
          tone="dark"
          eyebrow="Working together"
          title="What you'll gain with MIDIS."
          intro="You're not outsourcing tasks. You're building a partnership."
        />

        <StaggerGroup
          as="ul"
          step={70}
          className="mt-14 grid gap-px overflow-hidden rounded-xl bg-line-dark sm:grid-cols-2 lg:grid-cols-4"
        >
          {whatYouGain.map((g) => (
            <li key={g.title} className="bg-ink p-8">
              <h3 className="text-lg font-semibold tracking-tight text-surface">{g.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-surface/60">{g.body}</p>
            </li>
          ))}
        </StaggerGroup>
      </Section>
    </>
  );
}
