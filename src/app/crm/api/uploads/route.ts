import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getViewer } from "@/crm/auth/dal";
import { blobEnabled, blobToken } from "@/crm/lib/storage";
import { MAX_UPLOAD_BYTES, PURPOSE_TYPES, isDirectUploadPath, isUploadPurpose } from "@/crm/lib/upload-rules";

/**
 * Issues short-lived client tokens so a signed-in user's browser can upload a
 * file straight to the PRIVATE Blob store, bypassing the ~4.5 MB request-body
 * limit of Vercel Functions. Each token is bound by Vercel Blob to:
 * - one path inside the user's own folder (crm/uploads/<user id>/<uuid>.<ext>),
 * - the media types allowed for that input, and at most 10 MB,
 * - no overwriting, and 10 minutes of validity.
 *
 * Uploading only stores bytes. Nothing is attached to any record, and nobody
 * can read it, until a Server Action re-validates the stored file and links it
 * (storeUpload → claimDirectUpload). Downloads still go only through
 * /crm/api/files/[id] and its per-file access check.
 */
const TOKEN_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (!blobEnabled()) return NextResponse.json({ error: "Direct uploads are not enabled." }, { status: 404 });

  // Same-origin only (defence in depth on top of the SameSite session cookie).
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && !!host && new URL(origin).host === host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  // Only token requests: no upload-completed callbacks are used or accepted here.
  if (body?.type !== "blob.generate-client-token") return NextResponse.json({ error: "Bad request." }, { status: 400 });

  try {
    const result = await handleUpload({
      token: blobToken(),
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let purpose: unknown = "any";
        try {
          purpose = clientPayload ? (JSON.parse(clientPayload) as { purpose?: unknown }).purpose : "any";
        } catch {
          purpose = undefined;
        }
        if (!isUploadPurpose(purpose)) throw new Error("invalid purpose");
        const allowed = PURPOSE_TYPES[purpose];
        if (!isDirectUploadPath(pathname, viewer.userId, allowed)) throw new Error("invalid path");
        return {
          allowedContentTypes: allowed,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          validUntil: Date.now() + TOKEN_TTL_MS,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: null,
        };
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "That upload isn't allowed." }, { status: 400 });
  }
}
