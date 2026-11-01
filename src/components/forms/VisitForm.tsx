"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { submitVisitor, type FormState } from "@/app/(site)/connect-actions";
import { BotTraps, Choices, Field, SubmitButton, nairobiToday, useFocusFirstError } from "./fields";

const initial: FormState = { ok: false };

const ageGroups = ["Under 13", "13 – 19", "20 – 35", "36 – 55", "56 and above"];
const heardFrom = ["A friend or family member", "Social media (Instagram, TikTok, Facebook, YouTube)", "The church website", "Walked past the venue", "A camp, event or outreach", "Other"];
const interests = [
  "Talk to a pastor",
  "Become a member",
  "Join a ministry or fellowship group",
  "Be baptised",
  "Learn about Jewels, Teen Life or Branch",
  "I gave my life to Christ today",
];

function Inner({ onReset }: { onReset: () => void }) {
  const [state, action] = useActionState(submitVisitor, initial);
  const [today, setToday] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const err = state.errors ?? {};

  useEffect(() => setToday(nairobiToday()), []);
  useFocusFirstError(state.errors, formRef);
  useEffect(() => {
    if (state.ok) doneRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <div className="border-t-4 border-purple pt-8">
        <CheckCircle2 className="size-10 text-ok" aria-hidden />
        <h2 ref={doneRef} tabIndex={-1} className="t-h2 mt-4 outline-none">Thank you, {state.name}. You are registered.</h2>
        <p className="reading mt-4 text-muted">Welcome to the Christhood family. Someone from our hospitality team will be in touch soon.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={onReset} className="inline-flex min-h-12 items-center rounded-sm border border-ink/35 px-6 font-semibold hover:bg-ink hover:text-paper">Register another visitor</button>
          <Link href="/" className="inline-flex min-h-12 items-center px-2 font-semibold text-purple underline underline-offset-[6px]">Back to the home page</Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="relative grid gap-12">
      <BotTraps />
      {state.message && !state.ok && <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p>}

      <fieldset className="grid gap-6">
        <legend className="mb-2 text-2xl font-extrabold [font-variation-settings:'wdth'_86]"><span className="mr-3 text-purple">1</span>About you</legend>
        <Field label="Full name" error={err.fullName}>{(p) => <input {...p} name="fullName" className="f-input" autoComplete="name" maxLength={120} required />}</Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Phone or WhatsApp" error={err.phone}>{(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
          <Field label="Email" optional error={err.email}>{(p) => <input {...p} name="email" type="email" autoComplete="email" className="f-input" placeholder="name@example.com" maxLength={120} />}</Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Where do you live?" optional>{(p) => <input {...p} name="area" className="f-input" autoComplete="address-level2" placeholder="For example Kasarani, Ruaka, Kitengela" maxLength={80} />}</Field>
          <Field label="Age group" optional>{(p) => (
            <select {...p} name="ageGroup" className="f-input" defaultValue="">
              <option value="">Choose…</option>
              {ageGroups.map((a) => <option key={a}>{a}</option>)}
            </select>
          )}</Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-2 text-2xl font-extrabold [font-variation-settings:'wdth'_86]"><span className="mr-3 text-purple">2</span>Your visit</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Date of visit" error={err.visitDate}>{(p) => <input {...p} key={today} name="visitDate" type="date" className="f-input" defaultValue={today} max={today || undefined} required />}</Field>
          <Field label="How did you hear about us?" optional>{(p) => (
            <select {...p} name="heardFrom" className="f-input" defaultValue="">
              <option value="">Choose…</option>
              {heardFrom.map((a) => <option key={a}>{a}</option>)}
            </select>
          )}</Field>
        </div>
        <Choices legend="Is this your first time at Christhood?" type="radio" name="firstVisit" columns={2} error={err.firstVisit} options={[{ value: "First time", label: "Yes, it is my first time" }, { value: "Visited before", label: "I have visited before" }]} />
        <Field label="Who invited you?" optional hint="So we can thank them.">{(p) => <input {...p} name="invitedBy" className="f-input" maxLength={120} />}</Field>
        <Choices legend="Do you have a home church?" optional type="radio" name="homeChurch" columns={3} options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }, { value: "Looking for one", label: "Looking for one" }]} />
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-2 text-2xl font-extrabold [font-variation-settings:'wdth'_86]"><span className="mr-3 text-purple">3</span>How can we serve you?</legend>
        <Choices legend="I would like to…" optional hint="Tick any that apply." type="checkbox" name="interests" columns={2} options={interests.map((i) => ({ value: i, label: i }))} />
        <Field label="Is there anything we can pray with you about?" optional hint="Only our pastoral team will read this.">{(p) => <textarea {...p} name="prayerRequest" className="f-input" maxLength={2000} />}</Field>
      </fieldset>

      <div className="grid gap-6 border-t border-rule pt-8">
        <Choices legend="Your permission" type="checkbox" name="consent" error={err.consent} options={[{ value: "Yes", label: "I agree that Christhood Ministries may keep these details and contact me by phone, WhatsApp or email about church life. My details will not be shared outside the church." }]} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SubmitButton pending="Registering…">Register my visit</SubmitButton>
          <p className="flex items-center gap-2 text-[0.9rem] text-muted"><Lock className="size-4" aria-hidden /> Saved privately, for the church leadership only.</p>
        </div>
      </div>
    </form>
  );
}

export default function VisitForm() {
  const [round, setRound] = useState(0);
  return <Inner key={round} onReset={() => { setRound((r) => r + 1); window.scrollTo({ top: 0 }); }} />;
}
