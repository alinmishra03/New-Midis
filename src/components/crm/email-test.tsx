"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "./forms";
import { buttonClass } from "./ui";

/** Sends one test email to the controlled test mailbox via /crm/api/email/test (Super Admin only). */
export function TestEmailButton({ disabled }: { disabled?: boolean }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; id?: string } | null>(null);

  async function send() {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/crm/api/email/test", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; id?: string };
      const r = { ok: !!body.ok, message: body.message ?? (res.ok ? "Sent." : "The test email couldn't be sent."), id: body.id };
      setResult(r);
      toast(r.message, r.ok ? "success" : "error");
    } catch {
      setResult({ ok: false, message: "Couldn't reach the server." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={send} disabled={disabled || pending} className={buttonClass("primary")}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Send />} {pending ? "Sending…" : "Send test email"}
      </button>
      {result && (
        <p className={result.ok ? "text-[0.8125rem] text-c-success" : "text-[0.8125rem] text-c-danger"} role="status">
          {result.message}
          {result.id ? <span className="block font-mono text-xs text-c-subtle">Resend message id: {result.id}</span> : null}
        </p>
      )}
    </div>
  );
}
