import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EventFilter from "@/components/EventFilter";
import { EventRow } from "@/components/Cards";
import { Button, Section } from "@/components/ui";
import { categoryLabel } from "@/content/events";
import { getEvents, getSettings } from "@/lib/content";
import { formatEventDates } from "@/lib/time";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Events & camps",
  description: "Transformative mentorship experiences, missions, camps and worship gatherings. See what is coming up at Christhood and register online.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const [all, { fellowship: f }] = await Promise.all([getEvents(), getSettings()]);
  const now = Date.now();
  const upcoming = all.filter((e) => new Date(e.end ?? e.start).getTime() >= now);
  const past = all.filter((e) => new Date(e.end ?? e.start).getTime() < now).reverse();
  const cats = [...new Set(upcoming.map((e) => e.category))].map((c) => ({ value: c, label: categoryLabel[c], count: upcoming.filter((e) => e.category === c).length }));

  return (
    <>
      <PageHero slot="events.hero" title="Upcoming events" tagline="Mentorship, missions, camps and worship gatherings. Register online, or add the date to your calendar." crumbs={[{ label: "Events" }]} actions={[{ label: "Camps and applications", href: "/camps" }]} />
      <Section tone="alt">
        {upcoming.length > 0 ? (
          <>
            {cats.length > 1 && <EventFilter options={cats} targetId="event-list" />}
            <div id="event-list" className={cats.length > 1 ? "" : "border-t border-rule"}>
              {upcoming.map((e, i) => <div key={e.id} data-cat={e.category} className="[&[hidden]]:hidden"><EventRow event={e} showCountdown={i === 0} level={2} /></div>)}
            </div>
          </>
        ) : (
          <div className="border-t border-rule py-10"><h2 className="t-h2">New dates are on the way</h2><p className="t-lead mt-3 max-w-xl text-muted">We announce events here as soon as they are set. Until then, join us every {f.day}, {f.display}.</p></div>
        )}
        {past.length > 0 && (
          <details className="mt-10">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-semibold text-purple underline decoration-purple/40 underline-offset-[6px] [&::-webkit-details-marker]:hidden">Past events ({past.length})</summary>
            <ul className="mt-4 border-t border-rule">{past.map((e) => <li key={e.id} className="flex flex-wrap justify-between gap-2 border-b border-rule py-4 text-muted"><span className="font-semibold text-ink">{e.title}</span><span>{formatEventDates(e.start, e.end)}</span></li>)}</ul>
          </details>
        )}
      </Section>
      <Section tone="purple" tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div><h2 className="text-3xl">Every {f.day}, {f.display}</h2><p className="mt-2 text-on-purple-muted">Saturday fellowship at {f.venue}, {f.area}.</p></div>
          <Button href="/#visit">Plan your visit</Button>
        </div>
      </Section>
    </>
  );
}
