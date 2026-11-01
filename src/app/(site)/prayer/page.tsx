import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import PrayerForm from "@/components/forms/PrayerForm";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Prayer requests and thanksgiving",
  description: "Send a prayer request or share a thanksgiving with the Christhood Ministries pastoral and intercessory team. You can stay anonymous.",
  alternates: { canonical: "/prayer" },
};

export default async function PrayerPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <>
      <PageHero
        title="Let us pray with you and celebrate with you"
        tagline="“In every thing by prayer and supplication with thanksgiving let your requests be made known unto God.” Philippians 4:6"
        slot="prayer.hero"
        crumbs={[{ label: "Connect" }, { label: "Prayer and thanksgiving" }]}
      />
      <Section>
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-24">
          <aside className="grid gap-8 lg:sticky lg:top-28">
            <p className="flex gap-3"><ShieldCheck className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span><span className="block font-bold">Kept confidential</span><span className="text-muted">Only the people you choose on the form will read your message.</span></span></p>
            <p className="flex gap-3"><EyeOff className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span><span className="block font-bold">You can stay anonymous</span><span className="text-muted">Tick the box and we will not ask for your name or number.</span></span></p>
            <p className="border-t border-rule pt-6 text-muted">Would you like to talk to someone in person? <Link href="/ministries/counselling" className="font-semibold text-purple underline underline-offset-4">Our counselling ministry is free and confidential</Link>.</p>
          </aside>
          <PrayerForm initialType={type === "thanksgiving" ? "thanksgiving" : "prayer"} />
        </div>
      </Section>
    </>
  );
}
