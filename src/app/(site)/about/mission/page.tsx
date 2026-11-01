import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Blocks from "@/components/Blocks";
import { Button, Section } from "@/components/ui";
import { mission } from "@/content/about";

export const metadata: Metadata = {
  title: "Mission, vision & statement of faith",
  description: "What Christhood believes and how we live and serve together: our vision, mission, doctrinal statement, ministry philosophy, statement of faith, standards and commitments.",
  alternates: { canonical: "/about/mission" },
};

export default function MissionPage() {
  const { sections, standards, commitments } = mission;
  return (
    <>
      <PageHero title={mission.title} tagline={mission.sub} crumbs={[{ label: "About", href: "/about" }, { label: "Mission and faith" }]} />

      <Section tone="alt">
        <ol className="border-t border-rule">
          {sections.map((s, i) => (
            <li key={s.id} id={s.id} className="scroll-mt-24 border-b border-rule py-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
              <Reveal>
                <p className="text-[0.95rem] font-bold text-purple">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="t-h2 mt-1">{s.title}</h2>
              </Reveal>
              <Reveal delay={0.05} className="mt-5 lg:mt-0">
                <p className="t-lead">{s.lead}</p>
                {s.body.map((p) => <p key={p.slice(0, 20)} className="reading mt-5 text-muted">{p}</p>)}
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      <Blocks blocks={[
        { type: "cards", title: standards.title, intro: `${standards.sub}. ${standards.lead}`, numbered: true, items: standards.items.map(([title, text]) => ({ title, text })) },
        { type: "quote", text: standards.closing },
        { type: "cards", title: commitments.title, intro: `${commitments.sub} ${commitments.lead}`, numbered: true, items: commitments.items.map(([title, text]) => ({ title, text })) },
        { type: "quote", text: commitments.closing },
      ]} />

      <Section tone="purple" tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <h2 className="t-h2">See it lived out</h2>
          <div className="flex flex-wrap gap-3"><Button href="/ministries">Explore ministries</Button><Button href="/about/leadership" variant="outline-light">Meet our leaders</Button></div>
        </div>
      </Section>
    </>
  );
}
