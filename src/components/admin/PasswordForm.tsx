"use client";

import { useRouter } from "next/navigation";
import { changePassword } from "@/app/123admin/auth-actions";
import { SaveButton, TextField, useSave } from "./forms";

export default function PasswordForm() {
  const router = useRouter();
  const { run, formRef, errors } = useSave(changePassword, () => router.push("/123admin"));
  return (
    <form ref={formRef} action={run} className="grid gap-6" noValidate>
      <h2 className="text-xl">Change password</h2>
      <TextField name="current" label="Current password" type="password" autoComplete="current-password" error={errors.current} required />
      <TextField name="next" label="New password" type="password" autoComplete="new-password" error={errors.next} hint="At least 10 characters, with letters and numbers." required />
      <TextField name="confirm" label="New password again" type="password" autoComplete="new-password" error={errors.confirm} required />
      <div><SaveButton>Change password</SaveButton></div>
    </form>
  );
}
