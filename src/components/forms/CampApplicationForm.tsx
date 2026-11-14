"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Plus, Trash2 } from "lucide-react";
import { submitCampApplication } from "@/app/(site)/camp-actions";
import type { FormState } from "@/app/(site)/connect-actions";
import { phoneOk } from "@/lib/phone";
import { BotTraps, Choices, Field, SubmitButton, type Errors } from "./fields";
import { useActionStateKeep } from "./keep";

export type OpenCamp = { id: string; title: string; subtitle?: string; fee?: number; dates: string; start: string };

const initial: FormState = { ok: false };
const area = "grid gap-6";
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const validDateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/** The application is six short steps instead of one long page. Every step stays in the form, so one send carries everything. */
const STEPS = [
  { title: "The children", short: "Children", lead: "Choose one camp, then add each child who is coming." },
  { title: "Parent or guardian", short: "Parent", lead: "Who we should contact and connect to your family page." },
  { title: "Emergency contacts", short: "Emergency", lead: "One set of contacts, shared by the children in this application." },
  { title: "Health and care", short: "Health", lead: "Add only what the leaders need to care for each child. Skip anything that does not apply." },
  { title: "Consent", short: "Consent", lead: "Read once, then record each child's choices and type your name." },
  { title: "Payment and send", short: "Send", lead: "Check each child's details and send all applications together." },
] as const;
const LAST = STEPS.length - 1;

/** Which step a field lives on, so a refused send takes the parent straight to the problem. */
const stepOf: Record<string, number> = { eventId: 0, guardian: 1, phone: 1, email: 1, em1Name: 2, signature: 4, paymentDate: 5, balanceDate: 5 };
const childStepOf: Record<string, number> = { name: 0, dob: 0, nickname: 0, gender: 0, school: 0, grade: 0, allergies: 3, conditions: 3, medication: 3, specialNeeds: 3, swimming: 3, disabilities: 3, otherConditions: 3, doctor: 3, doctorPhone: 3, hospital: 3, blood: 3, insurer: 3, policy: 3, participationConsent: 4, medicalConsent: 4, mediaConsent: 4, paymentType: 5, amount: 5, pocketMoney: 5 };
type CamperSummary = { id: number; name: string; dob: string; health: boolean; mediaConsent: string };

const btnBack = "inline-flex min-h-12 items-center gap-2 rounded-sm border border-ink/35 px-6 font-semibold hover:bg-ink hover:text-paper";
const btnNext = "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-gold px-7 text-[0.98rem] font-bold text-ink transition-colors hover:bg-gold-hover";

function Inner({ camps, consent, selected, whatsapp, prefill, onReset }: { camps: OpenCamp[]; consent: string[]; selected: string; whatsapp: string; prefill?: Record<string, string>; onReset: () => void }) {
  const d = prefill ?? {};
  const [state, action, pending, formRef] = useActionStateKeep(submitCampApplication, initial);
  const [eventId, setEventId] = useState(selected);
  const [childIds, setChildIds] = useState([0]);
  const nextChildId = useRef(1);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState<CamperSummary[]>([]);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const submitAfterEdit = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const camp = camps.find((c) => c.id === eventId);
  const err = errors;
  const childField = (id: number, field: string) => `child.${id}.${field}`;
  const stepForError = (key: string) => {
    const childFieldName = /^child\.\d+\.(.+)$/.exec(key)?.[1];
    return (childFieldName ? childStepOf[childFieldName] : undefined) ?? stepOf[key] ?? 0;
  };

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
      const to = Math.min(...Object.keys(found).map(stepForError));
      setReached((r) => Math.max(r, to));
      setStep(to);
    }
  }, [state]);

  const get = () => {
    const form = formRef.current;
    if (!form) return (_key: string) => "";
    const fd = new FormData(form);
    return (k: string) => String(fd.get(k) ?? "").trim();
  };

  /** The same rules the camp office side applies, run on one step before moving on. */
  function check(i: number): Errors {
    const g = get();
    const e: Errors = {};
    if (i === 0) {
      if (!g("eventId")) e.eventId = "Choose a camp.";
      for (const id of childIds) {
        const nameKey = childField(id, "name");
        const dobKey = childField(id, "dob");
        const genderKey = childField(id, "gender");
        const gradeKey = childField(id, "grade");
        const name = g(nameKey);
        const dob = g(dobKey);
        const gender = g(genderKey);
        const grade = g(gradeKey);
        if (name.length < 2) e[nameKey] = "Enter the child's full name.";
        if (!validDateOnly(dob)) e[dobKey] = "Enter a valid date of birth.";
        if (gender !== "Female" && gender !== "Male") e[genderKey] = "Choose male or female.";
        if (!grade) e[gradeKey] = "Enter the child's class or grade.";
      }
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
      for (const id of childIds) {
        if (g(childField(id, "participationConsent")) !== "yes") e[childField(id, "participationConsent")] = "Please confirm this child's participation.";
        if (g(childField(id, "medicalConsent")) !== "yes") e[childField(id, "medicalConsent")] = "Please confirm the medical authorization for this child.";
        const mediaConsent = g(childField(id, "mediaConsent"));
        if (mediaConsent !== "Yes" && mediaConsent !== "No") e[childField(id, "mediaConsent")] = "Choose yes or no. Media consent is optional.";
      }
      if (!g("signature")) e.signature = "Type your full name as your signature.";
    }
    if (i === 5) {
      const bad = (v: string) => v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0);
      for (const id of childIds) {
        if (bad(g(childField(id, "amount")))) e[childField(id, "amount")] = "Enter a valid amount in shillings, or leave it empty.";
        if (bad(g(childField(id, "pocketMoney")))) e[childField(id, "pocketMoney")] = "Enter a valid amount in shillings, or leave it empty.";
      }
    }
    return e;
  }

  function go(to: number) {
    moved.current = true;
    if (to === LAST) {
      setEditingFromReview(false);
      const g = get();
      setSummary(childIds.map((id) => ({
        id,
        name: g(childField(id, "name")),
        dob: g(childField(id, "dob")),
        health: ["conditions", "allergies", "disabilities", "otherConditions", "medication", "specialNeeds"].some((field) => g(childField(id, field))),
        mediaConsent: g(childField(id, "mediaConsent")),
      })));
    }
    setReached((r) => Math.max(r, to));
    setStep(to);
  }

  function next() {
    const e = check(step);
    setErrors((prev) => ({ ...Object.fromEntries(Object.entries(prev).filter(([k]) => stepForError(k) !== step)), ...e }));
    if (Object.keys(e).length === 0) go(step + 1);
    else moved.current = true;
  }

  function editFromReview(to: number) {
    setEditingFromReview(true);
    go(to);
  }

  function submitEditedSection() {
    const e = check(step);
    setErrors((prev) => ({ ...Object.fromEntries(Object.entries(prev).filter(([k]) => stepForError(k) !== step)), ...e }));
    if (Object.keys(e).length) {
      moved.current = true;
      return;
    }
    submitAfterEdit.current = true;
    formRef.current?.requestSubmit();
  }

  if (state.ok) {
    const count = state.count ?? 1;
    return (
      <div className="border-t-4 border-purple pt-8">
        <CheckCircle2 className="size-10 text-ok" aria-hidden />
        <h2 ref={doneRef} tabIndex={-1} className="t-h2 mt-4 outline-none">{count === 1 ? `Thank you. ${state.name}'s application has been received.` : `Thank you. We have received applications for ${count} children.`}</h2>
        <p className="reading mt-4 text-muted">The camp office will review each application and contact you. If anything needs correcting we will tell you. Nothing is charged on this site, and your payment is confirmed by the office.</p>
        {state.familyLogin && (
          <div className="mt-8 max-w-xl border-t border-rule pt-6">
            <h3 className="text-lg font-bold">Your family page is ready</h3>
            <p className="mt-2 text-muted">Your child&apos;s application is already linked. Save these sign-in details before opening your page. When you first sign in, choose a memorable password of your own.</p>
            <dl className="mt-4 grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <dt className="text-muted">Sign-in phone</dt><dd className="font-semibold">{state.familyLogin.phone}</dd>
              <dt className="text-muted">Temporary password</dt><dd className="select-all break-all font-mono font-semibold">{state.familyLogin.temporaryPassword}</dd>
            </dl>
            <p className="mt-3 text-sm text-muted">Keep the temporary password private. If you leave this page before saving it, the camp office can reset it after confirming you are the parent.</p>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {state.type === "family" ? (
            <Link href="/family" className="inline-flex min-h-12 items-center rounded-sm bg-gold px-6 font-semibold text-ink hover:bg-gold-hover">Go to my family page</Link>
          ) : (
            <button type="button" onClick={onReset} className={btnBack}>Apply for another child</button>
          )}
          <Link href="/events" className="inline-flex min-h-12 items-center px-2 font-semibold text-purple underline underline-offset-[6px]">Back to events</Link>
        </div>
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
        // From a review edit, submit the complete form without revisiting later steps.
        if (step < LAST && !submitAfterEdit.current) {
          e.preventDefault();
          next();
        }
        submitAfterEdit.current = false;
      }}
    >
      <BotTraps />
      <input type="hidden" name="childKeys" value={childIds.join(",")} readOnly />
      {childIds.map((id, i) => <input key={id} type="hidden" name={childField(id, "profileId")} value={i === 0 ? d.childId ?? "" : ""} readOnly />)}

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
      {state.familySignInRequired && <p className="mt-3 border-l-2 border-purple pl-4 text-muted">Open the <Link href="/family" target="_blank" rel="noreferrer" className="font-semibold text-purple underline underline-offset-4">family page in a new tab</Link>, sign in, then return here and send the application. Your answers will stay in this form.</p>}

      <div className="mt-8">
        <fieldset className={pane(0)}>
          <legend className="sr-only">The children</legend>
          <Choices legend="Choose the camp" type="radio" name="eventId" error={err.eventId} defaultValue={eventId} onChange={setEventId} options={camps.map((c) => ({ value: c.id, label: <><span className="font-semibold">{c.title}</span>{c.subtitle ? ` · ${c.subtitle}` : ""} <span className="text-muted">· {c.dates}{typeof c.fee === "number" ? ` · ${kes(c.fee)}` : ""}</span></> }))} />
          <p className="text-muted">Everyone in this application will be registered for the same camp. For children attending different camps, send a separate application.</p>
          <div className="grid gap-8">
            {childIds.map((id, i) => {
              const key = (field: string) => childField(id, field);
              const first = i === 0;
              return (
                <section key={id} className="border-t border-rule pt-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">Child {i + 1}</h3>
                    {childIds.length > 1 && <button type="button" onClick={() => setChildIds((ids) => ids.filter((child) => child !== id))} className="inline-flex min-h-11 items-center gap-2 px-1 font-semibold text-purple underline underline-offset-4"><Trash2 className="size-4" aria-hidden /> Remove child {i + 1}</button>}
                  </div>
                  <Field label="Child's full name" error={err[key("name")]}>{(p) => <input {...p} name={key("name")} defaultValue={first ? d.name : ""} className="f-input" autoComplete="off" maxLength={120} required />}</Field>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Date of birth" error={err[key("dob")]}>{(p) => <input {...p} name={key("dob")} defaultValue={first ? d.dob : ""} type="date" className="f-input" required />}</Field>
                    <Field label="Preferred name or nickname" optional>{(p) => <input {...p} name={key("nickname")} defaultValue={first ? d.nickname : ""} className="f-input" maxLength={60} />}</Field>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <Field label="Gender" error={err[key("gender")]}>{(p) => <select {...p} name={key("gender")} className="f-input" defaultValue={first ? d.gender ?? "" : ""} required><option value="">Choose…</option><option>Female</option><option>Male</option></select>}</Field>
                    <Field label="School" optional>{(p) => <input {...p} name={key("school")} defaultValue={first ? d.school : ""} className="f-input" maxLength={120} />}</Field>
                    <Field label="Class or grade" error={err[key("grade")]}>{(p) => <input {...p} name={key("grade")} defaultValue={first ? d.grade : ""} className="f-input" maxLength={40} required />}</Field>
                  </div>
                </section>
              );
            })}
          </div>
          <button type="button" disabled={childIds.length >= 8} onClick={() => { const id = nextChildId.current++; setChildIds((ids) => [...ids, id]); }} className="inline-flex min-h-12 items-center gap-2 border-t border-rule pt-4 font-semibold text-purple underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="size-4" aria-hidden /> {childIds.length >= 8 ? "Eight children added" : "Add another child"}</button>
          {camp && <p className="text-muted">Ages are checked against the camp&apos;s age range. If your child is outside it, the office will look at the application and talk to you. It is not refused automatically.</p>}
        </fieldset>

        <fieldset className={pane(1)}>
          <legend className="sr-only">Parent or guardian</legend>
          <Field label="Parent or guardian's full name" error={err.guardian}>{(p) => <input {...p} name="guardian" defaultValue={d.guardian} className="f-input" autoComplete="name" maxLength={120} required />}</Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Mobile phone" error={err.phone}>{(p) => <input {...p} name="phone" defaultValue={d.phone} type="tel" inputMode="tel" autoComplete="tel" className="f-input" placeholder="07XX XXX XXX" maxLength={20} required />}</Field>
            <Field label="Email" optional error={err.email}>{(p) => <input {...p} name="email" defaultValue={d.email} type="email" autoComplete="email" className="f-input" maxLength={120} />}</Field>
          </div>
          <label className="flex items-start gap-3 rounded-sm border border-rule p-4 text-[0.95rem]">
            <input type="checkbox" name="smsUpdates" value="yes" defaultChecked={d.smsUpdates === "yes"} className="mt-1 size-5 accent-purple" />
            <span><span className="font-semibold">Text me important camp updates</span><span className="mt-1 block text-muted">Optional. This includes the application receipt, and, once your application is linked to a family page, private updates and away check-in alerts. Texts will not include health details.</span></span>
          </label>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Guardian ID number" optional>{(p) => <input {...p} name="guardianId" defaultValue={d.guardianId} className="f-input" maxLength={30} />}</Field>
            <Field label="Residence" optional>{(p) => <input {...p} name="residence" defaultValue={d.residence} className="f-input" autoComplete="address-level2" maxLength={120} />}</Field>
            <Field label="House number" optional>{(p) => <input {...p} name="house" defaultValue={d.house} className="f-input" maxLength={60} />}</Field>
          </div>
        </fieldset>

        <fieldset className={pane(2)} aria-describedby={err.em1Name ? "em-err" : undefined}>
          <legend className="sr-only">Emergency contacts</legend>
          <p className="text-muted">These contacts are shared by all children in this application. At least one is needed; the others are optional.</p>
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
          <div className="grid gap-10">
            {childIds.map((id, i) => {
              const key = (field: string) => childField(id, field);
              const values = i === 0 ? d : {};
              return (
                <section key={id} className="grid gap-6 border-t border-rule pt-6" aria-labelledby={`health-child-${id}`}>
                  <h3 id={`health-child-${id}`} className="text-lg font-bold">Child {i + 1}</h3>
                  <Field label="Allergies" optional hint="For example penicillin, bee stings, lactose, pollen, peanuts, gluten.">{(p) => <textarea {...p} name={key("allergies")} defaultValue={values.allergies} className="f-input" rows={3} maxLength={1000} />}</Field>
                  <Field label="Existing conditions" optional hint="For example asthma, migraines, travel sickness, anaemia, blackouts, heart condition, sleepwalking.">{(p) => <textarea {...p} name={key("conditions")} defaultValue={values.conditions} className="f-input" rows={3} maxLength={1000} />}</Field>
                  <Field label="Prescribed medication and dosage" optional>{(p) => <textarea {...p} name={key("medication")} defaultValue={values.medication} className="f-input" rows={2} maxLength={1000} />}</Field>
                  <Field label="Dietary and other special needs" optional>{(p) => <textarea {...p} name={key("specialNeeds")} defaultValue={values.specialNeeds} className="f-input" rows={2} maxLength={1000} />}</Field>
                  <Field label="Swimming ability" optional>{(p) => <select {...p} name={key("swimming")} className="f-input" defaultValue={values.swimming ?? ""}><option value="">Choose…</option><option>None</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>}</Field>
                  <details className="border-t border-rule pt-4" open={Boolean(values.disabilities || values.otherConditions || values.doctor || values.hospital || values.insurer)}>
                    <summary className="min-h-11 cursor-pointer font-semibold text-purple">More: support needs, doctor, hospital and insurance</summary>
                    <div className="mt-4 grid gap-6">
                      <Field label="Physical disabilities or support needs" optional>{(p) => <textarea {...p} name={key("disabilities")} defaultValue={values.disabilities} className="f-input" rows={2} maxLength={1000} />}</Field>
                      <Field label="Other pre-existing conditions" optional>{(p) => <textarea {...p} name={key("otherConditions")} defaultValue={values.otherConditions} className="f-input" rows={2} maxLength={1000} />}</Field>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <Field label="Preferred doctor" optional>{(p) => <input {...p} name={key("doctor")} defaultValue={values.doctor} className="f-input" maxLength={120} />}</Field>
                        <Field label="Doctor's phone" optional>{(p) => <input {...p} name={key("doctorPhone")} defaultValue={values.doctorPhone} type="tel" className="f-input" maxLength={20} />}</Field>
                        <Field label="Preferred hospital" optional>{(p) => <input {...p} name={key("hospital")} defaultValue={values.hospital} className="f-input" maxLength={120} />}</Field>
                        <Field label="Blood group, if known" optional>{(p) => <input {...p} name={key("blood")} defaultValue={values.blood} className="f-input" maxLength={10} />}</Field>
                        <Field label="Insurance provider" optional>{(p) => <input {...p} name={key("insurer")} defaultValue={values.insurer} className="f-input" maxLength={120} />}</Field>
                        <Field label="Policy number" optional>{(p) => <input {...p} name={key("policy")} defaultValue={values.policy} className="f-input" maxLength={60} />}</Field>
                      </div>
                    </div>
                  </details>
                </section>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={pane(4)}>
          <legend className="sr-only">Consent</legend>
          <details className="border border-rule bg-paper-2 p-4">
            <summary className="min-h-11 cursor-pointer font-bold">Read the consent, indemnity and media authorization</summary>
            <div className="reading mt-3 grid max-h-[26rem] gap-3 overflow-y-auto pr-2 text-[0.98rem]">
              {consent.map((line, i) => (/^[A-Z][A-Za-z &,()/:–-]{4,60}$/.test(line) || line.startsWith("PART") ? <h3 key={i} className="mt-2 text-base">{line}</h3> : <p key={i}>{line}</p>))}
            </div>
          </details>
          <p className="text-muted">Complete the choices for every child, then type your name once below.</p>
          <div className="grid gap-8">
            {childIds.map((id, i) => (
              <section key={id} className="grid gap-6 border-t border-rule pt-6" aria-labelledby={`consent-child-${id}`}>
                <h3 id={`consent-child-${id}`} className="text-lg font-bold">Child {i + 1}</h3>
                <Choices legend="Participation" type="checkbox" name={childField(id, "participationConsent")} error={err[childField(id, "participationConsent")]} options={[{ value: "yes", label: "I have read and understood the consent above, and I consent to my child's participation in the camp, voluntarily." }]} />
                <Choices legend="Medical authorization" type="checkbox" name={childField(id, "medicalConsent")} error={err[childField(id, "medicalConsent")]} options={[{ value: "yes", label: "I authorize the person in charge to secure any necessary first aid, medical or surgical treatment for my child during the camp, as set out above." }]} />
                <Choices legend="Photos and videos" type="radio" name={childField(id, "mediaConsent")} columns={2} error={err[childField(id, "mediaConsent")]} options={[{ value: "Yes", label: "Yes, the camp may photograph and film my child, as set out above" }, { value: "No", label: "No, please do not" }]} />
              </section>
            ))}
          </div>
          <Field label="Parent or guardian's signature" hint="Type your full name. This is your signature." error={err.signature}>{(p) => <input {...p} name="signature" className="f-input" autoComplete="off" maxLength={120} required />}</Field>
        </fieldset>

        <fieldset className={pane(5)}>
          <legend className="sr-only">Payment and send</legend>
          <div>
            <h3 className="text-lg font-bold">Check each child&apos;s details</h3>
            <p className="mt-1 text-muted">To correct an answer, change that section and submit from there. Your other answers will stay in this application.</p>
            <div className="mt-3 grid gap-6">
              {summary.map((child, i) => (
                <section key={child.id} className="border-t border-rule pt-4">
                  <h4 className="font-bold">Child {i + 1}: {child.name || "Name not given"}</h4>
                  <dl className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] sm:items-baseline">
                    <dt className="text-muted">Date of birth</dt><dd className="font-semibold">{child.dob || "Not given"}</dd><dd><button type="button" onClick={() => editFromReview(0)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> child {i + 1} details</span></button></dd>
                    <dt className="text-muted">Health and care</dt><dd className="font-semibold">{child.health ? "Notes added" : "No notes provided"}</dd><dd><button type="button" onClick={() => editFromReview(3)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> child {i + 1} health details</span></button></dd>
                    <dt className="text-muted">Photos and videos</dt><dd className="font-semibold">{child.mediaConsent === "Yes" ? "Allowed" : child.mediaConsent === "No" ? "Not allowed" : "Not chosen"}</dd><dd><button type="button" onClick={() => editFromReview(4)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> child {i + 1} consent</span></button></dd>
                  </dl>
                </section>
              ))}
            </div>
            <dl className="mt-6 border-t border-rule">
              <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-2.5"><dt className="text-muted">Parent or guardian</dt><dd className="min-w-0 break-words font-semibold">{[get()("guardian"), get()("phone")].filter(Boolean).join(", ") || "Not given"}</dd><dd><button type="button" onClick={() => editFromReview(1)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> parent details</span></button></dd></div>
              <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-2.5"><dt className="text-muted">Camp text updates</dt><dd className="min-w-0 break-words font-semibold">{get()("smsUpdates") === "yes" ? "Opted in" : "Not requested"}</dd><dd><button type="button" onClick={() => editFromReview(1)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> text message choice</span></button></dd></div>
              <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-2.5"><dt className="text-muted">Emergency contact</dt><dd className="min-w-0 break-words font-semibold">{[get()("em1Name"), get()("em1Phone")].filter(Boolean).join(", ") || "Not given"}</dd><dd><button type="button" onClick={() => editFromReview(2)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> emergency contact</span></button></dd></div>
              <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-2.5"><dt className="text-muted">Signed by</dt><dd className="min-w-0 break-words font-semibold">{get()("signature") || "Not given"}</dd><dd><button type="button" onClick={() => editFromReview(4)} className="inline-flex min-h-11 items-center px-1 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> signature</span></button></dd></div>
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-bold">Payment for each child</h3>
            <p className="mt-1 text-muted">{camp && typeof camp.fee === "number" ? `The fee for ${camp.title} is ${kes(camp.fee)} per child. ` : ""}Enter the amount paid for each child. The date, payment method and reference can be shared below. The camp office checks every payment before confirming a place. Nothing is charged on this site.</p>
          </div>
          <div className="grid gap-8">
            {summary.map((child, i) => (
              <section key={child.id} className="grid gap-6 border-t border-rule pt-5">
                <h4 className="font-bold">Child {i + 1}: {child.name || "Name not given"}</h4>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Payment status" optional>{(p) => <select {...p} name={childField(child.id, "paymentType")} className="f-input" defaultValue=""><option value="">Choose if applicable</option><option>Full payment</option><option>Part payment</option><option>Not paid yet</option></select>}</Field>
                  <Field label="Amount paid (KES)" optional error={err[childField(child.id, "amount")]}>{(p) => <input {...p} name={childField(child.id, "amount")} type="number" min={0} step={10} inputMode="numeric" className="f-input" />}</Field>
                  <Field label="Pocket money (KES)" optional error={err[childField(child.id, "pocketMoney")]}>{(p) => <input {...p} name={childField(child.id, "pocketMoney")} type="number" min={0} step={10} inputMode="numeric" className="f-input" />}</Field>
                </div>
              </section>
            ))}
          </div>
          <div className="grid gap-6 border-t border-rule pt-5 sm:grid-cols-2">
            <Field label="Payment date" optional error={err.paymentDate}>{(p) => <input {...p} name="paymentDate" type="date" className="f-input" />}</Field>
            <Field label="Payment method" optional>{(p) => <select {...p} name="paymentMode" className="f-input" defaultValue=""><option value="">Choose if applicable</option><option>M-Pesa</option><option>Bank transfer</option><option>Cheque</option><option>Cash / other</option></select>}</Field>
            <Field label="M-Pesa confirmation or cheque reference" optional>{(p) => <input {...p} name="paymentReference" className="f-input" maxLength={80} />}</Field>
            <Field label="Date you will clear the balance" optional error={err.balanceDate}>{(p) => <input {...p} name="balanceDate" type="date" className="f-input" />}</Field>
          </div>
        </fieldset>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule pt-8">
        {step > 0 && <button type="button" onClick={() => go(step - 1)} className={btnBack}><ArrowLeft className="size-4" aria-hidden /> Back</button>}
        {step < LAST ? editingFromReview ? <button type="button" onClick={submitEditedSection} disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-gold px-7 text-[0.98rem] font-bold text-ink transition-colors hover:bg-gold-hover disabled:cursor-wait disabled:opacity-70">{pending ? "Sending…" : "Save change and submit"}</button> : <button type="button" onClick={next} className={btnNext}>Continue <ArrowRight className="size-4" aria-hidden /></button> : <SubmitButton pending="Sending…">Send application</SubmitButton>}
        <p className="flex items-center gap-2 text-[0.9rem] text-muted"><Lock className="size-4" aria-hidden /> Seen only by the camp leaders.</p>
      </div>
    </form>
  );
}

export default function CampApplicationForm(props: { camps: OpenCamp[]; consent: string[]; selected: string; whatsapp: string; prefill?: Record<string, string> }) {
  const [round, setRound] = useState(0);
  return <Inner key={round} {...props} onReset={() => { setRound((r) => r + 1); window.scrollTo({ top: 0 }); }} />;
}
