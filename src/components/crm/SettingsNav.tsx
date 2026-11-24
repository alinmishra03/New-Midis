import { Tabs } from "./ui";

export type SettingsSection = "company" | "organisation" | "policies" | "users" | "roles" | "audit" | "email";

/** Sub-navigation for Settings, showing only the sections the viewer can manage. */
export function SettingsNav({ active, perms }: { active: SettingsSection; perms: { settings: boolean; users: boolean; roles: boolean; audit: boolean; /** Super Admin only. */ email?: boolean } }) {
  const tabs = [
    ...(perms.settings
      ? [
          { key: "company", label: "Company", href: "/crm/settings" },
          { key: "organisation", label: "Departments & designations", href: "/crm/settings/organisation" },
          { key: "policies", label: "Policies & schedules", href: "/crm/settings/policies" },
        ]
      : []),
    ...(perms.users || perms.roles ? [{ key: "users", label: "Users & access", href: "/crm/settings/users" }] : []),
    ...(perms.roles ? [{ key: "roles", label: "Roles & permissions", href: "/crm/settings/roles" }] : []),
    ...(perms.audit ? [{ key: "audit", label: "Audit log", href: "/crm/settings/audit" }] : []),
    ...(perms.email ? [{ key: "email", label: "Email", href: "/crm/settings/email" }] : []),
  ];
  return <Tabs tabs={tabs} active={active} />;
}
