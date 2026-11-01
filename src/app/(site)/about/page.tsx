import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Img from "@/components/Img";
import { Button, Section } from "@/components/ui";
import { story } from "@/content/about";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Our story",
  description: "Christhood Outfield International Ministries was birthed in 2009 and officially launched on 1 November 2015. Read how a humble outreach grew into a family of ministries.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero title={story.title} tagline="History, heritage and vision" image="christhoood-about" crumbs={[{ label: "About" }, { label: "Our story" }]} actions={[{ label: "Mission and faith", href: "/about/mission" }, { label: "Meet our leaders", href: "/about/leadership" }]} />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-24">
          <Reveal>
            <p className="t-lead">{story.lead}</p>
            <div className="mt-8 grid gap-5">{story.paragraphs.map((p) => <p key={p.slice(0, 20)} className="reading text-muted">{p}</p>)}</div>
          </Reveal>
          <Reveal delay={0.08}>
            <ol className="border-t border-rule">
              {story.timeline.map((t) => (
                <li key={t.year} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 border-b border-rule py-6">
                  <span className="text-[2.4rem] font-extrabold leading-none text-purple [font-variation-settings:'wdth'_86]">{t.year}</span>
                  <span className="text-muted">{t.text}</span>
                </li>
              ))}
            </ol>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden bg-paper-2"><Img cover src="christhood-about-intro" alt="An open Bible during a Christhood Bible study" sizes="(min-width:1024px) 38vw, 100vw" /></div>
          </Reveal>
        </div>
      </Section>

      <Section tone="purple">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <h2 className="t-h2">How we live it out</h2>
          <div>
            <ul className="border-t border-on-purple/25">{story.live.map((l) => <li key={l} className="border-b border-on-purple/25 py-5 font-serif text-xl leading-snug">{l}</li>)}</ul>
            <p className="reading mt-7 text-on-purple-muted">{story.liveClosing}</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <h2 className="t-h2">Why it matters</h2>
          <div>
            {story.why.map((p, i) => <p key={p.slice(0, 20)} className={i === 0 ? "t-lead" : "reading mt-6 text-muted"}>{p}</p>)}
            <p className="mt-10 text-2xl font-extrabold [font-variation-settings:'wdth'_86]">Come walk with us</p>
            <p className="reading mt-2 text-muted">{story.invite}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href="/#visit">Plan your visit</Button><Button href="/ministries" variant="outline">Explore ministries</Button></div>
          </div>
        </div>
      </Section>

      <Section tone="alt" tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div><h2 className="text-2xl">Connect with us</h2><p className="mt-1 text-muted">Join our fellowship across our official channels.</p></div>
          <ul className="flex flex-wrap gap-x-7 gap-y-1">{site.socials.map((s) => <li key={s.name}><a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-purple underline decoration-purple/40 underline-offset-[6px] hover:decoration-purple">{s.name}</a></li>)}</ul>
        </div>
      </Section>
    </>
  );
}
