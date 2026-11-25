"use client";

import { Eye, Upload, X, DatabaseZap } from "lucide-react";
import { importAction, previewAction, removeUploadAction, uploadCsvAction } from "@/app/crm/(app)/settings/integrations/actions";
import { ActionForm, SubmitButton, inputClass } from "./forms";

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
