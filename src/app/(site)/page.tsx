import Link from "next/link";
import type { CSSProperties } from "react";
import Img from "@/components/Img";
import SlotImg from "@/components/SlotImg";
import { Icon } from "@/components/icons";
import MotesLayer from "@/components/fx/MotesLayer";
import { Stagger, Wipe } from "@/components/fx/gsap";
import WordReveal from "@/components/WordReveal";
import VerseSlot from "@/components/fx/VerseSlot";
import Reveal from "@/components/Reveal";
import Directory from "@/components/Directory";
import { Button, Section, SectionHead } from "@/components/ui";
import { GatheringStatus } from "@/components/Countdown";
import { CopyButton, HeroMedia, QuoteSwitcher, VideoCard } from "@/components/Interactive";
import { EventRow } from "@/components/Cards";
import { humanitarian } from "@/content/about";
import { site } from "@/content/site";
import { resolvePhoto } from "@/lib/images";
import { getMessages, getMinistries, getProgrammes, getSettings, getSlot, getStories, getUpcomingEvents } from "@/lib/content";

export const revalidate = 60;

const firstSentence = (t: string) => t.split(/(?<=\.)\s/)[0];

export default async function Home() {
  const [settings, ministries, programmes, upcoming, stories, messages] = await Promise.all([
    getSettings(), getMinistries(), getProgrammes(), getUpcomingEvents(), getStories(), getMessages(1),
  ]);
  const { fellowship: f, hero, giving, contact, welcome, verse } = settings;
  const verseHero = await getSlot("home.verse", "christhood-about-intro");
  const versePhotos = [...new Set([verseHero.src ?? "christhood-about-intro", "prayer", "worship"])].map((n) => resolvePhoto(n).full);
  const latest = messages[0];

  return (
    <>
      {/* Hero: one photograph, the name, one promise, one action */}
      <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col justify-end bg-purple-deep text-on-purple">
        <HeroMedia><SlotImg cover priority slot="home.hero" fallback="fellowship" alt="" sizes="100vw" focus="50% 30%" /></HeroMedia>
        <div aria-hidden className="absolute inset-0 bg-ink/55" />
        <MotesLayer />
        <div className="wrap relative z-[2] pb-24 pt-32 md:pb-16 md:pt-40">
          <p className="rise text-lg font-semibold">Christhood International Outfield Ministry</p>
          <WordReveal className="t-hero mt-3 max-w-[9ch]">{hero.headline}</WordReveal>
          <p className="t-lead rise mt-6 max-w-xl text-on-purple" style={{ "--d": ".18s" } as CSSProperties}>{hero.sub}</p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--d": ".28s" } as CSSProperties}>
            <Button href="/visit">New here? Plan your visit</Button>
            <Button href="/ministries" variant="outline-light">Explore ministries</Button>
          </div>
          <p className="rise mt-8 text-[0.98rem] font-semibold" style={{ "--d": ".38s" } as CSSProperties}>{hero.kicker}</p>
        </div>
      </section>

      {/* The next Saturday, in plain words */}
      <section className="border-b border-rule bg-paper-2">
        <dl className="wrap grid py-2 md:grid-cols-3 md:divide-x md:divide-rule">
          <div className="py-5 md:pr-8"><dt className="text-[0.9rem] font-semibold text-muted">Saturday fellowship</dt><dd className="mt-1 text-xl font-bold">Every {f.day}, {f.display}</dd></div>
          <div className="border-t border-rule py-5 md:border-t-0 md:px-8"><dt className="text-[0.9rem] font-semibold text-muted">Where</dt><dd className="mt-1 text-xl font-bold">{f.venue}, {f.area}</dd></div>
          <div className="border-t border-rule py-5 md:border-t-0 md:pl-8"><dt className="text-[0.9rem] font-semibold text-muted">Next gathering</dt><dd className="mt-1 text-xl font-bold text-purple"><GatheringStatus day={f.day} start={f.start} end={f.end} /></dd></div>
        </dl>
      </section>

      {/* Welcome */}
      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24">
          <Wipe><div className="relative aspect-[4/5] overflow-hidden bg-paper-2"><SlotImg cover slot="home.welcome" fallback="main-img" alt="Apostle Dennis and Mrs. Vincent smiling together at Saturday fellowship" sizes="(min-width:1024px) 40vw, 100vw" focus="35% 40%" /></div></Wipe>
          <Reveal delay={0.08} className="lg:pt-6">
            <h2 className="t-h2">Welcome to Christhood</h2>
            <div className="mt-8 grid gap-5">{welcome.map((p) => <p key={p.slice(0, 20)} className="reading">{p}</p>)}</div>
            <p className="mt-8 font-bold">Apostle &amp; Mrs. D.N. Vincent</p>
            <p className="mt-6 max-w-[52ch] text-muted">Birthed in 2009 and launched on 1 November 2015. Today: twelve ministries, five programmes and three humanitarian activities.</p>
            <div className="mt-6 flex flex-wrap gap-x-8"><Button href="/about" variant="text">Our story</Button><Button href="/about/apostle-dennis" variant="text">Meet Apostle Dennis</Button></div>
          </Reveal>
        </div>
      </Section>

      {/* The word for the week */}
      <Section tone="deep">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div>
            <h2 className="t-h2">Word for the week</h2>
            <p className="t-lead mt-4 max-w-md text-on-purple-muted">A verse to carry with you through the week. It changes every week.</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2"><Button href="/prayer" variant="outline-light">Send a prayer request</Button><Button href="/give" variant="text" className="!text-gold !decoration-gold/50">Partner with us</Button></div>
          </div>
          <Reveal><VerseSlot text={verse.text} reference={verse.ref} photos={versePhotos} /></Reveal>
        </div>
      </Section>

      {/* Ministries */}
      <Section tone="alt">
        <SectionHead title="Ministries" lead="At Christhood, we believe in the power of mentorship. Join us and let us walk with you as your spirituality grows and flourishes." className="mb-12" />
        <Directory pages={ministries} base="/ministries" />
      </Section>

      {/* Programmes */}
      <Section tone="purple">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <header className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="t-h2">Programmes</h2>
            <p className="t-lead mt-4 text-on-purple-muted">Mentorship for every age, from the first years of school to university and beyond.</p>
            <div className="mt-8"><Button href="/programmes" variant="outline-light">All programmes</Button></div>
          </header>
          <Stagger selector="li"><ul className="border-t border-on-purple/25">
            {programmes.map((p) => (
              <li key={p.slug} className="border-b border-on-purple/25">
                <Link href={`/programmes/${p.slug}`} className="group grid gap-x-8 gap-y-1 py-6 sm:grid-cols-[11rem_1fr]">
                  <span className="font-semibold text-gold">{p.audience}</span>
                  <span><span className="block text-2xl font-extrabold leading-tight [font-variation-settings:'wdth'_86] group-hover:underline group-hover:underline-offset-4">{p.title}</span><span className="reading mt-1 block text-on-purple-muted">{p.summary}</span></span>
                </Link>
              </li>
            ))}
          </ul></Stagger>
        </div>
      </Section>

      {/* Events */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead title="Upcoming events" lead="Camps, mentorship seasons and special gatherings." />
          <Button href="/events" variant="outline">All events</Button>
        </div>
        <div className="mt-10 border-t border-rule">
          {upcoming.length > 0 ? (
            upcoming.slice(0, 3).map((e, i) => <EventRow key={e.id} event={e} showCountdown={i === 0} />)
          ) : (
            <p className="reading border-b border-rule py-8 text-muted">New dates are announced here as soon as they are set. Until then, join us every {f.day}.</p>
          )}
        </div>
      </Section>

      {/* Humanitarian */}
      <Section tone="alt">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24">
          <div>
            <h2 className="t-h2">Humanitarian wing</h2>
            <p className="t-lead mt-4 text-muted">{humanitarian.tagline}</p>
            <p className="reading mt-6">{humanitarian.about[0]}</p>
            <ul className="mt-8 border-t border-rule">
              {humanitarian.programmes.map((p) => <li key={p.title} className="border-b border-rule py-4"><h3 className="text-lg">{p.title}</h3><p className="reading mt-1 text-muted">{firstSentence(p.text)}</p></li>)}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2"><Button href="/humanitarian" variant="purple">Read the full story</Button><Button href="/give" variant="text">Sponsor or donate</Button></div>
          </div>
          <Wipe><div className="relative aspect-[4/5] overflow-hidden bg-paper"><SlotImg cover slot="home.humanitarian" fallback="humanitarian-women" alt="Women of the Baraka group sharing a meal and learning beadwork together" sizes="(min-width:1024px) 40vw, 100vw" focus="55% 50%" /></div></Wipe>
        </div>
      </Section>

      {/* In their words */}
      <Section>
        <SectionHead title="In their words" className="mb-12" />
        <QuoteSwitcher stories={stories.map((s) => ({ name: s.name, role: s.role, quote: s.quote, photo: s.photo ? resolvePhoto(s.photo).small : undefined }))} />
      </Section>

      {/* Watch */}
      <Section id="watch" tone="alt">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="t-h2">Watch online</h2>
            <p className="t-lead mt-4 text-muted">{latest?.summary ?? "Can't be with us on Saturday? Messages, worship and moments from our gatherings are shared on our channels."}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button href={site.socials[2].href} external variant="purple">Watch on YouTube</Button><Button href={site.socials[0].href} external variant="outline">Instagram</Button></div>
          </div>
          {latest?.youtubeId ? (
            <div><VideoCard id={latest.youtubeId} title={latest.title} /><p className="mt-3 font-semibold">{latest.title}{latest.speaker ? `, ${latest.speaker}` : ""}</p></div>
          ) : (
            <a href={site.socials[2].href} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden bg-purple-deep"><SlotImg cover slot="home.watch" fallback="worship" alt="A worship leader at Saturday fellowship. Open our YouTube channel." sizes="(min-width:1024px) 50vw, 100vw" /><span className="absolute bottom-0 left-0 bg-gold px-5 py-3 font-bold text-ink">Our YouTube channel</span></a>
          )}
        </div>
      </Section>

      {/* Connect */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <header>
            <h2 className="t-h2">New here, or need prayer?</h2>
            <p className="t-lead mt-4 max-w-md text-muted">Meet the people who will welcome you, ask us to pray with you, or share what God has done. Everything is kept private.</p>
          </header>
          <Stagger selector="li">
            <ul className="border-t border-rule">
              {[
                { href: "/visit", icon: "guest", title: "New here? Plan your visit", text: "What to expect, and the protocol team who will welcome and register you." },
                { href: "/prayer", icon: "prayer", title: "Send a prayer request", text: "Confidential, and you can stay anonymous." },
                { href: "/prayer?type=thanksgiving", icon: "heart", title: "Share a thanksgiving", text: "Tell us what God has done." },
                { href: "/ministries/counselling", icon: "counselling", title: "Talk to a counsellor", text: "Free and confidential, in person or online." },
              ].map((c) => (
                <li key={c.href} className="border-b border-rule">
                  <Link href={c.href} className="group flex items-start gap-4 py-5">
                    <Icon name={c.icon} className="mt-1 size-6 shrink-0 text-purple" />
                    <span className="min-w-0 flex-1"><span className="block text-xl font-extrabold leading-tight [font-variation-settings:'wdth'_86] group-hover:underline group-hover:underline-offset-4">{c.title}</span><span className="mt-1 block text-muted">{c.text}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Stagger>
        </div>
      </Section>

      {/* Give */}
      <Section tone="deep">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24">
          <div>
            <h2 className="t-h2">Give</h2>
            <blockquote className="mt-6 max-w-xl font-serif text-[1.35rem] leading-snug">“Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.”<footer className="mt-3 font-sans text-base font-semibold text-gold">2 Corinthians 9:7</footer></blockquote>
            <div className="mt-8"><Button href="/give">Ways to give</Button></div>
          </div>
          <div>
            <p className="font-semibold text-on-purple-muted">{giving.bank}</p>
            <dl className="mt-4 divide-y divide-on-purple/25 border-y border-on-purple/25">
              <div className="flex flex-wrap items-baseline justify-between gap-3 py-5"><dt className="text-on-purple-muted">Paybill</dt><dd className="text-4xl font-extrabold [font-variation-settings:'wdth'_86]">{giving.paybill}</dd></div>
              <div className="flex flex-wrap items-baseline justify-between gap-3 py-5"><dt className="text-on-purple-muted">Account number</dt><dd className="break-all text-3xl font-extrabold [font-variation-settings:'wdth'_86]">{giving.account}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3"><CopyButton value={giving.paybill} label="Copy paybill" /><CopyButton value={giving.account} label="Copy account" /></div>
          </div>
        </div>
      </Section>

      {/* Visit */}
      <Section id="visit">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div>
            <h2 className="t-h2">Plan your visit</h2>
            <p className="t-lead mt-4 text-muted">Come as you are. We have saved you a seat.</p>
            <dl className="mt-10 grid gap-6">
              <div><dt className="font-semibold text-muted">When</dt><dd className="mt-1 text-xl font-bold">Every {f.day}, {f.display}</dd></div>
              <div><dt className="font-semibold text-muted">Where</dt><dd className="mt-1 text-xl font-bold">{f.address}</dd></div>
              <div><dt className="font-semibold text-muted">Questions?</dt><dd className="mt-1 flex flex-wrap gap-x-6 text-xl font-bold">{contact.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="inline-flex min-h-11 items-center text-purple underline underline-offset-4">{p.display}</a>)}</dd><dd className="mt-1 break-all text-muted">{contact.email}</dd></div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3"><Button href="/visit" variant="purple">Plan your visit</Button><Button href={site.mapsLink} external variant="outline">Get directions</Button><Button href={`tel:${contact.phones[0]?.tel}`} variant="outline" arrow={false}>Call now</Button></div>
          </div>
          <div className="relative min-h-[22rem] bg-paper-2 lg:min-h-full"><iframe src={site.mapEmbed} title="Map showing where Christhood meets, Azuri Premier Hotel, Nairobi CBD" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 size-full border-0" /></div>
        </div>
      </Section>
    </>
  );
}
