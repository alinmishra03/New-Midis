/**
 * Upload rules shared by the browser (direct-to-Blob uploads) and the server
 * (src/crm/lib/storage.ts). No secrets and no server-only imports here: the
 * server re-checks everything when an upload is attached to a record.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Allowed media types and the file extension each is stored under. */
export const UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "text/plain": "txt",
};

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const RESUME_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

/** What a file input is for; decides which types its upload token accepts. */
export type UploadPurpose = "any" | "image" | "resume";
export const PURPOSE_TYPES: Record<UploadPurpose, string[]> = {
  any: Object.keys(UPLOAD_TYPES),
  image: IMAGE_TYPES,
  resume: RESUME_TYPES,
};
export const isUploadPurpose = (v: unknown): v is UploadPurpose => v === "any" || v === "image" || v === "resume";

/** The message for a type that isn't allowed (same wording as the server's). */
export function typeNotAllowedMessage(allowed?: string[]) {
  return allowed?.every((t) => t.startsWith("image/"))
    ? "Upload a PNG, JPEG or WebP image."
    : "That file type isn't allowed. Use PDF, an image, Word, Excel, CSV or text.";
}

/**
 * Direct uploads live under crm/uploads/<uploader's user id>/<random uuid>.<ext>.
 * The token route only signs paths in the signed-in user's own folder, and the
 * server only attaches a path from the acting user's own folder, so nobody can
 * claim a file someone else uploaded.
 */
export const DIRECT_UPLOAD_ROOT = "crm/uploads";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function isDirectUploadPath(pathname: string, userId: string, allowed: string[] = PURPOSE_TYPES.any) {
  if (!new RegExp(`^${UUID}$`).test(userId)) return false;
  const m = new RegExp(`^${DIRECT_UPLOAD_ROOT}/${userId}/${UUID}\\.([a-z]+)$`).exec(pathname);
  return !!m && allowed.some((t) => UPLOAD_TYPES[t] === m[1]);
}

/** Form-field names a direct upload is submitted under, in place of the file itself. */
export const directUploadFields = (name: string) => ({ path: `${name}__blob`, fileName: `${name}__name` });
