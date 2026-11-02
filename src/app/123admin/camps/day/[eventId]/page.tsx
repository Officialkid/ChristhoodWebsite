import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download, Phone } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { approvedFor, campAssignments, campAttendance, campDays, campSessions, dayLabel, dayShort, mayMarkFor, mayOpenCare, photoRule, pickDay, todayInNairobi } from "@/lib/camp-day";
import { getEvents } from "@/lib/content";
import { mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { formatEventDates } from "@/lib/time";
import { AttendanceToggle } from "@/components/admin/CampDay";
import { btnClass, Chip, Empty, LinkButton, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Camp day" };

const views = [
  ["all", "Everyone"],
  ["unmarked", "Not marked yet"],
  ["unassigned", "Nobody looks after them"],
] as const;
const camp = (c: string) => (c === "jewels" ? "Jewels" : c === "teen-life" ? "Teen Life" : "Camp");

export default async function CampDayPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ date?: string; show?: string }> }) {
  const { eventId } = await params;
  const { date: wanted, show } = await searchParams;
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayRunCampDay(user)) redirect(`${ADMIN_PATH}/no-access`);

  const [events, approved, assignments, sessions, marks] = await Promise.all([getEvents(), approvedFor(eventId), campAssignments.list(), campSessions.list(), campAttendance.list()]);
  const event = events.find((e) => e.id === eventId);
  if (!event && approved.length === 0) notFound();
  const title = event?.title ?? approved[0].eventTitle;
  const days = event ? campDays(event) : [todayInNairobi()];
  const date = pickDay(days, wanted);

  const keeper = mayKeepRoster(user);
  const given = new Map(assignments.filter((a) => a.eventId === eventId).map((a) => [a.id, a]));
  const marked = new Map(marks.filter((m) => m.eventId === eventId && m.date === date).map((m) => [m.applicationId, m.status]));
  const mine = approved.filter((a) => given.get(a.id)?.userId === user.id);
  const base = keeper ? approved : mine;
  const view = keeper ? (views.find(([v]) => v === show)?.[0] ?? "all") : "all";
  const list = base.filter((a) => (view === "unmarked" ? !marked.has(a.id) : view === "unassigned" ? !given.has(a.id) : true));
  const here = base.filter((a) => marked.get(a.id) === "present").length;
  const away = base.filter((a) => marked.get(a.id) === "absent").length;

  const photos = new Map(await Promise.all(list.map(async (a) => [a.id, await photoRule(a)] as const)));
  const today = sessions.filter((s) => s.eventId === eventId && s.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const root = `${ADMIN_PATH}/camps/day/${eventId}`;
  const link = (d: string, v: string = view) => `${root}?date=${d}${v !== "all" ? `&show=${v}` : ""}`;

  return (
    <>
      <PageTitle
        title={title}
        icon="clipboard"
        lead={`${event ? `${formatEventDates(event.start, event.end)} · ` : ""}${keeper ? `${approved.length} expected` : `${mine.length} ${mine.length === 1 ? "camper" : "campers"} with you`}`}
        crumbs={[{ label: "Camp days", href: `${ADMIN_PATH}/camps/day` }, { label: title }]}
        actions={
          keeper ? (
            <>
              <LinkButton href={`${root}/timetable`} icon="calendar">Timetable</LinkButton>
              <LinkButton href={`${root}/assign`} icon="users">Who looks after whom</LinkButton>
              <a href={`/api/admin/export?kind=register&event=${encodeURIComponent(eventId)}&date=${date}`} className={btnClass.secondary}><Download className="size-4" aria-hidden /> Register for {dayShort(date)}</a>
            </>
          ) : undefined
        }
      />

      <div className="mt-8 grid gap-12">
        {days.length > 1 && (
          <nav aria-label="Choose the day" className="flex flex-wrap gap-1">
            {days.map((d) => <Link key={d} href={link(d)} aria-current={d === date ? "page" : undefined} className={`inline-flex min-h-11 items-center px-4 text-[0.95rem] font-semibold ${d === date ? "bg-purple text-on-purple" : "border border-rule hover:border-ink"}`}>{dayShort(d)}{d === todayInNairobi() && <span className="ml-2 opacity-75">today</span>}</Link>)}
          </nav>
        )}

        <section aria-labelledby="tt">
          <h2 id="tt" className="text-xl">{dayLabel(date)}</h2>
          {today.length === 0 ? (
            <p className="mt-3 max-w-xl text-muted">No timetable has been added for this day.{keeper && <> <Link href={`${root}/timetable`} className="font-semibold text-purple underline underline-offset-4">Add it</Link>.</>}</p>
          ) : (
            <ol className="mt-3 border-t border-rule">
              {today.map((s) => (
                <li key={s.id} className="grid gap-x-6 gap-y-1 border-b border-rule py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <p className="font-semibold tabular-nums">{s.start}{s.end ? `–${s.end}` : ""}</p>
                  <div>
                    <p className="font-bold">{s.title}</p>
                    {(s.place || s.lead) && <p className="text-[0.95rem] text-muted">{[s.place, s.lead && `led by ${s.lead}`].filter(Boolean).join(" · ")}</p>}
                    {s.note && <p className="mt-1 text-[0.95rem] text-muted">{s.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="reg">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h2 id="reg" className="text-xl">{keeper ? "Who is here" : "Your campers"}</h2>
              <p className="mt-1 text-muted" aria-live="polite">{here} here · {away} away · {base.length - here - away} not marked yet</p>
            </div>
            {keeper && (
              <nav aria-label="Filter the list" className="flex flex-wrap gap-1">
                {views.map(([v, l]) => <Link key={v} href={link(date, v)} aria-current={view === v ? "page" : undefined} className={`inline-flex min-h-11 items-center px-4 text-[0.95rem] font-semibold ${view === v ? "bg-purple text-on-purple" : "border border-rule hover:border-ink"}`}>{l}</Link>)}
              </nav>
            )}
          </div>

          {list.length === 0 ? (
            <div className="mt-5">
              <Empty icon="users" title={base.length ? "Nobody matches" : keeper ? "Nobody is approved for this camp yet" : "No campers have been given to you yet"}>
                {base.length ? "Try a different filter." : keeper ? "Approve applications and they appear here." : "The head facilitators will give you the children you look after."}
              </Empty>
            </div>
          ) : (
            <ul className="mt-5 border-t border-rule">
              {list.map((a) => {
                const owner = given.get(a.id);
                const care = mayOpenCare(user, a, owner);
                const mark = marked.get(a.id);
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-4">
                    <div className="min-w-0 flex-1 basis-64">
                      <p className="font-bold leading-snug">{a.childName} <span className="font-normal text-muted">· age {a.ageAtCamp}</span> <Chip>{camp(a.camp)}</Chip>{photos.get(a.id) === "No" && <> <Chip tone="warn">No photos</Chip></>}</p>
                      <p className="mt-0.5 text-[0.92rem] text-muted">{keeper ? (owner ? `With ${owner.userName}` : "Nobody looks after them yet") : `Guardian: ${a.guardian}`}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-5">
                        <a href={`tel:${a.phone}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline underline-offset-4"><Phone className="size-4" aria-hidden /> {a.guardian}<span className="sr-only">, call</span></a>
                        {care && <Link href={`${root}/camper/${a.id}`} className="inline-flex min-h-11 items-center font-semibold text-purple underline underline-offset-4">Care details and notes</Link>}
                      </p>
                    </div>
                    {mayMarkFor(user, owner) ? <AttendanceToggle key={`${a.id}${date}${mark}`} id={a.id} date={date} name={a.childName} status={mark} /> : <span className="text-muted">{mark === "present" ? "Here" : mark === "absent" ? "Away" : "Not marked"}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
