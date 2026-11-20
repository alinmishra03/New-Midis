import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionForm, SubmitButton, TextField } from "@/components/crm/forms";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="crm-enter">
      <Link href="/crm/login" className="mb-6 inline-flex items-center gap-1.5 text-[0.8125rem] text-c-muted hover:text-c-fg">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1.5 text-sm text-c-muted">
        Enter your company email. HR will be notified and will send you a one-time link to set a new password.
      </p>
      <ActionForm action={requestPasswordReset} className="mt-8 space-y-4" resetOnSuccess>
        <TextField label="Company email" name="email" type="email" autoComplete="username" placeholder="name@midis.in" required autoFocus />
        <SubmitButton className="w-full" size="lg" pendingLabel="Sending…">
          Request reset link
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
