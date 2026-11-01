"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

const input = "mt-2 w-full rounded-sm border border-rule bg-paper px-4 py-3 text-ink focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple";
const label = "block text-sm font-semibold text-ink";

/** Branch registration. Writes the details out as a WhatsApp message to the programme coordinator. */
export default function BranchForm({ whatsapp, fee }: { whatsapp: string; fee: number }) {
  const [v, setV] = useState({ participantName: "", participantPhone: "", educationLevel: "", parentName: "", parentPhone: "", county: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: k === "participantName" || k === "parentName" ? e.target.value.toUpperCase() : e.target.value }));
  const ok = v.participantName.trim() && v.educationLevel.trim() && v.parentName.trim() && v.parentPhone.trim().length >= 9 && v.county.trim();

  const lines = ["Hello, I am contacting Christhood Ministries to register for the upcoming Branch Excands program. Here are my details:", "", `Participant Name: ${v.participantName.trim()}`];
  if (v.participantPhone.trim()) lines.push(`Participant Phone: ${v.participantPhone.trim()}`);
  lines.push(
    `Parent/Guardian Name: ${v.parentName.trim()}`,
    `Parent/Guardian Phone: ${v.parentPhone.trim()}`,
    `County: ${v.county.trim()}`,
    `Education Level: ${v.educationLevel.trim()}`,
    "",
    `I acknowledge I ought to pay ${fee.toLocaleString("en-KE")} Ksh as registration fee.`,
  );
  const message = lines.join("\n");

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 rounded-sm bg-paper p-6  border border-rule sm:p-9">
      <label className={label}>
        Participant full name (capital letters) *<input className={input} value={v.participantName} onChange={set("participantName")} placeholder="ENTER FULL NAME" autoComplete="name" />
      </label>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className={label}>
          Participant mobile number (optional)
          <input className={input} type="tel" inputMode="tel" value={v.participantPhone} onChange={set("participantPhone")} placeholder="+254 XXX XXX XXX" />
        </label>
        <label className={label}>
          Education level *<input className={input} value={v.educationLevel} onChange={set("educationLevel")} placeholder="Form 4 graduate, first year…" />
        </label>
        <label className={label}>
          Parent or guardian full name *<input className={input} value={v.parentName} onChange={set("parentName")} placeholder="ENTER FULL NAME" />
        </label>
        <label className={label}>
          Parent or guardian phone *<input className={input} type="tel" inputMode="tel" value={v.parentPhone} onChange={set("parentPhone")} placeholder="+254 XXX XXX XXX" />
        </label>
      </div>
      <label className={label}>
        County *<input className={input} value={v.county} onChange={set("county")} placeholder="County" />
      </label>
      <p className="rounded-sm bg-paper-2 p-4 text-sm text-muted">
        Registration fee: <strong className="text-purple">KES {fee.toLocaleString("en-KE")}</strong>. Pressing send opens WhatsApp with your details written out. Press send there to complete your registration.
      </p>
      <a
        aria-disabled={!ok}
        href={ok ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-sm px-7 font-semibold transition ${ok ? "bg-purple text-on-purple hover:bg-purple-deep" : "pointer-events-none bg-paper-2 text-muted"}`}
      >
        <MessageCircle className="size-5" aria-hidden /> Send on WhatsApp
      </a>
    </form>
  );
}
