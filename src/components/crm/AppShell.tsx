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
import { Avatar } from "./ui";

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

function NavList({ items, onNavigate }: { items: { key: NavKey; label: string; href: string }[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.key];
        const active = isActive(pathname, item.href);
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-c-accent-soft text-c-fg" : "text-c-muted hover:bg-c-hover hover:text-c-fg",
              )}
            >
              <Icon className={cn("size-[1.05rem] shrink-0", active ? "text-c-accent-text" : "text-c-subtle group-hover:text-c-muted")} />
              {item.label}
              {active && <span aria-hidden className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-c-accent" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

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
              <li className="px-4 py-8 text-center text-[0.8125rem] text-c-subtle">Loading…</li>
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
  children,
}: {
  nav: { key: NavKey; label: string; href: string }[];
  user: ShellUser;
  unread: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
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

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/crm" onClick={onNavigate} aria-label="Dashboard">
          <Brand />
        </Link>
      </div>
      <nav aria-label="Modules" className="flex-1 overflow-y-auto px-3 pb-6">
        <NavList items={nav} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-c-border px-5 py-3 text-[0.6875rem] text-c-subtle">MIDIS Employee Portal</div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1">
      <a href="#crm-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:rounded-lg focus:bg-c-surface focus:px-4 focus:py-2 focus:shadow-c-lg">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-c-border bg-c-surface lg:block">{sidebar()}</aside>

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
