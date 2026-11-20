import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { ADMIN_PATH, log, requireUser } from "@/lib/auth";
import { campAssignments, campDays, dayLabel, dayShort, pickDay, todayInNairobi } from "@/lib/camp-day";
import { campArrivals, campWalkIns, gateRoster, isCampEvent } from "@/lib/camp-gate";
import { unseal } from "@/lib/crypto";
import { getEvents } from "@/lib/content";
import { mayCareForCampers, mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { store } from "@/lib/store";
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
  if (!event || !isCampEvent(event)) notFound();
  const days = campDays(event);
  const date = pickDay(days, wanted);
  const keeper = mayKeepRoster(user);

  const [people, arrivals, given, walkins] = await Promise.all([gateRoster(event), campArrivals.list(), campAssignments.list(), campWalkIns.list().catch(() => [])]);
  const walkSealed = new Map(walkins.map((w) => [w.id, w.sealed]));
  // Health notes taken at the gate for children with no application: facilitators read them, everyone else only sees that one exists.
  const carer = mayCareForCampers(user);
  let opened = false;
  const here = new Map(arrivals.filter((a) => a.eventId === eventId && a.date === date).map((a) => [a.key, a]));
  const rows: GateRow[] = await Promise.all(people.map(async (p) => {
    const a = here.get(p.key);
    const sealed = p.key.startsWith("walkin:") ? walkSealed.get(p.key.slice(7)) : (arrivals.find((x) => x.key === p.key && x.eventId === eventId && x.sealed)?.sealed);
    let care: GateRow["care"];
    if (sealed && carer && a?.status !== "out") {
      try {
        const d = await unseal<{ emergency: { name: string; phone: string }; health: string }>(sealed);
        care = { emergency: `${d.emergency.name}, ${d.emergency.phone}`, health: d.health };
        opened = true;
      } catch {
        care = undefined;
      }
    }
    return {
      key: p.key,
      name: p.name,
      age: p.age,
      guardian: p.guardian,
      source: p.source,
      expected: p.expected,
      year: p.year,
      photos: p.photos,
      lookedAfter: given.find((g) => g.eventId === eventId && g.id === p.key)?.userName,
      // The number never reaches the page. Head facilitators and the camp office see the last digits and ask for the rest, which is logged.
      phoneEnd: keeper && p.phone ? p.phone.replace(/\D/g, "").slice(-3) : undefined,
      removed: p.removed,
      unpaid: keeper ? p.unpaid : undefined,
      noApplication: p.source !== "application",
      hasCare: Boolean(sealed),
      care,
      state: a ? { status: a.status, droppedBy: a.droppedBy, authorized: a.authorized ?? [], medication: a.medication, arrived: clock(a.arrivedAt), arrivedBy: a.arrivedBy, collectedBy: a.collectedBy, left: clock(a.leftAt), leftBy: a.leftBy, via: a.collectedVia, exception: a.exception?.reason, backfilled: a.backfilled } : undefined,
    };
  }));
  if (opened && (await store.hit(`gatecare:${user.id}:${eventId}`, 600).catch(() => 2)) === 1) await log(user, "Opened health notes taken at the gate", eventId);

  const root = `${ADMIN_PATH}/camps/day/${eventId}`;
  return (
    <>
      <PageTitle
        title="Gate desk"
        lead={`${event.title}. ${dayLabel(date)}.`}
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
        <GateDesk key={date} eventId={eventId} date={date} rows={rows} canSeePhones={keeper} keeper={keeper} />
      </div>
    </>
  );
}
