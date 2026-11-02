"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { changeFamilyPassword, connectCamper, registerFamily, signInFamily, signOutFamily } from "@/app/(site)/family/actions";
import type { FormState } from "@/app/(site)/connect-actions";
import { BotTraps, Field, SubmitButton, useFocusFirstError } from "@/components/forms/fields";
import { useActionStateKeep } from "@/components/forms/keep";

const initial: FormState = { ok: false };
const Alert = ({ state }: { state: FormState }) => (state.message && !state.ok ? <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p> : null);

export function SignInForm() {
  const [state, action, , formRef] = useActionStateKeep(signInFamily, initial);
  return (
    <form ref={formRef} action={action} noValidate className="grid gap-5">
      <Alert state={state} />
      <Field label="Mobile phone">{(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="username" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
      <Field label="Password">{(p) => <input {...p} name="password" type="password" autoComplete="current-password" className="f-input" required />}</Field>
      <div><SubmitButton pending="Signing in…">Sign in</SubmitButton></div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, , formRef] = useActionStateKeep(registerFamily, initial);
  const err = state.errors ?? {};
  useFocusFirstError(state.errors, formRef);
  return (
    <form ref={formRef} action={action} noValidate className="relative grid gap-5">
      <BotTraps />
      <Alert state={state} />
      <Field label="Your full name" error={err.name}>{(p) => <input {...p} name="name" autoComplete="name" className="f-input" maxLength={120} required />}</Field>
      <Field label="Mobile phone" hint="You will sign in with this number." error={err.phone}>{(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
      <Field label="Email" optional error={err.email}>{(p) => <input {...p} name="email" type="email" autoComplete="email" className="f-input" maxLength={120} />}</Field>
      <Field label="Choose a password" hint="At least 10 characters, with letters and numbers." error={err.password}>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" className="f-input" required />}</Field>
      <Field label="Type the password again" error={err.again}>{(p) => <input {...p} name="again" type="password" autoComplete="new-password" className="f-input" required />}</Field>
      <div><SubmitButton pending="Creating…">Create my family page</SubmitButton></div>
    </form>
  );
}

export function ConnectForm() {
  const router = useRouter();
  const [state, action, , formRef] = useActionStateKeep(connectCamper, initial);
  const err = state.errors ?? {};
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);
  return (
    <form ref={formRef} action={action} noValidate className="grid max-w-md gap-4">
      <Alert state={state} />
      {state.ok && <p role="status" className="flex items-start gap-2 font-semibold text-ok"><CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden /> {state.name} is now on your family page.</p>}
      <Field label="Code from the camp office" hint="Looks like ABCD-2345. It works once and runs out after two weeks." error={err.code}>{(p) => <input {...p} name="code" className="f-input uppercase" autoComplete="off" autoCapitalize="characters" maxLength={20} required />}</Field>
      <div><SubmitButton pending="Checking…">Add this child</SubmitButton></div>
    </form>
  );
}

export function PasswordForm({ forced }: { forced?: boolean }) {
  const [state, action, , formRef] = useActionStateKeep(changeFamilyPassword, initial);
  const err = state.errors ?? {};
  return (
    <form ref={formRef} action={action} noValidate className="grid max-w-md gap-4">
      <Alert state={state} />
      {state.ok && <p role="status" className="flex items-start gap-2 font-semibold text-ok"><CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden /> {state.message}</p>}
      <Field label={forced ? "The temporary password you were given" : "Current password"} error={err.current}>{(p) => <input {...p} name="current" type="password" autoComplete="current-password" className="f-input" required />}</Field>
      <Field label="New password" hint="At least 10 characters, with letters and numbers." error={err.password}>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" className="f-input" required />}</Field>
      <Field label="Type the new password again" error={err.again}>{(p) => <input {...p} name="again" type="password" autoComplete="new-password" className="f-input" required />}</Field>
      <div><SubmitButton pending="Saving…">Change password</SubmitButton></div>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutFamily}>
      <button type="submit" className="inline-flex min-h-11 items-center rounded-sm border border-ink/35 px-5 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
    </form>
  );
}
