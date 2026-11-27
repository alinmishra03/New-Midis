"use client";

import { Pencil, Plus } from "lucide-react";
import {
  companyAction,
  createRoleAction,
  departmentAction,
  designationAction,
  leaveTypeAction,
  notificationSettingsAction,
  payrollPolicyAction,
  rolePermissionsAction,
  scheduleAction,
} from "@/app/crm/(app)/settings/actions";
import { ActionForm, FormActions, CheckboxField, Dialog, SelectField, SubmitButton, TextAreaField, TextField } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => ({ value: String(i + 1), label: m }));
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function EditTrigger({ editing, label }: { editing: boolean; label: string }) {
  return editing ? (
    <>
      <Pencil /> <span className="sr-only">Edit {label}</span>
    </>
  ) : (
    <>
      <Plus /> {label}
    </>
  );
}

export type CompanyValues = { name: string; legalName: string | null; timezone: string; currency: string; address: string | null; phone: string | null; email: string | null; website: string | null; employeeCodePrefix: string; leaveYearStartMonth: number };

export function CompanyForm({ values }: { values: CompanyValues }) {
  return (
    <ActionForm action={companyAction} className="grid gap-4 sm:grid-cols-2">
      <TextField label="Company name" name="name" defaultValue={values.name} required />
      <TextField label="Legal name" name="legalName" defaultValue={values.legalName ?? ""} />
      <TextAreaField label="Address" name="address" defaultValue={values.address ?? ""} rows={2} className="sm:col-span-2" />
      <TextField label="Phone" name="phone" defaultValue={values.phone ?? ""} />
      <TextField label="Email" name="email" type="email" defaultValue={values.email ?? ""} />
      <TextField label="Website" name="website" type="url" defaultValue={values.website ?? ""} />
      <TextField label="Timezone" name="timezone" defaultValue={values.timezone} required hint="IANA name. Attendance days and late arrivals are computed in this timezone." />
      <TextField label="Currency" name="currency" defaultValue={values.currency} required />
      <TextField label="Employee code prefix" name="employeeCodePrefix" defaultValue={values.employeeCodePrefix} required hint="New employees get codes like MID-0007." />
      <SelectField label="Leave year starts in" name="leaveYearStartMonth" options={MONTHS} defaultValue={String(values.leaveYearStartMonth)} />
      <div className="sm:col-span-2">
        <SubmitButton>Save company information</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function DepartmentDialog({ values }: { values?: { id: string; name: string; code: string; description: string | null; isActive: boolean } }) {
  return (
    <Dialog
      size="sm"
      title={values ? `Edit ${values.name}` : "New department"}
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass(values ? "ghost" : "secondary", values ? "icon" : "sm")}>
          <EditTrigger editing={!!values} label={values ? values.name : "Department"} />
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={departmentAction} onSuccess={close} className="space-y-4">
          {values && <input type="hidden" name="id" value={values.id} />}
          <div className="grid grid-cols-3 gap-3">
            <TextField label="Name" name="name" defaultValue={values?.name} required className="col-span-2" />
            <TextField label="Code" name="code" defaultValue={values?.code} required />
          </div>
          <TextAreaField label="Description" name="description" defaultValue={values?.description ?? ""} rows={2} />
          <CheckboxField name="isActive" label="Active" defaultChecked={values?.isActive ?? true} />
          <FormActions>
            <SubmitButton>Save</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function DesignationDialog({ departments, values }: { departments: Opt[]; values?: { id: string; title: string; departmentId: string | null; level: number; isActive: boolean } }) {
  return (
    <Dialog
      size="sm"
      title={values ? `Edit ${values.title}` : "New designation"}
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass(values ? "ghost" : "secondary", values ? "icon" : "sm")}>
          <EditTrigger editing={!!values} label={values ? values.title : "Designation"} />
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={designationAction} onSuccess={close} className="space-y-4">
          {values && <input type="hidden" name="id" value={values.id} />}
          <TextField label="Title" name="title" defaultValue={values?.title} required />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Department" name="departmentId" options={departments} placeholder="Any" defaultValue={values?.departmentId ?? ""} />
            <TextField label="Level" name="level" type="number" min={1} max={10} defaultValue={values?.level ?? 1} />
          </div>
          <CheckboxField name="isActive" label="Active" defaultChecked={values?.isActive ?? true} />
          <FormActions>
            <SubmitButton>Save</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export type ScheduleValues = { id: string; name: string; startTime: string; endTime: string; workingDays: number[]; lateGraceMinutes: number; earlyLeaveGraceMinutes: number; fullDayMinutes: number; halfDayMinutes: number; breakAllowanceMinutes: number; allowUnplannedRemote: boolean; isDefault: boolean };

export function ScheduleDialog({ values }: { values?: ScheduleValues }) {
  return (
    <Dialog
      size="lg"
      title={values ? `Edit ${values.name}` : "New work schedule"}
      description="Working hours and the attendance rules that go with them."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass(values ? "secondary" : "primary", "sm")}>
          {values ? <Pencil /> : <Plus />} {values ? "Edit" : "New schedule"}
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={scheduleAction} onSuccess={close} className="space-y-4">
          {values && <input type="hidden" name="id" value={values.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Name" name="name" defaultValue={values?.name} required />
            <TextField label="Starts" name="startTime" type="time" defaultValue={values?.startTime ?? "09:30"} required />
            <TextField label="Ends" name="endTime" type="time" defaultValue={values?.endTime ?? "18:30"} required />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[0.8125rem] font-medium">Working days</legend>
            <div className="flex flex-wrap gap-3">
              {DAYS.map((d, i) => (
                <label key={d} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="workingDays[]" value={i + 1} defaultChecked={(values?.workingDays ?? [1, 2, 3, 4, 5]).includes(i + 1)} className="size-4 accent-[var(--c-accent)]" />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Late after (min grace)" name="lateGraceMinutes" type="number" min={0} defaultValue={values?.lateGraceMinutes ?? 15} />
            <TextField label="Early-leave grace (min)" name="earlyLeaveGraceMinutes" type="number" min={0} defaultValue={values?.earlyLeaveGraceMinutes ?? 15} />
            <TextField label="Break allowance (min)" name="breakAllowanceMinutes" type="number" min={0} defaultValue={values?.breakAllowanceMinutes ?? 60} />
            <TextField label="Full day needs (min)" name="fullDayMinutes" type="number" min={0} defaultValue={values?.fullDayMinutes ?? 480} />
            <TextField label="Half day needs (min)" name="halfDayMinutes" type="number" min={0} defaultValue={values?.halfDayMinutes ?? 240} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <CheckboxField name="allowUnplannedRemote" label="Allow remote check-in without approved WFH" defaultChecked={values?.allowUnplannedRemote} />
            <CheckboxField name="isDefault" label="Company default schedule" defaultChecked={values?.isDefault} />
          </div>
          <FormActions>
            <SubmitButton>Save schedule</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export type LeaveTypeValues = { id: string; code: string; name: string; description: string | null; annualQuota: string | null; isPaid: boolean; allowHalfDay: boolean; documentRequiredAfterDays: number | null; maxCarryForward: string; color: string; isActive: boolean; sortOrder: number };

export function LeaveTypeDialog({ values }: { values?: LeaveTypeValues }) {
  return (
    <Dialog
      title={values ? `Edit ${values.name}` : "New leave type"}
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass(values ? "ghost" : "primary", values ? "icon" : "sm")}>
          <EditTrigger editing={!!values} label={values ? values.name : "Leave type"} />
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={leaveTypeAction} onSuccess={close} className="space-y-4">
          {values && <input type="hidden" name="id" value={values.id} />}
          <div className="grid gap-3 sm:grid-cols-4">
            <TextField label="Code" name="code" defaultValue={values?.code} required />
            <TextField label="Name" name="name" defaultValue={values?.name} required className="sm:col-span-2" />
            <TextField label="Colour" name="color" type="color" defaultValue={values?.color ?? "#ef8716"} />
          </div>
          <TextField label="Description" name="description" defaultValue={values?.description ?? ""} />
          <div className="grid gap-3 sm:grid-cols-4">
            <TextField label="Days per year" name="annualQuota" defaultValue={values?.annualQuota ? String(Number(values.annualQuota)) : values ? "" : "12"} hint="Blank = unlimited" />
            <TextField label="Max carry forward" name="maxCarryForward" defaultValue={values ? String(Number(values.maxCarryForward)) : "0"} />
            <TextField label="Document after (days)" name="documentRequiredAfterDays" type="number" min={0} defaultValue={values?.documentRequiredAfterDays ?? ""} hint="Blank = never" />
            <TextField label="Sort order" name="sortOrder" type="number" min={0} defaultValue={values?.sortOrder ?? 10} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <CheckboxField name="isPaid" label="Paid" defaultChecked={values?.isPaid ?? true} />
            <CheckboxField name="allowHalfDay" label="Half days allowed" defaultChecked={values?.allowHalfDay ?? true} />
            <CheckboxField name="isActive" label="Active" defaultChecked={values?.isActive ?? true} />
          </div>
          <FormActions>
            <SubmitButton>Save leave type</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function PayrollPolicyForm({ values, canEdit }: { values: { lossOfPayEnabled: boolean; payDay: number; standardDeductions: { label: string; percentOfBasic: number }[] }; canEdit: boolean }) {
  return (
    <ActionForm action={payrollPolicyAction} className="space-y-4">
      <fieldset disabled={!canEdit} className="space-y-4">
        <CheckboxField name="lossOfPayEnabled" label="Apply loss-of-pay and part-month proration" hint="Off by default. When on, approved unpaid leave and partial months reduce paid days. Nothing is deducted automatically otherwise." defaultChecked={values.lossOfPayEnabled} />
        <TextField label="Pay day (of the month)" name="payDay" type="number" min={1} max={28} defaultValue={values.payDay} className="max-w-40" />
        <TextAreaField
          label="Standard deductions for everyone"
          name="standardDeductions"
          rows={3}
          defaultValue={values.standardDeductions.map((d) => `${d.label}: ${d.percentOfBasic}`).join("\n")}
          hint="One per line as “Label: percent of basic”, e.g. “Provident fund: 12”. Leave empty for none. Applies to payroll runs generated after saving."
        />
        {canEdit ? <SubmitButton>Save payroll policy</SubmitButton> : <p className="text-xs text-c-subtle">Only Finance or a Super Admin can change payroll policy.</p>}
      </fieldset>
    </ActionForm>
  );
}

export function NotificationSettingsForm({ values }: { values: { meetingReminderMinutes: number; taskDueReminderDays: number; birthdayAnnouncements: boolean } }) {
  return (
    <ActionForm action={notificationSettingsAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Meeting reminder (minutes before)" name="meetingReminderMinutes" type="number" min={0} defaultValue={values.meetingReminderMinutes} />
        <TextField label="Task due reminder (days before)" name="taskDueReminderDays" type="number" min={0} defaultValue={values.taskDueReminderDays} />
      </div>
      <CheckboxField name="birthdayAnnouncements" label="Notify everyone about colleagues' birthdays" defaultChecked={values.birthdayAnnouncements} />
      <SubmitButton>Save notification settings</SubmitButton>
    </ActionForm>
  );
}

export function RolePermissionsForm({ roleId, locked, granted, catalogue }: { roleId: string; locked: boolean; granted: string[]; catalogue: { key: string; module: string; description: string }[] }) {
  const modules = [...new Set(catalogue.map((c) => c.module))];
  return (
    <ActionForm action={rolePermissionsAction} className="space-y-5">
      <input type="hidden" name="roleId" value={roleId} />
      <fieldset disabled={locked} className="grid gap-5 md:grid-cols-2">
        {modules.map((m) => (
          <div key={m}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-c-subtle uppercase">{m}</p>
            <div className="space-y-2">
              {catalogue
                .filter((c) => c.module === m)
                .map((c) => (
                  <label key={c.key} className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" name="permissions" value={c.key} defaultChecked={granted.includes(c.key)} className="mt-0.5 size-4 accent-[var(--c-accent)]" />
                    <span>
                      {c.description}
                      <span className="block font-mono text-[0.6875rem] text-c-subtle">{c.key}</span>
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </fieldset>
      {locked ? <p className="text-xs text-c-subtle">The Super Admin role always has every permission.</p> : <SubmitButton>Save permissions</SubmitButton>}
    </ActionForm>
  );
}

export function NewRoleDialog() {
  return (
    <Dialog
      size="sm"
      title="New role"
      description="Create a role, then choose its permissions."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <Plus /> New role
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={createRoleAction} onSuccess={close} className="space-y-4">
          <TextField label="Name" name="name" required placeholder="Team Lead" />
          <TextAreaField label="Description" name="description" rows={2} />
          <FormActions>
            <SubmitButton>Create role</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}
