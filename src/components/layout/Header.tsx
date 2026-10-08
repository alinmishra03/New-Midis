"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ArrowRight } from "@/components/ui/Button";
import { LogoLink } from "@/components/ui/Logo";
import { nav } from "@/content/site";
import { hasPortfolio } from "@/content/work";
import { cn } from "@/lib/utils";

/*
 * "Our Work" is hidden until there is work to show. Sending a prospect to an
 * empty portfolio costs more confidence than a missing nav item, and the
 * item reappears automatically once projects are added.
 */
const visibleNav = nav.filter((item) => item.href !== "/work" || hasPortfolio);

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
   * Route change closes everything. Adjusted during render rather than in an
   * effect — React's documented pattern for resetting state when a value
   * changes, and it avoids a frame where the old menu is still open.
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  /* Escape closes; body scroll locks only for the mobile drawer. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenu(null);
      setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function openWithCancel(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  }

  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-[var(--dur-base)]",
        scrolled || openMenu
          ? "border-b border-line bg-paper/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-site">
        <div className="flex h-20 items-center justify-between gap-6">
          <LogoLink priority />

          {/* ------------------------------------------------ desktop nav */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {visibleNav.map((item) => {
                const hasMenu = "columns" in item && item.columns;
                return (
                  <li
                    key={item.label}
                    onMouseEnter={() => hasMenu && openWithCancel(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    {hasMenu ? (
                      <button
                        type="button"
                        aria-expanded={openMenu === item.label}
                        aria-haspopup="true"
                        onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                        className={cn(
                          "group/nav relative rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors",
                          "hover:text-ink",
                          active(item.href) ? "text-ink" : "text-ink/65",
                        )}
                      >
                        {item.label}
                        {/* Accent indicator: persistent when active, sweeping
                            in from the left on hover or keyboard focus. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute inset-x-4 -bottom-0.5 h-px origin-left bg-accent transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                            active(item.href)
                              ? "scale-x-100"
                              : "scale-x-0 group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100",
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "group/nav relative rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors hover:text-ink",
                          active(item.href) ? "text-ink" : "text-ink/65",
                        )}
                      >
                        {item.label}
                        {/* Accent indicator: persistent when active, sweeping
                            in from the left on hover or keyboard focus. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute inset-x-4 -bottom-0.5 h-px origin-left bg-accent transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                            active(item.href)
                              ? "scale-x-100"
                              : "scale-x-0 group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100",
                          )}
                        />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <Button href="/contact" variant="primary" magnetic>
              Start a Project
              <ArrowRight />
            </Button>
          </div>

          {/* ------------------------------------------------ mobile toggle */}
          <button
            type="button"
            className="lg:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full"
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

      {/* -------------------------------------------------- desktop mega menu */}
      {visibleNav.map((item) => {
        if (!("columns" in item) || !item.columns) return null;
        const isOpen = openMenu === item.label;
        return (
          <div
            key={`mega-${item.label}`}
            onMouseEnter={() => openWithCancel(item.label)}
            onMouseLeave={scheduleClose}
            className={cn(
              "absolute inset-x-0 top-full hidden origin-top border-b border-line bg-paper/95 backdrop-blur-xl lg:block",
              "transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
              isOpen
                ? "pointer-events-auto opacity-100 translate-y-0"
                : "pointer-events-none -translate-y-2 opacity-0",
            )}
            aria-hidden={!isOpen}
            data-mega-open={isOpen ? "true" : "false"}
          >
            <div className="container-site py-10">
              <div className="grid grid-cols-4 gap-8">
                {item.columns.map((col, i) => (
                  <div
                    key={col.heading || i}
                    className="mega-col"
                    style={{ "--col-delay": `${i * 55}ms` } as React.CSSProperties}
                  >
                    {col.heading && (
                      <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted">
                        {col.heading}
                      </p>
                    )}
                    <ul className="space-y-1">
                      {col.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            tabIndex={isOpen ? 0 : -1}
                            className="group flex items-center justify-between rounded-lg py-2 pr-2 text-[0.9375rem] text-ink/75 transition-colors hover:text-ink"
                          >
                            {link.label}
                            <ArrowRight className="opacity-0 transition-opacity group-hover:opacity-100 text-accent-ink" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* -------------------------------------------------- mobile drawer */}
      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto overscroll-contain bg-paper lg:hidden",
          "transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
          mobileOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
        aria-hidden={!mobileOpen}
      >
        <nav aria-label="Mobile" className="container-site py-8">
          <ul className="divide-y divide-line">
            {visibleNav.map((item) => (
              <li key={item.label} className="py-5">
                <Link
                  href={item.href}
                  tabIndex={mobileOpen ? 0 : -1}
                  className="block font-display text-[1.75rem] tracking-tight text-ink"
                >
                  {item.label}
                </Link>
                {"columns" in item && item.columns && (
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {item.columns.flatMap((c) => c.links).map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          tabIndex={mobileOpen ? 0 : -1}
                          className="block py-1 text-sm text-muted"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 pb-12">
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
    </header>
  );
}
