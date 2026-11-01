"use client";

import { useState } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { registerMember } from "@/app/123admin/actions-care";
import { SaveButton, SelectField, TextArea, TextField, Toggle, useSave } from "./forms";
import { btnClass, LinkButton } from "./ui";

const ageGroups = ["Under 13", "13 – 19", "20 – 35", "36 – 55", "56 and above"];
const heardFrom = ["A friend or family member", "Social media (Instagram, TikTok, Facebook, YouTube)", "The church website", "Walked past the venue", "A camp, event or outreach", "Other"];
const interests = ["Talk to a pastor", "Become a member", "Join a ministry or fellowship group", "Be baptised", "Learn about Jewels, Teen Life or Branch", "Gave their life to Christ today"];

function Choice({ legend, name, type, options, error, columns = 2 }: { legend: string; name: string; type: "radio" | "checkbox"; options: string[]; error?: string; columns?: 2 | 3 }) {
  return (
    <fieldset>
      <legend className="f-label">{legend}</legend>
      <div className={`mt-2 grid gap-2 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {options.map((o) => (
          <label key={o} className="f-choice"><input type={type} name={name} value={o} /><span className="leading-snug">{o}</span></label>
        ))}
      </div>
      {error && <p role="alert" className="f-error">{error}</p>}
    </fieldset>
  );
}

function Inner({ today, onAgain }: { today: string; onAgain: () => void }) {
  const [noEmail, setNoEmail] = useState(false);
  const { run, formRef, errors, state } = useSave(registerMember);

  if (state.ok) {
    return (
      <div className="grid max-w-2xl gap-6 border-t-4 border-purple pt-8">
        <CheckCircle2 className="size-10 text-ok" aria-hidden />
        <h2 className="text-2xl">{state.message}</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onAgain} className={btnClass.primary}><UserPlus className="size-4" aria-hidden /> Register another member</button>
          <LinkButton href="/123admin/guests" variant="secondary">See the list</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={run} className="grid max-w-3xl gap-10" noValidate>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">About them</legend>
        <TextField name="fullName" label="Full name" autoComplete="off" required maxLength={120} error={errors.fullName} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="phone" label="Phone or WhatsApp" type="tel" inputMode="tel" placeholder="07XX XXX XXX" required maxLength={20} error={errors.phone} />
          <div>
            <TextField name="email" label="Email" type="email" placeholder="name@example.com" maxLength={120} disabled={noEmail} error={errors.email} hint="We use this to welcome them and keep in touch." />
            <label className="f-choice mt-2"><input type="checkbox" name="noEmail" value="Yes" checked={noEmail} onChange={(e) => setNoEmail(e.target.checked)} /><span className="leading-snug">They do not have an email address</span></label>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="area" label="Where do they live?" optional maxLength={80} placeholder="For example Kasarani, Ruaka, Kitengela" />
          <SelectField name="ageGroup" label="Age group" optional defaultValue="" options={[{ value: "", label: "Choose…" }, ...ageGroups.map((a) => ({ value: a, label: a }))]} />
        </div>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Their visit</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="visitDate" label="Date they joined us" type="date" defaultValue={today} max={today} required error={errors.visitDate} />
          <SelectField name="heardFrom" label="How did they hear about us?" optional defaultValue="" options={[{ value: "", label: "Choose…" }, ...heardFrom.map((a) => ({ value: a, label: a }))]} />
        </div>
        <Choice legend="Is this their first time at Christhood?" name="firstVisit" type="radio" options={["First time", "Visited before"]} error={errors.firstVisit} />
        <TextField name="invitedBy" label="Who invited them?" optional maxLength={120} hint="So we can thank them." />
        <Choice legend="Do they have a home church?" name="homeChurch" type="radio" options={["Yes", "No", "Looking for one"]} columns={3} />
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">How can we serve them?</legend>
        <Choice legend="They would like to… (tick any)" name="interests" type="checkbox" options={interests} />
        <TextArea name="prayerRequest" label="Anything we can pray with them about?" optional rows={3} maxLength={2000} hint="Only the pastoral team will read this." />
      </fieldset>

      <div className="grid gap-5 border-t border-rule pt-8">
        {!noEmail && <Toggle name="sendWelcome" label="Send them a welcome email" hint="Sent only if email is switched on for the church (see System status)." defaultChecked />}
        <div>
          <label className="f-choice !items-start !py-3"><input type="checkbox" name="consent" value="Yes" className="mt-1" /><span className="leading-snug">They agree that Christhood Ministries may keep these details and contact them by phone, WhatsApp or email about church life. Their details are not shared outside the church.</span></label>
          {errors.consent && <p role="alert" className="f-error">{errors.consent}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3"><SaveButton>Register new member</SaveButton><LinkButton href="/123admin/guests" variant="ghost">Cancel</LinkButton></div>
      </div>
    </form>
  );
}

export default function MemberForm({ today }: { today: string }) {
  const [round, setRound] = useState(0);
  return <Inner key={round} today={today} onAgain={() => { setRound((r) => r + 1); window.scrollTo({ top: 0 }); }} />;
}
