"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle, Minus, Plus } from "lucide-react";

export type Camp = { id: string; title: string; ages: string; fee: number };
type Role = "camper" | "facilitator" | "sponsor";
type Props = {
  camps: Camp[];
  /** WhatsApp numbers (digits only) that receive each kind of registration. */
  numbers: Record<Role, string>;
  depositKes: number;
  facilitatorRoles: string[];
  /** Which kinds of sign-up to offer. Camper applications now have their own full form. */
  roles?: Role[];
};

const ROLES: { id: Role; title: string; text: string }[] = [
  { id: "camper", title: "Parent or camper", text: "Register a child, or register yourself as a camper." },
  { id: "facilitator", title: "Facilitator or volunteer", text: "Serve at camp as a matron, teacher, nurse, media or more." },
  { id: "sponsor", title: "Sponsor or donor", text: "Cover the cost for a camper who could not otherwise attend." },
];

const input = "mt-2 w-full rounded-sm border border-rule bg-paper px-4 py-3 text-ink focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple";
const label = "block text-sm font-semibold text-ink";
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const cleanPhone = (p: string) => p.replace(/[^\d+]/g, "");

export default function CampRegistration({ camps, numbers, depositKes, facilitatorRoles, roles }: Props) {
  const offered = roles ? ROLES.filter((r) => roles.includes(r.id)) : ROLES;
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(offered[0].id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [who, setWho] = useState<"parent" | "camper">("parent");
  const [kids, setKids] = useState([{ name: "", age: "" }]);
  const [age, setAge] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [duties, setDuties] = useState<string[]>([]);
  const [sponsorCamp, setSponsorCamp] = useState(camps[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const childCount = who === "parent" ? kids.length : 1;
  const chosen = camps.filter((c) => picked.includes(c.id));
  const total = chosen.reduce((n, c) => n + c.fee * childCount, 0);

  const detailsOk = useMemo(() => {
    if (!name.trim() || cleanPhone(phone).length < 9) return false;
    if (role === "camper") {
      if (!picked.length) return false;
      return who === "parent" ? kids.every((k) => k.name.trim() && Number(k.age) >= 5 && Number(k.age) <= 19) : Number(age) >= 5 && Number(age) <= 19;
    }
    if (role === "facilitator") return picked.length > 0 && duties.length > 0;
    return Number(amount) >= 500;
  }, [name, phone, role, picked, who, kids, age, duties, amount]);

  const message = useMemo(() => {
    const event = "Camps Mentorship Program";
    const lines: string[] = [];
    if (role === "camper") {
      lines.push(
        `Hello, I am contacting Christhood Ministries to submit a Camp Registration (${who === "parent" ? "Parent" : "Camper"}).`,
        "",
        `Event: ${event}`,
        "",
        `Name: ${name.trim()}`,
        `Phone: ${cleanPhone(phone)}`,
        `Relationship: ${who === "parent" ? "Parent" : "Camper"}`,
        "",
      );
      if (who === "parent") {
        lines.push(`Number of Children: ${kids.length}`, "");
        kids.forEach((k, i) => lines.push(`Child ${i + 1}: ${k.name.trim() || "Not provided"} (Age: ${k.age || "Not provided"})`));
        lines.push("");
      } else lines.push(`Camper Age: ${age}`, "");
      lines.push("Selected Camps:", ...chosen.map((c) => `• ${c.title}`), "", `Total Cost: ${kes(total)}`, "", `Deposit: ${kes(depositKes)} required within 14 days`);
    } else if (role === "facilitator") {
      lines.push(
        "Hello, I am contacting Christhood Ministries to apply as a Facilitator.",
        "",
        `Event: ${event}`,
        "",
        `Name: ${name.trim()}`,
        `Phone: ${cleanPhone(phone)}`,
        `Camps: ${chosen.map((c) => c.title).join(",")}`,
        `Roles: ${duties.join(",")}`,
      );
    } else {
      const camp = camps.find((c) => c.id === sponsorCamp);
      lines.push(
        "Hello, I am contacting Christhood Ministries regarding a Sponsorship Inquiry.",
        "",
        `Event: ${event}`,
        "",
        `Name: ${name.trim()}`,
        `Phone: ${cleanPhone(phone)}`,
        `Camp: ${camp?.title ?? "Any camp"}`,
        `Contribution: ${kes(Number(amount) || 0)}`,
      );
    }
    if (notes.trim()) lines.push("", `Notes: ${notes.trim()}`);
    lines.push("", "To: Christhood Ministries");
    return lines.join("\n");
  }, [role, who, name, phone, kids, age, chosen, total, depositKes, duties, sponsorCamp, camps, amount, notes]);

  const CampPick = ({ list }: { list: string[] }) => (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className={`${label} mb-2`}>Which camp{role === "camper" ? "(s)" : "(s) will you support"}? *</legend>
      {camps.map((c) => {
        const on = list.includes(c.id);
        return (
          <label key={c.id} className={`cursor-pointer rounded-sm border-2 p-4 transition ${on ? "border-purple bg-paper-2" : "border-rule bg-paper hover:border-purple"}`}>
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(picked, setPicked, c.id)} />
            <span className="block text-xl text-ink">{c.title}</span>
            <span className="block text-sm text-muted">{c.ages}</span>
            {role === "camper" && <span className="mt-1 block text-sm font-semibold text-purple">{kes(c.fee)} per child</span>}
            <span className={`mt-2 inline-block rounded-sm px-3 py-1 text-xs font-semibold ${on ? "bg-purple text-on-purple" : "bg-paper-2 text-purple"}`}>{on ? "Selected" : "Tap to select"}</span>
          </label>
        );
      })}
    </fieldset>
  );

  const steps = ["Who are you?", "Your details", "Review & send"];
  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={`rounded-sm px-3 py-2 text-center text-xs font-semibold sm:text-sm ${i === step ? "bg-purple text-on-purple" : i < step ? "bg-gold text-ink" : "bg-paper-2 text-muted"}`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="rounded-sm bg-paper p-6  border border-rule sm:p-9">
        {step === 0 && (
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-3xl font-extrabold text-ink">How would you like to take part?</legend>
            {offered.map((r) => (
              <label key={r.id} className={`flex cursor-pointer gap-4 rounded-sm border-2 p-5 transition ${role === r.id ? "border-purple bg-paper-2" : "border-rule hover:border-purple"}`}>
                <input
                  type="radio"
                  name="role"
                  className="mt-1.5 size-5 accent-purple"
                  checked={role === r.id}
                  onChange={() => {
                    setRole(r.id);
                    setPicked([]);
                  }}
                />
                <span>
                  <span className="block text-2xl text-ink">{r.title}</span>
                  <span className="text-muted">{r.text}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {step === 1 && (
          <div className="grid gap-6">
            <h2 className="text-3xl text-ink">Your details</h2>
            <label className={label}>
              Full name *<input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className={label}>
              Phone number *<input className={input} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+254 7XX XXX XXX" />
            </label>

            {role === "camper" && (
              <>
                <fieldset className="grid grid-cols-2 gap-3">
                  <legend className={`${label} mb-2`}>You are registering as *</legend>
                  {(["parent", "camper"] as const).map((w) => (
                    <label key={w} className={`cursor-pointer rounded-sm border-2 p-4 text-center font-semibold transition ${who === w ? "border-purple bg-paper-2 text-purple" : "border-rule text-muted"}`}>
                      <input type="radio" name="who" className="sr-only" checked={who === w} onChange={() => setWho(w)} />
                      {w === "parent" ? "A parent or guardian" : "The camper"}
                    </label>
                  ))}
                </fieldset>
                {who === "parent" ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <p className={label}>Children you are registering *</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Fewer children"
                          disabled={kids.length <= 1}
                          onClick={() => setKids(kids.slice(0, -1))}
                          className="grid size-11 place-items-center rounded-sm border border-ink/35 text-purple disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-2xl" aria-live="polite">
                          {kids.length}
                        </span>
                        <button
                          type="button"
                          aria-label="More children"
                          disabled={kids.length >= 8}
                          onClick={() => setKids([...kids, { name: "", age: "" }])}
                          className="grid size-11 place-items-center rounded-sm border border-ink/35 text-purple disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                    {kids.map((k, i) => (
                      <div key={i} className="grid gap-3 rounded-sm bg-paper-2 p-4 sm:grid-cols-[1fr_7rem]">
                        <label className={label}>
                          Child {i + 1} full name
                          <input className={input} value={k.name} onChange={(e) => setKids(kids.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                        </label>
                        <label className={label}>
                          Age
                          <input className={input} type="number" inputMode="numeric" min={5} max={19} value={k.age} onChange={(e) => setKids(kids.map((x, j) => (j === i ? { ...x, age: e.target.value } : x)))} />
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className={label}>
                    Your age *<input className={input} type="number" inputMode="numeric" min={5} max={19} value={age} onChange={(e) => setAge(e.target.value)} />
                  </label>
                )}
                <CampPick list={picked} />
                {chosen.length > 0 && (
                  <p className="rounded-sm bg-paper-2 p-4 font-semibold text-purple">
                    Total for {childCount} {childCount === 1 ? "child" : "children"}: {kes(total)}
                  </p>
                )}
              </>
            )}

            {role === "facilitator" && (
              <>
                <CampPick list={picked} />
                <fieldset>
                  <legend className={`${label} mb-3`}>Where would you like to serve? *</legend>
                  <div className="flex flex-wrap gap-2">
                    {facilitatorRoles.map((d) => {
                      const on = duties.includes(d);
                      return (
                        <label key={d} className={`cursor-pointer rounded-sm border-2 px-4 py-2 text-sm font-semibold transition ${on ? "border-purple bg-purple text-on-purple" : "border-rule text-purple hover:border-purple"}`}>
                          <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(duties, setDuties, d)} />
                          {d}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            )}

            {role === "sponsor" && (
              <>
                <label className={label}>
                  Which camp would you like to support? *
                  <select className={input} value={sponsorCamp} onChange={(e) => setSponsorCamp(e.target.value)}>
                    {camps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={label}>
                  Contribution (KES, from 500) *<input className={input} type="number" inputMode="numeric" min={500} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
              </>
            )}
            <label className={label}>
              Anything else we should know?
              <textarea className={`${input} min-h-24`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <h2 className="text-3xl text-ink">Check, then send</h2>
            <p className="text-muted">This opens WhatsApp with your registration written out. Press send there to complete it.</p>
            <pre className="whitespace-pre-wrap rounded-sm bg-paper-2 p-5 font-sans text-[0.95rem] leading-relaxed text-ink">{message}</pre>
            {role === "camper" && <p className="text-sm text-muted">A deposit of {kes(depositKes)} is required within 14 days to hold the place.</p>}
            <a
              href={`https://wa.me/${numbers[role]}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-sm bg-purple px-7 font-semibold text-on-purple transition hover:bg-purple-deep"
            >
              <MessageCircle className="size-5" aria-hidden /> Send on WhatsApp
            </a>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex min-h-12 items-center gap-2 rounded-sm px-5 font-semibold text-purple disabled:invisible">
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
          {step < 2 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !detailsOk}
              className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-gold px-7 font-semibold text-ink transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {step === 0 ? "Continue" : "Review"} <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
        {step === 1 && !detailsOk && <p className="mt-3 text-right text-sm text-muted">Fill in the starred fields to continue.</p>}
      </div>
    </div>
  );
}
