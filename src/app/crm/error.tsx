"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink, Card, EmptyState, buttonClass } from "@/components/crm/ui";

/**
 * Fallback for the portal outside the signed-in frame: the sign-in,
 * forgot-password and set-password pages, and failures while loading the
 * portal frame itself. Same rules as the in-frame error page: no technical
 * details, just a reference code that matches the server logs.
 */
export default function CrmError({ error, reset, retry }: { error: Error & { digest?: string }; reset: () => void; retry?: () => void }) {
  useEffect(() => {
    console.error("[crm error]", error.digest ?? "", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <EmptyState
          icon={<TriangleAlert />}
          title="Something went wrong"
          description={
            <>
              The employee portal couldn&apos;t load this page. Please try again in a moment.
              {error.digest ? (
                <>
                  {" "}Reference: <code className="font-mono text-c-fg">{error.digest}</code>
                </>
              ) : null}
            </>
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => (retry ?? reset)()} className={buttonClass("primary")}>
                <RotateCw /> Try again
              </button>
              <ButtonLink href="/crm/login">Sign-in page</ButtonLink>
            </div>
          }
        />
      </Card>
    </main>
  );
}
