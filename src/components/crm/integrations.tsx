"use client";

import { Eye, Upload, X, DatabaseZap } from "lucide-react";
import { useState } from "react";
import {
  decideRowAction,
  importAction,
  mapPersonAction,
  mapProjectNameAction,
  previewAction,
  removeAliasAction,
  removeUploadAction,
  uploadCsvAction,
} from "@/app/crm/(app)/settings/integrations/actions";
import { ActionForm, SelectField, SubmitButton, TextField, inputClass } from "./forms";

type Opt = { value: string; label: string };

/** One tab's CSV upload. The file is read and checked on the server; nothing is imported yet. */
export function CsvUploadForm({ tab, label, hasFile }: { tab: string; label: string; hasFile: boolean }) {
  return (
    <ActionForm action={uploadCsvAction} resetOnSuccess className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tab" value={tab} />
      <label className="min-w-56 flex-1 text-[0.8125rem] font-medium">
        <span className="mb-1.5 block">{hasFile ? `Replace the ${label} CSV` : `${label} CSV`}</span>
        <input type="file" name="file" accept=".csv,text/csv" required className={inputClass} />
      </label>
      <SubmitButton size="sm" variant={hasFile ? "secondary" : "primary"} pendingLabel="Checking…">
        <Upload /> Upload
      </SubmitButton>
    </ActionForm>
  );
}

export function RemoveUploadButton({ tab }: { tab: string }) {
  return (
    <ActionForm action={removeUploadAction}>
      <input type="hidden" name="tab" value={tab} />
      <SubmitButton variant="ghost" size="sm">
        <X /> Remove file
      </SubmitButton>
    </ActionForm>
  );
}

/** Preview never writes projects or tasks; Import applies exactly the previewed files and decisions. */
export function PreviewImportButtons({ canPreview, previewRunId }: { canPreview: boolean; previewRunId: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionForm action={previewAction}>
        <SubmitButton variant="secondary" disabled={!canPreview} pendingLabel="Previewing…">
          <Eye /> Preview import
        </SubmitButton>
      </ActionForm>
      <ActionForm action={importAction}>
        <input type="hidden" name="previewRunId" value={previewRunId ?? ""} />
        <SubmitButton disabled={!previewRunId} pendingLabel="Importing…">
          <DatabaseZap /> Import previewed changes
        </SubmitButton>
      </ActionForm>
    </div>
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
