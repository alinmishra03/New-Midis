"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { uploadDocumentAction } from "@/app/crm/(app)/documents/actions";
import { ActionForm, Dialog, SelectField, SubmitButton, TextField, inputClass } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };

/**
 * Upload dialog. HR picks the employee (or "company-wide"), category and
 * visibility; employees upload to their own record only.
 */
export function UploadDocumentDialog({ hr, employees, categories, selfId, defaultEmployee }: { hr: boolean; employees: Opt[]; categories: Opt[]; selfId: string | null; defaultEmployee?: string }) {
  const [target, setTarget] = useState(defaultEmployee ?? (hr ? "company" : (selfId ?? "")));
  const company = target === "company";
  return (
    <Dialog
      title="Upload document"
      description="PDF, image, Word, Excel or text, up to 10 MB. Stored privately — only people allowed to see it can download it."
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass("primary")}>
          <Upload /> Upload
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={uploadDocumentAction} onSuccess={close} className="space-y-4">
          {hr ? (
            <SelectField label="For" name="employeeId" value={target} onChange={(e) => setTarget(e.target.value)} options={[{ value: "company", label: "Company-wide (policies, handbooks)" }, ...employees]} />
          ) : (
            <input type="hidden" name="employeeId" value={selfId ?? ""} />
          )}
          <TextField label="Title" name="title" required placeholder="e.g. Leave policy 2027" />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Category" name="category" options={categories} defaultValue={company ? "policy" : categories[0]?.value} />
            {hr ? (
              <SelectField
                label="Who can see it"
                name="visibility"
                key={String(company)}
                defaultValue={company ? "company" : "employee"}
                options={company ? [{ value: "company", label: "Everyone" }, { value: "hr_only", label: "HR only" }] : [{ value: "employee", label: "The employee and HR" }, { value: "hr_only", label: "HR only" }]}
              />
            ) : (
              <input type="hidden" name="visibility" value="employee" />
            )}
          </div>
          <div>
            <label htmlFor="doc-file" className="mb-1.5 block text-[0.8125rem] font-medium">
              File <span className="text-c-danger">*</span>
            </label>
            <input id="doc-file" type="file" name="file" data-upload="any" required className={inputClass} />
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Dialog>
  );
}
