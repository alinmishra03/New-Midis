"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";
import { buttonClass } from "./ui";

/**
 * The in-card message for one uploaded file whose preview can't be shown.
 * Used both when the server couldn't build the preview and, through
 * SheetPreviewBoundary, when the table fails while rendering. Only the
 * preview is affected: the upload, its stored original and the download
 * button above stay as they are, and the other files' cards still load.
 */
export function SheetPreviewError({ fileName, onRetry, detail }: { fileName: string; onRetry?: () => void; detail?: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-lg border border-c-border bg-c-surface-2 px-4 py-3 text-[0.8125rem]">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-c-warning" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-c-fg">The preview of “{fileName}” can&apos;t be shown</p>
        <p className="text-c-muted">
          {detail ?? "Something went wrong while displaying this file."} The upload itself is unchanged, and the download above still works. The other files are not affected.
        </p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonClass("secondary", "sm")}>
          <RotateCw /> Try again
        </button>
      )}
    </div>
  );
}

function Fallback({ fileName }: { fileName: string }, { error, retry }: ErrorInfo) {
  useEffect(() => {
    console.error("[sheet preview] couldn't render the table for", fileName, error);
  }, [error, fileName]);
  return <SheetPreviewError fileName={fileName} onRetry={() => retry()} />;
}

/** Error boundary around one file's table, so a rendering failure stays inside that file's card. */
export const SheetPreviewBoundary = catchError(Fallback);
