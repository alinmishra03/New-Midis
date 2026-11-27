"use client";

import { CalendarPlus, Pencil, Plus, UserCheck } from "lucide-react";
import { useState } from "react";
import {
  addCandidateAction,
  addOnboardingTaskAction,
  candidateStageAction,
  hireAction,
  interviewFeedbackAction,
  saveJobAction,
  scheduleInterviewAction,
  toggleOnboardingAction,
} from "@/app/crm/(app)/recruitment/actions";
import { ActionForm, FormActions, Dialog, SelectField, SubmitButton, TextAreaField, TextField, inputClass } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };
export type JobValues = { id?: string; title?: string; departmentId?: string | null; location?: string | null; employmentType?: string; description?: string | null; positions?: number; status?: string; hiringManagerId?: string | null };

export function JobDialog({ values = {}, departments, people }: { values?: JobValues; departments: Opt[]; people: Opt[] }) {
  const editing = !!values.id;
  return (
    <Dialog
      size="lg"
      title={editing ? "Edit job opening" : "New job opening"}
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass(editing ? "secondary" : "primary", editing ? "sm" : "md")}>
          {editing ? <Pencil /> : <Plus />} {editing ? "Edit job" : "New job opening"}
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={saveJobAction} onSuccess={close} className="space-y-4">
          {editing && <input type="hidden" name="id" value={values.id} />}
          <TextField label="Job title" name="title" defaultValue={values.title} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Department" name="departmentId" options={departments} placeholder="None" defaultValue={values.departmentId ?? ""} />
            <SelectField label="Hiring manager" name="hiringManagerId" options={people} placeholder="None" defaultValue={values.hiringManagerId ?? ""} />
            <SelectField label="Type" name="employmentType" defaultValue={values.employmentType ?? "full_time"} options={[{ value: "full_time", label: "Full-time" }, { value: "part_time", label: "Part-time" }, { value: "contract", label: "Contract" }, { value: "intern", label: "Intern" }]} />
            <TextField label="Location" name="location" defaultValue={values.location ?? ""} placeholder="Mohali / Remote" />
            <TextField label="Positions" name="positions" type="number" min={1} defaultValue={values.positions ?? 1} />
            <SelectField label="Status" name="status" defaultValue={values.status ?? "open"} options={[{ value: "draft", label: "Draft" }, { value: "open", label: "Open" }, { value: "on_hold", label: "On hold" }, { value: "closed", label: "Closed" }]} />
          </div>
          <TextAreaField label="Description" name="description" defaultValue={values.description ?? ""} rows={6} />
          <FormActions>
            <SubmitButton>{editing ? "Save" : "Create opening"}</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function CandidateDialog({ jobId }: { jobId: string }) {
  return (
    <Dialog
      title="Add candidate"
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <Plus /> Add candidate
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={addCandidateAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="jobId" value={jobId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Full name" name="fullName" required />
            <TextField label="Email" name="email" type="email" required />
            <TextField label="Phone" name="phone" type="tel" />
            <TextField label="Source" name="source" placeholder="LinkedIn, referral…" />
          </div>
          <div>
            <label htmlFor="resume" className="mb-1.5 block text-[0.8125rem] font-medium">
              Resume <span className="font-normal text-c-muted">(PDF or Word)</span>
            </label>
            <input id="resume" type="file" name="resume" data-upload="resume" accept=".pdf,.docx,application/pdf" className={inputClass} />
          </div>
          <TextAreaField label="Notes" name="notes" rows={3} />
          <FormActions>
            <SubmitButton>Add candidate</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

const STAGES: Opt[] = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const [s, setS] = useState(stage);
  return (
    <ActionForm action={candidateStageAction} showMessage={false}>
      <input type="hidden" name="id" value={id} />
      <select
        name="stage"
        value={s}
        aria-label="Stage"
        onChange={(e) => {
          setS(e.target.value);
          e.currentTarget.form?.requestSubmit();
        }}
        className="h-8 rounded-md border border-c-border bg-c-surface px-2 text-xs"
      >
        {STAGES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </ActionForm>
  );
}

export function InterviewDialog({ candidateId, candidateName, people, today }: { candidateId: string; candidateName: string; people: Opt[]; today: string }) {
  return (
    <Dialog
      size="sm"
      title={`Schedule interview — ${candidateName}`}
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("ghost", "sm")}>
          <CalendarPlus /> Interview
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={scheduleInterviewAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="candidateId" value={candidateId} />
          <SelectField label="Interviewer" name="interviewerId" options={people} required placeholder="Choose…" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Date" name="date" type="date" min={today} defaultValue={today} required />
            <TextField label="Time" name="time" type="time" defaultValue="15:00" required />
            <SelectField label="Mode" name="mode" options={[{ value: "video", label: "Video" }, { value: "in_person", label: "In person" }, { value: "phone", label: "Phone" }]} />
            <TextField label="Minutes" name="durationMinutes" type="number" min={15} max={240} defaultValue={45} />
          </div>
          <TextField label="Location or link" name="location" />
          <FormActions>
            <SubmitButton>Schedule</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function HireDialog({ candidateId, candidateName, designations, people, today }: { candidateId: string; candidateName: string; designations: Opt[]; people: Opt[]; today: string }) {
  return (
    <Dialog
      size="sm"
      title={`Hire ${candidateName}`}
      description="Creates their employee record and an invited portal account, and starts the onboarding checklist."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary", "sm")}>
          <UserCheck /> Hire
        </button>
      )}
    >
      <ActionForm action={hireAction} className="space-y-4">
        <input type="hidden" name="id" value={candidateId} />
        <TextField label="Company email" name="email" type="email" required placeholder="name@midis.in" />
        <TextField label="Joining date" name="joiningDate" type="date" defaultValue={today} required />
        <SelectField label="Designation" name="designationId" options={designations} placeholder="Set later" />
        <SelectField label="Reporting manager" name="managerId" options={people} placeholder="Set later" />
        <FormActions>
          <SubmitButton>Hire and create account</SubmitButton>
        </FormActions>
      </ActionForm>
    </Dialog>
  );
}

export function FeedbackForm({ id }: { id: string }) {
  return (
    <ActionForm action={interviewFeedbackAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Rating" name="rating" required placeholder="Choose…" options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` }))} />
        <SelectField label="Recommendation" name="recommendation" options={[{ value: "strong_hire", label: "Strong hire" }, { value: "hire", label: "Hire" }, { value: "hold", label: "Hold" }, { value: "no_hire", label: "No hire" }]} />
      </div>
      <TextAreaField label="Feedback" name="feedback" rows={6} required />
      <SubmitButton>Submit feedback</SubmitButton>
    </ActionForm>
  );
}

export function ChecklistItem({ id, done, title, meta }: { id: string; done: boolean; title: string; meta: string }) {
  return (
    <ActionForm action={toggleOnboardingAction} showMessage={false} className="flex items-start gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="done" value={done ? "0" : "1"} />
      <button type="submit" aria-label={done ? `Mark “${title}” not done` : `Mark “${title}” done`} className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${done ? "border-c-success bg-c-success text-white" : "border-c-border-strong hover:border-c-accent"}`}>
        {done && (
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </button>
      <span>
        <span className={`block text-sm ${done ? "text-c-muted line-through" : ""}`}>{title}</span>
        <span className="text-xs text-c-subtle">{meta}</span>
      </span>
    </ActionForm>
  );
}

export function AddChecklistItem({ employeeId }: { employeeId: string }) {
  return (
    <ActionForm action={addOnboardingTaskAction} resetOnSuccess className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input name="title" required placeholder="Add a checklist item" aria-label="Checklist item" className={inputClass} />
      <select name="category" aria-label="Category" className={`${inputClass} sm:w-40`}>
        <option value="formalities">Formalities</option>
        <option value="documents">Documents</option>
        <option value="accounts">Accounts</option>
        <option value="department">Department</option>
        <option value="manager">Manager</option>
      </select>
      <SubmitButton variant="secondary">Add</SubmitButton>
    </ActionForm>
  );
}
