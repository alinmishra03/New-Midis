"use client";

import { RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import {
  autoImportAction,
  decideRowAction,
  mapPersonAction,
  mapProjectNameAction,
  removeAliasAction,
  syncNowAction,
} from "@/app/crm/(app)/settings/integrations/actions";
import { ActionForm, SelectField, SubmitButton, TextField } from "./forms";

type Opt = { value: string; label: string };

/** "Check" reads the sheet and reports without changing projects or tasks; "Sync now" imports. */
export function SyncButtons({ disabled }: { disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionForm action={syncNowAction}>
        <input type="hidden" name="mode" value="check" />
        <SubmitButton variant="secondary" disabled={disabled} pendingLabel="Checking…">
          <Search /> Check sheet (no import)
        </SubmitButton>
      </ActionForm>
      <ActionForm action={syncNowAction}>
        <input type="hidden" name="mode" value="import" />
        <SubmitButton disabled={disabled} pendingLabel="Syncing…">
          <RefreshCw /> Sync now
        </SubmitButton>
      </ActionForm>
    </div>
  );
}

export function AutoImportToggle({ on }: { on: boolean }) {
  return (
    <ActionForm action={autoImportAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <span className="text-[0.8125rem] text-c-muted">{on ? "The daily sync imports changes automatically." : "The daily sync only checks the sheet; nothing is imported until you turn this on."}</span>
      <SubmitButton variant="secondary" size="sm">
        {on ? "Turn automatic import off" : "Turn automatic import on"}
      </SubmitButton>
    </ActionForm>
  );
}

export function PersonMapForm({ id, employees }: { id: string; employees: Opt[] }) {
  return (
    <ActionForm action={mapPersonAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <SelectField label="Development employee" name="employeeId" options={[...employees, { value: "ignore", label: "Ignore this name" }]} placeholder="Choose…" required className="min-w-56" />
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}

export function ProjectNameMapForm({ name, projects }: { name: string; projects: Opt[] }) {
  return (
    <ActionForm action={mapProjectNameAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="name" value={name} />
      <SelectField label="Development project" name="projectId" options={[...projects, { value: "ignore", label: "Ignore these rows" }]} placeholder="Choose…" required className="min-w-64" />
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}

const LABELS: Record<string, string> = {
  create: "Create as a new project",
  link: "Link to an existing project",
  separate: "Import as its own task",
  attach: "Add as an update to an existing task",
  ignore: "Ignore",
  use_sheet: "Use the sheet's values",
  keep_crm: "Keep the CRM's values",
  acknowledge: "Acknowledge (CRM records are kept)",
};

/** One review item: the choices depend on what it is. */
export function RowDecisionForm({
  id,
  choices,
  needsProject,
  needsPerson,
  needsDate,
  projects,
  employees,
  tasks,
}: {
  id: string;
  choices: string[];
  needsProject: boolean;
  needsPerson: boolean;
  needsDate: boolean;
  projects: Opt[];
  employees: Opt[];
  tasks: Opt[];
}) {
  const [decision, setDecision] = useState("");
  return (
    <ActionForm action={decideRowAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <SelectField label="Decision" name="decision" options={choices.map((c) => ({ value: c, label: LABELS[c] ?? c }))} placeholder="Choose…" required value={decision} onChange={(e) => setDecision(e.target.value)} className="min-w-56" />
      {(decision === "link" || (decision === "separate" && needsProject)) && <SelectField label="Project" name="projectId" options={projects} placeholder="Choose…" required className="min-w-56" />}
      {decision === "separate" && !needsProject && <SelectField label="Project (optional)" name="projectId" options={projects} placeholder="As in the sheet" className="min-w-56" />}
      {decision === "attach" && <SelectField label="Task" name="taskId" options={tasks} placeholder="Choose…" required className="min-w-64" />}
      {(decision === "separate" || decision === "attach") && <SelectField label={needsPerson ? "Who did it" : "Who did it (optional)"} name="employeeId" options={employees} placeholder={needsPerson ? "Choose…" : "As in the sheet"} required={needsPerson} className="min-w-48" />}
      {(decision === "separate" || decision === "attach") && needsDate && <TextField label="Date" name="date" type="date" required />}
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}

export function RemoveAliasButton({ id }: { id: string }) {
  return (
    <ActionForm action={removeAliasAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" size="sm">
        Remove
      </SubmitButton>
    </ActionForm>
  );
}
