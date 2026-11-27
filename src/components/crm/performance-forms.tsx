"use client";

import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { createCycleAction, createGoalAction, managerReviewAction, selfReviewAction, updateGoalAction } from "@/app/crm/(app)/performance/actions";
import { ActionForm, FormActions, Dialog, SelectField, SubmitButton, TextAreaField, TextField, useFieldError } from "./forms";
import { buttonClass } from "./ui";

const LABELS = ["", "Needs improvement", "Below expectations", "Meets expectations", "Exceeds expectations", "Outstanding"];

function RatingField({ name, defaultValue }: { name: string; defaultValue?: number | null }) {
  const [v, setV] = useState(defaultValue ?? 0);
  const error = useFieldError(name);
  return (
    <fieldset>
      <legend className="mb-1.5 text-[0.8125rem] font-medium">
        Rating <span className="text-c-danger">*</span>
      </legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors ${v === n ? "border-c-accent bg-c-accent-soft text-c-accent-text" : "border-c-border hover:border-c-border-strong"}`}>
            <input type="radio" name={name} value={n} checked={v === n} onChange={() => setV(n)} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-c-muted">{v ? LABELS[v] : "1 = needs improvement · 5 = outstanding"}</p>
      {error && <p className="mt-1 text-xs text-c-danger">{error.join(" ")}</p>}
    </fieldset>
  );
}

export function SelfReviewForm({ id }: { id: string }) {
  return (
    <ActionForm action={selfReviewAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <RatingField name="rating" />
      <TextAreaField label="Self-assessment" name="assessment" rows={5} required hint="What went well, what was hard, and what you'd like to work on." />
      <TextAreaField label="Key achievements" name="achievements" rows={4} />
      <SubmitButton>Submit to my manager</SubmitButton>
    </ActionForm>
  );
}

export function ManagerReviewForm({ id }: { id: string }) {
  return (
    <ActionForm action={managerReviewAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <RatingField name="rating" />
      <TextAreaField label="Feedback" name="feedback" rows={6} required hint="Specific, fair and forward-looking. The employee will read this." />
      <SubmitButton>Complete review</SubmitButton>
    </ActionForm>
  );
}

export function CycleDialog({ today }: { today: string }) {
  return (
    <Dialog
      size="sm"
      title="Open a review cycle"
      description="Creates a review for every current employee, with their reporting manager as reviewer, and asks them for a self-assessment."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <Plus /> New review cycle
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={createCycleAction} onSuccess={close} className="space-y-4">
          <TextField label="Name" name="name" required placeholder="Q4 2026 review" />
          <SelectField label="Type" name="type" options={[{ value: "quarterly", label: "Quarterly" }, { value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }]} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Period start" name="periodStart" type="date" required defaultValue={today} />
            <TextField label="Period end" name="periodEnd" type="date" required />
          </div>
          <FormActions>
            <SubmitButton>Open cycle</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function GoalDialog({ employeeId, label = "Add goal" }: { employeeId: string; label?: string }) {
  return (
    <Dialog
      size="sm"
      title="New goal"
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("secondary", "sm")}>
          <Target /> {label}
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={createGoalAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="employeeId" value={employeeId} />
          <TextField label="Goal" name="title" required placeholder="Ship the new client onboarding flow" />
          <TextAreaField label="Details / success measure" name="description" rows={3} />
          <TextField label="Target date" name="dueDate" type="date" />
          <FormActions>
            <SubmitButton>Add goal</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function GoalProgress({ id, status, progress }: { id: string; status: string; progress: number }) {
  const [s, setS] = useState(status);
  const [p, setP] = useState(progress);
  return (
    <ActionForm action={updateGoalAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" value={s} onChange={(e) => { setS(e.target.value); if (e.target.value === "achieved") setP(100); }} aria-label="Goal status" className="h-8 rounded-md border border-c-border bg-c-surface px-2 text-xs">
        <option value="not_started">Not started</option>
        <option value="in_progress">In progress</option>
        <option value="achieved">Achieved</option>
        <option value="missed">Missed</option>
      </select>
      <input type="range" name="progress" min={0} max={100} step={10} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="Goal progress" className="w-28 accent-[var(--c-accent)]" />
      <span className="tabular w-9 text-xs text-c-muted">{p}%</span>
      <SubmitButton size="sm" variant="secondary">
        Save
      </SubmitButton>
    </ActionForm>
  );
}
