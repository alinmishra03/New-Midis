/**
 * MIDIS CRM / HRMS database schema (PostgreSQL, Drizzle ORM).
 *
 * Conventions
 * - Primary keys are UUIDs, except join tables (composite keys) and the
 *   append-only audit log (bigserial, so it sorts by insertion cheaply).
 * - Every instant is `timestamptz` and stored in UTC. "Which day was this?"
 *   questions use a `date` column computed in the company timezone at write
 *   time (see crm/lib/time.ts), so reports never re-derive it.
 * - Money is `numeric(12,2)` and handled as strings in TypeScript, never
 *   floats.
 * - Status columns are Postgres enums, so the database rejects values the
 *   application does not know about.
 *
 * Migrations are generated from this file by drizzle-kit into /drizzle.
 */
import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const ts = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

/* ========================================================================== */
/* Enums                                                                      */
/* ========================================================================== */

export const userStatus = pgEnum("user_status", ["invited", "active", "disabled"]);
export const authTokenType = pgEnum("auth_token_type", ["invite", "password_reset"]);
export const employmentStatus = pgEnum("employment_status", [
  "probation",
  "active",
  "notice",
  "exited",
]);
export const employmentType = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "intern",
]);
export const workMode = pgEnum("work_mode", ["office", "remote"]);
export const attendanceStatus = pgEnum("attendance_status", [
  "present",
  "half_day",
  "absent",
  "incomplete",
]);
export const requestStatus = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);
export const halfDaySession = pgEnum("half_day_session", ["none", "first_half", "second_half"]);
export const holidayType = pgEnum("holiday_type", ["public", "optional"]);
export const projectStatus = pgEnum("project_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
]);
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "review", "completed"]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const payrollRunStatus = pgEnum("payroll_run_status", ["draft", "approved", "paid"]);
export const adjustmentType = pgEnum("adjustment_type", ["bonus", "allowance", "deduction"]);
export const reviewCycleType = pgEnum("review_cycle_type", ["monthly", "quarterly", "annual"]);
export const reviewStatus = pgEnum("review_status", [
  "self_assessment",
  "manager_review",
  "completed",
]);
export const goalStatus = pgEnum("goal_status", ["not_started", "in_progress", "achieved", "missed"]);
export const jobStatus = pgEnum("job_status", ["draft", "open", "on_hold", "closed"]);
export const candidateStage = pgEnum("candidate_stage", [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
]);
export const interviewStatus = pgEnum("interview_status", ["scheduled", "completed", "cancelled"]);
export const interviewRecommendation = pgEnum("interview_recommendation", [
  "strong_hire",
  "hire",
  "hold",
  "no_hire",
]);
export const onboardingCategory = pgEnum("onboarding_category", [
  "documents",
  "accounts",
  "department",
  "manager",
  "formalities",
]);
export const documentCategory = pgEnum("document_category", [
  "offer_letter",
  "agreement",
  "policy",
  "id_proof",
  "certificate",
  "payslip",
  "other",
]);
export const documentVisibility = pgEnum("document_visibility", [
  /** The employee it belongs to, plus HR. */
  "employee",
  /** HR only — e.g. background verification notes. */
  "hr_only",
  /** Every signed-in employee — company policies. */
  "company",
]);
export const announcementCategory = pgEnum("announcement_category", [
  "company",
  "hr",
  "department",
  "notice",
  "policy",
  "event",
  "celebration",
]);
export const announcementStatus = pgEnum("announcement_status", ["draft", "published"]);
export const meetingScope = pgEnum("meeting_scope", ["private", "team", "company"]);

/* ========================================================================== */
/* Company configuration                                                      */
/* ========================================================================== */

/**
 * A single row (id = 1) of company-wide settings. Structured sub-settings
 * (payroll, notifications) are JSON because they are read and written as a
 * unit by the settings screens and validated by zod on the way in.
 */
export const companySettings = pgTable(
  "company_settings",
  {
    id: smallint("id").primaryKey().default(1),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    currency: text("currency").notNull().default("INR"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    /** Prefix for generated employee codes, e.g. MID → MID-0001. */
    employeeCodePrefix: text("employee_code_prefix").notNull().default("MID"),
    /** Month (1–12) the leave year starts in. */
    leaveYearStartMonth: smallint("leave_year_start_month").notNull().default(1),
    payroll: jsonb("payroll")
      .$type<{
        /** Off by default: no loss-of-pay deduction is computed unless HR enables it. */
        lossOfPayEnabled: boolean;
        payDay: number;
        /** Statutory/standard deductions applied to every payslip, as a % of basic. */
        standardDeductions: { label: string; percentOfBasic: number }[];
      }>()
      .notNull()
      .default({ lossOfPayEnabled: false, payDay: 1, standardDeductions: [] }),
    notifications: jsonb("notifications")
      .$type<{
        meetingReminderMinutes: number;
        taskDueReminderDays: number;
        birthdayAnnouncements: boolean;
      }>()
      .notNull()
      .default({ meetingReminderMinutes: 30, taskDueReminderDays: 1, birthdayAnnouncements: true }),
    updatedAt: updatedAt(),
  },
  (t) => [check("company_settings_singleton", sql`${t.id} = 1`)],
);

export const departments = pgTable("departments", {
  id: id(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const designations = pgTable(
  "designations",
  {
    id: id(),
    title: text("title").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    level: smallint("level").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("designations_title_department_uq").on(t.title, t.departmentId)],
);

/**
 * Working hours and the attendance rules that go with them. HR can define
 * several (e.g. a night shift) and assign one per employee; the row marked
 * default applies to everyone else.
 */
export const workSchedules = pgTable("work_schedules", {
  id: id(),
  name: text("name").notNull().unique(),
  isDefault: boolean("is_default").notNull().default(false),
  /** Local wall-clock times in the company timezone, "HH:MM". */
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  /** ISO weekdays that are working days: 1 = Monday … 7 = Sunday. */
  workingDays: smallint("working_days").array().notNull(),
  /** Minutes after start before a check-in counts as late. */
  lateGraceMinutes: smallint("late_grace_minutes").notNull().default(15),
  /** Minutes before end that a check-out may be without counting as early. */
  earlyLeaveGraceMinutes: smallint("early_leave_grace_minutes").notNull().default(15),
  /** Worked minutes needed for a full day; below this but above half → half day. */
  fullDayMinutes: smallint("full_day_minutes").notNull().default(480),
  halfDayMinutes: smallint("half_day_minutes").notNull().default(240),
  /** Unpaid break allowance; longer breaks are still deducted from worked time. */
  breakAllowanceMinutes: smallint("break_allowance_minutes").notNull().default(60),
  /** Whether employees may check in with work mode "remote" without an approved WFH. */
  allowUnplannedRemote: boolean("allow_unplanned_remote").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const holidays = pgTable(
  "holidays",
  {
    id: id(),
    date: date("date").notNull(),
    name: text("name").notNull(),
    type: holidayType("type").notNull().default("public"),
    description: text("description"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("holidays_date_name_uq").on(t.date, t.name), index("holidays_date_idx").on(t.date)],
);

/* ========================================================================== */
/* Identity, roles and permissions                                            */
/* ========================================================================== */

export const roles = pgTable("roles", {
  id: id(),
  /** Stable identifier used in code: super_admin, hr, finance, manager, employee. */
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /** System roles cannot be deleted or renamed; their permissions can be edited (except super_admin). */
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** The permission catalogue. Rows are synced from code (crm/auth/permissions.ts). */
export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
  module: text("module").notNull(),
  description: text("description").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionKey] })],
);

export const users = pgTable(
  "users",
  {
    id: id(),
    /** Always stored lower-cased. */
    email: text("email").notNull(),
    /** Null until the invite is accepted and a password is set. */
    passwordHash: text("password_hash"),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: userStatus("status").notNull().default("invited"),
    failedLoginCount: smallint("failed_login_count").notNull().default(0),
    lockedUntil: ts("locked_until"),
    lastLoginAt: ts("last_login_at"),
    passwordChangedAt: ts("password_changed_at"),
    /** UI preference only: "light" | "dark" | "system". */
    theme: text("theme").notNull().default("system"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    check("users_email_lowercase", sql`${t.email} = lower(${t.email})`),
  ],
);

/**
 * Database sessions. The cookie carries a random 256-bit token; only its
 * SHA-256 is stored here, so a database read does not yield usable sessions.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
    remember: boolean("remember").notNull().default(false),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

/** One-time invite and password-reset tokens (hashed, single use, expiring). */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenType("type").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

/**
 * "Forgot password" requests. There is no outbound email yet, so a request
 * is queued for HR/Admin, who issue a one-time reset link from the CRM.
 */
export const passwordResetRequests = pgTable(
  "password_reset_requests",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: requestStatus("status").notNull().default("pending"),
    handledById: uuid("handled_by_id").references(() => users.id, { onDelete: "set null" }),
    handledAt: ts("handled_at"),
    createdAt: createdAt(),
  },
  (t) => [index("password_reset_requests_status_idx").on(t.status)],
);

/* ========================================================================== */
/* Files (private storage metadata)                                           */
/* ========================================================================== */

/**
 * Metadata for every stored file. The bytes live in private storage (Vercel
 * Blob in production, local disk in development) under `storageKey`, and are
 * only ever served through a permission-checked route — never a public URL.
 */
export const files = pgTable("files", {
  id: id(),
  storageKey: text("storage_key").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/* ========================================================================== */
/* Employees                                                                  */
/* ========================================================================== */

export const employees = pgTable(
  "employees",
  {
    id: id(),
    userId: uuid("user_id")
      .unique()
      .references(() => users.id, { onDelete: "set null" }),
    employeeCode: text("employee_code").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull().default(""),
    officialEmail: text("official_email").notNull().unique(),
    phone: text("phone"),
    photoFileId: uuid("photo_file_id").references(() => files.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    designationId: uuid("designation_id").references(() => designations.id, { onDelete: "set null" }),
    managerId: uuid("manager_id").references((): AnyPgColumn => employees.id, { onDelete: "set null" }),
    workScheduleId: uuid("work_schedule_id").references(() => workSchedules.id, {
      onDelete: "set null",
    }),
    joiningDate: date("joining_date").notNull(),
    exitDate: date("exit_date"),
    employmentStatus: employmentStatus("employment_status").notNull().default("probation"),
    employmentType: employmentType("employment_type").notNull().default("full_time"),
    workLocation: text("work_location"),
    skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
    bio: text("bio"),

    /* Personal details — visible to the employee and HR only. */
    dateOfBirth: date("date_of_birth"),
    gender: text("gender"),
    maritalStatus: text("marital_status"),
    personalEmail: text("personal_email"),
    addressLine: text("address_line"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactRelation: text("emergency_contact_relation"),
    emergencyContactPhone: text("emergency_contact_phone"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("employees_department_idx").on(t.departmentId),
    index("employees_manager_idx").on(t.managerId),
    index("employees_status_idx").on(t.employmentStatus),
    check("employees_not_own_manager", sql`${t.managerId} is null or ${t.managerId} <> ${t.id}`),
  ],
);

/**
 * Salary structure history. The row with the latest `effectiveFrom` on or
 * before a date is the structure in force on that date. Deductions here are
 * only the ones HR/Finance explicitly configured for this employee.
 */
export const salaryStructures = pgTable(
  "salary_structures",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from").notNull(),
    currency: text("currency").notNull().default("INR"),
    /** Monthly amounts. */
    basic: money("basic").notNull(),
    hra: money("hra").notNull().default("0"),
    allowances: jsonb("allowances").$type<{ label: string; amount: string }[]>().notNull().default([]),
    deductions: jsonb("deductions").$type<{ label: string; amount: string }[]>().notNull().default([]),
    notes: text("notes"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("salary_structures_employee_effective_uq").on(t.employeeId, t.effectiveFrom)],
);

/* ========================================================================== */
/* Attendance                                                                 */
/* ========================================================================== */

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    /** The working day in the company timezone. One record per employee per day. */
    workDate: date("work_date").notNull(),
    checkInAt: ts("check_in_at"),
    checkOutAt: ts("check_out_at"),
    workMode: workMode("work_mode").notNull().default("office"),
    status: attendanceStatus("status").notNull().default("incomplete"),
    lateMinutes: smallint("late_minutes").notNull().default(0),
    earlyLeaveMinutes: smallint("early_leave_minutes").notNull().default(0),
    breakMinutes: smallint("break_minutes").notNull().default(0),
    workedMinutes: smallint("worked_minutes").notNull().default(0),
    note: text("note"),
    /** Set when HR or an approved correction last changed the times. */
    correctedAt: ts("corrected_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("attendance_employee_date_uq").on(t.employeeId, t.workDate),
    index("attendance_date_idx").on(t.workDate),
    check(
      "attendance_checkout_after_checkin",
      sql`${t.checkOutAt} is null or (${t.checkInAt} is not null and ${t.checkOutAt} >= ${t.checkInAt})`,
    ),
  ],
);

export const attendanceBreaks = pgTable(
  "attendance_breaks",
  {
    id: id(),
    attendanceId: uuid("attendance_id")
      .notNull()
      .references(() => attendanceRecords.id, { onDelete: "cascade" }),
    startAt: ts("start_at").notNull(),
    endAt: ts("end_at"),
  },
  (t) => [
    index("attendance_breaks_attendance_idx").on(t.attendanceId),
    // At most one open break per day.
    uniqueIndex("attendance_breaks_one_open_uq").on(t.attendanceId).where(sql`${t.endAt} is null`),
  ],
);

/** Employee-requested corrections. Approved ones are applied and keep the before/after values. */
export const attendanceCorrections = pgTable(
  "attendance_corrections",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    workDate: date("work_date").notNull(),
    requestedCheckInAt: ts("requested_check_in_at"),
    requestedCheckOutAt: ts("requested_check_out_at"),
    reason: text("reason").notNull(),
    status: requestStatus("status").notNull().default("pending"),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    reviewComment: text("review_comment"),
    reviewedAt: ts("reviewed_at"),
    previousValues: jsonb("previous_values").$type<{
      checkInAt: string | null;
      checkOutAt: string | null;
    } | null>(),
    createdAt: createdAt(),
  },
  (t) => [
    index("attendance_corrections_employee_idx").on(t.employeeId),
    index("attendance_corrections_status_idx").on(t.status),
  ],
);

/* ========================================================================== */
/* Leave and work from home                                                   */
/* ========================================================================== */

export const leaveTypes = pgTable("leave_types", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /** Days granted per leave year. Null = unlimited (e.g. unpaid leave). */
  annualQuota: numeric("annual_quota", { precision: 5, scale: 1 }),
  isPaid: boolean("is_paid").notNull().default(true),
  allowHalfDay: boolean("allow_half_day").notNull().default(true),
  /** Requests longer than this many days need a supporting document. Null = never. */
  documentRequiredAfterDays: smallint("document_required_after_days"),
  maxCarryForward: numeric("max_carry_forward", { precision: 5, scale: 1 }).notNull().default("0"),
  color: text("color").notNull().default("#ef8716"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: smallint("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "cascade" }),
    /** The leave year, named by the calendar year it starts in. */
    year: smallint("year").notNull(),
    allocated: numeric("allocated", { precision: 5, scale: 1 }).notNull().default("0"),
    carriedForward: numeric("carried_forward", { precision: 5, scale: 1 }).notNull().default("0"),
    /** Manual HR adjustment (+/-), always audit-logged. */
    adjustment: numeric("adjustment", { precision: 5, scale: 1 }).notNull().default("0"),
    used: numeric("used", { precision: 5, scale: 1 }).notNull().default("0"),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("leave_balances_uq").on(t.employeeId, t.leaveTypeId, t.year)],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    halfDay: halfDaySession("half_day").notNull().default("none"),
    /** Working days requested, excluding weekends and holidays. */
    days: numeric("days", { precision: 5, scale: 1 }).notNull(),
    reason: text("reason").notNull(),
    documentFileId: uuid("document_file_id").references(() => files.id, { onDelete: "set null" }),
    status: requestStatus("status").notNull().default("pending"),
    approverId: uuid("approver_id").references(() => users.id, { onDelete: "set null" }),
    decisionComment: text("decision_comment"),
    decidedAt: ts("decided_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("leave_requests_employee_idx").on(t.employeeId),
    index("leave_requests_status_idx").on(t.status),
    index("leave_requests_dates_idx").on(t.startDate, t.endDate),
    check("leave_requests_dates_ordered", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const wfhRequests = pgTable(
  "wfh_requests",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason").notNull(),
    status: requestStatus("status").notNull().default("pending"),
    approverId: uuid("approver_id").references(() => users.id, { onDelete: "set null" }),
    decisionComment: text("decision_comment"),
    decidedAt: ts("decided_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("wfh_requests_employee_idx").on(t.employeeId),
    index("wfh_requests_status_idx").on(t.status),
    check("wfh_requests_dates_ordered", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

/* ========================================================================== */
/* Projects and tasks                                                         */
/* ========================================================================== */

export const projects = pgTable(
  "projects",
  {
    id: id(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    description: text("description"),
    status: projectStatus("status").notNull().default("planning"),
    ownerId: uuid("owner_id").references(() => employees.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_status_idx").on(t.status)],
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    isLead: boolean("is_lead").notNull().default(false),
    addedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.employeeId] }), index("project_members_employee_idx").on(t.employeeId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatus("status").notNull().default("todo"),
    priority: taskPriority("priority").notNull().default("medium"),
    assigneeId: uuid("assignee_id").references(() => employees.id, { onDelete: "set null" }),
    createdById: uuid("created_by_id").references(() => employees.id, { onDelete: "set null" }),
    dueDate: date("due_date"),
    progress: smallint("progress").notNull().default(0),
    completedAt: ts("completed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_assignee_idx").on(t.assigneeId),
    index("tasks_project_idx").on(t.projectId),
    index("tasks_status_idx").on(t.status),
    check("tasks_progress_range", sql`${t.progress} between 0 and 100`),
  ],
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => employees.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("task_comments_task_idx").on(t.taskId)],
);

export const taskAttachments = pgTable(
  "task_attachments",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.fileId] })],
);

/* ========================================================================== */
/* Payroll                                                                    */
/* ========================================================================== */

/**
 * One payroll run per month. Payslips are generated while it is a draft and
 * only become visible to employees once someone with payroll.approve has
 * approved the run — nothing is deducted or paid without that approval.
 */
export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: id(),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
    status: payrollRunStatus("status").notNull().default("draft"),
    notes: text("notes"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    approvedById: uuid("approved_by_id").references(() => users.id, { onDelete: "set null" }),
    approvedAt: ts("approved_at"),
    paidAt: ts("paid_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("payroll_runs_period_uq").on(t.year, t.month),
    check("payroll_runs_month_range", sql`${t.month} between 1 and 12`),
  ],
);

/** One-off bonuses, allowances and deductions, each needing approval before payroll uses it. */
export const payrollAdjustments = pgTable(
  "payroll_adjustments",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
    type: adjustmentType("type").notNull(),
    label: text("label").notNull(),
    amount: money("amount").notNull(),
    status: requestStatus("status").notNull().default("pending"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    approvedById: uuid("approved_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("payroll_adjustments_period_idx").on(t.year, t.month),
    check("payroll_adjustments_amount_positive", sql`${t.amount} > 0`),
  ],
);

export const payslips = pgTable(
  "payslips",
  {
    id: id(),
    runId: uuid("run_id")
      .notNull()
      .references(() => payrollRuns.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("INR"),
    workingDays: smallint("working_days").notNull(),
    paidDays: numeric("paid_days", { precision: 5, scale: 1 }).notNull(),
    earnings: jsonb("earnings").$type<{ label: string; amount: string }[]>().notNull(),
    deductions: jsonb("deductions").$type<{ label: string; amount: string }[]>().notNull(),
    grossEarnings: money("gross_earnings").notNull(),
    totalDeductions: money("total_deductions").notNull(),
    netPay: money("net_pay").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("payslips_run_employee_uq").on(t.runId, t.employeeId),
    index("payslips_employee_idx").on(t.employeeId),
  ],
);

/* ========================================================================== */
/* Performance                                                                */
/* ========================================================================== */

export const reviewCycles = pgTable("review_cycles", {
  id: id(),
  name: text("name").notNull(),
  type: reviewCycleType("type").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: createdAt(),
});

export const performanceReviews = pgTable(
  "performance_reviews",
  {
    id: id(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => reviewCycles.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id").references(() => employees.id, { onDelete: "set null" }),
    status: reviewStatus("status").notNull().default("self_assessment"),
    selfRating: smallint("self_rating"),
    selfAssessment: text("self_assessment"),
    achievements: text("achievements"),
    managerRating: smallint("manager_rating"),
    managerFeedback: text("manager_feedback"),
    selfSubmittedAt: ts("self_submitted_at"),
    completedAt: ts("completed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("performance_reviews_cycle_employee_uq").on(t.cycleId, t.employeeId),
    check("performance_reviews_self_rating", sql`${t.selfRating} is null or ${t.selfRating} between 1 and 5`),
    check(
      "performance_reviews_manager_rating",
      sql`${t.managerRating} is null or ${t.managerRating} between 1 and 5`,
    ),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id").references(() => reviewCycles.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: date("due_date"),
    status: goalStatus("status").notNull().default("not_started"),
    progress: smallint("progress").notNull().default(0),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("goals_employee_idx").on(t.employeeId), check("goals_progress_range", sql`${t.progress} between 0 and 100`)],
);

/* ========================================================================== */
/* Recruitment and onboarding                                                 */
/* ========================================================================== */

export const jobOpenings = pgTable(
  "job_openings",
  {
    id: id(),
    title: text("title").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    location: text("location"),
    employmentType: employmentType("employment_type").notNull().default("full_time"),
    description: text("description"),
    positions: smallint("positions").notNull().default(1),
    status: jobStatus("status").notNull().default("draft"),
    hiringManagerId: uuid("hiring_manager_id").references(() => employees.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("job_openings_status_idx").on(t.status)],
);

export const candidates = pgTable(
  "candidates",
  {
    id: id(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobOpenings.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    source: text("source"),
    resumeFileId: uuid("resume_file_id").references(() => files.id, { onDelete: "set null" }),
    stage: candidateStage("stage").notNull().default("applied"),
    notes: text("notes"),
    /** Set when the candidate is hired and converted into an employee. */
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("candidates_job_idx").on(t.jobId), index("candidates_stage_idx").on(t.stage)],
);

export const interviews = pgTable(
  "interviews",
  {
    id: id(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    interviewerId: uuid("interviewer_id").references(() => employees.id, { onDelete: "set null" }),
    scheduledAt: ts("scheduled_at").notNull(),
    durationMinutes: smallint("duration_minutes").notNull().default(45),
    mode: text("mode").notNull().default("video"),
    location: text("location"),
    status: interviewStatus("status").notNull().default("scheduled"),
    rating: smallint("rating"),
    recommendation: interviewRecommendation("recommendation"),
    feedback: text("feedback"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("interviews_candidate_idx").on(t.candidateId), index("interviews_scheduled_idx").on(t.scheduledAt)],
);

export const onboardingTasks = pgTable(
  "onboarding_tasks",
  {
    id: id(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: onboardingCategory("category").notNull(),
    sortOrder: smallint("sort_order").notNull().default(0),
    dueDate: date("due_date"),
    completedAt: ts("completed_at"),
    completedById: uuid("completed_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("onboarding_tasks_employee_idx").on(t.employeeId)],
);

/* ========================================================================== */
/* Documents                                                                  */
/* ========================================================================== */

export const documents = pgTable(
  "documents",
  {
    id: id(),
    /** Null for company-wide documents such as policies. */
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }),
    category: documentCategory("category").notNull(),
    title: text("title").notNull(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    visibility: documentVisibility("visibility").notNull().default("employee"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("documents_employee_idx").on(t.employeeId), index("documents_category_idx").on(t.category)],
);

/* ========================================================================== */
/* Communication                                                              */
/* ========================================================================== */

export const announcements = pgTable(
  "announcements",
  {
    id: id(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    category: announcementCategory("category").notNull().default("company"),
    /** Set for department-specific announcements; null = everyone. */
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "cascade" }),
    isPinned: boolean("is_pinned").notNull().default(false),
    isImportant: boolean("is_important").notNull().default(false),
    status: announcementStatus("status").notNull().default("draft"),
    publishedAt: ts("published_at"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("announcements_published_idx").on(t.status, t.publishedAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    /** In-app path to open, e.g. /crm/leave. */
    link: text("link"),
    /** Makes reminder generation idempotent: one notification per key. */
    dedupeKey: text("dedupe_key"),
    readAt: ts("read_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_user_unread_idx").on(t.userId, t.readAt),
    uniqueIndex("notifications_dedupe_uq").on(t.userId, t.dedupeKey),
  ],
);

export const meetings = pgTable(
  "meetings",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description"),
    startAt: ts("start_at").notNull(),
    endAt: ts("end_at").notNull(),
    location: text("location"),
    meetingLink: text("meeting_link"),
    scope: meetingScope("scope").notNull().default("private"),
    organizerId: uuid("organizer_id").references(() => employees.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("meetings_start_idx").on(t.startAt),
    check("meetings_end_after_start", sql`${t.endAt} > ${t.startAt}`),
  ],
);

export const meetingParticipants = pgTable(
  "meeting_participants",
  {
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.meetingId, t.employeeId] }), index("meeting_participants_employee_idx").on(t.employeeId)],
);

/* ========================================================================== */
/* Audit                                                                      */
/* ========================================================================== */

/** Append-only. Written by crm/lib/audit.ts inside the same transaction as the change. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_actor_idx").on(t.actorUserId),
  ],
);

/* ========================================================================== */
/* Development team sheet → CRM: one-way CSV import (Settings → Integrations) */
/* ========================================================================== */

/**
 * Left from the earlier Google Sheets API version (automatic-import flag).
 * No longer used; kept so no existing data is dropped.
 */
export const sheetSyncSettings = pgTable("sheet_sync_settings", {
  id: smallint("id").primaryKey().default(1),
  autoImport: boolean("auto_import").notNull().default(false),
  updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

/** The CSV file currently uploaded for each tab (one per tab; a new upload replaces it). */
export const sheetSyncUploads = pgTable("sheet_sync_uploads", {
  /** "all_website" | "client_reviewed" | "daily_work_update" */
  tab: text("tab").primaryKey(),
  fileName: text("file_name").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  /** SHA-256 of the uploaded bytes: a preview is only importable while the files are unchanged. */
  sha256: text("sha256").notNull(),
  encoding: text("encoding").notNull(),
  delimiter: text("delimiter").notNull(),
  columns: jsonb("columns").$type<string[]>().notNull(),
  dataRows: integer("data_rows").notNull(),
  /** The parsed cells, as the server read them (never taken from the browser). */
  rows: jsonb("rows").$type<string[][]>().notNull(),
  uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One source row's outcome in a preview/import: sheet row number, the record it
 * belongs to (fingerprint), and ready / already imported / needs review /
 * ignored / exact duplicate of an earlier row. Stored inside `files` (jsonb), so
 * no schema change.
 */
export type SyncRowStatus = { n: number; fp: string; s: "ready" | "imported" | "review" | "ignored" | "duplicate"; reason?: string; dupOf?: number; group?: string };
export type SyncRunFile = { tab: string; fileName: string; sha256: string; dataRows: number; rows?: SyncRowStatus[] };

/** One row per preview or import, with the files used, counts and any error. */
export const sheetSyncRuns = pgTable(
  "sheet_sync_runs",
  {
    id: id(),
    /** "manual" (CSV upload). Earlier Google API runs may say "scheduled". */
    trigger: text("trigger").notNull(),
    /** "check" = preview (nothing written to projects/tasks) | "import" */
    mode: text("mode").notNull(),
    /** "running" | "succeeded" | "failed" */
    status: text("status").notNull().default("running"),
    spreadsheetTitle: text("spreadsheet_title"),
    /** The uploaded files this run used (names, hashes, row counts). */
    files: jsonb("files").$type<SyncRunFile[]>(),
    counts: jsonb("counts").$type<Record<string, number>>(),
    error: text("error"),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: ts("finished_at"),
  },
  (t) => [index("sheet_sync_runs_started_idx").on(t.startedAt)],
);

/**
 * One row per spreadsheet row (or per unknown person name), identified by a
 * content fingerprint rather than its position, so sorting or moving rows never
 * creates duplicates. Holds the CRM record it maps to, the source values last
 * seen, the values last written (to detect CRM-side edits), and review state.
 */
export const sheetSyncRecords = pgTable(
  "sheet_sync_records",
  {
    id: id(),
    /** "all_website" | "client_reviewed" | "daily_work_update" | "people" */
    sourceTab: text("source_tab").notNull(),
    fingerprint: text("fingerprint").notNull(),
    /** Row number when last seen (1 = header). Informational only. */
    rowNumber: integer("row_number").notNull(),
    /** "project" | "project_ref" | "task_update" | "person" */
    kind: text("kind").notNull(),
    /** Daily rows: project|employee|start date — the task this row belongs to. */
    groupKey: text("group_key"),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    commentId: uuid("comment_id").references(() => taskComments.id, { onDelete: "set null" }),
    /** Last-seen spreadsheet values. */
    source: jsonb("source").$type<Record<string, string>>().notNull(),
    /** Values last written to the CRM record (sheet-owned fields only). */
    applied: jsonb("applied").$type<Record<string, string | null>>(),
    /** "pending" | "linked" | "review" | "ignored" | "missing" */
    state: text("state").notNull(),
    reviewReason: text("review_reason"),
    reviewDetail: text("review_detail"),
    /** A Super Admin's decision on a review item: "ignore" | "create" | "link" | "separate" | "attach". */
    decision: text("decision"),
    decisionData: jsonb("decision_data").$type<Record<string, string>>(),
    resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: ts("resolved_at"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastRunId: uuid("last_run_id").references(() => sheetSyncRuns.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("sheet_sync_records_fp_uq").on(t.sourceTab, t.fingerprint), index("sheet_sync_records_state_idx").on(t.state), index("sheet_sync_records_group_idx").on(t.groupKey)],
);

/** Super Admin mappings for names the sync can't match on its own (people and project names). */
export const sheetSyncAliases = pgTable(
  "sheet_sync_aliases",
  {
    id: id(),
    /** "person" | "project" */
    kind: text("kind").notNull(),
    /** Normalised spreadsheet text. */
    alias: text("alias").notNull(),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("sheet_sync_aliases_uq").on(t.kind, t.alias)],
);
