import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campDays, dayLabel, dayShort, pickDay, todayInNairobi } from "@/lib/camp-day";
import { campArrivals, gateRoster } from "@/lib/camp-gate";
import { getEvents } from "@/lib/content";
import { mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { fmt } from "@/lib/time";
import { GateDesk, type GateRow } from "@/components/admin/GateDesk";
import { btnClass, LinkButton, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Gate desk" };

const clock = (iso?: string) => (iso ? fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)) : "");

export default async function GatePage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ date?: string }> }) {
  const { eventId } = await params;
  const { date: wanted } = await searchParams;
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayRunCampDay(user)) redirect(`${ADMIN_PATH}/no-access`);

  const event = (await getEvents()).find((e) => e.id === eventId);
  if (!event) notFound();
  const days = campDays(event);
  const date = pickDay(days, wanted);
  const keeper = mayKeepRoster(user);

  const [people, arrivals] = await Promise.all([gateRoster(event), campArrivals.list()]);
  const here = new Map(arrivals.filter((a) => a.eventId === eventId && a.date === date).map((a) => [a.key, a]));
  const rows: GateRow[] = people.map((p) => {
    const a = here.get(p.key);
    return {
      key: p.key,
      name: p.name,
      age: p.age,
      guardian: p.guardian,
      // Parents' phone numbers go only to head facilitators and the camp office, as everywhere else on camp days.
      phone: keeper ? p.phone : undefined,
      source: p.source,
      photos: p.photos,
      state: a ? { status: a.status, droppedBy: a.droppedBy, mayCollect: a.mayCollect, medication: a.medication, arrived: clock(a.arrivedAt), collectedBy: a.collectedBy, left: clock(a.leftAt) } : undefined,
    };
  });

  const root = `${ADMIN_PATH}/camps/day/${eventId}`;
  return (
    <>
      <PageTitle
        title="Gate desk"
        lead={`${event.title}. Find the child, check them in, and sign them out when someone collects them.`}
        crumbs={[{ label: "Camp days", href: `${ADMIN_PATH}/camps/day` }, { label: event.title, href: root }, { label: "Gate desk" }]}
        actions={
          <>
            <LinkButton href={root} icon="clipboard">Camp day</LinkButton>
            {keeper && <a href={`/api/admin/export?kind=register&event=${encodeURIComponent(eventId)}&date=${date}`} className={btnClass.secondary}><Download className="size-4" aria-hidden /> Paper list for {dayShort(date)}</a>}
          </>
        }
      />
      <div className="mt-8 grid gap-8">
        {days.length > 1 && (
          <nav aria-label="Choose the day" className="a-tabs">
            {days.map((d) => <Link key={d} href={`${root}/gate?date=${d}`} aria-current={d === date ? "page" : undefined} className="a-tab">{dayShort(d)}{d === todayInNairobi() && <span className="n">today</span>}</Link>)}
          </nav>
        )}
        <h2 className="text-xl">{dayLabel(date)}</h2>
        <GateDesk key={date} eventId={eventId} date={date} rows={rows} showPhones={keeper} />
      </div>
    </>
  );
}
