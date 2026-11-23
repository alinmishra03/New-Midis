"use server";

import { z } from "zod";
import { ok, parseForm, runAction, zCheckbox, zId, ValidationError, type ActionState } from "@/crm/lib/actions";
import {
  createRole,
  saveDepartment,
  saveDesignation,
  saveLeaveType,
  saveSchedule,
  setRolePermissions,
  updateCompany,
  updateNotificationSettings,
  updatePayrollPolicy,
} from "@/crm/services/settings";

const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const optId = (fd: FormData) => (fd.get("id") ? zId.parse(fd.get("id")) : null);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.");
const mins = (max: number) => z.coerce.number().int().min(0).max(max);

export async function companyAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        name: z.string().trim().min(2).max(150),
        legalName: optText(150),
        timezone: z.string().trim().min(3).max(64),
        currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter code like INR."),
        address: optText(500),
        phone: optText(40),
        email: z.union([z.literal(""), z.email()]).optional().transform((v) => v || null),
        website: z.union([z.literal(""), z.url()]).optional().transform((v) => v || null),
        employeeCodePrefix: z.string().trim().toUpperCase().regex(/^[A-Z]{2,6}$/, "2–6 letters."),
        leaveYearStartMonth: z.coerce.number().int().min(1).max(12),
      }),
      fd,
    );
    await updateCompany(viewer, input);
    return ok("Company information saved.");
  });
}

export async function payrollPolicyAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const base = parseForm(z.object({ lossOfPayEnabled: zCheckbox, payDay: z.coerce.number().int().min(1).max(28) }), fd);
    const raw = String(fd.get("standardDeductions") ?? "");
    const standardDeductions: { label: string; percentOfBasic: number }[] = [];
    for (const [i, line] of raw.split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      const m = line.match(/^\s*(.+?)\s*[:=]\s*(\d{1,2}(?:\.\d{1,2})?)\s*%?\s*$/);
      if (!m) throw new ValidationError({ standardDeductions: [`Line ${i + 1}: use “Label: percent”, e.g. “Provident fund: 12”.`] });
      standardDeductions.push({ label: m[1]!.slice(0, 80), percentOfBasic: Number(m[2]) });
    }
    await updatePayrollPolicy(viewer, { ...base, standardDeductions });
    return ok("Payroll policy saved.");
  });
}

export async function notificationSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await updateNotificationSettings(viewer, parseForm(z.object({ meetingReminderMinutes: mins(1440), taskDueReminderDays: mins(14), birthdayAnnouncements: zCheckbox }), fd));
    return ok("Notification settings saved.");
  });
}

export async function departmentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,10}$/, "2–10 letters or numbers."), description: optText(500), isActive: zCheckbox }), fd);
    await saveDepartment(viewer, optId(fd), input);
    return ok("Department saved.");
  });
}

export async function designationAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(z.object({ title: z.string().trim().min(2).max(100), departmentId: z.uuid().optional().transform((v) => v || null), level: z.coerce.number().int().min(1).max(10), isActive: zCheckbox }), fd);
    await saveDesignation(viewer, optId(fd), input);
    return ok("Designation saved.");
  });
}

export async function scheduleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        name: z.string().trim().min(2).max(80),
        startTime: hhmm,
        endTime: hhmm,
        workingDays: z.array(z.coerce.number().int().min(1).max(7)).min(1, "Choose at least one working day."),
        lateGraceMinutes: mins(240),
        earlyLeaveGraceMinutes: mins(240),
        fullDayMinutes: mins(1440),
        halfDayMinutes: mins(1440),
        breakAllowanceMinutes: mins(480),
        allowUnplannedRemote: zCheckbox,
        isDefault: zCheckbox,
      }),
      fd,
    );
    await saveSchedule(viewer, optId(fd), input);
    return ok("Work schedule saved. New check-ins use it immediately.");
  });
}

export async function leaveTypeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        code: z.string().trim().toUpperCase().regex(/^[A-Z]{1,6}$/, "1–6 letters."),
        name: z.string().trim().min(2).max(60),
        description: optText(300),
        annualQuota: z.string().trim().optional().transform((v) => (v ? v : null)).pipe(z.string().regex(/^\d{1,3}(\.5)?$/, "Whole or half days, or blank for unlimited.").nullable()),
        isPaid: zCheckbox,
        allowHalfDay: zCheckbox,
        documentRequiredAfterDays: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(0).max(60).nullable()),
        maxCarryForward: z.string().trim().optional().transform((v) => v || "0").pipe(z.string().regex(/^\d{1,3}(\.5)?$/, "Whole or half days.")),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a colour."),
        isActive: zCheckbox,
        sortOrder: z.coerce.number().int().min(0).max(99).default(0),
      }),
      fd,
    );
    await saveLeaveType(viewer, optId(fd), input);
    return ok("Leave type saved. New balances use the new quota; existing balances aren't changed.");
  });
}

export async function rolePermissionsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const keys = fd.getAll("permissions").filter((v): v is string => typeof v === "string");
    await setRolePermissions(viewer, zId.parse(fd.get("roleId")), keys);
    return ok("Permissions saved. They apply on each user's next request.");
  });
}

export async function createRoleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(z.object({ name: z.string().trim().min(2).max(60), description: optText(300) }), fd);
    await createRole(viewer, input);
    return ok("Role created. Set its permissions below.");
  });
}
