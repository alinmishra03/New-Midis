"use client";

import { CalendarPlus, House, Scale } from "lucide-react";
import { useState } from "react";
import { adjustBalanceAction, applyLeaveAction, requestWfhAction } from "@/app/crm/(app)/leave/actions";
import { ActionForm, Dialog, SelectField, SubmitButton, TextAreaField, TextField, inputClass } from "./forms";
import { buttonClass } from "./ui";

export type LeaveTypeOption = { id: string; name: string; allowHalfDay: boolean; available: string; documentRequiredAfterDays: number | null };

export function ApplyLeaveDialog({ types, today, autoOpen }: { types: LeaveTypeOption[]; today: string; autoOpen?: boolean }) {
  const [open, setOpen] = useState(!!autoOpen);
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const type = types.find((t) => t.id === typeId);
  const single = start === end;
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Apply for leave"
      description="Weekends and public holidays inside the range aren't counted."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <CalendarPlus /> Apply for leave
        </button>
      )}
    >
      <ActionForm action={applyLeaveAction} onSuccess={() => setOpen(false)} className="space-y-4" encType="multipart/form-data">
        <SelectField
          label="Leave type"
          name="leaveTypeId"
          required
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          options={types.map((t) => ({ value: t.id, label: `${t.name} — ${t.available}` }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="From" name="startDate" type="date" required value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); }} />
          <TextField label="To" name="endDate" type="date" required value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </div>
        {type?.allowHalfDay && single ? (
          <SelectField
            label="Duration"
            name="halfDay"
            defaultValue="none"
            options={[
              { value: "none", label: "Full day" },
              { value: "first_half", label: "First half" },
              { value: "second_half", label: "Second half" },
            ]}
          />
        ) : (
          <input type="hidden" name="halfDay" value="none" />
        )}
        <TextAreaField label="Reason" name="reason" rows={3} required />
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium" htmlFor="leave-doc">
            Supporting document {type?.documentRequiredAfterDays !== null && type?.documentRequiredAfterDays !== undefined ? <span className="font-normal text-c-muted">(required beyond {type.documentRequiredAfterDays} day{type.documentRequiredAfterDays === 1 ? "" : "s"})</span> : <span className="font-normal text-c-muted">(optional)</span>}
          </label>
          <input id="leave-doc" type="file" name="document" data-upload="any" accept="application/pdf,image/png,image/jpeg,image/webp" className={inputClass} />
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Submitting…">Submit request</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}

export function WfhDialog({ today }: { today: string }) {
  return (
    <Dialog
      size="sm"
      title="Request work from home"
      description="Once approved, you can check in remotely on those days."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("primary")}>
          <House /> Request WFH
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={requestWfhAction} onSuccess={close} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="From" name="startDate" type="date" defaultValue={today} required />
            <TextField label="To" name="endDate" type="date" defaultValue={today} required />
          </div>
          <TextAreaField label="Reason" name="reason" rows={3} required />
          <div className="flex justify-end">
            <SubmitButton>Submit request</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function AdjustBalanceDialog({ employeeId, employeeName, types }: { employeeId: string; employeeName: string; types: { id: string; name: string }[] }) {
  return (
    <Dialog
      size="sm"
      title={`Adjust balance — ${employeeName}`}
      description="Adds or removes days for the current leave year. Use negative numbers to deduct. Logged with your reason."
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass("secondary", "sm")}>
          <Scale /> Adjust
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={adjustBalanceAction} onSuccess={close} className="space-y-4">
          <input type="hidden" name="employeeId" value={employeeId} />
          <SelectField label="Leave type" name="leaveTypeId" options={types.map((t) => ({ value: t.id, label: t.name }))} required />
          <TextField label="Days (+/-)" name="delta" type="number" step="0.5" required placeholder="e.g. 2 or -1.5" />
          <TextAreaField label="Reason" name="comment" rows={2} required />
          <div className="flex justify-end">
            <SubmitButton>Apply adjustment</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}
