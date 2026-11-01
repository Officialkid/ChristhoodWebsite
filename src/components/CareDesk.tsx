"use client";

import { useState } from "react";
import { HandHeart, HeartHandshake, MessageCircle, Mail } from "lucide-react";

type Props = { whatsapp: { prayer: string; counselling: string }; email: string };

const field = "mt-2 w-full rounded-sm border border-rule bg-paper px-4 py-3 text-ink placeholder:text-muted/70 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple";

/** Prayer requests and counselling bookings. Opens WhatsApp or email with the message ready to send. Nothing is stored here. */
export default function CareDesk({ whatsapp, email }: Props) {
  const [mode, setMode] = useState<"prayer" | "counselling">("prayer");
  const [anon, setAnon] = useState(false);
  const [v, setV] = useState({ name: "", contact: "", topic: "", how: "In person (Nairobi CBD)", message: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const who = anon ? "Anonymous" : v.name.trim() || "Not given";
  const lines =
    mode === "prayer"
      ? ["*Prayer request*", `From: ${who}`, !anon && v.contact ? `Reach me on: ${v.contact}` : "", "", v.message.trim()]
      : ["*Counselling session request*", `From: ${who}`, v.contact ? `Reach me on: ${v.contact}` : "", `Preferred way: ${v.how}`, v.topic ? `Area: ${v.topic}` : "", "", v.message.trim()];
  const body = lines.filter((l, i) => l || (i > 0 && lines[i - 1] !== "")).join("\n");
  const subject = mode === "prayer" ? "Prayer request" : "Counselling session request";
  const ready = v.message.trim().length > 2 && (anon || mode === "prayer" || v.contact.trim());
  const phone = mode === "prayer" ? whatsapp.prayer : whatsapp.counselling;

  return (
    <section id="care" className="scroll-mt-24 bg-paper-2 py-20 sm:py-24">
      <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="font-semibold text-purple">Pastoral care</p>
          <h2 className="mt-4 text-[clamp(2.2rem,4.6vw,3.6rem)] text-ink">
            You don&apos;t have to carry it alone
          </h2>
          <p className="mt-5 max-w-lg text-lg text-muted">Send a prayer request to our intercessory team, or book a private counselling session. Everything is handled with strict confidentiality, and counselling is free.</p>
          <ul className="mt-8 grid gap-3 text-ink">
            <li className="flex gap-3">
              <HandHeart className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden /> You can send a prayer request anonymously.
            </li>
            <li className="flex gap-3">
              <HeartHandshake className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden /> Counselling in person (Nairobi CBD), by WhatsApp call or virtually.
            </li>
          </ul>
        </div>
        <div className="rounded-sm bg-paper p-6  border border-rule sm:p-8">
          <div role="tablist" aria-label="What do you need?" className="grid grid-cols-2 gap-2 rounded-sm bg-paper-2 p-1.5">
            {(["prayer", "counselling"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-11 rounded-sm px-4 text-sm font-semibold transition ${mode === m ? "bg-purple text-on-purple shadow" : "text-purple hover:bg-paper"}`}
              >
                {m === "prayer" ? "Prayer request" : "Book counselling"}
              </button>
            ))}
          </div>
          <form className="mt-6 grid gap-5" onSubmit={(e) => e.preventDefault()}>
            <label className="flex items-center gap-3 text-sm font-semibold text-ink">
              <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="size-5 accent-purple" /> Keep my name private
            </label>
            {!anon && (
              <>
                <label className="text-sm font-semibold text-ink">
                  Your name
                  <input className={field} value={v.name} onChange={set("name")} autoComplete="name" placeholder="Optional" />
                </label>
                <label className="text-sm font-semibold text-ink">
                  Phone or email{mode === "counselling" ? " *" : ""}
                  <input className={field} value={v.contact} onChange={set("contact")} placeholder={mode === "counselling" ? "So we can reach you" : "Optional"} />
                </label>
              </>
            )}
            {mode === "counselling" && (
              <>
                <label className="text-sm font-semibold text-ink">
                  How would you like to meet?
                  <select className={field} value={v.how} onChange={set("how")}>
                    <option>In person (Nairobi CBD)</option>
                    <option>WhatsApp call</option>
                    <option>Virtual call</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-ink">
                  What would you like help with?
                  <select className={field} value={v.topic} onChange={set("topic")}>
                    <option value="">Choose one (optional)</option>
                    <option>Grief or loss</option>
                    <option>Emotional healing</option>
                    <option>Marriage or premarital guidance</option>
                    <option>Family or relationships</option>
                    <option>Faith questions</option>
                    <option>Mentorship</option>
                  </select>
                </label>
              </>
            )}
            <label className="text-sm font-semibold text-ink">
              {mode === "prayer" ? "Your prayer request or praise report *" : "A few words about what you are facing *"}
              <textarea className={`${field} min-h-32`} value={v.message} onChange={set("message")} placeholder="Write here" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                aria-disabled={!ready}
                href={ready ? `https://wa.me/${phone}?text=${encodeURIComponent(body)}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-5 font-semibold transition ${ready ? "bg-purple text-on-purple hover:bg-purple-deep" : "pointer-events-none bg-paper-2 text-muted"}`}
              >
                <MessageCircle className="size-4" aria-hidden /> Send on WhatsApp
              </a>
              <a
                aria-disabled={!ready}
                href={ready ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : undefined}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border px-5 font-semibold transition ${ready ? "border-ink/35 text-purple hover:bg-purple hover:text-on-purple" : "pointer-events-none border-transparent bg-paper-2 text-muted"}`}
              >
                <Mail className="size-4" aria-hidden /> Send by email
              </a>
            </div>
            <p className="text-xs text-muted">Pressing send opens WhatsApp or your email app with your message ready. We do not keep anything you type here.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
