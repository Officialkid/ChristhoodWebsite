import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, DoorOpen, HandHeart, MapPin, Phone } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Button, Section } from "@/components/ui";
import Reveal from "@/components/Reveal";
import { site } from "@/content/site";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "New here? Plan your visit",
  description: "What to expect at Christhood Ministries on a Saturday, and how our protocol team welcomes and registers every new member.",
  alternates: { canonical: "/visit" },
};

const steps = [
  ["Meet the protocol team", "Our protocol, security and hospitality team greets everyone at the door and shows you to a seat."],
  ["They register you", "The protocol team sets you up as a new member, with your email and phone if you wish, so no one is missed. Only they can do this, so your details stay with people you can see and trust."],
  ["We keep in touch", "Someone will call, message or email you to welcome you, answer questions and help you find a ministry."],
] as const;

export default async function VisitPage() {
  const { fellowship: f, contact } = await getSettings();
  return (
    <>
      <PageHero
        title="Welcome to Christhood. We are glad you are coming."
        tagline="Come as you are. When you arrive, our protocol team will meet you at the door and register you as a new member, so we can keep in touch."
        slot="visit.hero"
        crumbs={[{ label: "Connect" }, { label: "Plan your visit" }]}
        actions={[{ label: "Get directions", href: site.mapsLink, external: true }]}
      />
      <Section>
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24">
          <Reveal>
            <h2 className="t-h2">When and where</h2>
            <dl className="mt-8 grid gap-6">
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><CalendarDays className="size-5 shrink-0 text-purple" aria-hidden />When</dt><dd className="pl-8 text-xl font-bold">Every {f.day}</dd></div>
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><Clock className="size-5 shrink-0 text-purple" aria-hidden />Time</dt><dd className="pl-8 text-xl font-bold">{f.display}</dd></div>
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><MapPin className="size-5 shrink-0 text-purple" aria-hidden />Where</dt><dd className="pl-8 text-xl font-bold">{f.address}</dd></div>
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><Phone className="size-5 shrink-0 text-purple" aria-hidden />Questions</dt><dd className="flex flex-wrap gap-x-6 pl-8 text-xl font-bold">{contact.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="inline-flex min-h-11 items-center text-purple underline underline-offset-4">{p.display}</a>)}</dd></div>
            </dl>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="t-h2">How we welcome you</h2>
            <ol className="mt-8 border-t border-rule">
              {steps.map(([title, text], i) => (
                <li key={title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-rule py-6">
                  <span className="text-3xl font-extrabold text-purple [font-variation-settings:'wdth'_86]">{i + 1}</span>
                  <span><span className="block text-xl font-bold">{title}</span><span className="reading text-muted">{text}</span></span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Button href="/ministries/protocol" variant="purple"><DoorOpen className="size-4" aria-hidden /> Meet the protocol team</Button>
              <Link href="/prayer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline underline-offset-[6px]"><HandHeart className="size-4" aria-hidden /> Send a prayer request</Link>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
