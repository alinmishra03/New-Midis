import "server-only";
import { and, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/crm/db";
import { documents, employees, files, users } from "@/crm/db/schema";
import { can, ForbiddenError, type Viewer } from "@/crm/auth/dal";
import { AppError } from "@/crm/lib/actions";
import { audit } from "@/crm/lib/audit";
import { deleteStored, storeUpload } from "@/crm/lib/storage";
import { notify, userIdForEmployee } from "./notifications";

/**
 * Documents. Visibility per document:
 * - employee: the employee it belongs to, plus HR (documents.manage);
 * - hr_only:  HR only;
 * - company:  every signed-in employee (company policies).
 * HR uploads anything; employees can add their own ID proofs, certificates
 * and other personal documents (visibility "employee").
 */

export type DocCategory = "offer_letter" | "agreement" | "policy" | "id_proof" | "certificate" | "payslip" | "other";
export const DOC_CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: "offer_letter", label: "Offer letter" },
  { value: "agreement", label: "Employment agreement" },
  { value: "policy", label: "Company policy" },
  { value: "id_proof", label: "ID / verification" },
  { value: "certificate", label: "Certificate" },
  { value: "payslip", label: "Payslip" },
  { value: "other", label: "Other" },
];
const SELF_CATEGORIES: DocCategory[] = ["id_proof", "certificate", "other"];

const docSelect = {
  id: documents.id,
  title: documents.title,
  category: documents.category,
  visibility: documents.visibility,
  employeeId: documents.employeeId,
  fileId: documents.fileId,
  fileName: files.fileName,
  sizeBytes: files.sizeBytes,
  contentType: files.contentType,
  createdAt: documents.createdAt,
  uploadedById: documents.uploadedById,
  uploaderEmail: users.email,
  firstName: employees.firstName,
  lastName: employees.lastName,
};

function base() {
  return db
    .select(docSelect)
    .from(documents)
    .innerJoin(files, eq(files.id, documents.fileId))
    .leftJoin(users, eq(users.id, documents.uploadedById))
    .leftJoin(employees, eq(employees.id, documents.employeeId));
}

export async function myDocuments(viewer: Viewer) {
  if (!viewer.employee) return [];
  return base()
    .where(and(eq(documents.employeeId, viewer.employee.id), inArray(documents.visibility, ["employee", "company"])))
    .orderBy(desc(documents.createdAt));
}

export async function companyDocuments() {
  return base()
    .where(and(isNull(documents.employeeId), eq(documents.visibility, "company")))
    .orderBy(desc(documents.createdAt));
}

/** HR view: every document, with filters. */
export async function allDocuments(viewer: Viewer, f: { employeeId?: string; category?: string; q?: string }) {
  if (!can(viewer, "documents.manage")) throw new ForbiddenError();
  const conds: SQL[] = [];
  if (f.employeeId === "company") conds.push(isNull(documents.employeeId));
  else if (f.employeeId) conds.push(eq(documents.employeeId, f.employeeId));
  if (f.category && DOC_CATEGORIES.some((c) => c.value === f.category)) conds.push(eq(documents.category, f.category as DocCategory));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(sql`${documents.title} ilike ${like}`, sql`${files.fileName} ilike ${like}`)!);
  }
  return base()
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(documents.createdAt))
    .limit(300);
}

export async function uploadDocument(
  viewer: Viewer,
  input: { employeeId: string | null; category: DocCategory; title: string; visibility: "employee" | "hr_only" | "company"; file: File },
) {
  const hr = can(viewer, "documents.manage");
  const self = !!viewer.employee && input.employeeId === viewer.employee.id;
  if (!hr) {
    if (!self) throw new ForbiddenError("You can only upload documents to your own record.");
    if (!SELF_CATEGORIES.includes(input.category)) throw new ForbiddenError("HR uploads offer letters, agreements, policies and payslips.");
    input.visibility = "employee";
  }
  if (input.employeeId === null && input.visibility === "employee") input.visibility = "company";
  if (input.employeeId) {
    const emp = await db.query.employees.findFirst({ where: eq(employees.id, input.employeeId), columns: { id: true } });
    if (!emp) throw new AppError("Employee not found.");
  }
  const doc = await db.transaction(async (tx) => {
    const stored = await storeUpload(input.file, viewer.userId, { tx });
    const [d] = await tx
      .insert(documents)
      .values({ employeeId: input.employeeId, category: input.category, title: input.title, visibility: input.visibility, fileId: stored.id, uploadedById: viewer.userId })
      .returning();
    await audit(
      { actorUserId: viewer.userId, action: "document.upload", entityType: "document", entityId: d!.id, summary: `Uploaded “${input.title}”${input.employeeId ? "" : " (company-wide)"}`, metadata: { category: input.category, visibility: input.visibility, employeeId: input.employeeId } },
      tx,
    );
    return d!;
  });
  if (input.employeeId && !self && input.visibility !== "hr_only") {
    await notify([await userIdForEmployee(input.employeeId)], { type: "document_added", title: `HR added a document: ${input.title}`, link: "/crm/documents" });
  }
  return doc;
}

export async function deleteDocument(viewer: Viewer, id: string) {
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) });
  if (!doc) throw new AppError("Document not found.");
  const own = doc.uploadedById === viewer.userId && !!viewer.employee && doc.employeeId === viewer.employee.id;
  if (!can(viewer, "documents.manage") && !own) throw new ForbiddenError();
  const file = await db.query.files.findFirst({ where: eq(files.id, doc.fileId) });
  await db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.id, id));
    // The file row goes too unless something else still references it.
    if (file) await tx.delete(files).where(eq(files.id, file.id));
    await audit({ actorUserId: viewer.userId, action: "document.delete", entityType: "document", entityId: id, summary: `Deleted “${doc.title}”` }, tx);
  });
  if (file) await deleteStored(file.storageKey).catch(() => undefined);
}
