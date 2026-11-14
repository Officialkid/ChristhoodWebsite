import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EventFilter from "@/components/EventFilter";
import { EventRow } from "@/components/Cards";
import { Button, Section } from "@/components/ui";
import { categoryLabel } from "@/content/events";
import { getEvents, getSettings } from "@/lib/content";
import { formatEventDates } from "@/lib/time";
import { finalGatheringIsUpcoming } from "@/lib/gathering-schedule";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Events & camps",
  description: "See upcoming mentorship experiences, missions, camps and worship gatherings at Christhood, with dates and details for each event.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const [all, { fellowship: f }] = await Promise.all([getEvents(), getSettings()]);
  const now = Date.now();
  const finalGatheringUpcoming = finalGatheringIsUpcoming(f, now);
  const upcoming = all.filter((e) => new Date(e.end ?? e.start).getTime() >= now);
  const past = all.filter((e) => new Date(e.end ?? e.start).getTime() < now).reverse();
  const cats = [...new Set(upcoming.map((e) => e.category))].map((c) => ({ value: c, label: categoryLabel[c], count: upcoming.filter((e) => e.category === c).length }));

  return (
    <>
      <PageHero slot="events.hero" title="Upcoming events" tagline="Mentorship, missions, camps and worship gatherings. See the details and save each date to your calendar." crumbs={[{ label: "Events" }]} actions={[{ label: "Camps and applications", href: "/camps" }]} />
      <Section tone="alt">
        {upcoming.length > 0 ? (
          <>
            {cats.length > 1 && <EventFilter options={cats} targetId="event-list" />}
            <div id="event-list" className={cats.length > 1 ? "" : "border-t border-rule"}>
              {upcoming.map((e, i) => <div key={e.id} data-cat={e.category} className="[&[hidden]]:hidden"><EventRow event={e} showCountdown={i === 0} level={2} /></div>)}
            </div>
          </>
        ) : (
          <div className="border-t border-rule py-10"><h2 className="t-h2">New dates are on the way</h2><p className="t-lead mt-3 max-w-xl text-muted">{finalGatheringUpcoming ? `Our final gathering of 2026 is Saturday, 14 November, ${f.display}. We plan to meet again in January as we prepare for camps.` : "We are pausing regular gatherings as we prepare for camps. We plan to meet again in January; the exact date will be shared when confirmed."}</p></div>
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
          <div><h2 className="text-3xl">{finalGatheringUpcoming ? `Final 2026 gathering · 14 November` : "Gatherings resume in January"}</h2><p className="mt-2 text-on-purple-muted">{finalGatheringUpcoming ? `${f.display} at ${f.venue}, ${f.area}. Further information about January will be shared when available.` : "We are pausing regular gatherings as we prepare for camps. The exact January date will be shared when confirmed."}</p></div>
          <Button href="/#visit">Plan your visit</Button>
        </div>
      </Section>
    </>
  );
}
