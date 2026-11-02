import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import CampApplicationForm from "@/components/forms/CampApplicationForm";
import { Button, Section } from "@/components/ui";
import consent from "@/content/camp-consent.json";
import { site } from "@/content/site";
import { sealingReady } from "@/lib/crypto";
import { getEvents } from "@/lib/content";
import { store } from "@/lib/store";
import { formatEventDates } from "@/lib/time";

export const metadata: Metadata = {
  title: "Camp application",
  description: "Apply for a place at the Jewels Kids Camp or the Teen Life Mentorship Camp. Health details are kept private.",
  alternates: { canonical: "/events/apply" },
};

export default async function CampApplyPage({ searchParams }: { searchParams: Promise<{ camp?: string }> }) {
  const { camp } = await searchParams;
  const now = Date.now();
  const camps = (await getEvents())
    .filter((e) => e.category === "camp" && e.registrationOpen && new Date(e.end ?? e.start).getTime() >= now)
    .map((e) => ({ id: e.id, title: e.title, subtitle: e.subtitle, fee: e.fee, dates: formatEventDates(e.start, e.end) }));
  const ready = store.writable && (await sealingReady());
  const call = `0${site.whatsapp.camps.replace(/^254/, "")}`;

  return (
    <>
      <PageHero
        title="Camp application"
        slot="camps.apply.hero"
        image="jewels-camp-memory"
        focus="50% 35%"
        tagline="Apply for a place for your child. It takes about ten minutes, and you can stop and talk to the camp office at any time."
        crumbs={[{ label: "Camps", href: "/camps" }, { label: "Camp application" }]}
      />
      <Section>
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-24">
          <aside className="grid gap-8 lg:sticky lg:top-28">
            <p className="flex gap-3"><ShieldCheck className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span><span className="block font-bold">Kept private</span><span className="text-muted">Health and family details are encrypted when saved and are seen only by the programme&apos;s leaders and the camp office.</span></span></p>
            <p className="flex gap-3"><MessageCircle className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span><span className="block font-bold">Prefer to talk?</span><span className="text-muted">WhatsApp the camp office on <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>.</span></span></p>
            <p className="border-t border-rule pt-6 text-muted">Want to serve as a facilitator, or sponsor a child? <Link href="/events/register" className="font-semibold text-purple underline underline-offset-4">Use the volunteer and sponsor form</Link>.</p>
          </aside>
          {camps.length === 0 ? (
            <p className="border border-rule bg-paper-2 p-8 text-lg text-muted">Camp applications are not open right now. New camps are announced on the <Link href="/events" className="font-semibold text-purple underline underline-offset-4">events page</Link>.</p>
          ) : !ready ? (
            <div className="border border-rule bg-paper-2 p-8">
              <p className="text-xl font-bold">Online applications are being set up.</p>
              <p className="reading mt-2 text-muted">Until they are open, please WhatsApp the camp office and we will register your child.</p>
              <div className="mt-6"><Button href={`https://wa.me/${site.whatsapp.camps}`} external>WhatsApp {call}</Button></div>
            </div>
          ) : (
            <CampApplicationForm camps={camps} consent={consent} selected={camps.find((c) => c.id === camp)?.id ?? camps[0].id} whatsapp={site.whatsapp.camps} />
          )}
        </div>
      </Section>
    </>
  );
}
