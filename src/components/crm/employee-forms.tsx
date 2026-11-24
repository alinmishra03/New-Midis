"use client";

import { Camera, Download, KeyRound, Upload } from "lucide-react";
import { useState } from "react";
import {
  createEmployeeAction,
  importEmployeesAction,
  issueAccessLinkAction,
  updateEmployeeAction,
  updatePersonalAction,
  uploadPhotoAction,
} from "@/app/crm/(app)/employees/actions";
import { ActionForm, CopyField, Dialog, SelectField, SubmitButton, TextAreaField, TextField, inputClass } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };
export type EmployeeFormOptions = { departments: Opt[]; designations: Opt[]; managers: Opt[]; roles: Opt[]; schedules: Opt[] };

export type EmployeeFormValues = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  managerId?: string | null;
  workScheduleId?: string | null;
  joiningDate?: string;
  employmentType?: string;
  employmentStatus?: string;
  workLocation?: string | null;
  skills?: string[];
  bio?: string | null;
  roleKey?: string;
};

const TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];
const STATUSES = [
  { value: "probation", label: "Probation" },
  { value: "active", label: "Active (confirmed)" },
  { value: "notice", label: "Notice period" },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-x-5 gap-y-4 border-t border-c-border pt-5 first:border-0 first:pt-0 sm:grid-cols-2">
      <legend className="sr-only">{title}</legend>
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-[0.8125rem] text-c-muted">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

/** Create (no id) or edit (id) an employee's employment record. */
export function EmployeeForm({
  options,
  values = {},
  canAssignElevated,
  today,
}: {
  options: EmployeeFormOptions;
  values?: EmployeeFormValues;
  canAssignElevated: boolean;
  today: string;
}) {
  const editing = !!values.id;
  const roles = canAssignElevated ? options.roles : options.roles.filter((r) => ["employee", "manager"].includes(r.value) || r.value === values.roleKey);
  return (
    <ActionForm action={editing ? updateEmployeeAction : createEmployeeAction} className="space-y-6">
      {editing && <input type="hidden" name="id" value={values.id} />}
      <Section title="Identity" description={editing ? undefined : "The official email becomes their sign-in. They'll set their own password from an activation link."}>
        <TextField label="First name" name="firstName" defaultValue={values.firstName} required autoComplete="off" />
        <TextField label="Last name" name="lastName" defaultValue={values.lastName} autoComplete="off" />
        {!editing && <TextField label="Official email" name="email" type="email" placeholder="name@midis.in" required autoComplete="off" />}
        <TextField label="Contact number" name="phone" type="tel" defaultValue={values.phone ?? ""} />
      </Section>

      <Section title="Role & reporting">
        <SelectField
          label="Portal role"
          name="roleKey"
          options={roles}
          defaultValue={values.roleKey ?? "employee"}
          required
          hint={canAssignElevated ? "Controls what they can access in the portal." : "HR, Finance and Super Admin roles are assigned by a Super Admin."}
        />
        <SelectField label="Reporting manager" name="managerId" options={options.managers.filter((m) => m.value !== values.id)} placeholder="No manager" defaultValue={values.managerId ?? ""} />
        <SelectField label="Department" name="departmentId" options={options.departments} placeholder="Not assigned" defaultValue={values.departmentId ?? ""} />
        <SelectField label="Designation" name="designationId" options={options.designations} placeholder="Not assigned" defaultValue={values.designationId ?? ""} />
      </Section>

      <Section title="Employment">
        <TextField label="Joining date" name="joiningDate" type="date" defaultValue={values.joiningDate ?? today} required />
        <SelectField label="Employment type" name="employmentType" options={TYPES} defaultValue={values.employmentType ?? "full_time"} required />
        <SelectField label="Employment status" name="employmentStatus" options={STATUSES} defaultValue={values.employmentStatus ?? "probation"} required />
        <SelectField label="Work schedule" name="workScheduleId" options={options.schedules} placeholder="Company default" defaultValue={values.workScheduleId ?? ""} />
        <TextField label="Work location" name="workLocation" defaultValue={values.workLocation ?? ""} placeholder="Mohali office" />
        <TextField label="Skills" name="skills" defaultValue={values.skills?.join(", ") ?? ""} hint="Comma-separated, e.g. React, Figma, SEO" />
        <TextAreaField label="Short bio" name="bio" defaultValue={values.bio ?? ""} rows={3} className="sm:col-span-2" />
      </Section>

      <div className="flex justify-end gap-2 border-t border-c-border pt-5">
        <SubmitButton pendingLabel="Saving…">{editing ? "Save changes" : "Create employee"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export type PersonalValues = {
  phone?: string | null;
  personalEmail?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  skills?: string[];
  bio?: string | null;
};

/** Personal details: editable by the employee themselves, or HR. */
export function PersonalForm({ employeeId, values }: { employeeId: string; values: PersonalValues }) {
  const v = (x: string | null | undefined) => x ?? "";
  return (
    <ActionForm action={updatePersonalAction} className="space-y-6">
      <input type="hidden" name="id" value={employeeId} />
      <Section title="Contact">
        <TextField label="Contact number" name="phone" type="tel" defaultValue={v(values.phone)} />
        <TextField label="Personal email" name="personalEmail" type="email" defaultValue={v(values.personalEmail)} />
      </Section>
      <Section title="Personal">
        <TextField label="Date of birth" name="dateOfBirth" type="date" defaultValue={v(values.dateOfBirth)} hint="Colleagues see only the day and month, on the birthdays list." />
        <TextField label="Gender" name="gender" defaultValue={v(values.gender)} />
        <TextField label="Marital status" name="maritalStatus" defaultValue={v(values.maritalStatus)} />
      </Section>
      <Section title="Address">
        <TextField label="Address" name="addressLine" defaultValue={v(values.addressLine)} className="sm:col-span-2" />
        <TextField label="City" name="city" defaultValue={v(values.city)} />
        <TextField label="State" name="state" defaultValue={v(values.state)} />
        <TextField label="PIN code" name="postalCode" defaultValue={v(values.postalCode)} />
        <TextField label="Country" name="country" defaultValue={v(values.country)} />
      </Section>
      <Section title="Emergency contact">
        <TextField label="Name" name="emergencyContactName" defaultValue={v(values.emergencyContactName)} />
        <TextField label="Relationship" name="emergencyContactRelation" defaultValue={v(values.emergencyContactRelation)} />
        <TextField label="Phone" name="emergencyContactPhone" type="tel" defaultValue={v(values.emergencyContactPhone)} />
      </Section>
      <Section title="About">
        <TextField label="Skills" name="skills" defaultValue={values.skills?.join(", ") ?? ""} hint="Comma-separated" className="sm:col-span-2" />
        <TextAreaField label="Short bio" name="bio" defaultValue={v(values.bio)} rows={3} className="sm:col-span-2" />
      </Section>
      <div className="flex justify-end border-t border-c-border pt-5">
        <SubmitButton pendingLabel="Saving…">Save personal details</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PhotoUpload({ employeeId }: { employeeId: string }) {
  return (
    <Dialog
      size="sm"
      title="Profile photo"
      description="PNG, JPEG or WebP, up to 10 MB. Square photos look best."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("secondary", "sm")}>
          <Camera /> Photo
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={uploadPhotoAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="id" value={employeeId} />
          <input type="file" name="photo" data-upload="image" accept="image/png,image/jpeg,image/webp" required className={inputClass} />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Uploading…">
              <Upload /> Upload
            </SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}

/** Issues a one-time activation/reset link and shows it for HR to copy. */
export function AccessLinkButton({ userId, invited, autoOpen = false }: { userId: string; invited: boolean; autoOpen?: boolean }) {
  const [link, setLink] = useState<string | null>(null);
  /** "sent" when the link was also emailed; otherwise the reason it was not (or null before creating). */
  const [mailed, setMailed] = useState<string | null>(null);
  const [open, setOpen] = useState(autoOpen);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setLink(null);
          setMailed(null);
        }
      }}
      size="md"
      title={invited ? "Activation link" : "Password reset link"}
      description={
        invited
          ? "Creates a single-use link (valid 7 days) where they set their password, and emails it to their company address. Any earlier link stops working."
          : "Creates a single-use link (valid 1 hour) to choose a new password, and emails it to their company address. It signs them out of every device once used."
      }
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("secondary", "sm")}>
          <KeyRound /> {invited ? "Activation link" : "Reset password"}
        </button>
      )}
    >
      {link ? (
        <div className="space-y-3">
          {mailed === "sent" ? (
            <p className="rounded-lg bg-c-success-soft px-3 py-2 text-[0.8125rem] text-c-success">Emailed to the employee&apos;s company address. You only need the link below if it doesn&apos;t arrive.</p>
          ) : mailed ? (
            <p className="rounded-lg bg-c-warning-soft px-3 py-2 text-[0.8125rem] text-c-warning">Not emailed: {mailed} Send the link below to them directly.</p>
          ) : null}
          <CopyField label="Send this link to the employee directly (e.g. company chat). Don't post it anywhere shared." value={link} />
          <p className="text-xs text-c-subtle">For security it isn&apos;t stored and can&apos;t be shown again. Create a new one if it&apos;s lost.</p>
        </div>
      ) : (
        <ActionForm action={issueAccessLinkAction} onSuccess={(s) => { setLink(s.data?.link ?? null); setMailed(s.data?.emailed === "1" ? "sent" : s.data?.emailNote ? s.data.emailNote : null); }} showMessage={false}>
          <input type="hidden" name="userId" value={userId} />
          <div className="flex justify-end gap-2">
            <SubmitButton pendingLabel="Creating…">Create link</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function ImportEmployees() {
  const [csv, setCsv] = useState<string | null>(null);
  const download = () => {
    if (!csv) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-import-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Dialog
      size="md"
      title="Import employees"
      description="Upload a CSV. Each valid row creates an employee and an invited account; problem rows are skipped and listed in the results."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("secondary")}>
          <Upload /> Import
        </button>
      )}
    >
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-c-muted">
          Columns: <code className="text-xs">first_name, last_name, email, role, department, designation, manager_email, joining_date (YYYY-MM-DD), employment_type, phone, work_location</code>. Only first_name, email and joining_date are required.
        </p>
        <a href="/crm/api/employees/template" download className={buttonClass("ghost", "sm")}>
          <Download /> Download template
        </a>
        <ActionForm action={importEmployeesAction} onSuccess={(s) => setCsv(s.data?.csv ?? null)} className="space-y-4">
          <input type="file" name="file" accept=".csv,text/csv" required className={inputClass} />
          <div className="flex justify-end gap-2">
            {csv && (
              <button type="button" onClick={download} className={buttonClass("secondary")}>
                <Download /> Results & activation links
              </button>
            )}
            <SubmitButton pendingLabel="Importing…">Import</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </Dialog>
  );
}
