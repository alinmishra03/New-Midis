import { ArrowRight, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";

/**
 * Closing conversion band for inner pages.
 *
 * CTAs are passed in per page rather than fixed, because the brief is
 * explicit that the same call to action should not appear in every section —
 * a visitor finishing the Process page wants something different from one
 * finishing Team.
 */
export function CtaBand({
  eyebrow = "Start here",
  title,
  body,
  primary = { label: "Start a project", href: "/contact" },
  secondary,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-[0.15] blur-3xl"
        style={{ background: "radial-gradient(circle, #EF8716 0%, transparent 70%)" }}
      />

      <div className="container-site relative py-20 text-center lg:py-28">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          </div>

          <h2 className="mx-auto mt-7 max-w-[18ch] text-[length:var(--text-display-md)] text-surface">
            {title}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-surface/60">{body}</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={primary.href} variant="primary" size="lg" magnetic>
              {primary.label}
              <ArrowRight />
            </Button>
            {secondary && (
              <Button href={secondary.href} variant="outline-light" size="lg">
                {secondary.label}
              </Button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
