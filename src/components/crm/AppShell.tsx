"use client";

import {
  Bell,
  Briefcase,
  Calendar,
  CalendarOff,
  ChartColumn,
  ChevronDown,
  Clock,
  FileText,
  House,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { logout } from "@/app/crm/(auth)/actions";
import { loadNotifications, markNotificationsRead, setTheme } from "@/app/crm/(app)/shell-actions";
import type { NavKey } from "@/crm/nav";
import { formatRelative } from "@/crm/lib/time";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { Avatar, Skeleton } from "./ui";

const ICONS: Record<NavKey, typeof Users> = {
  dashboard: LayoutDashboard,
  employees: Users,
  attendance: Clock,
  leave: CalendarOff,
  wfh: House,
  tasks: ListChecks,
  payroll: Wallet,
  performance: TrendingUp,
  recruitment: Briefcase,
  documents: FileText,
  calendar: Calendar,
  announcements: Megaphone,
  reports: ChartColumn,
  settings: Settings,
};

export type ShellUser = {
  name: string;
  email: string;
  roleName: string;
  photoFileId: string | null;
  theme: "light" | "dark" | "system";
};

function isActive(pathname: string, href: string) {
  return href === "/crm" ? pathname === "/crm" : pathname === href || pathname.startsWith(`${href}/`);
}

/*
 * Visual sections for the sidebar. They only add headings: the items keep
 * exactly the order, labels and links of NAV (crm/nav.ts), and only the
 * items the server already allowed for this user are passed in, so a
 * section with nothing visible is simply not shown. Any module not listed
 * here still appears, in a final section.
 */
const SECTIONS: { label: string | null; keys: NavKey[] }[] = [
  { label: null, keys: ["dashboard"] },
  { label: "People", keys: ["employees", "attendance", "leave", "wfh"] },
  { label: "Work", keys: ["tasks"] },
  { label: "HR & Finance", keys: ["payroll", "performance", "recruitment"] },
  { label: "Company", keys: ["documents", "calendar", "announcements"] },
  { label: "Insights & Admin", keys: ["reports", "settings"] },
];

type NavItem = { key: NavKey; label: string; href: string };

function groupNav(items: NavItem[]) {
  const listed = new Set(SECTIONS.flatMap((s) => s.keys));
  const groups = SECTIONS.map((s) => ({ label: s.label, items: items.filter((i) => s.keys.includes(i.key)) }));
  const rest = items.filter((i) => !listed.has(i.key));
  if (rest.length) groups.push({ label: "More", items: rest });
  return groups.filter((g) => g.items.length);
}

function NavList({ items, onNavigate, collapsed = false }: { items: NavItem[]; onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      {groupNav(items).map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label &&
            (collapsed ? (
              <div aria-hidden className="mx-auto mb-2 h-px w-6 bg-c-border" />
            ) : (
              <p className="mb-1 px-3 text-[0.6875rem] font-semibold tracking-[0.06em] text-c-subtle uppercase">{group.label}</p>
            ))}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.key] ?? LayoutDashboard;
              const active = isActive(pathname, item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-150",
                      collapsed ? "justify-center px-0" : "px-3",
                      active ? "bg-c-accent-soft text-c-fg" : "text-c-muted hover:bg-c-hover hover:text-c-fg",
                    )}
                  >
                    <Icon className={cn("size-[1.05rem] shrink-0 transition-colors", active ? "text-c-accent-text" : "text-c-subtle group-hover:text-c-muted")} />
                    <span className={cn("min-w-0 truncate", collapsed && "sr-only")}>{item.label}</span>
                    {active && <span aria-hidden className={cn("absolute top-2 bottom-2 w-[3px] rounded-r-full bg-c-accent", collapsed ? "-left-2" : "-left-3")} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

const SIDEBAR_COOKIE = "crm_sidebar";

/* ------------------------------------------------------------- dropdowns */

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const panel = "crm-enter absolute right-0 top-full z-50 mt-2 rounded-xl border border-c-border bg-c-surface shadow-c-lg";

type Notice = Awaited<ReturnType<typeof loadNotifications>>["items"][number];

function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notice[] | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const ref = useDismiss(open, () => setOpen(false));

  // Follow the server's count when the layout re-renders (e.g. after router.refresh()).
  const [seenInitial, setSeenInitial] = useState(initialUnread);
  if (seenInitial !== initialUnread) {
    setSeenInitial(initialUnread);
    setUnread(initialUnread);
  }

  const refresh = () =>
    start(async () => {
      const res = await loadNotifications();
      setItems(res.items);
      setUnread(res.unread);
    });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh();
        }}
        className="relative flex size-9 items-center justify-center rounded-lg text-c-muted hover:bg-c-hover hover:text-c-fg"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="size-[1.1rem]" />
        {unread > 0 && (
          <span className="tabular absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-c-accent px-1 text-[0.625rem] leading-4 font-semibold text-c-on-accent">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className={cn(panel, "w-[min(22rem,calc(100vw-1.5rem))] -right-12 sm:right-0")}>
          <div className="flex items-center justify-between border-b border-c-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-c-accent-text hover:underline"
                onClick={() =>
                  start(async () => {
                    await markNotificationsRead("all");
                    setItems((list) => list?.map((n) => ({ ...n, read: true })) ?? null);
                    setUnread(0);
                    router.refresh();
                  })
                }
              >
                Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-[22rem] overflow-y-auto">
            {items === null ? (
              <li role="status" aria-busy="true" className="space-y-4 px-4 py-4">
                <span className="sr-only">Loading…</span>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="mt-1 size-2 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5" style={{ width: `${80 - i * 15}%` }} />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </li>
            ) : items.length === 0 ? (
              <li className="px-4 py-8 text-center text-[0.8125rem] text-c-subtle">You&apos;re all caught up.</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b border-c-border last:border-0">
                  <button
                    type="button"
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-c-hover"
                    onClick={() =>
                      start(async () => {
                        if (!n.read) {
                          await markNotificationsRead([n.id]);
                          setUnread((u) => Math.max(0, u - 1));
                        }
                        setOpen(false);
                        if (n.link) router.push(n.link);
                        else router.refresh();
                      })
                    }
                  >
                    <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-c-accent")} />
                    <span className="min-w-0">
                      <span className={cn("block text-[0.8125rem]", n.read ? "text-c-muted" : "font-medium text-c-fg")}>{n.title}</span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-c-muted">{n.body}</span>}
                      <span className="mt-1 block text-[0.6875rem] text-c-subtle">{formatRelative(new Date(n.createdAt))}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <Link href="/crm/notifications" onClick={() => setOpen(false)} className="block border-t border-c-border px-4 py-2.5 text-center text-[0.8125rem] font-medium text-c-accent-text hover:bg-c-hover">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

const THEMES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

function ThemeSwitcher({ initial }: { initial: ShellUser["theme"] }) {
  const [theme, setLocal] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const Current = THEMES.find((t) => t.key === theme)!.icon;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-lg text-c-muted hover:bg-c-hover hover:text-c-fg"
        aria-label="Theme"
        aria-expanded={open}
      >
        <Current className="size-[1.1rem]" />
      </button>
      {open && (
        <div className={cn(panel, "w-40 p-1")} role="menu">
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.key}
              onClick={() => {
                setLocal(t.key);
                document.getElementById("crm-root")?.setAttribute("data-theme", t.key);
                setOpen(false);
                void setTheme(t.key);
              }}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-c-hover", theme === t.key ? "text-c-fg" : "text-c-muted")}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-c-hover"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={user.name} photoFileId={user.photoFileId} size={30} />
        <span className="hidden text-left md:block">
          <span className="block max-w-[10rem] truncate text-[0.8125rem] leading-tight font-medium">{user.name}</span>
          <span className="block text-[0.6875rem] leading-tight text-c-subtle">{user.roleName}</span>
        </span>
        <ChevronDown className="hidden size-4 text-c-subtle md:block" />
      </button>
      {open && (
        <div className={cn(panel, "w-60 p-1")} role="menu">
          <div className="border-b border-c-border px-3 py-2.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-c-muted">{user.email}</p>
          </div>
          <Link href="/crm/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-c-muted hover:bg-c-hover hover:text-c-fg" role="menuitem">
            <UserCog className="size-4" /> My profile & settings
          </Link>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-c-muted hover:bg-c-hover hover:text-c-fg" role="menuitem">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- shell */

export function AppShell({
  nav,
  user,
  unread,
  sidebarCollapsed = false,
  children,
}: {
  nav: NavItem[];
  user: ShellUser;
  unread: number;
  /** Desktop sidebar shown as icons only; remembered in a cookie so the first paint is already right. */
  sidebarCollapsed?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/crm; max-age=31536000; samesite=lax`;
  };
  // The drawer is open only for the page it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawer = drawerPath === pathname;
  const setDrawer = (open: boolean) => setDrawerPath(open ? pathname : null);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  // `rail` = the collapsed desktop sidebar (icons only). The mobile drawer is always full width.
  const sidebar = (onNavigate?: () => void, rail = false) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-c-border", rail ? "justify-center px-2" : "px-5")}>
        <Link href="/crm" onClick={onNavigate} aria-label="Dashboard" className="rounded-lg">
          <Brand compact={rail} />
        </Link>
      </div>
      <nav aria-label="Modules" className={cn("flex-1 overflow-x-hidden overflow-y-auto pt-4 pb-6", rail ? "px-2" : "px-3")}>
        <NavList items={nav} onNavigate={onNavigate} collapsed={rail} />
      </nav>
      {onNavigate ? (
        <div className="border-t border-c-border px-5 py-3 text-[0.6875rem] text-c-subtle">MIDIS Employee Portal</div>
      ) : (
        <div className={cn("flex items-center border-t border-c-border py-2", rail ? "justify-center px-2" : "justify-between pr-2 pl-5")}>
          {!rail && <span className="truncate text-[0.6875rem] text-c-subtle">MIDIS Employee Portal</span>}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-c-subtle transition-colors hover:bg-c-hover hover:text-c-fg"
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            title={rail ? "Expand sidebar" : "Collapse sidebar"}
          >
            {rail ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1">
      <a href="#crm-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:rounded-lg focus:bg-c-surface focus:px-4 focus:py-2 focus:shadow-c-lg">
        Skip to content
      </a>

      <aside className={cn("c-sidebar sticky top-0 hidden h-dvh shrink-0 border-r border-c-border bg-c-surface lg:block", collapsed ? "w-[4.25rem]" : "w-64")}>
        {sidebar(undefined, collapsed)}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setDrawer(false)} />
          <div className="crm-enter absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-c-border bg-c-surface shadow-c-lg">
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" className="absolute top-4 right-3 rounded-lg p-1.5 text-c-subtle hover:bg-c-hover hover:text-c-fg">
              <X className="size-5" />
            </button>
            {sidebar(() => setDrawer(false))}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-c-border bg-c-surface/90 px-3 backdrop-blur sm:gap-3 sm:px-6">
          <button type="button" onClick={() => setDrawer(true)} className="flex size-9 items-center justify-center rounded-lg text-c-muted hover:bg-c-hover lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </button>
          <form action="/crm/search" role="search" className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-c-subtle" />
            <input
              type="search"
              name="q"
              placeholder="Search people, projects, tasks…"
              aria-label="Search"
              className="h-9 w-full rounded-lg border border-c-border bg-c-surface-2 pr-3 pl-9 text-sm text-c-fg placeholder:text-c-subtle focus:border-c-accent focus:bg-c-surface focus:ring-3 focus:ring-c-accent/20 focus:outline-none"
            />
          </form>
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <NotificationBell initialUnread={unread} />
            <ThemeSwitcher initial={user.theme} />
            <UserMenu user={user} />
          </div>
        </header>
        <main id="crm-main" className="crm-enter w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
