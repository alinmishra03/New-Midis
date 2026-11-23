"use client";

import { changePasswordAction } from "@/app/crm/(app)/profile/actions";
import { ActionForm, PasswordField, SubmitButton } from "./forms";

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess className="max-w-sm space-y-4">
      <PasswordField label="Current password" name="current" autoComplete="current-password" required />
      <PasswordField label="New password" name="password" autoComplete="new-password" hint="At least 10 characters, with a letter and a number." required />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" required />
      <SubmitButton pendingLabel="Saving…">Change password</SubmitButton>
    </ActionForm>
  );
}
