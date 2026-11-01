import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Img from "@/components/Img";
import { Button, Section } from "@/components/ui";
import { humanitarian as h } from "@/content/about";
import { getSettings } from "@/lib/content";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Humanitarian wing",
  description: "Serving humanity, restoring dignity and rebuilding hope for women and children in street situations and informal settlements since 2009.",
  alternates: { canonical: "/humanitarian" },
};

export default async function HumanitarianPage() {
  const { contact } = await getSettings();
  return (
    <>
      <PageHero slot="humanitarian.hero" title="Humanitarian wing" tagline={h.tagline} image="humanitarian-women" focus="50% 45%" crumbs={[{ label: "Humanitarian" }]} actions={[{ label: "Donate now", href: "/give" }, { label: "Sponsor a child", href: "#involved" }]} />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-24">
          <Reveal>
            <p className="t-lead">{h.about[0]}</p>
            {h.about.slice(1).map((p) => <p key={p.slice(0, 20)} className="reading mt-6 text-muted">{p}</p>)}
          </Reveal>
          <Reveal delay={0.06}>
            <dl className="border-t border-rule">
              {h.facts.map((f) => <div key={f.k} className="border-b border-rule py-5"><dt className="text-[0.9rem] font-semibold text-muted">{f.k}</dt><dd className="mt-1 text-2xl font-extrabold text-purple [font-variation-settings:'wdth'_86]">{f.v}</dd><dd className="mt-1 text-muted">{f.t}</dd></div>)}
            </dl>
          </Reveal>
        </div>
      </Section>

      <Section tone="purple">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-24">
          <div><h2 className="text-[1.05rem] font-bold text-gold">Our vision</h2><p className="mt-3 font-serif text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.35]">{h.vision}</p></div>
          <figure>
            <video controls preload="none" playsInline className="aspect-video w-full bg-ink" aria-label="Welcome to our Humanitarian Wing"><source src="/media/humanitarian-wing.mp4" type="video/mp4" />Your browser cannot play this video.</video>
            <figcaption className="mt-3 text-sm text-on-purple-muted">Welcome to our Humanitarian Wing</figcaption>
          </figure>
        </div>
      </Section>

      <Section tone="alt">
        <h2 className="t-h2 mb-14">Our programmes</h2>
        <ol className="grid gap-20">
          {h.programmes.map((p, i) => (
            <Reveal as="li" key={p.title}>
              <article className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-24 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-paper"><Img cover src={p.photo} alt="" sizes="(min-width:1024px) 45vw, 100vw" focus={p.focus} /></div>
                <div><p className="font-bold text-purple">0{i + 1}</p><h3 className="mt-1 text-[clamp(1.6rem,2.6vw,2.2rem)]">{p.title}</h3><p className="reading mt-4 text-muted">{p.text}</p></div>
              </article>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section id="involved" tone="deep">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div><h2 className="text-[1.05rem] font-bold text-gold">Why we do this</h2><p className="mt-3 font-serif text-[clamp(1.35rem,2.2vw,1.8rem)] leading-[1.4]">{h.why}</p></div>
          <div>
            <h2 className="t-h2">Be part of the story</h2>
            <ul className="mt-6 border-t border-on-purple/25">{h.involve.map((i) => <li key={i} className="border-b border-on-purple/25 py-4 text-xl">{i}</li>)}</ul>
            <div className="mt-8 flex flex-wrap gap-3"><Button href="/give">Donate now</Button><Button href={`mailto:${contact.email}?subject=${encodeURIComponent("Humanitarian wing")}`} variant="outline-light" arrow={false}>Send a message</Button></div>
          </div>
        </div>
      </Section>
    </>
  );
}
