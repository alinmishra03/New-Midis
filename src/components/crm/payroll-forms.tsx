"use client";

import { Plus } from "lucide-react";
import { addAdjustmentAction, addStructureAction, createRunAction } from "@/app/crm/(app)/payroll/actions";
import { ActionForm, Dialog, SelectField, SubmitButton, TextAreaField, TextField } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };

export function NewRunDialog({ defaultPeriod }: { defaultPeriod: string }) {
  return (
    <Dialog
      size="sm"
      title="New payroll run"
      description="Creates a draft for the month. Payslips are generated from salary structures and approved adjustments, then need approval."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <Plus /> New payroll run
        </button>
      )}
    >
      <ActionForm action={createRunAction} className="space-y-4">
        <TextField label="Month" name="period" type="month" defaultValue={defaultPeriod} required />
        <div className="flex justify-end">
          <SubmitButton>Create run</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}

export function StructureDialog({ employeeId, employeeName, today }: { employeeId: string; employeeName: string; today: string }) {
  return (
    <Dialog
      title={`New salary structure — ${employeeName}`}
      description="Monthly amounts. The new structure applies from its effective date; earlier ones are kept as history."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary", "sm")}>
          <Plus /> New structure
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={addStructureAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="employeeId" value={employeeId} />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Effective from" name="effectiveFrom" type="date" defaultValue={today} required />
            <TextField label="Basic (monthly)" name="basic" inputMode="decimal" required placeholder="30000" />
            <TextField label="HRA (monthly)" name="hra" inputMode="decimal" placeholder="12000" />
          </div>
          <TextAreaField label="Allowances" name="allowances" rows={3} placeholder={"Conveyance: 1600\nSpecial allowance: 5000"} hint="One per line, “Label: amount”." />
          <TextAreaField label="Deductions" name="deductions" rows={3} placeholder={"Provident fund: 1800\nProfessional tax: 200"} hint="Only deductions agreed for this employee. Nothing else is deducted automatically." />
          <TextAreaField label="Notes" name="notes" rows={2} />
          <div className="flex justify-end">
            <SubmitButton>Save structure</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function AdjustmentDialog({ employees, defaultPeriod }: { employees: Opt[]; defaultPeriod: string }) {
  return (
    <Dialog
      size="sm"
      title="Add a one-off adjustment"
      description="A bonus, allowance or deduction for one month. Someone with approval rights must approve it before payroll uses it."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <Plus /> Add adjustment
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={addAdjustmentAction} onSuccess={close} className="space-y-4">
          <SelectField label="Employee" name="employeeId" options={employees} required />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Month" name="period" type="month" defaultValue={defaultPeriod} required />
            <SelectField label="Type" name="type" options={[{ value: "bonus", label: "Bonus" }, { value: "allowance", label: "Allowance" }, { value: "deduction", label: "Deduction" }]} />
          </div>
          <TextField label="Description" name="label" required placeholder="Diwali bonus" />
          <TextField label="Amount" name="amount" inputMode="decimal" required />
          <div className="flex justify-end">
            <SubmitButton>Add adjustment</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}
