"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ArrowRight } from "@/components/ui/Button";
import { LogoLink } from "@/components/ui/Logo";
import { nav, type NavItem } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Primary navigation.
 *
 * Eight top-level items, five of which open a panel. The structure lives in
 * content/site.ts; nothing in this file knows the name of a service.
 *
 * LAYOUT. Logo, centred navigation, CTA — a three-column grid rather than
 * justify-between, so the menu is centred on the page rather than on
 * whatever space is left between two differently-sized neighbours.
 *
 * BREAKPOINT. The full menu needs real width: eight labels, five chevrons,
 * the logo lockup and the CTA. The switch to the drawer is at 1320px, which
 * was measured rather than guessed — at 1280px the menu, logo and CTA leave
 * about 40px of slack inside the content box, close enough that a font
 * fallback or a longer label collides. Below it the drawer is a full menu
 * rather than a squeezed one.
 *
 * Tailwind reads class names as literal strings out of this file, so the
 * breakpoint is written out at each use rather than built from a constant.
 *
 * PANELS. Each panel is a card anchored under its trigger, not a full-bleed
 * mega menu: these menus hold three to nine links, and a full-width sheet
 * for three links looks like a mistake. A panel that would run past the
 * viewport is nudged back inside by --nav-shift, measured when it opens.
 *
 * MOTION. Opacity and a few pixels of travel, on CSS transitions — there is
 * no JavaScript animation here at all, so opening a menu costs one class
 * change. globals.css flattens the durations under prefers-reduced-motion.
 *
 * A closed panel and the closed drawer are `inert`, which takes them out of
 * the tab order, out of the accessibility tree and out of hit-testing in
 * one attribute, instead of juggling tabIndex and aria-hidden by hand.
 */

/*
 * "Work" used to be filtered out of the navigation until `hasPortfolio`
 * flipped, because /work was then a noindexed empty state and sending a
 * prospect to it cost more than a missing nav item did.
 *
 * It is now the work landing page: it carries its own featured projects and
 * its own route to the portfolio, and it does not depend on
 * content/evidence.ts being populated. So there is nothing left to gate and
 * the navigation renders as written.
 */
const visibleNav = nav;

/** Matches the 1320px breakpoint used in the classes below. */
const DESKTOP_NAV = "(min-width: 1320px)";

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  /*
   * Where the drawer starts. Null until measured, so the server output and
   * the first client render match; the fallback is the pinned-header case.
   */
  const [drawerTop, setDrawerTop] = useState<number | null>(null);

  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ---------------------------------------------------------- scrolled */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
   * A route change closes everything. Adjusted during render rather than in
   * an effect — React's documented pattern for resetting state when a value
   * changes, and it avoids a frame where the old menu is still open.
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
    setOpenSections([]);
  }

  const closeAll = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
    setMobileOpen(false);
  }, []);

  /* ------------------------------------------- escape and outside click */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /* Escape from inside a panel returns focus to the trigger that opened
         it, which is where the reader was. */
      if (openMenu) triggerRefs.current[openMenu]?.focus();
      closeAll();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      /* The drawer is rendered outside <header>, so both have to count as
         "inside" or every tap in the drawer would close it. */
      if (headerRef.current?.contains(target)) return;
      if (drawerRef.current?.contains(target)) return;
      closeAll();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [openMenu, closeAll]);

  /* Crossing into desktop width must not leave a locked body behind. */
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_NAV);
    const onChange = () => {
      if (mql.matches) setMobileOpen(false);
      else setOpenMenu(null);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  /* ---------------------------------------------- drawer scroll locking */
  useEffect(() => {
    if (!mobileOpen) return;
    const { body, documentElement } = document;
    /* Compensating for the scrollbar keeps the page from jumping sideways
       the moment the drawer opens. */
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [mobileOpen]);

  /*
   * The drawer hangs off the bottom of the header rather than a fixed
   * offset, because the announcement bar above means the header only sits
   * at y=80 once the page has scrolled past it.
   */
  useEffect(() => {
    if (!mobileOpen) return;
    const measure = () => {
      const el = headerRef.current;
      if (el) setDrawerTop(Math.round(el.getBoundingClientRect().bottom));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mobileOpen]);

  /*
   * Keep an open panel inside the viewport. Written straight to the element
   * as a custom property rather than held in state, so nudging a panel does
   * not re-render the whole header.
   */
  useEffect(() => {
    if (!openMenu) return;
    const panel = panelRefs.current[openMenu];
    if (!panel) return;

    const clamp = () => {
      panel.style.setProperty("--nav-shift", "0px");
      const r = panel.getBoundingClientRect();
      const edge = 16;
      let dx = 0;
      if (r.left < edge) dx = edge - r.left;
      else if (r.right > window.innerWidth - edge) dx = window.innerWidth - edge - r.right;
      panel.style.setProperty("--nav-shift", `${Math.round(dx)}px`);
    };

    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [openMenu]);

  /* ------------------------------------------------------ hover intent */
  const openWithCancel = useCallback((label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    /* A short grace period, so the diagonal from trigger to panel does not
       close the menu under the pointer. */
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  }, []);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  /* ------------------------------------------------------ current page */
  const isCurrent = (item: NavItem) => {
    if (item.href === "/") return pathname === "/";
    const paths = item.match ?? [item.href];
    return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  };

  const toggleSection = (label: string) =>
    setOpenSections((open) =>
      open.includes(label) ? open.filter((l) => l !== label) : [...open, label],
    );

  const linkRow =
    "group/link flex items-center justify-between gap-6 rounded-lg px-3 py-2 text-[0.9375rem] " +
    "text-ink/75 transition-colors duration-[var(--dur-fast)] hover:bg-paper hover:text-ink " +
    "focus-visible:bg-paper focus-visible:text-ink";

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-[var(--dur-base)]",
          scrolled || openMenu || mobileOpen
            ? "border-b border-line bg-paper/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-site">
          {/* Logo | menu | CTA. Below the breakpoint the hidden cells drop out
              of the grid entirely and the toggle takes the second column. */}
          <div className="grid h-20 grid-cols-[auto_1fr] items-center gap-4 min-[1320px]:grid-cols-[auto_1fr_auto]">
            <LogoLink variant="lockup" priority />

            {/* ------------------------------------------------ desktop nav */}
            <nav aria-label="Main" className="hidden justify-self-center min-[1320px]:block">
              <ul className="flex items-center gap-0.5">
                {visibleNav.map((item) => {
                  const current = isCurrent(item);
                  const hasPanel = Boolean(item.columns?.length);
                  const isOpen = openMenu === item.label;
                  const slug = item.label.replace(/\W+/g, "-").toLowerCase();
                  const panelId = `nav-panel-${slug}`;

                  const face = cn(
                    "group/nav relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2",
                    "text-[0.9375rem] font-medium tracking-tight",
                    "transition-colors duration-[var(--dur-fast)] hover:text-ink",
                    current || isOpen ? "text-ink" : "text-ink/65",
                  );

                  /* Accent indicator: held while the page is current, sweeping
                     in from the left on hover, focus or an open panel. */
                  const indicator = (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3.5 bottom-0.5 h-[1.5px] origin-left rounded-full bg-accent",
                        "transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                        current || isOpen
                          ? "scale-x-100"
                          : "scale-x-0 group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100",
                      )}
                    />
                  );

                  return (
                    <li
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => hasPanel && openWithCancel(item.label)}
                      onMouseLeave={() => hasPanel && scheduleClose()}
                    >
                      {hasPanel ? (
                        <button
                          type="button"
                          ref={(el) => {
                            triggerRefs.current[item.label] = el;
                          }}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          aria-current={current ? "page" : undefined}
                          onClick={() => setOpenMenu(isOpen ? null : item.label)}
                          onKeyDown={(e) => {
                            if (e.key !== "ArrowDown") return;
                            e.preventDefault();
                            openWithCancel(item.label);
                            /* Next paint, so the panel is no longer inert. */
                            requestAnimationFrame(() =>
                              panelRefs.current[item.label]?.querySelector("a")?.focus(),
                            );
                          }}
                          className={face}
                        >
                          {item.label}
                          <Chevron
                            className={cn(
                              "h-3 w-3 text-ink/40 transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                              isOpen && "rotate-180 text-accent-ink",
                            )}
                          />
                          {indicator}
                        </button>
                      ) : (
                        <Link href={item.href} aria-current={current ? "page" : undefined} className={face}>
                          {item.label}
                          {indicator}
                        </Link>
                      )}

                      {/* ---------------------------------------- the panel */}
                      {hasPanel && (
                        <div
                          /*
                           * Positioning lives on this wrapper and the entrance
                           * on the card inside it, so the centring translate
                           * and the animation never fight over one transform.
                           * The wrapper's top padding is the hover-safe gap
                           * between trigger and card.
                           */
                          ref={(el) => {
                            panelRefs.current[item.label] = el;
                          }}
                          inert={!isOpen}
                          className="absolute left-1/2 top-full pt-3"
                          style={{ translate: "calc(-50% + var(--nav-shift, 0px)) 0" }}
                          onMouseEnter={() => openWithCancel(item.label)}
                          onMouseLeave={scheduleClose}
                        >
                          <div
                            id={panelId}
                            onBlur={(e) => {
                              /* Tabbing past the last link closes the panel
                                 rather than leaving it open behind the
                                 reader. */
                              const next = e.relatedTarget as Node | null;
                              if (!next) return;
                              if (e.currentTarget.contains(next)) return;
                              if (triggerRefs.current[item.label]?.contains(next)) return;
                              setOpenMenu(null);
                            }}
                            className={cn(
                              "rounded-2xl border border-line bg-surface p-3",
                              "shadow-[0_24px_60px_-32px_rgba(23,25,28,0.3)]",
                              "transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                              isOpen ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0",
                            )}
                          >
                            <div
                              className={cn(
                                "grid gap-x-6",
                                item.columns!.length > 1
                                  ? "w-[36rem] grid-cols-2"
                                  : "w-[17.5rem] grid-cols-1",
                              )}
                            >
                              {item.columns!.map((col, i) => (
                                <div key={col.heading || i}>
                                  {col.heading && (
                                    <p className="px-3 pb-1.5 pt-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted">
                                      {col.heading}
                                    </p>
                                  )}
                                  <ul>
                                    {col.links.map((link) => (
                                      <li key={link.href}>
                                        <Link href={link.href} className={linkRow}>
                                          <span>{link.label}</span>
                                          <ArrowRight className="shrink-0 -translate-x-1 text-accent-ink opacity-0 transition-[opacity,transform] duration-[var(--dur-fast)] group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100" />
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>

                            {item.overview && (
                              <div className="mt-2 border-t border-line pt-2">
                                <Link href={item.overview.href} className={cn(linkRow, "text-ink/60")}>
                                  <span>{item.overview.label}</span>
                                  <ArrowRight className="shrink-0 text-accent-ink transition-transform duration-[var(--dur-fast)] group-hover/link:translate-x-1" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/*
              CTA and toggle share the last cell, so the CTA survives the
              drawer breakpoint. Losing "Start a Project" from a 1280px
              laptop header would hide the conversion path on exactly the
              widths where there is room for it; only a phone, where the
              drawer carries it, drops it.
            */}
            <div className="flex items-center gap-1 justify-self-end">
              <Button href="/contact" variant="primary" magnetic className="hidden sm:inline-flex">
                Start a Project
                <ArrowRight />
              </Button>

              {/* -------------------------------------------- drawer toggle */}
              <button
                type="button"
                className={cn(
                  "-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full",
                  "transition-colors duration-[var(--dur-fast)] hover:bg-ink/5 min-[1320px]:hidden",
                )}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <span className="relative block h-3.5 w-6">
                  <span
                    className={cn(
                      "absolute left-0 h-px w-full bg-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                      mobileOpen ? "top-1.5 rotate-45" : "top-0",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 h-px w-full bg-ink transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                      mobileOpen ? "top-1.5 -rotate-45" : "top-3",
                    )}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*
        -------------------------------------------------- mobile drawer

        Outside <header> on purpose: the header carries a backdrop-filter
        while it is blurred, which would make it the containing block for
        this fixed panel and collapse it to the height of the header.
      */}
      <div
        ref={drawerRef}
        id="mobile-nav"
        inert={!mobileOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 overflow-y-auto overscroll-contain bg-paper",
          "transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
          mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          "min-[1320px]:hidden",
        )}
        style={{ top: drawerTop ?? "5rem" }}
      >
        <nav aria-label="Mobile" className="container-site py-6">
          <ul className="divide-y divide-line">
            {visibleNav.map((item) => {
              const current = isCurrent(item);
              const hasPanel = Boolean(item.columns?.length);
              const expanded = openSections.includes(item.label);
              const sectionId = `nav-section-${item.label.replace(/\W+/g, "-").toLowerCase()}`;
              const links = item.columns?.flatMap((c) => c.links) ?? [];

              /* An item with no panel is a plain destination. */
              if (!hasPanel) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex min-h-[3.25rem] items-center font-display text-[1.375rem] tracking-tight",
                        current ? "text-accent-ink" : "text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={sectionId}
                    onClick={() => toggleSection(item.label)}
                    className={cn(
                      "flex min-h-[3.25rem] w-full items-center justify-between gap-4 text-left",
                      "font-display text-[1.375rem] tracking-tight",
                      current ? "text-accent-ink" : "text-ink",
                    )}
                  >
                    {item.label}
                    <Chevron
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                        expanded && "rotate-180 text-accent-ink",
                      )}
                    />
                  </button>

                  {/*
                    0fr to 1fr, so the section animates to its own height
                    with no measurement and no fixed max-height to outgrow.
                  */}
                  <div
                    id={sectionId}
                    inert={!expanded}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                      expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <ul className="pb-3">
                        {links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="flex min-h-11 items-center border-l border-line pl-4 text-[0.9375rem] text-muted transition-colors hover:text-ink"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                        {item.overview && (
                          <li>
                            <Link
                              href={item.overview.href}
                              className="flex min-h-11 items-center gap-1.5 border-l border-line pl-4 text-[0.9375rem] text-accent-ink"
                            >
                              {item.overview.label}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 flex flex-col gap-3 pb-14">
            <Button href="/contact" variant="primary" size="lg" className="w-full">
              Start a Project
              <ArrowRight />
            </Button>
            <Button href="/tools/website-audit" variant="outline" size="lg" className="w-full">
              Get a free website audit
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
