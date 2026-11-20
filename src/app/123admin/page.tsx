import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ADMIN_PATH, getUser, needsSetup, recentActivity, systemStatus } from "@/lib/auth";
import { pendingRequestCount } from "@/lib/access";
import { ago, daysBetween } from "@/lib/ago";
import { campAssignments, campAttendance, campDays, campSessions, todayInNairobi } from "@/lib/camp-day";
import { getEvents } from "@/lib/content";
import { store } from "@/lib/store";
import { collection } from "@/lib/store";
import { campScope, can, canReadPrayer, mayKeepRoster, mayOpenCamp, mayRunCampDay, permsOf } from "@/lib/rbac";
import { fmt, formatEventDates } from "@/lib/time";
import { FirstSetup, SignIn } from "@/components/admin/LoginForm";
import { Notice, Section, Status } from "@/components/admin/ui";
import { Band, CampPanel, ComingUp, QuickActions, Timeline, WaitingList, type CampSummary, type Metric, type QuickAction, type Upcoming, type Waiting } from "@/components/admin/overview/parts";
import { Reveal } from "@/components/admin/overview/Reveal";
import type { CampApplication, EventDoc, Prayer, StoredUser, Visitor } from "@/lib/types";

export default async function AdminHome() {
  const user = await getUser();
  if (!user) return <LoginScreen />;
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  return <Overview user={user} />;
}

async function LoginScreen() {
  const [setup, status] = await Promise.all([needsSetup().catch(() => false), systemStatus()]);
  const canCreate = setup && store.writable && status.signIn;
  return (
    <main className="min-h-svh bg-paper text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3" aria-label="Christhood Ministries home">
            <Image src="/logo-96.png" alt="" width={44} height={44} className="size-11 rounded-full" priority />
            <span>
              <span className="block text-[1.1rem] font-extrabold leading-tight [font-variation-settings:'wdth'_86]">Christhood</span>
              <span className="block text-[0.8rem] font-semibold leading-tight text-purple">Ministries</span>
            </span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-purple underline-offset-4 hover:underline">
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to website</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100svh-4.25rem)] max-w-[84rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section aria-labelledby="team-area-title" className="flex flex-col justify-center border-b border-rule px-5 py-9 sm:px-10 sm:py-12 lg:border-b-0 lg:border-r lg:px-16">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-sm font-semibold text-purple"><span className="h-px w-8 bg-purple" aria-hidden />For the Christhood team</p>
            <h1 id="team-area-title" className="mt-5 max-w-[11ch] text-5xl sm:text-6xl">Team area</h1>
            <p className="mt-5 max-w-[38ch] font-serif text-[1.08rem] leading-[1.7] text-muted">Update the website, welcome new guests and stand with people in prayer.</p>
          </div>
          <div className="mt-8 max-w-md border-t border-rule pt-5 sm:mt-12 sm:pt-6">
            <blockquote className="max-w-[40ch] font-serif text-base leading-relaxed text-muted">“Whatever you do, work at it with all your heart, as working for the Lord.”</blockquote>
            <p className="mt-2 text-sm font-semibold">Colossians 3:23</p>
          </div>
        </section>

        <section aria-labelledby="sign-in-title" className="flex items-center px-5 py-9 sm:px-10 sm:py-12 lg:px-16">
          <div className="mx-auto w-full max-w-[26rem]">
            <p className="text-sm font-semibold text-purple">Team sign-in</p>
            <h2 id="sign-in-title" className="mt-3 text-3xl">{canCreate ? "Set up the first administrator" : "Sign in"}</h2>
            <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-muted">
              {canCreate
                ? "This person can add everyone else and give each department head their own access."
                : process.env.GOOGLE_CLIENT_ID
                  ? "Use your Google account to sign in. New team members can request access for an administrator to review."
                  : "Use the email and password your administrator gave you."}
            </p>
            <div className="mt-8 grid gap-6">
              {!status.signIn && <Notice tone="warn" title="Sign-in is temporarily unavailable">Please ask the person who manages the site to help.</Notice>}
              {status.signIn && setup && !store.writable && <Notice tone="warn" title="Setup is not ready yet">The site administrator needs to finish the database setup before the first administrator can be created.</Notice>}
              {canCreate ? <FirstSetup needsKey={Boolean(process.env.VERCEL)} /> : !setup && status.signIn ? <SignIn googleClientId={process.env.GOOGLE_CLIENT_ID} /> : null}
            </div>
            <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-muted">Forgotten your password? Ask your administrator to reset it for you.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

const hours = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date()));
const clock = () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date());
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Where a camp stands: how far off, or how far in. */
function campWhen(event: EventDoc | undefined, today: string) {
  if (!event) return { label: "", tone: "plain" as const, days: [] as string[] };
  const days = campDays(event);
  if (!days.length) return { label: "", tone: "plain" as const, days };
  if (days.includes(today)) return { label: `On now, day ${days.indexOf(today) + 1} of ${days.length}`, tone: "new" as const, days };
  if (today < days[0]) {
    const n = daysBetween(today, days[0]);
    return { label: n === 1 ? "Starts tomorrow" : `Starts in ${n} days`, tone: "plain" as const, days };
  }
  return { label: "Finished", tone: "plain" as const, days };
}

async function Overview({ user }: { user: StoredUser }) {
  const scope = campScope(user);
  const runsCamp = mayRunCampDay(user);
  const seesCamps = scope === "all" || scope.length > 0 || runsCamp;
  const [guests, prayers, camps, status, activity, requests, events, sessions, marks, given] = await Promise.all([
    can(user, "visitors") ? collection<Visitor>("visitors").list().catch(() => []) : [],
    can(user, "prayers") ? collection<Prayer>("prayers").list().catch(() => []) : [],
    seesCamps ? collection<CampApplication>("camp-applications").list().catch(() => []) : [],
    user.role === "admin" ? systemStatus() : null,
    user.role === "admin" ? recentActivity(40) : [],
    user.role === "admin" ? pendingRequestCount() : 0,
    seesCamps || user.role === "admin" || [...permsOf(user)].some((p) => p.startsWith("events:")) ? getEvents().catch(() => []) : [],
    runsCamp ? campSessions.list().catch(() => []) : [],
    runsCamp ? campAttendance.list().catch(() => []) : [],
    runsCamp ? campAssignments.list().catch(() => []) : [],
  ]);

  const today = todayInNairobi();
  const now = Date.now();
  const mine = camps.filter((a) => mayOpenCamp(user, a));
  const reviewer = scope === "all" || scope.length > 0;
  // Signing in is kept in the activity log, but it is noise on the front screen.
  const changes = activity.filter((a) => !/^signed (in|out)/i.test(a.action)).slice(0, 7);
  const newGuests = guests.filter((g) => g.status === "new");
  const lateGuests = newGuests.filter((g) => now - Date.parse(g.createdAt) >= 3 * 864e5).length;
  const newPrayers = prayers.filter((p) => p.status === "new" && canReadPrayer(user, p));
  const callBacks = newPrayers.filter((p) => p.callBack).length;
  const toReview = mine.filter((a) => a.status === "Pending review");
  const ageChecks = toReview.filter((a) => a.ageReview).length;
  const approved = mine.filter((a) => a.status === "Approved");
  const paid = approved.filter((a) => a.paymentVerified).length;
  const unpaid = approved.length - paid;

  const h = hours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const waiting: Waiting[] = [
    requests > 0 && { key: "access", n: requests, href: "/123admin/team/requests", title: requests === 1 ? "person asked for team access" : "people asked for team access", meta: "Approve the ones you know and give them a role." },
    toReview.length > 0 && { key: "camp", n: toReview.length, href: "/123admin/camps?status=Pending%20review", title: toReview.length === 1 ? "camp application to review" : "camp applications to review", meta: ageChecks ? `${plural(ageChecks, "is", "are")} outside the usual age range and ${ageChecks === 1 ? "needs" : "need"} a look.` : "Check the details and the payment, then approve." },
    unpaid > 0 && { key: "unpaid", n: unpaid, href: "/123admin/camps?status=Approved", title: unpaid === 1 ? "approved camper without a payment check" : "approved campers without a payment check", meta: "Open each one and tick the box once the office has seen the money." },
    newGuests.length > 0 && { key: "guests", n: newGuests.length, href: "/123admin/guests", title: newGuests.length === 1 ? "new member to follow up" : "new members to follow up", meta: lateGuests ? `${plural(lateGuests, "has", "have")} waited three days or more. Call or email them.` : "Call or email them this week." },
    newPrayers.length > 0 && { key: "prayers", n: newPrayers.length, href: "/123admin/prayers", title: newPrayers.length === 1 ? "new prayer request" : "new prayer requests", meta: callBacks ? `${plural(callBacks, "asked", "asked")} for a call back. Handled in confidence.` : "Handled in confidence." },
  ].filter(Boolean) as Waiting[];
  const waitingTotal = waiting.reduce((n, w) => n + w.n, 0);

  // Camps: every camp this person can see, with its picture, how far off it is and where its applications stand. Soonest first, finished last.
  const eventIds = new Set<string>([...mine.map((a) => a.eventId), ...events.filter((e) => e.category === "camp" && (scope === "all" || (e.department && (scope as string[]).includes(e.department)))).map((e) => e.id)]);
  const campRows: CampSummary[] = [...eventIds]
    .map((id) => {
      const list = mine.filter((a) => a.eventId === id);
      const event = events.find((e) => e.id === id);
      const when = campWhen(event, today);
      const n = (s: string) => list.filter((a) => a.status === s).length;
      const programme = list[0] && list[0].camp !== "other" ? list[0].camp : event?.department;
      return {
        summary: {
          id, title: event?.title ?? list[0]?.eventTitle ?? "", image: event?.image, dates: event ? formatEventDates(event.start, event.end) : "", when: when.label, live: when.tone === "new",
          total: list.length, approved: n("Approved"), review: n("Pending review"), fix: n("Needs correction"), declined: n("Declined"), paid: list.filter((a) => a.status === "Approved" && a.paymentVerified).length,
          programme, place: event?.location, dayHref: can(user, "camps:day") && event ? `${ADMIN_PATH}/camps/day/${id}` : undefined,
        } satisfies CampSummary,
        start: event?.start ?? "",
        finished: when.label === "Finished",
      };
    })
    .filter((c) => c.summary.title)
    .sort((a, b) => Number(a.finished) - Number(b.finished) || a.start.localeCompare(b.start))
    .map((c) => c.summary)
    .filter((c) => c.when !== "Finished" || c.total > 0)
    .slice(0, 4);
  const nextCamp = campRows.find((c) => c.when && c.when !== "Finished");

  // Camps on today that this person helps run.
  const onToday = runsCamp
    ? [...new Set(camps.filter((a) => a.status === "Approved").map((a) => a.eventId))]
        .map((id) => ({ id, event: events.find((e) => e.id === id) }))
        .filter((c) => c.event && campDays(c.event).includes(today))
    : [];
  const keeper = mayKeepRoster(user);

  // Camp helpers with no applications of their own to review: the camp ahead, how it stands, and what to read before it starts.
  const ahead = runsCamp && !reviewer
    ? [...new Set(camps.filter((a) => a.status === "Approved").map((a) => a.eventId))]
        .map((id) => ({ id, event: events.find((e) => e.id === id), title: events.find((e) => e.id === id)?.title ?? camps.find((a) => a.eventId === id)?.eventTitle ?? "Camp", when: campWhen(events.find((e) => e.id === id), today) }))
        .filter((c) => c.when.label !== "Finished" && !onToday.some((o) => o.id === c.id))
        .sort((a, b) => (a.event?.start ?? "").localeCompare(b.event?.start ?? ""))
    : [];

  // The numbers at the top: only what this person may see, all counted from the saved records.
  const metrics = [
    reviewer && mine.length > 0 && { key: "apps", label: "Camp applications", value: mine.length, note: plural(new Set(mine.map((a) => a.eventId)).size, "camp", "camps"), href: "/123admin/camps" },
    reviewer && mine.length > 0 && { key: "review", label: "Awaiting review", value: toReview.length, note: ageChecks ? plural(ageChecks, "age check", "age checks") : undefined, href: "/123admin/camps?status=Pending%20review" },
    reviewer && approved.length > 0 && { key: "approved", label: "Approved", value: approved.length, note: `${paid} of ${approved.length} paid`, href: "/123admin/camps?status=Approved" },
    can(user, "visitors") && { key: "guests", label: "New members", value: newGuests.length, note: lateGuests ? `${lateGuests} waiting 3+ days` : undefined, href: "/123admin/guests" },
    can(user, "prayers") && { key: "prayers", label: "New prayer requests", value: newPrayers.length, note: callBacks ? `${callBacks} want a call` : undefined, href: "/123admin/prayers" },
    user.role === "admin" && requests > 0 && { key: "access", label: "Access requests", value: requests, href: "/123admin/team/requests" },
  ].filter(Boolean).slice(0, 5) as Metric[];

  const statusLine = (
    <>
      {nextCamp ? <>{nextCamp.title} {nextCamp.when.charAt(0).toLowerCase() + nextCamp.when.slice(1)}. </> : null}
      {waitingTotal > 0 ? <>{plural(waitingTotal, "thing is", "things are")} waiting for you.</> : "Nothing is waiting for you."}
    </>
  );

  const mayEvents = user.role === "admin" || [...permsOf(user)].some((p) => p.startsWith("events:"));
  const actions = [
    reviewer && { href: "/123admin/camps?status=Pending%20review", label: "Review camp applications", icon: "tent", count: toReview.length, primary: toReview.length > 0 },
    reviewer && { href: "/123admin/camps/updates", label: "Post an update to families", icon: "megaphone" },
    can(user, "home") && { href: "/123admin/home", label: "Change the weekly scripture", icon: "book" },
    can(user, "media") && { href: "/123admin/media", label: "Manage photos", icon: "images" },
    mayEvents && { href: "/123admin/events", label: "Manage events", icon: "calendar" },
    can(user, "prayers") && { href: "/123admin/prayers", label: "Prayer requests", icon: "prayer", count: newPrayers.length },
    can(user, "visitors") && { href: "/123admin/guests", label: "New members", icon: "guest", count: newGuests.length },
  ].filter(Boolean).slice(0, 6) as QuickAction[];

  const campIds = new Set(campRows.map((c) => c.id));
  const coming: Upcoming[] = events
    .filter((e) => !campIds.has(e.id) && (e.end ?? e.start).slice(0, 10) >= today)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3)
    .map((e) => ({ id: e.id, title: e.title, dates: formatEventDates(e.start, e.end), place: e.location, href: "/123admin/events" }));

  const mayWait = user.role === "admin" || can(user, "visitors") || can(user, "prayers") || reviewer;
  const date = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const hasSide = actions.length > 0 || coming.length > 0 || changes.length > 0;

  return (
    <div className="grid gap-7">
      {status && (!status.signIn || status.storage === "none") && (
        <Notice tone="warn" title="Finish setting up before the team starts">Saving is not switched on for the live site yet. <Link href="/123admin/status" className="font-semibold underline underline-offset-4">See what is missing</Link>.</Notice>
      )}

      <Reveal><Band date={date} greeting={greeting} name={user.name.split(" ")[0]} status={statusLine} metrics={metrics} /></Reveal>

      <div className={`grid items-start gap-x-10 gap-y-8 ${hasSide ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
        <div className="grid gap-8">
          {onToday.map(({ id, event }) => {
            const approvedHere = camps.filter((a) => a.eventId === id && a.status === "Approved");
            const group = keeper ? approvedHere : approvedHere.filter((a) => given.find((g) => g.id === a.id)?.userId === user.id);
            const todayMarks = marks.filter((m) => m.eventId === id && m.date === today);
            const present = group.filter((a) => todayMarks.some((m) => m.applicationId === a.id && m.status === "present")).length;
            const left = group.filter((a) => !todayMarks.some((m) => m.applicationId === a.id)).length;
            const lines = sessions.filter((s) => s.eventId === id && s.date === today).sort((a, b) => a.start.localeCompare(b.start));
            const t = clock();
            return (
              <Reveal key={id} delay={0.04}>
                <Section id={`today-${id}`} title={`Today at ${event!.title}`} aside={<Link href={`${ADMIN_PATH}/camps/day/${id}`} className="inline-flex min-h-8 items-center gap-1 font-semibold text-purple hover:underline pointer-coarse:min-h-11">Open today&rsquo;s register <ArrowRight className="size-4" aria-hidden /></Link>}>
                  <p className="mt-3 text-[1.02rem]"><strong>{present}</strong> of {group.length} {keeper ? "expected campers are" : group.length === 1 ? "of your campers is" : "of your campers are"} here{left > 0 ? <>, <strong>{left}</strong> not marked yet</> : ". Everyone is marked."}</p>
                  {lines.length > 0 ? (
                    <ol className="mt-2">
                      {lines.map((l) => {
                        const on = l.start <= t && (l.end ?? l.start) > t;
                        const done = (l.end ?? l.start) <= t;
                        return (
                          <li key={l.id} className={`grid grid-cols-[7rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-rule py-2 ${done ? "text-muted" : ""}`}>
                            <span className="whitespace-nowrap font-semibold">{l.start}{l.end ? <span className="font-normal text-muted">–{l.end}</span> : null}</span>
                            <span className={on ? "font-bold" : ""}>{l.title}{l.place ? <span className="font-normal text-muted"> · {l.place}</span> : null}</span>
                            {on ? <Status tone="new">Now</Status> : null}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="mt-2 text-muted">No timetable has been written for today.</p>
                  )}
                </Section>
              </Reveal>
            );
          })}

          {ahead.length > 0 && (
            <Reveal delay={0.04}>
              <Section id="ahead" title={ahead.length === 1 ? "The camp ahead" : "The camps ahead"} aside={<Link href={`${ADMIN_PATH}/camps/guide`} className="inline-flex min-h-8 items-center gap-1 font-semibold text-purple hover:underline pointer-coarse:min-h-11">Read the facilitator guide <ArrowRight className="size-4" aria-hidden /></Link>}>
                <ul>
                  {ahead.map((c) => {
                    const expected = camps.filter((a) => a.eventId === c.id && a.status === "Approved");
                    const withMe = expected.filter((a) => given.find((g) => g.id === a.id)?.userId === user.id).length;
                    const lines = sessions.filter((s) => s.eventId === c.id).length;
                    return (
                      <li key={c.id}>
                        <Link href={`${ADMIN_PATH}/camps/day/${c.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule px-1 py-3.5 transition-colors hover:bg-paper-2">
                          <span className="min-w-0">
                            <span className="block font-bold leading-snug">{c.title}</span>
                            <span className="mt-0.5 block text-[0.92rem] leading-snug text-muted">{c.event ? formatEventDates(c.event.start, c.event.end) : ""}{c.when.label ? <> · <span className="font-semibold text-ink">{c.when.label}</span></> : null}</span>
                            <span className="mt-1 block text-[0.92rem] leading-snug text-muted">{keeper ? `${plural(expected.length, "camper", "campers")} expected` : withMe > 0 ? `${plural(withMe, "camper is", "campers are")} with you` : "No campers are with you yet. The head facilitators give them out before camp."} · {lines > 0 ? `${plural(lines, "timetable line", "timetable lines")}` : "timetable not written yet"}</span>
                          </span>
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            </Reveal>
          )}

          <Reveal delay={0.06}><WaitingList items={waiting} mayWait={mayWait} /></Reveal>

          {campRows.length > 0 && (
            <Reveal delay={0.1}>
              <Section id="camps" title="The camps" aside={reviewer ? <Link href="/123admin/camps" className="inline-flex min-h-8 items-center gap-1 font-semibold text-purple hover:underline pointer-coarse:min-h-11">All applications <ArrowRight className="size-4" aria-hidden /></Link> : undefined}>
                <ul>{campRows.map((c) => <CampPanel key={c.id} camp={c} canReview={reviewer} />)}</ul>
              </Section>
            </Reveal>
          )}
        </div>

        {hasSide && (
          <aside aria-label="Shortcuts and recent changes" className="grid gap-8">
            <Reveal delay={0.08}><QuickActions actions={actions} /></Reveal>
            <Reveal delay={0.12}><ComingUp items={coming} /></Reveal>
            <Reveal delay={0.16}><Timeline changes={changes} /></Reveal>
          </aside>
        )}
      </div>
    </div>
  );
}
