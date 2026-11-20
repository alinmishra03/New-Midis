import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, type Tx } from "@/crm/db";
import { files } from "@/crm/db/schema";
import { AppError } from "./actions";

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
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED: Record<string, { ext: string; magic?: (b: Uint8Array) => boolean }> = {
  "application/pdf": { ext: "pdf", magic: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  "image/png": { ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/webp": { ext: "webp", magic: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", magic: (b) => b[0] === 0x50 && b[1] === 0x4b },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", magic: (b) => b[0] === 0x50 && b[1] === 0x4b },
  "text/csv": { ext: "csv" },
  "text/plain": { ext: "txt" },
};
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const ACCEPT_ATTR = Object.keys(ALLOWED).join(",");

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
  file: File,
  uploadedById: string,
  opts: { allowed?: string[]; tx?: Tx } = {},
) {
  if (!file || typeof file === "string" || file.size === 0) throw new AppError("Choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("Files can be at most 10 MB.");
  const type = file.type || "application/octet-stream";
  const rule = ALLOWED[type];
  if (!rule || (opts.allowed && !opts.allowed.includes(type))) {
    throw new AppError(opts.allowed?.every((t) => t.startsWith("image/")) ? "Upload a PNG, JPEG or WebP image." : "That file type isn't allowed. Use PDF, an image, Word, Excel, CSV or text.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (rule.magic && !rule.magic(bytes)) throw new AppError("The file's contents don't match its type.");

  const key = `crm/${new Date().getUTCFullYear()}/${randomUUID()}.${rule.ext}`;
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(key, Buffer.from(bytes), { access: "private", contentType: type, addRandomSuffix: false });
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

/** Reads a stored file's bytes as a stream. Only call after an access check. */
export async function readStored(storageKey: string): Promise<ReadableStream<Uint8Array> | null> {
  if (blobEnabled()) {
    const { get } = await import("@vercel/blob");
    const res = await get(storageKey, { access: "private" });
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
    await del(storageKey);
  } else {
    await rm(path.join(LOCAL_DIR, storageKey), { force: true });
  }
}

/** Reads an uploaded File from FormData, or null if the field is empty. */
export function fileFrom(fd: FormData, name: string): File | null {
  const v = fd.get(name);
  return v && typeof v !== "string" && v.size > 0 ? v : null;
}
