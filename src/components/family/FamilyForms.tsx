"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { changeFamilyPassword, confirmFamilyPhoneChange, connectCamper, registerFamily, requestFamilyPhoneChange, signInFamily, signOutFamily, updateFamilyChildProfile, updateFamilyContact } from "@/app/(site)/family/actions";
import type { FormState } from "@/app/(site)/connect-actions";
import { BotTraps, Field, SubmitButton, useFocusFirstError } from "@/components/forms/fields";
import { useActionStateKeep } from "@/components/forms/keep";
import type { ChildProfile } from "@/lib/types";

const initial: FormState = { ok: false };
const Alert = ({ state }: { state: FormState }) => (state.message && !state.ok ? <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p> : null);

export function SignInForm() {
  const [state, action, , formRef] = useActionStateKeep(signInFamily, initial);
  return (
    <form ref={formRef} action={action} noValidate className="grid gap-5">
      <Alert state={state} />
      <Field label="Mobile phone">{(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="username" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
      <Field label="Password">{(p) => <input {...p} name="password" type="password" autoComplete="current-password" className="f-input" required />}</Field>
      <div><SubmitButton tone="purple" pending="Signing in…">Sign in</SubmitButton></div>
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
      <Field label="Choose a password" hint="Use 12 or more characters. A phrase you remember is fine; numbers are not required." error={err.password}>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" className="f-input" required />}</Field>
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
      <Field label="New password" hint="Use 12 or more characters. A phrase you remember is fine; numbers are not required." error={err.password}>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" className="f-input" required />}</Field>
      <Field label="Type the new password again" error={err.again}>{(p) => <input {...p} name="again" type="password" autoComplete="new-password" className="f-input" required />}</Field>
      <div><SubmitButton pending="Saving…">Change password</SubmitButton></div>
    </form>
  );
}

export function ContactDetailsForm({ name, email, smsUpdates }: { name: string; email?: string; smsUpdates?: boolean }) {
  const [state, action, , formRef] = useActionStateKeep(updateFamilyContact, initial);
  const err = state.errors ?? {};
  return (
    <form ref={formRef} action={action} noValidate className="grid max-w-xl gap-5">
      {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "font-semibold text-ok" : "border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger"}>{state.message}</p>}
      <Field label="Your full name" error={err.name}>{(p) => <input {...p} name="name" defaultValue={name} autoComplete="name" className="f-input" maxLength={120} required />}</Field>
      <Field label="Email" hint="Optional. Used if the camp office needs to contact you." error={err.email}>{(p) => <input {...p} name="email" defaultValue={email ?? ""} type="email" autoComplete="email" className="f-input" maxLength={120} />}</Field>
      <label className="flex items-start gap-3 rounded-sm border border-rule p-4 text-[0.95rem]"><input type="checkbox" name="smsUpdates" value="yes" defaultChecked={smsUpdates} className="mt-1 size-5 accent-purple" /><span><span className="font-semibold">Text me important camp updates</span><span className="mt-1 block text-muted">Optional: application receipts, private family updates and away check-in alerts. You can change this any time.</span></span></label>
      <div><SubmitButton pending="Saving…">Save contact details</SubmitButton></div>
    </form>
  );
}

export function ChildProfileForm({ childId, name, profile }: { childId: string; name: string; profile?: ChildProfile }) {
  const router = useRouter();
  const [state, action, , formRef] = useActionStateKeep(updateFamilyChildProfile, initial);
  const err = state.errors ?? {};
  useFocusFirstError(state.errors, formRef);
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);
  const emergencies = profile?.emergencies ?? [];
  return (
    <form ref={formRef} action={action} noValidate className="grid max-w-3xl gap-6">
      <input type="hidden" name="childId" value={childId} readOnly />
      {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "font-semibold text-ok" : "border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger"}>{state.message}</p>}
      <p className="text-muted">Changes are saved to your family page and any camp that has not finished. The camp team can see the latest care details.</p>
      <Field label="Child's full name" error={err.name}>{(p) => <input {...p} name="name" defaultValue={name} className="f-input" maxLength={120} required />}</Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of birth" error={err.dob}>{(p) => <input {...p} name="dob" defaultValue={profile?.dob ?? ""} type="date" className="f-input" required />}</Field>
        <Field label="Gender" error={err.gender}>{(p) => <select {...p} name="gender" defaultValue={profile?.gender ?? ""} className="f-input" required><option value="">Choose…</option><option>Female</option><option>Male</option></select>}</Field>
        <Field label="Class or grade" error={err.grade}>{(p) => <input {...p} name="grade" defaultValue={profile?.grade ?? ""} className="f-input" maxLength={40} required />}</Field>
        <Field label="School" optional>{(p) => <input {...p} name="school" defaultValue={profile?.school ?? ""} className="f-input" maxLength={120} />}</Field>
        <Field label="Preferred name or nickname" optional>{(p) => <input {...p} name="nickname" defaultValue={profile?.nickname ?? ""} className="f-input" maxLength={60} />}</Field>
      </div>
      <div className="grid gap-5 border-t border-rule pt-5">
        {[{ key: "allergies", label: "Allergies" }, { key: "conditions", label: "Existing conditions" }, { key: "medication", label: "Medication and dosage" }, { key: "specialNeeds", label: "Dietary or other special needs" }].map(({ key, label }) => (
          <Field key={key} label={label} optional>{(p) => <textarea {...p} name={key} defaultValue={profile?.[key as keyof ChildProfile] as string ?? ""} className="f-input" rows={2} maxLength={1000} />}</Field>
        ))}
        <Field label="Swimming ability" optional error={err.swimming}>{(p) => <select {...p} name="swimming" defaultValue={profile?.swimming ?? ""} className="f-input"><option value="">Choose…</option><option>None</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>}</Field>
      </div>
      <div className="grid gap-4 border-t border-rule pt-5">
        <h3 className="text-lg font-bold">Emergency contacts</h3>
        <p className="text-muted">Keep at least one contact the camp leaders can reach.</p>
        {[1, 2, 3].map((n) => {
          const contact = emergencies[n - 1];
          return (
            <div key={n} className="grid gap-4 border-t border-rule pt-4 sm:grid-cols-2">
              <Field label={`Contact ${n}: name`} optional={n > 1} error={err[`em${n}Name`]}>{(p) => <input {...p} name={`em${n}Name`} defaultValue={contact?.name ?? ""} className="f-input" maxLength={120} />}</Field>
              <Field label="Relationship" optional>{(p) => <input {...p} name={`em${n}Rel`} defaultValue={contact?.relationship ?? ""} className="f-input" maxLength={60} />}</Field>
              <Field label="Phone" optional={n > 1} error={err[`em${n}Phone`]}>{(p) => <input {...p} name={`em${n}Phone`} defaultValue={contact?.phone ?? ""} type="tel" inputMode="tel" className="f-input" maxLength={20} />}</Field>
              <Field label="Email" optional error={err[`em${n}Email`]}>{(p) => <input {...p} name={`em${n}Email`} defaultValue={contact?.email ?? ""} type="email" className="f-input" maxLength={120} />}</Field>
            </div>
          );
        })}
      </div>
      <details className="border-t border-rule pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-purple">More details: support, doctor and insurance</summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Physical disabilities or support needs" optional>{(p) => <textarea {...p} name="disabilities" defaultValue={profile?.disabilities ?? ""} className="f-input" rows={2} maxLength={1000} />}</Field>
          <Field label="Other conditions" optional>{(p) => <textarea {...p} name="otherConditions" defaultValue={profile?.otherConditions ?? ""} className="f-input" rows={2} maxLength={1000} />}</Field>
          <Field label="Guardian ID number" optional>{(p) => <input {...p} name="guardianId" defaultValue={profile?.guardianId ?? ""} className="f-input" maxLength={30} />}</Field>
          <Field label="Residence" optional>{(p) => <input {...p} name="residence" defaultValue={profile?.residence ?? ""} className="f-input" maxLength={120} />}</Field>
          <Field label="House number" optional>{(p) => <input {...p} name="house" defaultValue={profile?.house ?? ""} className="f-input" maxLength={60} />}</Field>
          <Field label="Preferred doctor" optional>{(p) => <input {...p} name="doctor" defaultValue={profile?.doctor ?? ""} className="f-input" maxLength={120} />}</Field>
          <Field label="Doctor's phone" optional>{(p) => <input {...p} name="doctorPhone" defaultValue={profile?.doctorPhone ?? ""} className="f-input" maxLength={20} />}</Field>
          <Field label="Preferred hospital" optional>{(p) => <input {...p} name="hospital" defaultValue={profile?.hospital ?? ""} className="f-input" maxLength={120} />}</Field>
          <Field label="Blood group, if known" optional>{(p) => <input {...p} name="blood" defaultValue={profile?.blood ?? ""} className="f-input" maxLength={10} />}</Field>
          <Field label="Insurance provider" optional>{(p) => <input {...p} name="insurer" defaultValue={profile?.insurer ?? ""} className="f-input" maxLength={120} />}</Field>
          <Field label="Policy number" optional>{(p) => <input {...p} name="policy" defaultValue={profile?.policy ?? ""} className="f-input" maxLength={60} />}</Field>
        </div>
      </details>
      <div><SubmitButton pending="Saving…">Save child's details</SubmitButton></div>
    </form>
  );
}

export function FamilyPhoneForm({ currentPhone }: { currentPhone: string }) {
  const router = useRouter();
  const [requested, setRequested] = useState(false);
  const [requestState, requestAction, , requestRef] = useActionStateKeep(requestFamilyPhoneChange, initial);
  const [confirmState, confirmAction, , confirmRef] = useActionStateKeep(confirmFamilyPhoneChange, initial);
  useEffect(() => {
    if (requestState.ok && requestState.message?.startsWith("A verification code")) setRequested(true);
    if (confirmState.ok) {
      setRequested(false);
      router.refresh();
    }
  }, [requestState, confirmState, router]);
  const reqErr = requestState.errors ?? {};
  const verifyErr = confirmState.errors ?? {};
  return (
    <div className="grid max-w-xl gap-5">
      <p className="text-muted">Current sign-in number: <span className="font-semibold text-ink">{currentPhone}</span></p>
      {!requested ? (
        <form ref={requestRef} action={requestAction} noValidate className="grid gap-4">
          {requestState.message && <p role={requestState.ok ? "status" : "alert"} className={requestState.ok ? "font-semibold text-ok" : "border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger"}>{requestState.message}</p>}
          <Field label="New mobile phone" hint="We will send a six-digit code to verify it." error={reqErr.phone}>{(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
          <div><SubmitButton pending="Sending code…">Verify new number</SubmitButton></div>
        </form>
      ) : (
        <form ref={confirmRef} action={confirmAction} noValidate className="grid gap-4">
          {requestState.message && <p className="text-muted">{requestState.message}</p>}
          {confirmState.message && <p role={confirmState.ok ? "status" : "alert"} className={confirmState.ok ? "font-semibold text-ok" : "border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger"}>{confirmState.message}</p>}
          <Field label="Six-digit code" error={verifyErr.code}>{(p) => <input {...p} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" className="f-input" maxLength={6} required />}</Field>
          <div className="flex flex-wrap gap-3"><SubmitButton pending="Checking…">Confirm number</SubmitButton><button type="button" onClick={() => setRequested(false)} className="min-h-12 px-3 font-semibold text-purple underline underline-offset-4">Use another number</button></div>
        </form>
      )}
    </div>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutFamily}>
      <button type="submit" className="inline-flex min-h-11 items-center rounded-sm border border-ink/35 px-5 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
    </form>
  );
}
