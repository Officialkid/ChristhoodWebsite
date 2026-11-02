"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { submitCampApplication } from "@/app/(site)/camp-actions";
import type { FormState } from "@/app/(site)/connect-actions";
import { BotTraps, Choices, Field, SubmitButton, useFocusFirstError } from "./fields";
import { useActionStateKeep } from "./keep";

export type OpenCamp = { id: string; title: string; subtitle?: string; fee?: number; dates: string };

const initial: FormState = { ok: false };
const area = "grid gap-6";
const heading = "mb-2 text-2xl font-extrabold [font-variation-settings:'wdth'_86]";
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

function Inner({ camps, consent, selected, whatsapp, prefill, onReset }: { camps: OpenCamp[]; consent: string[]; selected: string; whatsapp: string; prefill?: Record<string, string>; onReset: () => void }) {
  const d = prefill ?? {};
  const [state, action, , formRef] = useActionStateKeep(submitCampApplication, initial);
  const [eventId, setEventId] = useState(selected);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const err = state.errors ?? {};
  const camp = camps.find((c) => c.id === eventId);
  useFocusFirstError(state.errors, formRef);
  useEffect(() => {
    if (state.ok) doneRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <div className="border-t-4 border-purple pt-8">
        <CheckCircle2 className="size-10 text-ok" aria-hidden />
        <h2 ref={doneRef} tabIndex={-1} className="t-h2 mt-4 outline-none">Thank you. {state.name}&apos;s application has been received.</h2>
        <p className="reading mt-4 text-muted">The camp office will review it and contact you. If anything needs correcting we will tell you. Nothing is charged on this site, and your payment is confirmed by the office.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {state.type === "family" ? (
            <Link href="/family" className="inline-flex min-h-12 items-center rounded-sm bg-gold px-6 font-semibold text-ink hover:bg-gold-hover">Go to my family page</Link>
          ) : (
            <button type="button" onClick={onReset} className="inline-flex min-h-12 items-center rounded-sm border border-ink/35 px-6 font-semibold hover:bg-ink hover:text-paper">Apply for another child</button>
          )}
          <Link href="/events" className="inline-flex min-h-12 items-center px-2 font-semibold text-purple underline underline-offset-[6px]">Back to events</Link>
        </div>
        {state.type !== "family" && <p className="mt-6 max-w-xl text-muted">Next year, skip the typing: <Link href="/family" className="font-semibold text-purple underline underline-offset-4">make a family page</Link> and your child&apos;s details are kept for you.</p>}
        <p className="mt-6 text-muted">Questions? WhatsApp <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${whatsapp}`}>0{whatsapp.replace(/^254/, "")}</a>.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="relative grid gap-14">
      <BotTraps />
      <input type="hidden" name="childId" value={d.childId ?? ""} readOnly />
      {state.message && !state.ok && <p role="alert" className="border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p>}

      <fieldset className={area}>
        <legend className={heading}><span className="mr-3 text-purple">1</span>Which camp?</legend>
        <Choices legend="Choose the camp" type="radio" name="eventId" error={err.eventId} defaultValue={eventId} onChange={setEventId} options={camps.map((c) => ({ value: c.id, label: <><span className="font-semibold">{c.title}</span>{c.subtitle ? ` · ${c.subtitle}` : ""} <span className="text-muted">· {c.dates}{typeof c.fee === "number" ? ` · ${kes(c.fee)}` : ""}</span></> }))} />
      </fieldset>

      <fieldset className={area}>
        <legend className={heading}><span className="mr-3 text-purple">2</span>The child</legend>
        <Field label="Child's full name" error={err.name}>{(p) => <input {...p} name="name" defaultValue={d.name} className="f-input" autoComplete="off" maxLength={120} required />}</Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Date of birth" error={err.dob}>{(p) => <input {...p} name="dob" defaultValue={d.dob} type="date" className="f-input" required />}</Field>
          <Field label="Preferred name or nickname" optional>{(p) => <input {...p} name="nickname" defaultValue={d.nickname} className="f-input" maxLength={60} />}</Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Gender" optional>{(p) => <select {...p} name="gender" className="f-input" defaultValue={d.gender ?? ""}><option value="">Choose…</option><option>Female</option><option>Male</option></select>}</Field>
          <Field label="School" optional>{(p) => <input {...p} name="school" defaultValue={d.school} className="f-input" maxLength={120} />}</Field>
          <Field label="Class or grade" optional>{(p) => <input {...p} name="grade" defaultValue={d.grade} className="f-input" maxLength={40} />}</Field>
        </div>
        {camp && <p className="text-muted">Ages are checked against the camp&apos;s age range. If your child is outside it, the office will look at the application and talk to you. It is not refused automatically.</p>}
      </fieldset>

      <fieldset className={area}>
        <legend className={heading}><span className="mr-3 text-purple">3</span>Parent or guardian</legend>
        <Field label="Parent or guardian's full name" error={err.guardian}>{(p) => <input {...p} name="guardian" defaultValue={d.guardian} className="f-input" autoComplete="name" maxLength={120} required />}</Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Mobile phone" error={err.phone}>{(p) => <input {...p} name="phone" defaultValue={d.phone} type="tel" inputMode="tel" autoComplete="tel" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
          <Field label="Email" optional error={err.email}>{(p) => <input {...p} name="email" defaultValue={d.email} type="email" autoComplete="email" className="f-input" maxLength={120} />}</Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Guardian ID number" optional>{(p) => <input {...p} name="guardianId" defaultValue={d.guardianId} className="f-input" maxLength={30} />}</Field>
          <Field label="Residence" optional>{(p) => <input {...p} name="residence" defaultValue={d.residence} className="f-input" autoComplete="address-level2" maxLength={120} />}</Field>
          <Field label="House number" optional>{(p) => <input {...p} name="house" defaultValue={d.house} className="f-input" maxLength={60} />}</Field>
        </div>
      </fieldset>

      <fieldset className={area} aria-describedby={err.em1Name ? "em-err" : undefined}>
        <legend className={heading}><span className="mr-3 text-purple">4</span>Emergency contacts</legend>
        <p className="text-muted">At least one is needed. Someone other than you, if possible, who can be reached during camp.</p>
        {err.em1Name && <p id="em-err" role="alert" className="f-error">{err.em1Name}</p>}
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid gap-4 border-t border-rule pt-5 sm:grid-cols-2">
            <Field label={`Contact ${n}: name`} optional={n > 1}>{(p) => <input {...p} name={`em${n}Name`} defaultValue={d[`em${n}Name`]} className="f-input" maxLength={120} />}</Field>
            <Field label="Relationship" optional>{(p) => <input {...p} name={`em${n}Rel`} defaultValue={d[`em${n}Rel`]} className="f-input" maxLength={60} />}</Field>
            <Field label="Phone" optional={n > 1}>{(p) => <input {...p} name={`em${n}Phone`} defaultValue={d[`em${n}Phone`]} type="tel" inputMode="tel" className="f-input" maxLength={20} />}</Field>
            <Field label="Email" optional>{(p) => <input {...p} name={`em${n}Email`} defaultValue={d[`em${n}Email`]} type="email" className="f-input" maxLength={120} />}</Field>
          </div>
        ))}
      </fieldset>

      <fieldset className={area}>
        <legend className={heading}><span className="mr-3 text-purple">5</span>Health and care</legend>
        <p className="flex items-start gap-2 text-muted"><Lock className="mt-1 size-4 shrink-0 text-purple" aria-hidden /> Health details are encrypted when saved and are seen only by the programme&apos;s leaders and the camp office.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Preferred doctor" optional>{(p) => <input {...p} name="doctor" defaultValue={d.doctor} className="f-input" maxLength={120} />}</Field>
          <Field label="Doctor's phone" optional>{(p) => <input {...p} name="doctorPhone" defaultValue={d.doctorPhone} type="tel" className="f-input" maxLength={20} />}</Field>
          <Field label="Preferred hospital" optional>{(p) => <input {...p} name="hospital" defaultValue={d.hospital} className="f-input" maxLength={120} />}</Field>
          <Field label="Blood group, if known" optional>{(p) => <input {...p} name="blood" defaultValue={d.blood} className="f-input" maxLength={10} />}</Field>
          <Field label="Insurance provider" optional>{(p) => <input {...p} name="insurer" defaultValue={d.insurer} className="f-input" maxLength={120} />}</Field>
          <Field label="Policy number" optional>{(p) => <input {...p} name="policy" defaultValue={d.policy} className="f-input" maxLength={60} />}</Field>
        </div>
        <Field label="Existing conditions" optional hint="For example asthma, migraines, travel sickness, anaemia, blackouts, heart condition, sleepwalking.">{(p) => <textarea {...p} name="conditions" defaultValue={d.conditions} className="f-input" rows={3} maxLength={1000} />}</Field>
        <Field label="Allergies" optional hint="For example penicillin, bee stings, lactose, pollen, peanuts, gluten.">{(p) => <textarea {...p} name="allergies" defaultValue={d.allergies} className="f-input" rows={3} maxLength={1000} />}</Field>
        <Field label="Physical disabilities or support needs" optional>{(p) => <textarea {...p} name="disabilities" defaultValue={d.disabilities} className="f-input" rows={2} maxLength={1000} />}</Field>
        <Field label="Other pre-existing conditions" optional>{(p) => <textarea {...p} name="otherConditions" defaultValue={d.otherConditions} className="f-input" rows={2} maxLength={1000} />}</Field>
        <Field label="Prescribed medication and dosage" optional>{(p) => <textarea {...p} name="medication" defaultValue={d.medication} className="f-input" rows={2} maxLength={1000} />}</Field>
        <Field label="Dietary and other special needs" optional>{(p) => <textarea {...p} name="specialNeeds" defaultValue={d.specialNeeds} className="f-input" rows={2} maxLength={1000} />}</Field>
        <Field label="Swimming ability" optional>{(p) => <select {...p} name="swimming" className="f-input" defaultValue={d.swimming ?? ""}><option value="">Choose…</option><option>None</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>}</Field>
      </fieldset>

      <fieldset className={area}>
        <legend className={heading}><span className="mr-3 text-purple">6</span>Consent</legend>
        <details className="border border-rule bg-paper-2 p-4">
          <summary className="min-h-11 cursor-pointer font-bold">Read the consent, indemnity and media authorization</summary>
          <div className="reading mt-3 grid max-h-[26rem] gap-3 overflow-y-auto pr-2 text-[0.98rem]">
            {consent.map((line, i) => (/^[A-Z][A-Za-z &,()/:–-]{4,60}$/.test(line) || line.startsWith("PART") ? <h3 key={i} className="mt-2 text-base">{line}</h3> : <p key={i}>{line}</p>))}
          </div>
        </details>
        <Choices legend="Participation" type="checkbox" name="participationConsent" error={err.participationConsent} options={[{ value: "yes", label: "I have read and understood the consent above, and I consent to my child's participation in the camp, voluntarily." }]} />
        <Choices legend="Medical authorization" type="checkbox" name="medicalConsent" error={err.medicalConsent} options={[{ value: "yes", label: "I authorize the person in charge to secure any necessary first aid, medical or surgical treatment for my child during the camp, as set out above." }]} />
        <Choices legend="Photos and videos (optional)" type="radio" name="mediaConsent" columns={2} error={err.mediaConsent} options={[{ value: "Yes", label: "Yes, the camp may photograph and film my child, as set out above" }, { value: "No", label: "No, please do not" }]} />
        <Field label="Parent or guardian's signature" hint="Type your full name. This is your signature." error={err.signature}>{(p) => <input {...p} name="signature" className="f-input" autoComplete="off" maxLength={120} required />}</Field>
      </fieldset>

      <fieldset className={area}>
        <legend className={heading}><span className="mr-3 text-purple">7</span>Payment you have made</legend>
        <p className="text-muted">{camp && typeof camp.fee === "number" ? `The fee for ${camp.title} is ${kes(camp.fee)}. ` : ""}Tell us what you have paid so far, if anything. The camp office checks every payment before confirming a place. Nothing is charged on this site.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Payment made" optional>{(p) => <select {...p} name="paymentType" className="f-input" defaultValue=""><option value="">Choose if applicable</option><option>Full payment</option><option>Part payment</option><option>Not paid yet</option></select>}</Field>
          <Field label="Amount paid (KES)" optional error={err.amount}>{(p) => <input {...p} name="amount" type="number" min={0} step={10} inputMode="numeric" className="f-input" />}</Field>
          <Field label="Payment date" optional>{(p) => <input {...p} name="paymentDate" type="date" className="f-input" />}</Field>
          <Field label="Payment method" optional>{(p) => <select {...p} name="paymentMode" className="f-input" defaultValue=""><option value="">Choose if applicable</option><option>M-Pesa</option><option>Bank transfer</option><option>Cheque</option><option>Cash / other</option></select>}</Field>
          <Field label="M-Pesa confirmation or cheque reference" optional>{(p) => <input {...p} name="paymentReference" className="f-input" maxLength={80} />}</Field>
          <Field label="Date you will clear the balance" optional>{(p) => <input {...p} name="balanceDate" type="date" className="f-input" />}</Field>
          <Field label="Pocket money (KES)" optional>{(p) => <input {...p} name="pocketMoney" type="number" min={0} step={10} inputMode="numeric" className="f-input" />}</Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-8">
        <SubmitButton pending="Sending…">Send application</SubmitButton>
        <p className="flex items-center gap-2 text-[0.9rem] text-muted"><Lock className="size-4" aria-hidden /> Seen only by the camp leaders.</p>
      </div>
    </form>
  );
}

export default function CampApplicationForm(props: { camps: OpenCamp[]; consent: string[]; selected: string; whatsapp: string; prefill?: Record<string, string> }) {
  const [round, setRound] = useState(0);
  return <Inner key={round} {...props} onReset={() => { setRound((r) => r + 1); window.scrollTo({ top: 0 }); }} />;
}
