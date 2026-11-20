/**
 * The permission catalogue and the default permissions of each system role.
 *
 * Permissions describe what a role may do *beyond* its own records. Every
 * signed-in employee can always see and act on their own profile,
 * attendance, leave, tasks, payslips and documents; those checks are
 * ownership checks in the data layer, not permissions.
 *
 * "team" permissions are scoped to the people who report to the user,
 * directly or indirectly (crm/auth/scope.ts). "all" permissions are
 * company-wide.
 *
 * The catalogue is synced into the `permissions` table by the seed, and the
 * role→permission mapping is editable by a Super Admin in Settings → Roles.
 * The defaults below are what a fresh install starts with.
 */

export const PERMISSIONS = {
  // Employees
  "employees.view_team": { module: "Employees", description: "View full profiles of their team" },
  "employees.view_all": { module: "Employees", description: "View full profiles of every employee" },
  "employees.manage": {
    module: "Employees",
    description: "Add, edit, deactivate, import and export employee records",
  },
  "employees.view_personal": {
    module: "Employees",
    description: "See other employees' personal details (date of birth, address, emergency contact)",
  },
  "users.invite": { module: "Employees", description: "Create employee accounts and issue invite/reset links" },

  // Attendance
  "attendance.view_team": { module: "Attendance", description: "View their team's attendance" },
  "attendance.view_all": { module: "Attendance", description: "View everyone's attendance" },
  "attendance.approve_team": { module: "Attendance", description: "Approve attendance corrections for their team" },
  "attendance.manage": {
    module: "Attendance",
    description: "Correct any attendance record and approve any correction",
  },

  // Leave and WFH
  "leave.approve_team": { module: "Leave", description: "Approve or reject their team's leave and WFH requests" },
  "leave.manage": {
    module: "Leave",
    description: "Approve any leave/WFH request and adjust leave balances",
  },

  // Tasks and projects
  "projects.manage": { module: "Tasks & Projects", description: "Create projects and manage their members" },
  "tasks.view_all": { module: "Tasks & Projects", description: "View every project and task" },

  // Payroll
  "payroll.view": { module: "Payroll", description: "View salary structures, payroll runs and payslips" },
  "payroll.manage": {
    module: "Payroll",
    description: "Edit salary structures, create payroll runs and adjustments",
  },
  "payroll.approve": {
    module: "Payroll",
    description: "Approve payroll runs and adjustments, and mark them paid",
  },

  // Performance
  "performance.review_team": { module: "Performance", description: "Review and set goals for their team" },
  "performance.manage": { module: "Performance", description: "Manage review cycles and see every review" },

  // Recruitment and onboarding
  "recruitment.manage": { module: "Recruitment", description: "Manage job openings, candidates and interviews" },
  "onboarding.manage": { module: "Recruitment", description: "Run onboarding checklists for new joiners" },

  // Documents, calendar, communication
  "documents.manage": {
    module: "Documents",
    description: "Upload and manage any employee's documents and company policies",
  },
  "calendar.manage": { module: "Calendar", description: "Manage company holidays and company-wide events" },
  "announcements.publish": { module: "Announcements", description: "Create, edit and publish announcements" },

  // Reports
  "reports.view_team": { module: "Reports", description: "Reports for their team" },
  "reports.view_all": { module: "Reports", description: "Company-wide reports (excluding payroll)" },

  // Administration
  "settings.manage": {
    module: "Settings",
    description: "Company info, departments, designations, schedules, leave and attendance policies",
  },
  "roles.manage": { module: "Settings", description: "Change roles and their permissions; assign roles to users" },
  "audit.view": { module: "Settings", description: "View the audit log" },
} as const satisfies Record<string, { module: string; description: string }>;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const ROLE_KEYS = ["super_admin", "hr", "finance", "manager", "employee"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const SYSTEM_ROLES: Record<RoleKey, { name: string; description: string; permissions: Permission[] }> = {
  super_admin: {
    name: "Super Admin",
    description: "Complete system access. Cannot be restricted.",
    permissions: ALL_PERMISSIONS,
  },
  hr: {
    name: "HR",
    description: "Employee records and HR operations.",
    permissions: [
      "employees.view_team",
      "employees.view_all",
      "employees.manage",
      "employees.view_personal",
      "users.invite",
      "attendance.view_team",
      "attendance.view_all",
      "attendance.approve_team",
      "attendance.manage",
      "leave.approve_team",
      "leave.manage",
      "tasks.view_all",
      "payroll.view",
      "performance.review_team",
      "performance.manage",
      "recruitment.manage",
      "onboarding.manage",
      "documents.manage",
      "calendar.manage",
      "announcements.publish",
      "reports.view_team",
      "reports.view_all",
      "settings.manage",
    ],
  },
  finance: {
    name: "Finance",
    description: "Payroll and salary administration.",
    permissions: ["employees.view_all", "payroll.view", "payroll.manage", "payroll.approve", "reports.view_all"],
  },
  manager: {
    name: "Manager",
    description: "Team leads and managers: their team's attendance, leave, tasks and reviews.",
    permissions: [
      "employees.view_team",
      "attendance.view_team",
      "attendance.approve_team",
      "leave.approve_team",
      "projects.manage",
      "performance.review_team",
      "reports.view_team",
    ],
  },
  employee: {
    name: "Employee",
    description: "Their own records, plus company-wide resources.",
    permissions: [],
  },
};

/** Permission keys that can never be removed from the Super Admin role. */
export const LOCKED_ROLE: RoleKey = "super_admin";
