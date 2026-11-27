import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, CheckboxField, PasswordField, SubmitButton, TextField } from "@/components/crm/forms";
import { getViewer } from "@/crm/auth/dal";
import { login } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/crm/login">) {
  if (await getViewer()) redirect("/crm");
  const { next } = await searchParams;

  return (
    <div className="crm-enter">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Sign in</h1>
      <p className="mt-1.5 text-sm text-c-muted">Use your official MIDIS email address.</p>

      <ActionForm action={login} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />
        <TextField
          label="Company email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="name@midis.in"
          required
          autoFocus
        />
        <PasswordField label="Password" name="password" autoComplete="current-password" required />
        <div className="flex items-center justify-between gap-3">
          <CheckboxField name="remember" label="Remember me for 30 days" />
          <Link href="/crm/forgot-password" className="text-[0.8125rem] font-medium whitespace-nowrap text-c-accent-text hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton className="w-full" size="lg" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>

      <p className="mt-8 text-xs leading-relaxed text-c-subtle">
        Accounts are created by HR. If you&apos;ve joined MIDIS and haven&apos;t received an activation link, ask HR.
      </p>
    </div>
  );
}
