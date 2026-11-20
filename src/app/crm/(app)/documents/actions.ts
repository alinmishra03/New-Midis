"use server";

import { z } from "zod";
import { fail, ok, parseForm, runAction, zId, type ActionState } from "@/crm/lib/actions";
import { fileFrom } from "@/crm/lib/storage";
import { deleteDocument, uploadDocument } from "@/crm/services/documents";

const uploadSchema = z.object({
  employeeId: z.string().optional().transform((v) => (v && v !== "company" ? v : null)).pipe(z.uuid().nullable()),
  category: z.enum(["offer_letter", "agreement", "policy", "id_proof", "certificate", "payslip", "other"]),
  title: z.string().trim().min(2, "Give the document a title.").max(200),
  visibility: z.enum(["employee", "hr_only", "company"]).default("employee"),
});

export async function uploadDocumentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(uploadSchema, fd);
    const file = fileFrom(fd, "file");
    if (!file) return fail("Choose a file.");
    await uploadDocument(viewer, { ...input, file });
    return ok("Document uploaded.");
  });
}

export async function deleteDocumentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await deleteDocument(viewer, zId.parse(fd.get("id")));
    return ok("Document deleted.");
  });
}
