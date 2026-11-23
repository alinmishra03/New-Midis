import { getViewer } from "@/crm/auth/dal";
import { canViewFile } from "@/crm/auth/file-access";
import { readStored } from "@/crm/lib/storage";

/**
 * The only way to read a stored file. Checks the signed-in viewer's right to
 * this specific file, then streams it with headers that stop the browser
 * from caching it or executing it as anything other than its declared type.
 */
export async function GET(request: Request, ctx: RouteContext<"/crm/api/files/[id]">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in required.", { status: 401 });

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found.", { status: 404 });

  const file = await canViewFile(viewer, id);
  // 404 rather than 403: don't confirm the file exists to someone who can't see it.
  if (!file) return new Response("Not found.", { status: 404 });

  const stream = await readStored(file.storageKey);
  if (!stream) return new Response("Not found.", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const inline = !download && (file.contentType.startsWith("image/") || file.contentType === "application/pdf");
  const encoded = encodeURIComponent(file.fileName);
  return new Response(stream, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
