"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DIRECT_UPLOAD_ROOT,
  MAX_UPLOAD_BYTES,
  PURPOSE_TYPES,
  UPLOAD_TYPES,
  directUploadFields,
  isUploadPurpose,
  typeNotAllowedMessage,
} from "@/crm/lib/upload-rules";

/**
 * Direct-to-Blob uploads for CRM forms.
 *
 * File inputs marked with `data-upload="any" | "image" | "resume"` are
 * uploaded by the browser straight to the private Blob store before the form's
 * Server Action runs; the action then receives only the stored path and the
 * original file name. This keeps uploads up to 10 MB working on Vercel, whose
 * Functions reject request bodies over ~4.5 MB.
 *
 * When Blob isn't configured (local development) nothing changes: the file is
 * sent to the Server Action as before.
 */
type DirectUploadConfig = { enabled: boolean; userId: string | null };
const DirectUploadContext = createContext<DirectUploadConfig>({ enabled: false, userId: null });

export function DirectUploadProvider({ enabled, userId, children }: DirectUploadConfig & { children: ReactNode }) {
  return <DirectUploadContext.Provider value={{ enabled, userId }}>{children}</DirectUploadContext.Provider>;
}

export const useDirectUpload = () => useContext(DirectUploadContext);

/** File inputs in `form` that should go direct to Blob and have a file chosen. */
export function directUploadInputs(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"][data-upload]')).filter(
    (i) => !!i.name && !!i.files?.length,
  );
}

/**
 * Uploads each marked file and rewrites `fd` so the file is replaced by its
 * stored path. Files already uploaded by an earlier submit of the same form
 * (e.g. after a validation error) are reused via `cache`. Returns an error
 * message to show, or null on success.
 */
export async function prepareDirectUploads(
  inputs: HTMLInputElement[],
  fd: FormData,
  config: DirectUploadConfig,
  cache: WeakMap<File, string>,
): Promise<string | null> {
  if (!config.enabled || !config.userId) return null;
  const { upload } = await import("@vercel/blob/client");

  for (const input of inputs) {
    const file = input.files![0]!;
    const purpose = isUploadPurpose(input.dataset.upload) ? input.dataset.upload : "any";
    const allowed = PURPOSE_TYPES[purpose];

    if (file.size === 0) return "Choose a file to upload.";
    if (file.size > MAX_UPLOAD_BYTES) return "Files can be at most 10 MB.";
    if (!allowed.includes(file.type)) return typeNotAllowedMessage(purpose === "any" ? undefined : allowed);

    let pathname = cache.get(file);
    if (!pathname) {
      const candidate = `${DIRECT_UPLOAD_ROOT}/${config.userId}/${crypto.randomUUID()}.${UPLOAD_TYPES[file.type]}`;
      try {
        await upload(candidate, file, {
          access: "private",
          handleUploadUrl: "/crm/api/uploads",
          clientPayload: JSON.stringify({ purpose }),
          contentType: file.type,
        });
      } catch {
        return "The upload failed. Check your connection and try again.";
      }
      pathname = candidate;
      cache.set(file, pathname);
    }

    const f = directUploadFields(input.name);
    fd.delete(input.name);
    fd.set(f.path, pathname);
    fd.set(f.fileName, file.name);
  }
  return null;
}
