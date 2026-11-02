"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { submitCampApplication } from "@/app/(site)/camp-actions";
import type { FormState } from "@/app/(site)/connect-actions";
import { phoneOk } from "@/lib/phone";
import { BotTraps, Choices, Field, SubmitButton, type Errors } from "./fields";
import { useActionStateKeep } from "./keep";

export type OpenCamp = { id: string; title: string; subtitle?: string; fee?: number; dates: string; start: string };

const initial: FormState = { ok: false };
const area = "grid gap-6";
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

/** The application is six short steps instead of one long page. Every step stays in the form, so one send carries everything. */
const STEPS = [
  { title: "The child", short: "Child", lead: "Which camp, and who is coming." },
  { title: "Parent or guardian", short: "Parent", lead: "Who we should call about this application." },
  { title: "Emergency contacts", short: "Emergency", lead: "Someone other than you, if possible, who can be reached during camp." },
  { title: "Health and care", short: "Health", lead: "Only what the leaders need to keep your child well. Skip anything that does not apply." },
  { title: "Consent", short: "Consent", lead: "Please read, then agree and sign." },
  { title: "Payment and send", short: "Send", lead: "Check your answers, tell us about any payment, and send." },
] as const;
const LAST = STEPS.length - 1;

/** Which step a field lives on, so a refused send takes the parent straight to the problem. */
const stepOf: Record<string, number> = { eventId: 0, name: 0, dob: 0, guardian: 1, phone: 1, email: 1, em1Name: 2, participationConsent: 4, medicalConsent: 4, signature: 4, mediaConsent: 4, amount: 5 };

const btnBack = "inline-flex min-h-12 items-center gap-2 rounded-sm border border-ink/35 px-6 font-semibold hover:bg-ink hover:text-paper";
const btnNext = "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-gold px-7 text-[0.98rem] font-bold text-ink transition-colors hover:bg-gold-hover";

function Inner({ camps, consent, selected, whatsapp, prefill, onReset }: { camps: OpenCamp[]; consent: string[]; selected: string; whatsapp: string; prefill?: Record<string, string>; onReset: () => void }) {
  const d = prefill ?? {};
  const [state, action, , formRef] = useActionStateKeep(submitCampApplication, initial);
  const [eventId, setEventId] = useState(selected);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState<[string, string, number][]>([]);
  const topRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const camp = camps.find((c) => c.id === eventId);
  const err = errors;

  // After every move: bring the step into view, and put focus on the first problem or on the step's heading.
  useEffect(() => {
    if (!moved.current) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    const t = setTimeout(() => {
      const bad = formRef.current?.querySelector<HTMLElement>('fieldset:not(.hidden) [aria-invalid="true"], fieldset:not(.hidden) fieldset[aria-describedby*="-err"] input, fieldset:not(.hidden) #em-err ~ div input');
      (bad ?? headRef.current)?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [step, errors, formRef]);

  // A refused send: show what the office-side check found and go to the first step that has a problem.
  useEffect(() => {
    if (state.ok) {
      doneRef.current?.focus();
      return;
    }
    const found = state.errors;
    if (found && Object.keys(found).length) {
      moved.current = true;
      setErrors(found);
      const to = Math.min(...Object.keys(found).map((k) => stepOf[k] ?? 0));
      setReached((r) => Math.max(r, to));
      setStep(to);
    }
  }, [state]);

  const get = () => {
    const fd = new FormData(formRef.current!);
    return (k: string) => String(fd.get(k) ?? "").trim();
  };

  /** The same rules the camp office side applies, run on one step before moving on. */
  function check(i: number): Errors {
    const g = get();
    const e: Errors = {};
    if (i === 0) {
      if (!g("eventId")) e.eventId = "Choose a camp.";
      if (g("name").length < 2) e.name = "Enter the child's full name.";
      const dob = g("dob");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(Date.parse(dob))) e.dob = "Enter a valid date of birth.";
      else if (camp && new Date(dob) > new Date(camp.start)) e.dob = "The birth date must be before the camp starts.";
    }
    if (i === 1) {
      if (g("guardian").length < 2) e.guardian = "Enter the parent or guardian's name.";
      if (!phoneOk(g("phone"))) e.phone = "Enter a phone number we can reach you on.";
      if (g("email") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g("email"))) e.email = "That email address does not look right.";
    }
    if (i === 2) {
      if (!g("em1Name") || !g("em1Phone")) e.em1Name = "Add at least one emergency contact with a name and a phone number.";
      else if ([1, 2, 3].some((n) => g(`em${n}Phone`) && !phoneOk(g(`em${n}Phone`)))) e.em1Name = "Check the emergency contact phone numbers.";
    }
    if (i === 4) {
      if (g("participationConsent") !== "yes") e.participationConsent = "Please confirm you have read and agree to your child's participation.";
      if (g("medicalConsent") !== "yes") e.medicalConsent = "Please confirm the medical authorization.";
      if (g("mediaConsent") !== "Yes" && g("mediaConsent") !== "No") e.mediaConsent = "Choose yes or no. Media consent is optional.";
      if (!g("signature")) e.signature = "Type your full name as your signature.";
    }
    if (i === 5) {
      const bad = (v: string) => v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0);
      if (bad(g("amount")) || bad(g("pocketMoney"))) e.amount = "Enter valid amounts in shillings, or leave them empty.";
    }
    return e;
  }

  function go(to: number) {
    moved.current = true;
    if (to === LAST) {
      const g = get();
      const health = ["conditions", "allergies", "disabilities", "otherConditions", "medication", "specialNeeds"].some((k) => g(k));
      setSummary([
        ["Camp", camp ? `${camp.title}, ${camp.dates}` : "", 0],
        ["Child", [g("name"), g("dob")].filter(Boolean).join(", born "), 0],
        ["Parent or guardian", [g("guardian"), g("phone")].filter(Boolean).join(", "), 1],
        ["Emergency contact", [g("em1Name"), g("em1Phone")].filter(Boolean).join(", "), 2],
        ["Health notes", health ? "Added" : "Nothing noted", 3],
        ["Photos and videos", g("mediaConsent") === "Yes" ? "Allowed" : "Not allowed", 4],
        ["Signed by", g("signature"), 4],
      ]);
    }
    setReached((r) => Math.max(r, to));
    setStep(to);
  }

  function next() {
    const e = check(step);
    setErrors((prev) => ({ ...Object.fromEntries(Object.entries(prev).filter(([k]) => (stepOf[k] ?? 0) !== step)), ...e }));
    if (Object.keys(e).length === 0) go(step + 1);
    else moved.current = true;
  }

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
            <button type="button" onClick={onReset} className={btnBack}>Apply for another child</button>
          )}
          <Link href="/events" className="inline-flex min-h-12 items-center px-2 font-semibold text-purple underline underline-offset-[6px]">Back to events</Link>
        </div>
        {state.type !== "family" && <p className="mt-6 max-w-xl text-muted">Next year, skip the typing: <Link href="/family" className="font-semibold text-purple underline underline-offset-4">make a family page</Link> and your child&apos;s details are kept for you.</p>}
        <p className="mt-6 text-muted">Questions? WhatsApp <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${whatsapp}`}>0{whatsapp.replace(/^254/, "")}</a>.</p>
      </div>
    );
  }

  const pane = (i: number) => (step === i ? area : "hidden");

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="relative"
      onSubmit={(e) => {
        // Enter in a box moves to the next step; only the last step sends.
        if (step < LAST) {
          e.preventDefault();
          next();
        }
      }}
    >
      <BotTraps />
      <input type="hidden" name="childId" value={d.childId ?? ""} readOnly />

      <div ref={topRef} className="scroll-mt-24">
        <nav aria-label="Application steps">
          <p className="text-[0.95rem] font-semibold text-muted" aria-live="polite">Step {step + 1} of {STEPS.length}</p>
          <ol className="mt-1 flex gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex-1">
                <button type="button" disabled={i > reached} aria-current={i === step ? "step" : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => go(i)} className="block w-full py-2.5 text-left disabled:cursor-default">
                  <span className={`block h-1.5 ${i === step ? "bg-purple" : i <= reached ? "bg-purple/45" : "bg-rule"}`} />
                  <span className={`mt-2 hidden text-[0.85rem] sm:block ${i === step ? "font-bold text-ink" : "text-muted"}`}>{s.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <h2 ref={headRef} tabIndex={-1} className="t-h2 mt-6 outline-none">{STEPS[step].title}</h2>
        <p className="reading mt-2 text-muted">{STEPS[step].lead}</p>
      </div>

      {state.message && !state.ok && <p role="alert" className="mt-6 border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{state.message}</p>}

      <div className="mt-8">
        <fieldset className={pane(0)}>
          <legend className="sr-only">The child</legend>
          <Choices legend="Choose the camp" type="radio" name="eventId" error={err.eventId} defaultValue={eventId} onChange={setEventId} options={camps.map((c) => ({ value: c.id, label: <><span className="font-semibold">{c.title}</span>{c.subtitle ? ` · ${c.subtitle}` : ""} <span className="text-muted">· {c.dates}{typeof c.fee === "number" ? ` · ${kes(c.fee)}` : ""}</span></> }))} />
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

        <fieldset className={pane(1)}>
          <legend className="sr-only">Parent or guardian</legend>
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

        <fieldset className={pane(2)} aria-describedby={err.em1Name ? "em-err" : undefined}>
          <legend className="sr-only">Emergency contacts</legend>
          <p className="text-muted">At least one is needed. The others are optional.</p>
          {err.em1Name && <p id="em-err" role="alert" className="f-error">{err.em1Name}</p>}
          {[1, 2, 3].map((n) => (
            <div key={n} className="grid gap-4 border-t border-rule pt-5 sm:grid-cols-2">
              <Field label={`Contact ${n}: name`} optional={n > 1}>{(p) => <input {...p} name={`em${n}Name`} defaultValue={d[`em${n}Name`]} className="f-input" maxLength={120} aria-invalid={n === 1 && err.em1Name ? true : undefined} />}</Field>
              <Field label="Relationship" optional>{(p) => <input {...p} name={`em${n}Rel`} defaultValue={d[`em${n}Rel`]} className="f-input" maxLength={60} />}</Field>
              <Field label="Phone" optional={n > 1}>{(p) => <input {...p} name={`em${n}Phone`} defaultValue={d[`em${n}Phone`]} type="tel" inputMode="tel" className="f-input" maxLength={20} />}</Field>
              <Field label="Email" optional>{(p) => <input {...p} name={`em${n}Email`} defaultValue={d[`em${n}Email`]} type="email" className="f-input" maxLength={120} />}</Field>
            </div>
          ))}
        </fieldset>

        <fieldset className={pane(3)}>
          <legend className="sr-only">Health and care</legend>
          <p className="flex items-start gap-2 text-muted"><Lock className="mt-1 size-4 shrink-0 text-purple" aria-hidden /> Health details are encrypted when saved and are seen only by the programme&apos;s leaders and the camp office.</p>
          <Field label="Allergies" optional hint="For example penicillin, bee stings, lactose, pollen, peanuts, gluten.">{(p) => <textarea {...p} name="allergies" defaultValue={d.allergies} className="f-input" rows={3} maxLength={1000} />}</Field>
          <Field label="Existing conditions" optional hint="For example asthma, migraines, travel sickness, anaemia, blackouts, heart condition, sleepwalking.">{(p) => <textarea {...p} name="conditions" defaultValue={d.conditions} className="f-input" rows={3} maxLength={1000} />}</Field>
          <Field label="Prescribed medication and dosage" optional>{(p) => <textarea {...p} name="medication" defaultValue={d.medication} className="f-input" rows={2} maxLength={1000} />}</Field>
          <Field label="Dietary and other special needs" optional>{(p) => <textarea {...p} name="specialNeeds" defaultValue={d.specialNeeds} className="f-input" rows={2} maxLength={1000} />}</Field>
          <Field label="Swimming ability" optional>{(p) => <select {...p} name="swimming" className="f-input" defaultValue={d.swimming ?? ""}><option value="">Choose…</option><option>None</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>}</Field>
          <details className="border-t border-rule pt-4" open={Boolean(d.disabilities || d.otherConditions || d.doctor || d.hospital || d.insurer)}>
            <summary className="min-h-11 cursor-pointer font-semibold text-purple">More: support needs, doctor, hospital and insurance</summary>
            <div className="mt-4 grid gap-6">
              <Field label="Physical disabilities or support needs" optional>{(p) => <textarea {...p} name="disabilities" defaultValue={d.disabilities} className="f-input" rows={2} maxLength={1000} />}</Field>
              <Field label="Other pre-existing conditions" optional>{(p) => <textarea {...p} name="otherConditions" defaultValue={d.otherConditions} className="f-input" rows={2} maxLength={1000} />}</Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Preferred doctor" optional>{(p) => <input {...p} name="doctor" defaultValue={d.doctor} className="f-input" maxLength={120} />}</Field>
                <Field label="Doctor's phone" optional>{(p) => <input {...p} name="doctorPhone" defaultValue={d.doctorPhone} type="tel" className="f-input" maxLength={20} />}</Field>
                <Field label="Preferred hospital" optional>{(p) => <input {...p} name="hospital" defaultValue={d.hospital} className="f-input" maxLength={120} />}</Field>
                <Field label="Blood group, if known" optional>{(p) => <input {...p} name="blood" defaultValue={d.blood} className="f-input" maxLength={10} />}</Field>
                <Field label="Insurance provider" optional>{(p) => <input {...p} name="insurer" defaultValue={d.insurer} className="f-input" maxLength={120} />}</Field>
                <Field label="Policy number" optional>{(p) => <input {...p} name="policy" defaultValue={d.policy} className="f-input" maxLength={60} />}</Field>
              </div>
            </div>
          </details>
        </fieldset>

        <fieldset className={pane(4)}>
          <legend className="sr-only">Consent</legend>
          <details className="border border-rule bg-paper-2 p-4">
            <summary className="min-h-11 cursor-pointer font-bold">Read the consent, indemnity and media authorization</summary>
            <div className="reading mt-3 grid max-h-[26rem] gap-3 overflow-y-auto pr-2 text-[0.98rem]">
              {consent.map((line, i) => (/^[A-Z][A-Za-z &,()/:–-]{4,60}$/.test(line) || line.startsWith("PART") ? <h3 key={i} className="mt-2 text-base">{line}</h3> : <p key={i}>{line}</p>))}
            </div>
          </details>
          <Choices legend="Participation" type="checkbox" name="participationConsent" error={err.participationConsent} options={[{ value: "yes", label: "I have read and understood the consent above, and I consent to my child's participation in the camp, voluntarily." }]} />
          <Choices legend="Medical authorization" type="checkbox" name="medicalConsent" error={err.medicalConsent} options={[{ value: "yes", label: "I authorize the person in charge to secure any necessary first aid, medical or surgical treatment for my child during the camp, as set out above." }]} />
          <Choices legend="Photos and videos" type="radio" name="mediaConsent" columns={2} error={err.mediaConsent} options={[{ value: "Yes", label: "Yes, the camp may photograph and film my child, as set out above" }, { value: "No", label: "No, please do not" }]} />
          <Field label="Parent or guardian's signature" hint="Type your full name. This is your signature." error={err.signature}>{(p) => <input {...p} name="signature" className="f-input" autoComplete="off" maxLength={120} required />}</Field>
        </fieldset>

        <fieldset className={pane(5)}>
          <legend className="sr-only">Payment and send</legend>
          <div>
            <h3 className="text-lg font-bold">Check your answers</h3>
            <dl className="mt-3 border-t border-rule">
              {summary.map(([label, value, to]) => (
                <div key={label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-2.5">
                  <dt className="text-[0.92rem] text-muted">{label}</dt>
                  <dd className="min-w-0 break-words font-semibold">{value || "Not given"}</dd>
                  <dd><button type="button" onClick={() => go(to)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> {label.toLowerCase()}</span></button></dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-bold">Payment you have made</h3>
            <p className="mt-1 text-muted">{camp && typeof camp.fee === "number" ? `The fee for ${camp.title} is ${kes(camp.fee)}. ` : ""}Tell us what you have paid so far, if anything. The camp office checks every payment before confirming a place. Nothing is charged on this site.</p>
          </div>
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
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule pt-8">
        {step > 0 && <button type="button" onClick={() => go(step - 1)} className={btnBack}><ArrowLeft className="size-4" aria-hidden /> Back</button>}
        {step < LAST ? <button type="button" onClick={next} className={btnNext}>Continue <ArrowRight className="size-4" aria-hidden /></button> : <SubmitButton pending="Sending…">Send application</SubmitButton>}
        <p className="flex items-center gap-2 text-[0.9rem] text-muted"><Lock className="size-4" aria-hidden /> Seen only by the camp leaders.</p>
      </div>
    </form>
  );
}

export default function CampApplicationForm(props: { camps: OpenCamp[]; consent: string[]; selected: string; whatsapp: string; prefill?: Record<string, string> }) {
  const [round, setRound] = useState(0);
  return <Inner key={round} {...props} onReset={() => { setRound((r) => r + 1); window.scrollTo({ top: 0 }); }} />;
}
