import { Reveal } from "@/components/ui/Reveal";
import type { Faq } from "@/content/types";

/**
 * Accessible FAQ list built on native <details>, so it is keyboard operable
 * and fully functional with JavaScript disabled.
 */
export function FaqList({ faqs, tone = "light" }: { faqs: readonly Faq[]; tone?: "light" | "dark" }) {
  const border = tone === "dark" ? "border-line-dark" : "border-line";

  return (
    <div className={`border-t ${border}`}>
      {faqs.map((f, i) => (
        <Reveal key={f.question} delay={Math.min(i, 6) * 40}>
          <details className={`group border-b ${border}`}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
              <h3
                className={`text-base font-medium tracking-tight sm:text-lg ${
                  tone === "dark" ? "text-surface" : "text-ink"
                }`}
              >
                {f.question}
              </h3>
              <span aria-hidden="true" className="relative mt-2 block h-3 w-3 shrink-0">
                <span
                  className={`absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 ${
                    tone === "dark" ? "bg-surface" : "bg-ink"
                  }`}
                />
                <span
                  className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-open:rotate-90 group-open:opacity-0 ${
                    tone === "dark" ? "bg-surface" : "bg-ink"
                  }`}
                />
              </span>
            </summary>
            <div className="pb-6 pr-10">
              <p
                className={`max-w-2xl text-sm leading-relaxed sm:text-base ${
                  tone === "dark" ? "text-surface/60" : "text-muted"
                }`}
              >
                {f.answer}
              </p>
            </div>
          </details>
        </Reveal>
      ))}
    </div>
  );
}

/** FAQPage schema. Only emit this where the questions are visibly rendered. */
export function faqSchema(faqs: readonly Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
