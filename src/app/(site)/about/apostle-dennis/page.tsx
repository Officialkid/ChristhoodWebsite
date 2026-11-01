import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Img from "@/components/Img";
import { Button, Section } from "@/components/ui";
import { apostle } from "@/content/about";

export const metadata: Metadata = {
  title: "Apostle Dennis N. Vincent",
  description: "Founder and visionary leader of Christhood: husband, father, gospel minister, missionary, apologist, life coach, counsellor, author and certified trainer.",
  alternates: { canonical: "/about/apostle-dennis" },
};

export default function ApostlePage() {
  return (
    <>
      <PageHero slot="about.apostle.hero" title={apostle.name} tagline={apostle.titles.join(" · ")} crumbs={[{ label: "About", href: "/about" }, { label: "Apostle Dennis" }]} actions={[{ label: "Get the full bio (PDF)", href: apostle.bioPdf, external: true }]} />

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <Reveal className="lg:sticky lg:top-28"><div className="relative aspect-square overflow-hidden bg-paper-2"><Img cover src={apostle.photo} alt="Apostle Dennis N. Vincent" sizes="(min-width:1024px) 40vw, 100vw" /></div></Reveal>
          <Reveal delay={0.06}>
            <p className="t-lead">{apostle.bio[0]}</p>
            <p className="reading mt-6 text-muted">{apostle.bio[1]}</p>
            <ol className="mt-8 border-t border-rule">
              {apostle.pillars.map(([t, d], i) => (
                <li key={t} className="grid gap-x-6 border-b border-rule py-6 sm:grid-cols-[3rem_1fr]"><span aria-hidden className="font-bold text-purple">0{i + 1}</span><div><h3 className="text-xl">{t}</h3><p className="reading mt-1 text-muted">{d}</p></div></li>
              ))}
            </ol>
            <p className="reading mt-8 text-muted">{apostle.reach}</p>
          </Reveal>
        </div>
      </Section>

      <Section tone="alt">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <h2 className="t-h2">Core values</h2>
          <ul className="border-t border-rule">{apostle.values.map(([t, d]) => <li key={t} className="border-b border-rule py-6"><h3 className="text-xl">{t}</h3><p className="reading mt-1 text-muted">{d}</p></li>)}</ul>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <h2 className="t-h2">Notable accomplishments</h2>
          <ul className="border-t border-rule">{apostle.accomplishments.map((a) => <li key={a.slice(0, 20)} className="reading border-b border-rule py-5">{a}</li>)}</ul>
        </div>
      </Section>

      <Section tone="purple">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <h2 className="t-h2">Vision and inspiration</h2>
          <div>
            {apostle.vision.map((p, i) => <p key={p.slice(0, 20)} className={i === 0 ? "font-serif text-[1.45rem] leading-snug" : "reading mt-5 text-on-purple-muted"}>{p}</p>)}
            <div className="mt-8"><Button href={apostle.bioPdf} external>Get the full bio (PDF)</Button></div>
          </div>
        </div>
      </Section>
    </>
  );
}
