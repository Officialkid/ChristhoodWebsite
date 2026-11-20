import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campApplications, campAssignments, campSessions, campDays, dayShort, todayInNairobi } from "@/lib/camp-day";
import { gateCount } from "@/lib/camp-gate";
import { getEvents } from "@/lib/content";
import { mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { formatEventDates } from "@/lib/time";
import { Chip, Empty, LinkButton, Notice, PageTitle, Row } from "@/components/admin/ui";

export const metadata = { title: "Camp days" };

export default async function CampDaysPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayRunCampDay(user)) redirect(`${ADMIN_PATH}/no-access`);

  const [events, apps, mine, sessions] = await Promise.all([getEvents(), campApplications.list().catch(() => []), campAssignments.list().catch(() => []), campSessions.list().catch(() => [])]);
  const approved = apps.filter((a) => a.status === "Approved");
  const keeper = mayKeepRoster(user);
  const today = todayInNairobi();
  // Every camp on the events list, and any camp with approved campers. Soonest first; a camp already in the past sits at the bottom.
  const camps = (
    await Promise.all(
      [...new Set([...events.filter((e) => e.category === "camp").map((e) => e.id), ...approved.map((a) => a.eventId)])].map(async (id) => {
        const event = events.find((e) => e.id === id);
        const first = approved.find((a) => a.eventId === id);
        const days = event ? campDays(event) : [];
        const expected = event ? await gateCount(event).catch(() => approved.filter((a) => a.eventId === id).length) : approved.filter((a) => a.eventId === id).length;
        return { id, title: event?.title ?? first?.eventTitle ?? id, event, days, expected, over: days.length > 0 && days[days.length - 1] < today, on: days.includes(today) };
      }),
    )
  )
    .sort((a, b) => Number(a.over) - Number(b.over) || (a.event?.start ?? "").localeCompare(b.event?.start ?? ""));

  return (
    <>
      <PageTitle
        title="Camp days"
        icon="clipboard"
        actions={<LinkButton href={`${ADMIN_PATH}/camps/guide`} icon="book">Facilitator guide</LinkButton>}
        lead={keeper ? "The expected list, the timetable and who looks after whom. Open a camp to mark who has arrived." : "The timetable, and the campers you look after. Open a camp to mark who is here and to write notes."}
      />
      <div className="mt-8 grid gap-6">
        {!keeper && !mine.some((m) => m.userId === user.id) && camps.length > 0 && (
          <Notice title="You have no campers yet">The head facilitators will give you the children you look after. You can still read the timetable.</Notice>
        )}
        {camps.length === 0 ? (
          <Empty icon="tent" title="No camp is on the events list yet">When a camp is added to the events, its expected list and gate desk appear here.</Empty>
        ) : (
          <div className="border-t border-rule">
            {camps.map((c) => {
              const mineHere = mine.filter((m) => m.eventId === c.id && m.userId === user.id).length;
              const count = c.expected;
              const lines = sessions.filter((s) => s.eventId === c.id).length;
              return (
                <Row
                  key={c.id}
                  href={`${ADMIN_PATH}/camps/day/${c.id}`}
                  icon="tent"
                  title={c.title}
                  meta={[c.event ? formatEventDates(c.event.start, c.event.end) : null, `${count} expected`, keeper ? `${lines} timetable ${lines === 1 ? "line" : "lines"}` : `${mineHere} with you`, c.days.length > 1 ? `${dayShort(c.days[0])} to ${dayShort(c.days[c.days.length - 1])}` : null].filter(Boolean).join(" · ")}
                  aside={<span className="flex items-center gap-3">{c.on ? <Chip tone="new">On now</Chip> : c.over ? <Chip>Finished</Chip> : null}<ArrowRight className="size-4" aria-hidden /></span>}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
