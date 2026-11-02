"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, ShieldPlus } from "lucide-react";
import { login, setupFirstAdmin } from "@/app/123admin/auth-actions";
import GoogleSignIn from "./GoogleSignIn";
import { TextField, useSave } from "./forms";
import { btnClass } from "./ui";

function Password({ name, label, error, autoComplete, hint }: { name: string; label: string; error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="f-label">{label}</label>
      {hint && <p id={`${id}-hint`} className="f-hint">{hint}</p>}
      <div className="relative">
        <input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required className="f-input pr-12" aria-invalid={error ? true : undefined} aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined} />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-1 top-[0.4rem] inline-flex size-12 items-center justify-center text-muted hover:text-ink">
          {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="f-error">{error}</p>}
    </div>
  );
}

export function SignIn({ googleClientId }: { googleClientId?: string }) {
  const { run, formRef, pending, state } = useSave(login);
  return (
    <div className="grid gap-8">
    {googleClientId && (
      <div className="grid gap-5">
        <GoogleSignIn clientId={googleClientId} />
        <p className="flex items-center gap-4 text-[0.92rem] text-muted"><span className="h-px flex-1 bg-rule" aria-hidden /> or use your password <span className="h-px flex-1 bg-rule" aria-hidden /></p>
      </div>
    )}
    <form ref={formRef} action={run} className="grid gap-6" noValidate>
      <TextField name="email" label="Email" type="email" autoComplete="username" required autoFocus />
      <Password name="password" label="Password" autoComplete="current-password" />
      {state.message && !state.ok && <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={`${btnClass.primary} w-full`}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
    </div>
  );
}

export function FirstSetup({ needsKey }: { needsKey: boolean }) {
  const { run, formRef, pending, state, errors } = useSave(setupFirstAdmin);
  return (
    <form ref={formRef} action={run} className="grid gap-6" noValidate>
      <TextField name="name" label="Your name" autoComplete="name" required error={errors.name} />
      <TextField name="email" label="Email" type="email" autoComplete="username" required error={errors.email} />
      <Password name="password" label="Choose a password" autoComplete="new-password" error={errors.password} hint="At least 10 characters, with letters and numbers." />
      <Password name="confirm" label="Type it again" autoComplete="new-password" error={errors.confirm} />
      {needsKey && <TextField name="setupKey" label="Setup key" hint="The key you added to the hosting settings (ADMIN_SETUP_KEY)." required autoComplete="off" />}
      {state.message && !state.ok && !Object.keys(errors).length && <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={`${btnClass.primary} w-full`}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ShieldPlus className="size-4" aria-hidden />}
        {pending ? "Creating…" : "Create the administrator"}
      </button>
    </form>
  );
}
