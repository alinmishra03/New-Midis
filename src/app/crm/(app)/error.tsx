"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink, Card, EmptyState, buttonClass } from "@/components/crm/ui";

/**
 * Shown inside the portal frame (sidebar and header stay usable) when a page
 * fails unexpectedly, e.g. a database hiccup. No technical details are shown:
 * in production the server never sends error messages to the browser. The
 * reference code matches the entry in the server logs.
 */
export default function CrmPageError({ error, reset, retry }: { error: Error & { digest?: string }; reset: () => void; retry?: () => void }) {
  useEffect(() => {
    console.error("[crm page error]", error.digest ?? "", error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={<TriangleAlert />}
        title="Something went wrong"
        description={
          <>
            This page couldn&apos;t be loaded. Please try again. If it keeps happening, tell HR or the administrator
            {error.digest ? (
              <>
                {" "}and quote reference <code className="font-mono text-c-fg">{error.digest}</code>
              </>
            ) : null}
            .
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => (retry ?? reset)()} className={buttonClass("primary")}>
              <RotateCw /> Try again
            </button>
            <ButtonLink href="/crm">Back to dashboard</ButtonLink>
          </div>
        }
      />
    </Card>
  );
}
