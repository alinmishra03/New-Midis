"use client";

import { CalendarPlus, PartyPopper } from "lucide-react";
import { useState } from "react";
import { addHolidayAction, scheduleMeetingAction } from "@/app/crm/(app)/calendar/actions";
import { ActionForm, FormActions, Dialog, SelectField, SubmitButton, TextAreaField, TextField } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };

export function MeetingDialog({ people, today, canCompany, hasTeam }: { people: Opt[]; today: string; canCompany: boolean; hasTeam: boolean }) {
  const [scope, setScope] = useState("private");
  const [filter, setFilter] = useState("");
  const shown = people.filter((p) => p.label.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Dialog
      size="lg"
      title="Schedule a meeting"
      description="Participants get a notification now and a reminder before it starts."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("primary")}>
          <CalendarPlus /> Schedule meeting
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={scheduleMeetingAction} onSuccess={close} className="space-y-4">
          <TextField label="Title" name="title" required />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Date" name="date" type="date" min={today} defaultValue={today} required />
            <TextField label="Starts" name="start" type="time" defaultValue="11:00" required />
            <TextField label="Ends" name="end" type="time" defaultValue="11:30" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Location" name="location" placeholder="Conference room / Office" />
            <TextField label="Video link" name="meetingLink" type="url" placeholder="https://meet.google.com/…" />
          </div>
          <TextAreaField label="Description / agenda" name="description" rows={3} />
          <SelectField
            label="Who's it for"
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            options={[
              { value: "private", label: "Selected people" },
              ...(hasTeam ? [{ value: "team", label: "My whole team (+ anyone selected)" }] : []),
              ...(canCompany ? [{ value: "company", label: "Company-wide event" }] : []),
            ]}
          />
          {scope !== "company" && (
            <fieldset>
              <legend className="mb-1.5 text-[0.8125rem] font-medium">Participants</legend>
              <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter people" aria-label="Filter people" className="mb-2 h-8 w-full rounded-md border border-c-border bg-c-surface px-2.5 text-sm" />
              <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-lg border border-c-border p-3 sm:grid-cols-2">
                {people.map((p) => (
                  <label key={p.value} className={`flex items-center gap-2 text-sm ${shown.includes(p) ? "" : "hidden"}`}>
                    <input type="checkbox" name="participants[]" value={p.value} className="size-4 accent-[var(--c-accent)]" />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <FormActions>
            <SubmitButton>Schedule</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}

export function HolidayDialog() {
  return (
    <Dialog
      size="sm"
      title="Add a holiday"
      description="Public holidays are excluded from leave counts and attendance. Optional holidays are taken with the Optional Holiday leave type."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("secondary")}>
          <PartyPopper /> Add holiday
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={addHolidayAction} onSuccess={close} className="space-y-4">
          <TextField label="Name" name="name" required />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Date" name="date" type="date" required />
            <SelectField label="Type" name="type" options={[{ value: "public", label: "Public" }, { value: "optional", label: "Optional" }]} />
          </div>
          <TextAreaField label="Note" name="description" rows={2} />
          <FormActions>
            <SubmitButton>Add holiday</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}
