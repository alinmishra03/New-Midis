import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ActionForm, PasswordField, SubmitButton } from "@/components/crm/forms";
import { buttonClass } from "@/components/crm/ui";
import { peekToken } from "@/crm/auth/tokens";
import { db } from "@/crm/db";
import { employees } from "@/crm/db/schema";
import { setPasswordWithToken } from "../actions";

export const metadata: Metadata = { title: "Set your password" };

export default async function SetPasswordPage({ searchParams }: PageProps<"/crm/set-password">) {
  const { token } = await searchParams;
  const row = typeof token === "string" ? await peekToken(token) : null;

  if (!row) {
    return (
      <div className="crm-enter">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">This link can&apos;t be used</h1>
        <p className="mt-2 text-sm text-c-muted">
          It has expired or has already been used. Ask HR to issue a new one — invite links last 7 days, reset links 1 hour.
        </p>
        <Link href="/crm/login" className={buttonClass("secondary", "lg", "mt-8 w-full")}>
          Go to sign in
        </Link>
      </div>
    );
  }

  const emp = await db.query.employees.findFirst({ where: eq(employees.userId, row.userId), columns: { firstName: true } });
  const invite = row.type === "invite";

  return (
    <div className="crm-enter">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{invite ? `Welcome${emp ? `, ${emp.firstName}` : ""}` : "Choose a new password"}</h1>
      <p className="mt-1.5 text-sm text-c-muted">
        {invite
          ? "Set a password to activate your MIDIS employee account."
          : "Your new password signs you out of every other device."}
      </p>
      <ActionForm action={setPasswordWithToken} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token as string} />
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          hint="At least 10 characters, with a letter and a number."
          required
          autoFocus
        />
        <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" required />
        <SubmitButton className="w-full" size="lg" pendingLabel="Saving…">
          {invite ? "Activate account" : "Set password"}
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
