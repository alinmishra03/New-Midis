"use client";

import { Pencil, Timer } from "lucide-react";
import { hrSetAttendanceAction, requestCorrectionAction } from "@/app/crm/(app)/attendance/actions";
import { ActionForm, FormActions, Dialog, SubmitButton, TextAreaField, TextField } from "./forms";
import { buttonClass } from "./ui";

export function CorrectionDialog({ today, defaultDate }: { today: string; defaultDate?: string }) {
  return (
    <Dialog
      size="sm"
      title="Request an attendance correction"
      description="For a missed check-in or check-out, or wrong times. Your manager or HR reviews it; your record isn't changed until it's approved."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("secondary")}>
          <Timer /> Request correction
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={requestCorrectionAction} onSuccess={close} className="space-y-4">
          <TextField label="Date" name="date" type="date" max={today} defaultValue={defaultDate ?? today} required />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Correct check-in" name="checkIn" type="time" hint="Leave blank to keep" />
            <TextField label="Correct check-out" name="checkOut" type="time" hint="Leave blank to keep" />
          </div>
          <TextAreaField label="Reason" name="reason" rows={3} required placeholder="e.g. Forgot to check out after the client call." />
          <FormActions>
            <SubmitButton pendingLabel="Sending…">Send request</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

/** HR-only: set a day's times directly. */
export function HrEditDialog({ employeeId, name, date, checkIn, checkOut }: { employeeId: string; name: string; date: string; checkIn: string; checkOut: string }) {
  return (
    <Dialog
      size="sm"
      title={`Edit attendance — ${name}`}
      description="The change is applied immediately, recorded as an approved correction with the previous times, and the employee is notified."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("ghost", "icon")} aria-label={`Edit attendance for ${name}`}>
          <Pencil />
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={hrSetAttendanceAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="employeeId" value={employeeId} />
          <input type="hidden" name="date" value={date} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Check-in" name="checkIn" type="time" defaultValue={checkIn} />
            <TextField label="Check-out" name="checkOut" type="time" defaultValue={checkOut} />
          </div>
          <TextAreaField label="Reason" name="reason" rows={2} required />
          <FormActions>
            <SubmitButton>Save</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}
