import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, HandHeart, MapPin } from "lucide-react";
import PageHero from "@/components/PageHero";
import VisitForm from "@/components/forms/VisitForm";
import { Section } from "@/components/ui";
import { site } from "@/content/site";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "New here? Register your visit",
  description: "New to Christhood Ministries? Register your visit so our hospitality team can welcome you and keep in touch.",
  alternates: { canonical: "/visit" },
};

export default async function VisitPage() {
  const { fellowship: f, contact } = await getSettings();
  return (
    <>
      <PageHero
        title="Welcome to Christhood. We are glad you came."
        tagline="Take two minutes to tell us a little about yourself so our hospitality team can welcome you properly and keep in touch."
        slot="visit.hero"
        crumbs={[{ label: "Connect" }, { label: "I'm new" }]}
      />
      <Section>
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-24">
          <aside className="grid gap-8 lg:sticky lg:top-28">
            <div>
              <h2 className="t-h2 !text-[1.6rem]">What to expect</h2>
              <p className="reading mt-3 text-muted">A warm welcome, worship, the Word and people who will be glad to meet you. Come as you are.</p>
            </div>
            <dl className="grid gap-5 border-t border-rule pt-6">
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><CalendarDays className="size-5 shrink-0 text-purple" aria-hidden />When</dt><dd className="pl-8 font-bold">Every {f.day}</dd></div>
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><Clock className="size-5 shrink-0 text-purple" aria-hidden />Time</dt><dd className="pl-8 font-bold">{f.display}</dd></div>
              <div><dt className="flex items-center gap-3 text-[0.9rem] font-semibold text-muted"><MapPin className="size-5 shrink-0 text-purple" aria-hidden />Where</dt><dd className="pl-8 font-bold">{f.address}</dd><dd className="mt-1 pl-8"><a href={site.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-purple underline underline-offset-4">Get directions</a></dd></div>
            </dl>
            <p className="flex gap-3 border-t border-rule pt-6 text-muted"><HandHeart className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span>Prefer to talk first? Call <a className="font-semibold text-purple underline underline-offset-4" href={`tel:${contact.phones[0]?.tel}`}>{contact.phones[0]?.display}</a> or <Link href="/prayer" className="font-semibold text-purple underline underline-offset-4">send a prayer request</Link>.</span></p>
          </aside>
          <VisitForm />
        </div>
      </Section>
    </>
  );
}
