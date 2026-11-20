import type { Permission } from "@/crm/auth/permissions";

/**
 * Sidebar modules, in the order the spec lists them. `requires` lists
 * permissions of which the user needs at least one; modules without it are
 * open to every employee because everyone has their own records there
 * (own attendance, own payslips, own reviews…). Hiding a link is a UX
 * nicety only — each page and action re-checks on the server.
 */
export type NavKey =
  | "dashboard"
  | "employees"
  | "attendance"
  | "leave"
  | "wfh"
  | "tasks"
  | "payroll"
  | "performance"
  | "recruitment"
  | "documents"
  | "calendar"
  | "announcements"
  | "reports"
  | "settings";

export const NAV: { key: NavKey; label: string; href: string; requires?: Permission[] }[] = [
  { key: "dashboard", label: "Dashboard", href: "/crm" },
  { key: "employees", label: "Employees", href: "/crm/employees" },
  { key: "attendance", label: "Attendance", href: "/crm/attendance" },
  { key: "leave", label: "Leave Management", href: "/crm/leave" },
  { key: "wfh", label: "Work From Home", href: "/crm/wfh" },
  { key: "tasks", label: "Tasks & Projects", href: "/crm/tasks" },
  { key: "payroll", label: "Payroll", href: "/crm/payroll" },
  { key: "performance", label: "Performance", href: "/crm/performance" },
  { key: "recruitment", label: "Recruitment", href: "/crm/recruitment", requires: ["recruitment.manage", "onboarding.manage"] },
  { key: "documents", label: "Documents", href: "/crm/documents" },
  { key: "calendar", label: "Calendar", href: "/crm/calendar" },
  { key: "announcements", label: "Announcements", href: "/crm/announcements" },
  { key: "reports", label: "Reports", href: "/crm/reports", requires: ["reports.view_team", "reports.view_all", "payroll.view"] },
  {
    key: "settings",
    label: "Settings",
    href: "/crm/settings",
    requires: ["settings.manage", "roles.manage", "audit.view", "users.invite"],
  },
];

export function visibleNav(permissions: ReadonlySet<Permission>) {
  return NAV.filter((n) => !n.requires || n.requires.some((p) => permissions.has(p))).map(({ key, label, href }) => ({ key, label, href }));
}
