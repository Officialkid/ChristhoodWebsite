import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { approvedFor, campDays, campSessions, dayLabel, dayShort, pickDay } from "@/lib/camp-day";
import { getEvents } from "@/lib/content";
import { mayKeepRoster } from "@/lib/rbac";
import { RemoveSession, SessionForm } from "@/components/admin/CampDay";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Camp timetable" };

export default async function TimetablePage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ edit?: string; date?: string }> }) {
  const { eventId } = await params;
  const { edit, date: wanted } = await searchParams;
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayKeepRoster(user)) redirect(`${ADMIN_PATH}/no-access`);

  const [events, approved, sessions] = await Promise.all([getEvents(), approvedFor(eventId), campSessions.list()]);
  const event = events.find((e) => e.id === eventId);
  if (!event && approved.length === 0) notFound();
  const title = event?.title ?? approved[0].eventTitle;
  const days = event ? campDays(event) : [];
  if (days.length === 0) return <PageTitle title="Camp timetable" lead="This camp has no dates on the events list, so a timetable cannot be made yet. Add the dates to the event first." />;

  const mine = sessions.filter((s) => s.eventId === eventId).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const editing = edit ? mine.find((s) => s.id === edit) : undefined;
  const back = `${ADMIN_PATH}/camps/day/${eventId}/timetable`;
  const options = days.map((d) => ({ value: d, label: dayLabel(d) }));
  const first = editing?.date ?? pickDay(days, wanted);
  const ordered = [first, ...options.map((o) => o.value).filter((d) => d !== first)].map((d) => options.find((o) => o.value === d)!);

  return (
    <>
      <PageTitle
        title="Camp timetable"
        icon="calendar"
        lead={`${title}. Families whose child has a place can read this on their family page.`}
        crumbs={[{ label: "Camp days", href: `${ADMIN_PATH}/camps/day` }, { label: title, href: `${ADMIN_PATH}/camps/day/${eventId}` }, { label: "Timetable" }]}
      />
      <div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <section aria-labelledby="form">
          <h2 id="form" className="text-xl">{editing ? "Change this session" : "Add a session"}</h2>
          <div className="mt-5"><SessionForm key={editing?.id ?? first} eventId={eventId} days={ordered} session={editing} back={back} /></div>
        </section>

        <section aria-labelledby="list">
          <h2 id="list" className="text-xl">The timetable so far</h2>
          {mine.length === 0 ? (
            <div className="mt-5"><Empty icon="calendar" title="Nothing yet">Add the first session of the first day.</Empty></div>
          ) : (
            <div className="mt-3 grid gap-8">
              {days.filter((d) => mine.some((s) => s.date === d)).map((d) => (
                <div key={d}>
                  <h3 className="text-[1.05rem] font-bold">{dayShort(d)}</h3>
                  <ol className="mt-2 border-t border-rule">
                    {mine.filter((s) => s.date === d).map((s) => (
                      <li key={s.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-rule py-3">
                        <div className="min-w-0 flex-1 basis-48">
                          <p><span className="font-semibold tabular-nums">{s.start}{s.end ? `–${s.end}` : ""}</span> <span className="font-bold">{s.title}</span></p>
                          {(s.place || s.lead) && <p className="text-[0.92rem] text-muted">{[s.place, s.lead && `led by ${s.lead}`].filter(Boolean).join(" · ")}</p>}
                        </div>
                        <span className="flex flex-wrap items-center gap-2">
                          <Link href={`${back}?edit=${s.id}`} className="inline-flex min-h-11 items-center px-3 font-semibold text-purple underline underline-offset-4">Change<span className="sr-only"> {s.title}</span></Link>
                          <RemoveSession id={s.id} />
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              {mine.some((s) => !days.includes(s.date)) && <p className="text-muted">Some sessions are on days outside the camp dates and are hidden here.</p>}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
