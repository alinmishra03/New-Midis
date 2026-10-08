"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RevealImage } from "@/components/motion/RevealImage";
import { ArrowRight } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import type { Project, ProjectCategory } from "@/content/types";
import { cn } from "@/lib/utils";

type Filter = ProjectCategory | "all";

/**
 * Portfolio grid with category filtering.
 *
 * Filtering happens on the client over a list rendered on the server, so the
 * full portfolio is present in the HTML for search engines regardless of the
 * active filter, and switching filters costs no navigation.
 *
 * The initial filter is read from ?category= so the footer's deep links
 * (/work?category=ecommerce) land on the right view.
 */
export function WorkGrid({
  projects,
  categories,
}: {
  projects: readonly Project[];
  categories: { id: ProjectCategory; label: string }[];
}) {
  const searchParams = useSearchParams();
  const initial = searchParams.get("category") as Filter | null;
  const valid = initial && categories.some((c) => c.id === initial) ? initial : "all";

  const [filter, setFilter] = useState<Filter>(valid);
  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All projects" },
    ...categories,
  ];

  function select(id: Filter) {
    setFilter(id);
    // Keep the URL shareable without triggering a navigation.
    const url = id === "all" ? "/work" : `/work?category=${id}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      {categories.length > 1 && (
        <div className="mb-12 flex flex-wrap gap-2" role="group" aria-label="Filter projects">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              aria-pressed={filter === t.id}
              className={cn(
                "h-10 rounded-full border px-5 text-sm font-medium transition-colors",
                filter === t.id
                  ? "border-ink bg-ink text-surface"
                  : "border-line text-ink/70 hover:border-ink hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        Showing {visible.length} {visible.length === 1 ? "project" : "projects"}
      </p>

      <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.slug} as="li" delay={(i % 3) * 80}>
            <Link href={`/work/${p.slug}`} className="group block">
              {/* Fixed 16:10 on every card: the grid never reflows as images
                  load, and no project's interface is cropped beyond
                  recognition. */}
              <RevealImage className="relative aspect-[16/10] rounded-xl bg-line" delay={0}>
                <Image
                  src={p.thumbnail}
                  alt={p.thumbnailAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                />
              </RevealImage>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-ink">{p.name}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.summary}</p>
                </div>
                <ArrowRight className="mt-1.5 shrink-0 text-muted transition-colors group-hover:text-accent-ink" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                <span>{p.industry}</span>
                <span aria-hidden="true" className="text-line">
                  /
                </span>
                <span>{p.year}</span>
                {p.caseStudy && (
                  <>
                    <span aria-hidden="true" className="text-line">
                      /
                    </span>
                    <span className="text-accent-ink">Case study</span>
                  </>
                )}
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </>
  );
}
