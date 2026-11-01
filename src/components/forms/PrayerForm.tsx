"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, HandHeart, Lock, PartyPopper } from "lucide-react";
import { submitPrayer, type FormState } from "@/app/(site)/connect-actions";
import { BotTraps, Choices, Field, SubmitButton, useFocusFirstError } from "./fields";

const initial: FormState = { ok: false };

const categories = [
  "Spiritual breakthrough and growth",
  "Healing, health and deliverance",
  "Family, marriage and relationships",
  "Career, job and financial provision",
  "School and exams",
  "Grief, comfort and emotional restoration",
  "Another need",
];

function Inner({ onReset, initialType }: { onReset: () => void; initialType: "prayer" | "thanksgiving" }) {
  const [state, action] = useActionState(submitPrayer, initial);
  const [type, setType] = useState<"prayer" | "thanksgiving">(initialType);
  const [anon, setAnon] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const err = state.errors ?? {};
  const prayer = type === "prayer";

  useFocusFirstError(state.errors, formRef);
  useEffect(() => {
    if (state.ok) doneRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    const thanks = state.type === "thanksgiving";
    return (
      <div className="border-t-4 border-purple pt-8">
        <CheckCircle2 className="size-10 text-ok" aria-hidden />
        <h2 ref={doneRef} tabIndex={-1} className="t-h2 mt-4 outline-none">{thanks ? "Thank you for sharing what God has done." : "We have received your prayer request."}</h2>
        <p className="reading mt-4 text-muted">{thanks ? "We rejoice with you. Your thanksgiving has reached the pastoral team." : "Our team is standing with you in prayer. If you asked us to call, we will reach out soon."}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={onReset} className="inline-flex min-h-12 items-center rounded-sm border border-ink/35 px-6 font-semibold hover:bg-ink hover:text-paper">Send another</button>
          <Link href="/" className="inline-flex min-h-12 items-center px-2 font-semibold text-purple underline underline-offset-[6px]">Back to the home page</Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="relative grid gap-12">
      <BotTraps />
      <input type="hidden" name="type" value={type} />
      {state.message && !state.ok && <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p>}

      <fieldset>
        <legend className="f-label">What would you like to send?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {([["prayer", "Prayer request", "Ask us to pray with you", HandHeart], ["thanksgiving", "Thanksgiving", "Share what God has done", PartyPopper]] as const).map(([v, title, sub, Icon]) => (
            <label key={v} className="f-choice !min-h-[4.25rem]">
              <input type="radio" name="kind" value={v} checked={type === v} onChange={() => setType(v)} />
              <Icon className="size-6 shrink-0 text-purple" aria-hidden />
              <span><span className="block font-bold leading-tight">{title}</span><span className="block text-[0.9rem] text-muted">{sub}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-2 text-2xl font-extrabold [font-variation-settings:'wdth'_86]"><span className="mr-3 text-purple">1</span>About you</legend>
        <label className="f-choice">
          <input type="checkbox" name="anonymous" value="Yes" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          <span className="leading-snug">Keep me anonymous <span className="text-muted">(we will not ask for your name or number)</span></span>
        </label>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Your name" optional>{(p) => <input {...p} name="name" className="f-input" autoComplete="name" maxLength={120} disabled={anon} />}</Field>
          <Field label="Phone or WhatsApp" optional error={err.phone}>{(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" className="f-input" placeholder="07XX XXX XXX" maxLength={20} disabled={anon} />}</Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-2 text-2xl font-extrabold [font-variation-settings:'wdth'_86]"><span className="mr-3 text-purple">2</span>{prayer ? "Your prayer request" : "Your thanksgiving"}</legend>
        {prayer && (
          <Field label="What is it about?" optional>{(p) => (
            <select {...p} name="category" className="f-input" defaultValue="">
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}</Field>
        )}
        <Field label={prayer ? "What would you like us to pray about?" : "What are you thanking God for?"} error={err.message}>{(p) => <textarea {...p} name="message" className="f-input" maxLength={3000} required />}</Field>
        {prayer ? (
          <Choices legend="Who may read your request?" type="radio" name="whoMaySee" error={err.whoMaySee} defaultValue="Pastoral team only" options={[{ value: "Pastoral team only", label: <>Pastoral team only <span className="text-muted">(confidential)</span></> }, { value: "Pastoral team and intercessory prayer team", label: "Pastoral team and the intercessory prayer team" }]} />
        ) : (
          <Choices legend="May we share your thanksgiving in the fellowship?" type="radio" name="mayShare" columns={2} error={err.mayShare} options={[{ value: "Yes, it may be shared", label: "Yes, you may share it" }, { value: "Keep it private", label: "Please keep it private" }]} />
        )}
        <label className="f-choice">
          <input type="checkbox" name="callBack" value="Yes" disabled={anon} />
          <span className="leading-snug">Please call or WhatsApp me <span className="text-muted">(add your number above)</span></span>
        </label>
        {!prayer && <p className="text-muted">Would you also like to give a thanksgiving offering? <Link href="/give" className="font-semibold text-purple underline underline-offset-4">See our giving options</Link>.</p>}
      </fieldset>

      <div className="grid gap-6 border-t border-rule pt-8">
        <Choices legend="Your permission" type="checkbox" name="consent" error={err.consent} options={[{ value: "Yes", label: "I agree that Christhood Ministries may keep this message securely. Only the people I chose above will read it." }]} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SubmitButton>{prayer ? "Send my prayer request" : "Send my thanksgiving"}</SubmitButton>
          <p className="flex items-center gap-2 text-[0.9rem] text-muted"><Lock className="size-4" aria-hidden /> Saved privately for the pastoral team only.</p>
        </div>
      </div>
    </form>
  );
}

export default function PrayerForm({ initialType = "prayer" }: { initialType?: "prayer" | "thanksgiving" }) {
  const [round, setRound] = useState(0);
  return <Inner key={round} onReset={() => { setRound((r) => r + 1); window.scrollTo({ top: 0 }); }} initialType={initialType} />;
}
