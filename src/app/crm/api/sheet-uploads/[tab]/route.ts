import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getViewer } from "@/crm/auth/dal";
import { db } from "@/crm/db";
import { sheetSyncUploads } from "@/crm/db/schema";
import { isTabKey } from "@/crm/integrations/dev-sheet/admin";
import { writeCsv, type ParsedCsv } from "@/crm/integrations/dev-sheet/csv";
import { readStored } from "@/crm/lib/storage";

/**
 * Super Admin only: the CSV currently uploaded for one Development-sheet tab.
 *
 * - Default: the original file, byte for byte, streamed from private storage.
 *   The storage key and credentials never reach the browser.
 * - ?version=reconstructed: for files uploaded before originals were kept, a
 *   CSV rebuilt from the cells stored in the database. It is labelled as
 *   reconstructed in its filename and in the X-MIDIS-Reconstructed header.
 */
const CHARSET: Record<string, string> = { "utf-8": "utf-8", "utf-16le": "utf-16le", "utf-16be": "utf-16be", "windows-1252": "windows-1252" };

const disposition = (name: string) => {
  const ascii = name.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

const SAFE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "sandbox; default-src 'none'",
};

export async function GET(request: Request, ctx: RouteContext<"/crm/api/sheet-uploads/[tab]">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });
  // 404 rather than 403: don't confirm to anyone else that an upload exists.
  if (viewer.role.key !== "super_admin") return new Response("Not found.", { status: 404 });

  const { tab } = await ctx.params;
  if (!isTabKey(tab)) return new Response("Not found.", { status: 404 });
  const upload = await db.query.sheetSyncUploads.findFirst({ where: eq(sheetSyncUploads.tab, tab) });
  if (!upload) return new Response("Not found.", { status: 404 });

  const base = upload.fileName.replace(/\.csv$/i, "") || tab;
  if (new URL(request.url).searchParams.get("version") === "reconstructed") {
    // UTF-8 originals are rebuilt as plain UTF-8 (like a Google Sheets export); other encodings as UTF-8 with a
    // byte-order mark so spreadsheet apps read accented characters correctly.
    const text = (upload.encoding === "utf-8" ? "" : "\uFEFF") + writeCsv(upload.rows, upload.delimiter as ParsedCsv["delimiter"]);
    const body = new TextEncoder().encode(text);
    // Still a reconstruction either way; this only says whether it happens to equal the uploaded file's fingerprint.
    const matches = createHash("sha256").update(body).digest("hex") === upload.sha256;
    return new Response(body, {
      headers: {
        ...SAFE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": disposition(`${base} (reconstructed).csv`),
        "X-MIDIS-Reconstructed": "true",
        "X-MIDIS-Matches-Original-SHA256": matches ? "yes" : "no",
      },
    });
  }

  if (!upload.blobKey) return new Response("The original file wasn't kept for this upload. Download the reconstructed copy instead.", { status: 404 });
  const stream = await readStored(upload.blobKey);
  if (!stream) {
    console.error(`[sheet-import] original CSV missing from storage (tab=${tab}, key=${upload.blobKey})`);
    return new Response("The original file couldn't be found in storage.", { status: 404 });
  }
  const charset = CHARSET[upload.encoding];
  return new Response(stream, {
    headers: {
      ...SAFE_HEADERS,
      "Content-Type": charset ? `text/csv; charset=${charset}` : "text/csv",
      "Content-Length": String(upload.sizeBytes),
      "Content-Disposition": disposition(`${base}.csv`),
    },
  });
}
