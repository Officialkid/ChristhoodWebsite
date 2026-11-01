import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Img from "@/components/Img";
import { QuoteSwitcher } from "@/components/Interactive";
import { Section } from "@/components/ui";
import { getLeaders, getStories } from "@/lib/content";
import { resolvePhoto } from "@/lib/images";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Leadership",
  description: "Meet the servant leaders and ministry directors of Christhood, in their own words.",
  alternates: { canonical: "/about/leadership" },
};

export default async function LeadershipPage() {
  const [leaders, stories] = await Promise.all([getLeaders(), getStories()]);
  return (
    <>
      <PageHero slot="about.leadership.hero" title="Our servant leaders" tagline="Meet our servant leaders and ministry directors, in their own words." crumbs={[{ label: "About", href: "/about" }, { label: "Leadership" }]} />

      <Section>
        <ul className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l, i) => (
            <Reveal as="li" key={l.name} delay={(i % 3) * 0.05}>
              <article>
                <div className="relative aspect-[4/5] overflow-hidden bg-paper-2"><Img cover src={l.photo} alt={`${l.name}, ${l.role}`} sizes="(min-width:1024px) 26vw, (min-width:640px) 45vw, 100vw" focus="50% 22%" /></div>
                <h2 className="mt-5 text-[1.7rem]">{l.name}</h2>
                <p className="mt-1 font-semibold text-purple">{l.role}</p>
                <p className="reading mt-4 text-muted">{l.teaser}</p>
                {l.story.length > 0 && (
                  <details className="group mt-3">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-semibold text-purple underline decoration-purple/40 underline-offset-[6px] [&::-webkit-details-marker]:hidden"><span className="group-open:hidden">Read more</span><span className="hidden group-open:inline">Show less</span></summary>
                    <div className="mt-2 grid gap-4">{l.story.map((p) => <p key={p.slice(0, 20)} className="reading text-muted">{p}</p>)}</div>
                  </details>
                )}
              </article>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="alt">
        <h2 className="t-h2 mb-12">Messages from members</h2>
        <QuoteSwitcher stories={stories.map((s) => ({ name: s.name, role: s.role, quote: s.quote, photo: s.photo ? resolvePhoto(s.photo).small : undefined }))} />
      </Section>
    </>
  );
}
