import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandHeart, HeartHandshake, LifeBuoy } from "lucide-react";
import Img from "@/components/Img";
import PageHero from "@/components/PageHero";
import { Button, Section } from "@/components/ui";
import { site } from "@/content/site";
import { getEvents, getSettings } from "@/lib/content";
import { formatEventDates, formatMoney } from "@/lib/time";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Camps and mentorship",
  description: "Faith-centred holiday camps and mentorship for children and teenagers: the Jewels Kids Camp and the Teen Life Mentorship Camp. Dates, cost, how to apply and how to serve or sponsor.",
  alternates: { canonical: "/camps" },
};

/** The programme page that goes with a camp, when we can tell which one it is. */
const aboutLink = (id: string) => (id.startsWith("jewels") ? { href: "/programmes/jewels", label: "About Jewels" } : id.startsWith("teen-life") ? { href: "/programmes/teen-life", label: "About Teen Life" } : null);

const programmes = [
  {
    key: "jewels",
    who: "Children",
    title: "Jewels Kids Mentorship",
    text: "A joyful, faith-based space for children to discover their gifts, build confidence, and grow in belonging.",
    points: ["Bible-based devotions and mentorship", "Life skills, learning and STEM activities", "Games, creative arts and community service"],
    href: "/programmes/jewels",
    photo: "jewels-camp-memory",
    alt: "Children at a Jewels camp",
    instagram: { label: "Follow Jewels on Instagram", href: "https://www.instagram.com/jewelskidsclub/" },
  },
  {
    key: "teen-life",
    who: "Teenagers",
    title: "Teen Life Mentorship",
    text: "A faith-anchored place for teenagers to explore identity, purpose, relationships, and the choices shaping their future.",
    points: ["Practical life skills and decision-making", "Faith, relationships and honest conversations", "Team challenges, outdoor activities and talent showcases"],
    href: "/programmes/teen-life",
    photo: "teen-life-camp-activities",
    alt: "Teenagers taking part in a Teen Life camp activity",
    instagram: { label: "Follow Teen Life on Instagram", href: "https://www.instagram.com/christhood_teenlife_mentorship/" },
  },
];

const beyond = [
  { title: "Faith with room for questions", text: "Devotions, Bible-based learning and honest conversations that connect faith to everyday life." },
  { title: "Confidence through doing", text: "Life skills, teamwork, problem-solving, outdoor activities and creative expression." },
  { title: "Belonging that lasts", text: "Encouraging mentors and positive relationships help young people feel seen, valued and supported." },
];

export default async function CampsPage() {
  const now = Date.now();
  const [events, { contact }] = await Promise.all([getEvents(), getSettings()]);
  const camps = events.filter((e) => e.category === "camp" && new Date(e.end ?? e.start).getTime() >= now);
  const call = `0${site.whatsapp.camps.replace(/^254/, "")}`;
  const link = "inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline decoration-purple/40 underline-offset-[6px] hover:decoration-purple";

  return (
    <>
      <PageHero
        slot="camps.hero"
        image="jewels-camp-memory"
        focus="50% 35%"
        title="A place to belong, grow and become"
        tagline="Faith-centred holiday camps and mentorship for children and teenagers: rooted in Scripture, shaped by caring relationships, and full of room to discover what is possible."
        crumbs={[{ label: "Camps" }]}
        actions={[{ label: "Apply for your child", href: "/events/apply" }]}
      />

      <Section>
        <h2 className="t-h2">Camps coming up</h2>
        {camps.length > 0 ? (
          <div className="mt-10 border-t border-rule">
            {camps.map((c) => {
              const about = aboutLink(c.id);
              return (
                <article key={c.id} className="grid gap-x-10 gap-y-5 border-b border-rule py-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div>
                    <h3 className="text-[1.7rem] leading-tight">{c.title}</h3>
                    {c.subtitle && <p className="mt-1 text-lg text-muted">{c.subtitle}</p>}
                    <dl className="mt-4 grid gap-x-8 gap-y-1 text-[0.98rem] sm:grid-cols-[auto_1fr]">
                      <dt className="font-semibold">When</dt><dd className="text-muted">{formatEventDates(c.start, c.end)}</dd>
                      {c.location && <><dt className="font-semibold">Where</dt><dd className="text-muted">{c.location}</dd></>}
                      {typeof c.fee === "number" && c.fee > 0 && <><dt className="font-semibold">Cost</dt><dd className="text-muted">{formatMoney(c.fee)} per child</dd></>}
                    </dl>
                    {c.details && <p className="reading mt-3 text-muted">{c.details}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:flex-col md:items-end">
                    {c.registrationOpen ? <Button href={`/events/apply?camp=${encodeURIComponent(c.id)}`}>Apply for your child</Button> : <p className="font-semibold text-muted">Applications closed</p>}
                    {about && <Link href={about.href} className={link}>{about.label}<ArrowRight className="size-4" aria-hidden /></Link>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 border-t border-rule py-10">
            <p className="t-lead max-w-xl text-muted">No camp dates are open right now. New camps are announced here and on the <Link href="/events" className="font-semibold text-purple underline underline-offset-4">events page</Link>.</p>
          </div>
        )}
      </Section>

      <Section tone="alt">
        <h2 className="t-h2">Two programmes, one caring community</h2>
        <p className="t-lead mt-4 max-w-2xl text-muted">Each programme meets young people where they are, and helps them take their next step with faith and confidence.</p>
        <div className="mt-12 grid gap-x-16 gap-y-16 lg:grid-cols-2">
          {programmes.map((p) => (
            <article key={p.key}>
              <div className="relative aspect-[3/2] overflow-hidden bg-paper"><Img src={p.photo} alt={p.alt} cover sizes="(min-width: 1024px) 40vw, 100vw" /></div>
              <p className="mt-6 font-semibold text-purple">{p.who}</p>
              <h3 className="mt-1 text-[1.9rem] leading-tight">{p.title}</h3>
              <p className="reading mt-3 text-muted">{p.text}</p>
              <ul className="mt-4 grid gap-1.5 border-t border-rule pt-4">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="mt-5 flex flex-wrap gap-x-8 gap-y-1">
                <Link href={p.href} className={link}>About the programme<ArrowRight className="size-4" aria-hidden /></Link>
                <a href={p.instagram.href} target="_blank" rel="noopener noreferrer" className={link}>{p.instagram.label}</a>
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="t-h2">More than a holiday</h2>
        <p className="t-lead mt-4 max-w-2xl text-muted">Faith, practical learning and real connection, so every young person can flourish in their own way.</p>
        <ol className="mt-10 grid border-t border-rule md:grid-cols-3">
          {beyond.map((b, i) => (
            <li key={b.title} className="border-b border-rule py-8 md:border-b-0 md:pr-10 md:[&:not(:first-child)]:pl-10 md:[&:not(:last-child)]:border-r">
              <p aria-hidden className="text-[2.6rem] font-extrabold leading-none text-purple [font-variation-settings:'wdth'_86]">{`0${i + 1}`}</p>
              <h3 className="mt-3 text-2xl">{b.title}</h3>
              <p className="reading mt-2 text-muted">{b.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="alt">
        <h2 className="t-h2">Other ways to take part</h2>
        <ul className="mt-10 grid gap-x-16 gap-y-10 border-t border-rule pt-10 md:grid-cols-2">
          <li>
            <HeartHandshake className="size-6 text-purple" aria-hidden />
            <h3 className="mt-3 text-2xl">Serve as a facilitator</h3>
            <p className="reading mt-2 text-muted">Camps run on volunteers: matrons, teachers, games, devotions, nurses, counsellors, media and more.</p>
            <p className="mt-4"><Link href="/events/register" className={link}>Offer to serve<ArrowRight className="size-4" aria-hidden /></Link></p>
          </li>
          <li>
            <HandHeart className="size-6 text-purple" aria-hidden />
            <h3 className="mt-3 text-2xl">Sponsor a camper</h3>
            <p className="reading mt-2 text-muted">Help a child who could not otherwise come to camp.</p>
            <p className="mt-4"><Link href="/events/register" className={link}>Sponsor a child<ArrowRight className="size-4" aria-hidden /></Link></p>
          </li>
        </ul>
        <div className="mt-12 flex max-w-3xl items-start gap-3 border-t border-rule pt-6 text-muted">
          <LifeBuoy className="mt-1 size-5 shrink-0 text-purple" aria-hidden />
          <div>
            <p><strong className="text-ink">Questions about camp?</strong> Call or WhatsApp the camp office on <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>.</p>
            <p className="mt-2">You can also call {contact.phones.map((p, i) => <span key={p.tel}>{i > 0 && " or "}<a className="font-semibold text-purple underline underline-offset-4" href={`tel:${p.tel}`}>{p.display}</a></span>)}, or write to <a className="font-semibold text-purple underline underline-offset-4 [overflow-wrap:anywhere]" href={`mailto:${contact.email}`}>{contact.email}</a>.</p>
            <p className="mt-2">Already applied, or came before? <Link href="/family" className="font-semibold text-purple underline underline-offset-4">Open your family page</Link>.</p>
          </div>
        </div>
      </Section>
    </>
  );
}
