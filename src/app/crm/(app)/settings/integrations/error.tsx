"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink, Card, EmptyState, buttonClass } from "@/components/crm/ui";

/**
 * Settings → Integrations couldn't load as a whole (e.g. the database was
 * unreachable). A single file that can't be previewed is handled inside its
 * own card instead. No technical details are shown; the reference code
 * matches the server log entry.
 */
export default function IntegrationsError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  useEffect(() => {
    console.error("[integrations page error]", digest ?? "", error);
  }, [error, digest]);

  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={<TriangleAlert />}
        title="The CSV import page couldn't be loaded"
        description={
          <>
            Your uploaded files and imported data are safe; nothing was changed. Please try again. If it keeps happening, tell the administrator
            {digest ? (
              <>
                {" "}and quote reference <code className="font-mono text-c-fg">{digest}</code>
              </>
            ) : null}
            .
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
              <RotateCw /> Try again
            </button>
            <ButtonLink href="/crm/settings">Back to Settings</ButtonLink>
          </div>
        }
      />
    </Card>
  );
}
