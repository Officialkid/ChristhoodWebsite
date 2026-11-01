import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { CopyButton } from "@/components/Interactive";
import { Button, Section } from "@/components/ui";
import { site } from "@/content/site";
import { getSettings } from "@/lib/content";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Give & partner",
  description: "Support Christhood Ministries outreach, camps and humanitarian work. Give by M-Pesa Paybill or bank transfer, and send a prayer request or testimony.",
  alternates: { canonical: "/give" },
};

export default async function GivePage() {
  const { giving, contact } = await getSettings();
  const supports = [
    ["Gospel outreach", "Missions to high schools, campuses and towns across Kenya."],
    ["Camps and mentorship", "Sponsoring campers, and keeping Jewels, Teen Life and Branch within reach of every family."],
    ["Humanitarian work", "Meals for children in street situations, daycare in Gichagi, and skills for the Baraka women."],
  ];
  return (
    <>
      <PageHero title="Giving and partnership" tagline="Thank you for your generous heart and willingness to support the work of God through Christhood Ministry. Your giving enables us to spread the Gospel and transform lives." crumbs={[{ label: "Give" }]} />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <div>
            <blockquote className="font-serif text-[clamp(1.4rem,2.2vw,1.8rem)] italic leading-snug">“Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.”<footer className="mt-3 font-sans text-base font-semibold not-italic text-purple">2 Corinthians 9:7</footer></blockquote>
            <h2 className="mt-14 text-2xl">What your giving supports</h2>
            <ul className="mt-4 border-t border-rule">{supports.map(([t, d]) => <li key={t} className="border-b border-rule py-4"><p className="font-bold">{t}</p><p className="reading text-muted">{d}</p></li>)}</ul>
          </div>

          <div className="grid content-start gap-12">
            <section aria-labelledby="mpesa">
              <h2 id="mpesa" className="text-2xl">M-Pesa Paybill</h2>
              <ol className="reading mt-3 list-decimal pl-5 text-muted"><li>Open M-Pesa, then Lipa na M-Pesa, then Paybill.</li><li>Enter the business number, then the account number below.</li><li>Enter the amount and your PIN.</li></ol>
              <dl className="mt-6 divide-y divide-rule border-y border-rule">
                <div className="flex flex-wrap items-baseline justify-between gap-3 py-5"><dt className="text-muted">Business number (Paybill)</dt><dd className="text-5xl font-extrabold text-purple [font-variation-settings:'wdth'_86]">{giving.paybill}</dd></div>
                <div className="flex flex-wrap items-baseline justify-between gap-3 py-5"><dt className="text-muted">Account number</dt><dd className="break-all text-3xl font-extrabold [font-variation-settings:'wdth'_86]">{giving.account}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-3"><CopyButton tone="light" value={giving.paybill} label="Copy paybill" /><CopyButton tone="light" value={giving.account} label="Copy account number" /></div>
            </section>
            <section aria-labelledby="bank">
              <h2 id="bank" className="text-2xl">Bank transfer</h2>
              <dl className="mt-4 divide-y divide-rule border-y border-rule">
                <div className="flex flex-wrap items-baseline justify-between gap-3 py-4"><dt className="text-muted">Bank</dt><dd className="text-xl font-bold">{giving.bank}</dd></div>
                <div className="flex flex-wrap items-baseline justify-between gap-3 py-4"><dt className="text-muted">Account number</dt><dd className="break-all text-xl font-bold">{giving.account}</dd></div>
              </dl>
            </section>
            <p className="text-muted">Giving another way, or a question about a gift? Call <a className="font-semibold text-purple underline underline-offset-4" href={`tel:${contact.phones[0]?.tel}`}>{contact.phones[0]?.display}</a> or write to <a className="font-semibold text-purple underline underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a>.</p>
          </div>
        </div>
      </Section>

      <Section tone="alt">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <div>
            <h2 className="t-h2">Prayer request or testimony</h2>
            <p className="t-lead mt-4 text-muted">Tell us how we can pray with you, or share what God has done. Your information is securely submitted to Christhood Ministry.</p>
            <div className="mt-8"><Button href="/ministries/counselling#care" variant="outline">Prefer WhatsApp or counselling?</Button></div>
          </div>
          <div className="overflow-hidden border border-rule bg-paper"><iframe src={site.prayerForm} title="Prayer request and testimony form" loading="lazy" className="h-[44rem] w-full border-0">Loading prayer request form…</iframe></div>
        </div>
      </Section>
    </>
  );
}
