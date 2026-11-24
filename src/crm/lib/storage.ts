import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, type Tx } from "@/crm/db";
import { files } from "@/crm/db/schema";
import { AppError } from "./actions";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_TYPES, directUploadFields, isDirectUploadPath, typeNotAllowedMessage } from "./upload-rules";

export { IMAGE_TYPES, MAX_UPLOAD_BYTES };

/**
 * Private file storage for employee documents, photos, attachments and
 * resumes.
 *
 * - Production: Vercel Blob with `access: "private"` (BLOB_READ_WRITE_TOKEN).
 *   Private blobs have no public URL; they are read server-side with the
 *   token.
 * - Development: .data/uploads on local disk (gitignored).
 *
 * Either way the browser only ever reaches a file through
 * /crm/api/files/[id], which checks the viewer's right to that specific
 * file first. Storage keys are random and never derived from user input.
 */

const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");
export const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
/**
 * Always pass the read-write token explicitly. Without it the SDK prefers
 * Vercel OIDC + BLOB_STORE_ID when both exist (as they do on Vercel), so
 * the store actually used could differ from the one the token belongs to.
 */
export const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN!;

const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (b) => b[0] === 0x50 && b[1] === 0x4b,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (b) => b[0] === 0x50 && b[1] === 0x4b,
};
const ALLOWED: Record<string, { ext: string; magic?: (b: Uint8Array) => boolean }> = Object.fromEntries(
  Object.entries(UPLOAD_TYPES).map(([type, ext]) => [type, { ext, magic: MAGIC[type] }]),
);
export const ACCEPT_ATTR = Object.keys(ALLOWED).join(",");

/**
 * A file the browser already uploaded straight to private Blob storage
 * (see /crm/api/uploads). Only its storage path and original name reach the
 * server action, so the upload never passes through a function's ~4.5 MB
 * request-body limit. It is checked again before it is attached to anything.
 */
export type DirectUpload = { kind: "direct"; pathname: string; fileName: string };
export type UploadInput = File | DirectUpload;
const isDirect = (u: UploadInput): u is DirectUpload => (u as DirectUpload).kind === "direct";

function safeName(name: string) {
  const cleaned = name.replace(/[^\w.\- ()]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120);
  return cleaned || "file";
}

/**
 * Validates and stores an uploaded file, returning its `files` row. Rejects
 * empty files, files over 10 MB, types outside the allow-list, and files
 * whose bytes don't match their declared type.
 */
export async function storeUpload(
  file: UploadInput,
  uploadedById: string,
  opts: { allowed?: string[]; tx?: Tx } = {},
) {
  if (file && isDirect(file)) return claimDirectUpload(file, uploadedById, opts);
  if (!file || typeof file === "string" || file.size === 0) throw new AppError("Choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("Files can be at most 10 MB.");
  const type = file.type || "application/octet-stream";
  const rule = ALLOWED[type];
  if (!rule || (opts.allowed && !opts.allowed.includes(type))) {
    throw new AppError(typeNotAllowedMessage(opts.allowed));
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (rule.magic && !rule.magic(bytes)) throw new AppError("The file's contents don't match its type.");

  const key = `crm/${new Date().getUTCFullYear()}/${randomUUID()}.${rule.ext}`;
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(key, Buffer.from(bytes), { access: "private", contentType: type, addRandomSuffix: false, token: blobToken() });
  } else {
    const full = path.join(LOCAL_DIR, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }

  const [row] = await (opts.tx ?? db)
    .insert(files)
    .values({ storageKey: key, fileName: safeName(file.name), contentType: type, sizeBytes: file.size, uploadedById })
    .returning();
  return row!;
}

/**
 * Attaches a direct upload: same rules as storeUpload, enforced on what is
 * actually in storage (size, type, leading bytes), not on what the browser
 * claimed. Only paths in the acting user's own upload folder are accepted,
 * each at most once. A file that fails a content check is deleted.
 */
async function claimDirectUpload(upload: DirectUpload, uploadedById: string, opts: { allowed?: string[]; tx?: Tx }) {
  const invalid = "That upload couldn't be used. Choose the file and try again.";
  if (!blobEnabled() || !isDirectUploadPath(upload.pathname, uploadedById)) throw new AppError(invalid);
  const q = opts.tx ?? db;
  const taken = await q.query.files.findFirst({ where: eq(files.storageKey, upload.pathname), columns: { id: true } });
  if (taken) throw new AppError(invalid);

  const { del, head } = await import("@vercel/blob");
  let meta: Awaited<ReturnType<typeof head>>;
  try {
    meta = await head(upload.pathname, { token: blobToken() });
  } catch {
    throw new AppError("The upload didn't finish. Please try again.");
  }
  const reject = async (message: string): Promise<never> => {
    await del(upload.pathname, { token: blobToken() }).catch(() => undefined);
    throw new AppError(message);
  };

  const type = (meta.contentType ?? "").split(";")[0]!.trim().toLowerCase();
  const rule = ALLOWED[type];
  if (meta.size === 0) return reject("Choose a file to upload.");
  if (meta.size > MAX_UPLOAD_BYTES) return reject("Files can be at most 10 MB.");
  if (!rule || (opts.allowed && !opts.allowed.includes(type)) || !upload.pathname.endsWith(`.${rule.ext}`)) {
    return reject(typeNotAllowedMessage(opts.allowed));
  }
  if (rule.magic) {
    const prefix = await readPrefix(upload.pathname, 16);
    if (!prefix || !rule.magic(prefix)) return reject("The file's contents don't match its type.");
  }

  const [row] = await q
    .insert(files)
    .values({ storageKey: upload.pathname, fileName: safeName(upload.fileName), contentType: type, sizeBytes: meta.size, uploadedById })
    .returning();
  return row!;
}

/** The first `n` bytes of a private blob (for the content-type check). */
async function readPrefix(storageKey: string, n: number): Promise<Uint8Array | null> {
  const { get } = await import("@vercel/blob");
  const res = await get(storageKey, { access: "private", token: blobToken() });
  if (!res || res.statusCode !== 200 || !res.stream) return null;
  const reader = res.stream.getReader();
  const out = new Uint8Array(n);
  let filled = 0;
  try {
    while (filled < n) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const take = Math.min(value.length, n - filled);
      out.set(value.subarray(0, take), filled);
      filled += take;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return out.subarray(0, filled);
}

/** Reads a stored file's bytes as a stream. Only call after an access check. */
export async function readStored(storageKey: string): Promise<ReadableStream<Uint8Array> | null> {
  if (blobEnabled()) {
    const { get } = await import("@vercel/blob");
    const res = await get(storageKey, { access: "private", token: blobToken() });
    return res && res.statusCode === 200 ? res.stream : null;
  }
  const full = path.join(LOCAL_DIR, storageKey);
  if (!full.startsWith(LOCAL_DIR)) return null;
  try {
    const buf = await readFile(full);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buf));
        controller.close();
      },
    });
  } catch {
    return null;
  }
}

export async function deleteStored(storageKey: string) {
  if (blobEnabled()) {
    const { del } = await import("@vercel/blob");
    await del(storageKey, { token: blobToken() });
  } else {
    await rm(path.join(LOCAL_DIR, storageKey), { force: true });
  }
}

/**
 * Reads an upload field from FormData: a direct-to-Blob upload (its path and
 * original name) when the browser sent one, otherwise the File itself (local
 * development without Blob). Null if the field is empty.
 */
export function uploadFrom(fd: FormData, name: string): UploadInput | null {
  const f = directUploadFields(name);
  const pathname = fd.get(f.path);
  if (typeof pathname === "string" && pathname) {
    const fileName = fd.get(f.fileName);
    return { kind: "direct", pathname, fileName: typeof fileName === "string" && fileName ? fileName : "file" };
  }
  return fileFrom(fd, name);
}

/** Reads an uploaded File from FormData, or null if the field is empty. */
export function fileFrom(fd: FormData, name: string): File | null {
  const v = fd.get(name);
  return v && typeof v !== "string" && v.size > 0 ? v : null;
}
