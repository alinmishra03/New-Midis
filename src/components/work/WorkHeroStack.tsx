import { BrowserFrame } from "./BrowserFrame";
import { Reveal } from "@/components/ui/Reveal";
import type { FeaturedProject } from "@/content/featured-work";

/**
 * The hero's project composition.
 *
 * Three real screenshots, offset and overlapped rather than laid out in a
 * grid, so the hero shows work instead of showing a pattern. The order is
 * back-to-front: the two behind are dimmed and scaled down so the front one
 * reads as the subject and the others as depth.
 *
 * Below lg the stack collapses to the front frame alone. The offsets that
 * make the composition work need roughly 30rem of width, and three
 * overlapping frames on a phone is three illegible slivers — so the mobile
 * hero gets one preview at full width, which is the same argument made in
 * less space rather than a worse version of the same picture.
 *
 * Decorative in the accessibility sense: the frames repeat projects the page
 * lists properly further down, each with its name and link. They are given
 * empty alt text rather than described twice.
 */
export function WorkHeroStack({ projects }: { projects: readonly FeaturedProject[] }) {
  const [front, middle, back] = projects;
  if (!front) return null;

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Depth layers. Hidden below lg — see the note above. */}
      {back && (
        <Reveal
          delay={160}
          className="pointer-events-none absolute -right-6 -top-10 hidden w-[62%] lg:block"
        >
          <BrowserFrame
            src={back.preview}
            alt=""
            host={back.host}
            sizes="(min-width: 1024px) 28vw, 0px"
            className="opacity-45 shadow-[0_24px_60px_-40px_rgb(23_25_28/0.5)]"
          />
        </Reveal>
      )}

      {middle && (
        <Reveal
          delay={80}
          className="pointer-events-none absolute -left-10 bottom-[-14%] hidden w-[58%] lg:block"
        >
          <BrowserFrame
            src={middle.preview}
            alt=""
            host={middle.host}
            sizes="(min-width: 1024px) 26vw, 0px"
            className="opacity-70 shadow-[0_24px_60px_-40px_rgb(23_25_28/0.5)]"
          />
        </Reveal>
      )}

      {/* The subject. The only one that loads eagerly: it is the page's
          largest contentful paint on every width. */}
      <Reveal className="relative">
        <BrowserFrame
          src={front.preview}
          alt={`${front.name} — homepage of the live site`}
          host={front.host}
          priority
          sizes="(min-width: 1024px) 42vw, (min-width: 640px) 32rem, 92vw"
          className="shadow-[0_40px_90px_-50px_rgb(23_25_28/0.55)]"
        />
      </Reveal>
    </div>
  );
}
