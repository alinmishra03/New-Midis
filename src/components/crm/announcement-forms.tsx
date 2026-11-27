"use client";

import { Megaphone, Pencil } from "lucide-react";
import { useState } from "react";
import { saveAnnouncementAction } from "@/app/crm/(app)/announcements/actions";
import { ActionForm, FormActions, CheckboxField, Dialog, SelectField, SubmitButton, TextAreaField, TextField } from "./forms";
import { buttonClass } from "./ui";

type Opt = { value: string; label: string };
export type AnnouncementValues = { id?: string; title?: string; body?: string; category?: string; departmentId?: string | null; isPinned?: boolean; isImportant?: boolean; status?: string };

export function AnnouncementDialog({ values = {}, categories, departments }: { values?: AnnouncementValues; categories: Opt[]; departments: Opt[] }) {
  const editing = !!values.id;
  const [category, setCategory] = useState(values.category ?? "company");
  return (
    <Dialog
      size="lg"
      title={editing ? "Edit announcement" : "New announcement"}
      trigger={(open) => (
        <button type="button" onClick={open} className={buttonClass(editing ? "secondary" : "primary", editing ? "sm" : "md")}>
          {editing ? <Pencil /> : <Megaphone />} {editing ? "Edit" : "New announcement"}
        </button>
      )}
    >
      {(close) => (
        <ActionForm action={saveAnnouncementAction} onSuccess={close} className="space-y-4">
          {editing && <input type="hidden" name="id" value={values.id} />}
          <TextField label="Title" name="title" defaultValue={values.title} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Category" name="category" options={categories} value={category} onChange={(e) => setCategory(e.target.value)} />
            <SelectField label="Audience" name="departmentId" options={departments} placeholder="Everyone" defaultValue={values.departmentId ?? ""} required={category === "department"} hint={category === "department" ? "Department announcements need a department." : "Leave as Everyone, or limit to one department."} />
          </div>
          <TextAreaField label="Message" name="body" defaultValue={values.body} rows={8} required hint="Plain text. Line breaks are kept." />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <CheckboxField name="isImportant" label="Mark as important" defaultChecked={values.isImportant} />
            <CheckboxField name="isPinned" label="Pin to top" defaultChecked={values.isPinned} />
            <CheckboxField name="publish" label={values.status === "published" ? "Published" : "Publish now (notifies the audience)"} defaultChecked={values.status ? values.status === "published" : true} />
          </div>
          <FormActions>
            <SubmitButton>{editing ? "Save" : "Save announcement"}</SubmitButton>
          </FormActions>
        </ActionForm>
      )}
    </Dialog>
  );
}
