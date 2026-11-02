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
import { buildNav } from "@/lib/admin-nav";
import { campScope, can, canReadPrayer, mayKeepRoster, mayOpenCamp, mayRunCampDay } from "@/lib/rbac";
import { fmt, formatEventDates } from "@/lib/time";
import { FirstSetup, SignIn } from "@/components/admin/LoginForm";
import { Icon } from "@/components/icons";
import { Notice, PageTitle, Section, Status } from "@/components/admin/ui";
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
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="relative flex flex-col justify-between gap-12 bg-purple-deep px-6 py-10 text-on-purple sm:px-10 lg:px-14 lg:py-14">
        <Link href="/" className="inline-flex items-center gap-3 self-start">
          <Image src="/logo-96.png" alt="" width={48} height={48} className="size-12 rounded-full" priority />
          <span className="text-2xl font-extrabold [font-variation-settings:'wdth'_86]">Christhood Ministries</span>
        </Link>
        <div>
          <h1 className="t-h1 max-w-[12ch]">Team area</h1>
          <p className="t-lead mt-5 max-w-md text-on-purple-muted">Update the website, welcome new guests and stand with people in prayer. No developer needed.</p>
        </div>
        <p className="hidden max-w-sm font-serif text-lg leading-snug text-on-purple-muted lg:block">“Whatever you do, work at it with all your heart, as working for the Lord.”<span className="mt-1 block font-sans text-base font-semibold text-on-purple">Colossians 3:23</span></p>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-[clamp(1.75rem,3vw,2.25rem)]">{canCreate ? "Set up the first administrator" : "Sign in"}</h2>
          <p className="mt-2 text-muted">{canCreate ? "This person can add everyone else and give each department head their own access." : process.env.GOOGLE_CLIENT_ID ? "Sign in with Google. No account yet? Sign in anyway and an administrator will be asked to approve you." : "Use the email and password your administrator gave you."}</p>
          <div className="mt-8 grid gap-6">
            {!status.signIn && <Notice tone="warn" title="Sign-in is not switched on yet">The hosting settings need a secret key before anyone can sign in. The setup steps are in the README.</Notice>}
            {status.signIn && setup && !store.writable && <Notice tone="warn" title="Saving is not switched on yet">Connect the free database in the hosting dashboard first, then come back here to create the first administrator.</Notice>}
            {canCreate ? <FirstSetup needsKey={Boolean(process.env.VERCEL)} /> : !setup && status.signIn ? <SignIn googleClientId={process.env.GOOGLE_CLIENT_ID} /> : null}
          </div>
          <p className="mt-10 text-[0.9rem] text-muted">Forgotten your password? Ask your administrator to reset it for you.</p>
          <p className="mt-2 text-[0.9rem]"><Link href="/" className="font-semibold text-purple underline underline-offset-4">Back to the website</Link></p>
        </div>
      </section>
    </div>
  );
}

const hours = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date()));
const clock = () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date());
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const blurbs: Record<string, string> = {
  "/123admin/home": "The words and verse at the top of the home page.",
  "/123admin/pages": "Wording and pictures for your ministry or programme page.",
  "/123admin/events": "Camps, mentorship seasons and gatherings.",
  "/123admin/camps": "Parents' applications for the Jewels and Teen Life camps.",
  "/123admin/camps/day": "The timetable, who is here, and notes for the children you look after.",
  "/123admin/banner": "A short message across the top of every page.",
  "/123admin/messages": "Add a sermon video for people to watch.",
  "/123admin/people": "Leaders' words and members' stories.",
  "/123admin/pictures": "Change the main picture on any page.",
  "/123admin/media": "Upload, brighten and keep the church's photos.",
  "/123admin/guests": "New members the protocol team registered.",
  "/123admin/prayers": "Requests and thanksgivings people sent.",
  "/123admin/share": "Print a QR code for the entrance and the bulletin.",
  "/123admin/settings": "Service times, address, phone numbers and giving details.",
  "/123admin/team": "Add department heads and approve people who asked for access.",
  "/123admin/status": "What is switched on, and what still needs setting up.",
  "/123admin/activity": "Who changed what, and when.",
};

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
  const [guests, prayers, camps, status, activity, requests, events, sessions, marks, given] = await Promise.all([
    can(user, "visitors") ? collection<Visitor>("visitors").list().catch(() => []) : [],
    can(user, "prayers") ? collection<Prayer>("prayers").list().catch(() => []) : [],
    scope === "all" || scope.length || runsCamp ? collection<CampApplication>("camp-applications").list().catch(() => []) : [],
    user.role === "admin" ? systemStatus() : null,
    user.role === "admin" ? recentActivity(40) : [],
    user.role === "admin" ? pendingRequestCount() : 0,
    scope === "all" || scope.length || runsCamp ? getEvents().catch(() => []) : [],
    runsCamp ? campSessions.list().catch(() => []) : [],
    runsCamp ? campAttendance.list().catch(() => []) : [],
    runsCamp ? campAssignments.list().catch(() => []) : [],
  ]);

  const today = todayInNairobi();
  const now = Date.now();
  const mine = camps.filter((a) => mayOpenCamp(user, a));
  // Signing in is kept in the activity log, but it is noise on the front screen.
  const changes = activity.filter((a) => !/^signed (in|out)/i.test(a.action)).slice(0, 8);
  const newGuests = guests.filter((g) => g.status === "new");
  const lateGuests = newGuests.filter((g) => now - Date.parse(g.createdAt) >= 3 * 864e5).length;
  const newPrayers = prayers.filter((p) => p.status === "new" && canReadPrayer(user, p));
  const callBacks = newPrayers.filter((p) => p.callBack).length;
  const toReview = mine.filter((a) => a.status === "Pending review");
  const ageChecks = toReview.filter((a) => a.ageReview).length;
  const unpaid = mine.filter((a) => a.status === "Approved" && !a.paymentVerified).length;

  const h = hours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const nav = buildNav(user, { guests: newGuests.length, prayers: newPrayers.length, camps: toReview.length, requests });
  const waiting = [
    requests > 0 && { key: "access", n: requests, href: "/123admin/team/requests", title: requests === 1 ? "person asked for team access" : "people asked for team access", meta: "Approve the ones you know and give them a role." },
    toReview.length > 0 && { key: "camp", n: toReview.length, href: "/123admin/camps?status=Pending%20review", title: toReview.length === 1 ? "camp application to review" : "camp applications to review", meta: ageChecks ? `${plural(ageChecks, "is", "are")} outside the usual age range and ${ageChecks === 1 ? "needs" : "need"} a look.` : "Check the details and the payment, then approve." },
    unpaid > 0 && { key: "unpaid", n: unpaid, href: "/123admin/camps?status=Approved", title: unpaid === 1 ? "approved camper without a payment check" : "approved campers without a payment check", meta: "Open each one and tick the box once the office has seen the money." },
    newGuests.length > 0 && { key: "guests", n: newGuests.length, href: "/123admin/guests", title: newGuests.length === 1 ? "new member to follow up" : "new members to follow up", meta: lateGuests ? `${plural(lateGuests, "has", "have")} waited three days or more. Call or WhatsApp them.` : "Call or WhatsApp them this week." },
    newPrayers.length > 0 && { key: "prayers", n: newPrayers.length, href: "/123admin/prayers", title: newPrayers.length === 1 ? "new prayer request" : "new prayer requests", meta: callBacks ? `${plural(callBacks, "asked", "asked")} for a call back. Handled in confidence.` : "Handled in confidence." },
  ].filter(Boolean) as { key: string; n: number; href: string; title: string; meta: string }[];

  // Camps with applications: how each stands, soonest first.
  const campRows = [...new Set(mine.map((a) => a.eventId))]
    .map((id) => {
      const list = mine.filter((a) => a.eventId === id);
      const event = events.find((e) => e.id === id);
      const when = campWhen(event, today);
      const n = (s: string) => list.filter((a) => a.status === s).length;
      return { id, title: event?.title ?? list[0].eventTitle, event, when, total: list.length, approved: n("Approved"), review: n("Pending review"), fix: n("Needs correction"), declined: n("Declined"), paid: list.filter((a) => a.status === "Approved" && a.paymentVerified).length };
    })
    .sort((a, b) => Number(a.when.label === "Finished") - Number(b.when.label === "Finished") || (a.event?.start ?? "").localeCompare(b.event?.start ?? ""));

  // Camps on today that this person helps run.
  const onToday = runsCamp
    ? [...new Set(camps.filter((a) => a.status === "Approved").map((a) => a.eventId))]
        .map((id) => ({ id, event: events.find((e) => e.id === id) }))
        .filter((c) => c.event && campDays(c.event).includes(today))
    : [];
  const keeper = mayKeepRoster(user);

  const showSide = changes.length > 0;
  const mayWait = user.role === "admin" || can(user, "visitors") || can(user, "prayers") || scope === "all" || scope.length > 0;
  const date = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="grid gap-9">
      <PageTitle title={`${greeting}, ${user.name.split(" ")[0]}`} lead={date} />

      {status && (!status.signIn || status.storage === "none") && (
        <Notice tone="warn" title="Finish setting up before the team starts">Saving is not switched on for the live site yet. <Link href="/123admin/status" className="font-semibold underline underline-offset-4">See what is missing</Link>.</Notice>
      )}

      <div className={`grid items-start gap-x-12 gap-y-9 ${showSide ? "xl:grid-cols-[minmax(0,1fr)_21rem]" : ""}`}>
        <div className="grid gap-9">
          {onToday.map(({ id, event }) => {
            const approved = camps.filter((a) => a.eventId === id && a.status === "Approved");
            const group = keeper ? approved : approved.filter((a) => given.find((g) => g.id === a.id)?.userId === user.id);
            const today_ = marks.filter((m) => m.eventId === id && m.date === today);
            const present = group.filter((a) => today_.some((m) => m.applicationId === a.id && m.status === "present")).length;
            const left = group.filter((a) => !today_.some((m) => m.applicationId === a.id)).length;
            const lines = sessions.filter((s) => s.eventId === id && s.date === today).sort((a, b) => a.start.localeCompare(b.start));
            const t = clock();
            return (
              <Section key={id} id={`today-${id}`} title={`Today at ${event!.title}`} aside={<Link href={`${ADMIN_PATH}/camps/day/${id}`} className="inline-flex min-h-8 items-center gap-1 font-semibold text-purple hover:underline pointer-coarse:min-h-11">Open today&rsquo;s register <ArrowRight className="size-4" aria-hidden /></Link>}>
                <p className="mt-3 text-[1.02rem]"><strong>{present}</strong> of {group.length} {keeper ? "expected campers are" : group.length === 1 ? "of your campers is" : "of your campers are"} here{left > 0 ? <>, <strong>{left}</strong> not marked yet</> : ". Everyone is marked."}</p>
                {lines.length > 0 ? (
                  <ol className="mt-2">
                    {lines.map((l) => {
                      const on = l.start <= t && (l.end ?? l.start) > t;
                      const done = (l.end ?? l.start) <= t;
                      return (
                        <li key={l.id} className={`grid grid-cols-[7rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-rule py-2.5 ${done ? "text-muted" : ""}`}>
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
            );
          })}

          {(waiting.length > 0 || mayWait) && (
          <Section id="waiting" title="Waiting for you">
            {waiting.length === 0 ? (
              <p className="py-5 text-muted">Nothing is waiting for you right now. New applications, members and prayer requests show up here.</p>
            ) : (
              <ul>
                {waiting.map((w) => (
                  <li key={w.key}>
                    <Link href={w.href} className="group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule px-1 py-3.5 transition-colors hover:bg-paper-2">
                      <span className="text-[1.65rem] font-extrabold leading-none text-purple [font-variation-settings:'wdth'_86]">{w.n}</span>
                      <span className="min-w-0">
                        <span className="block font-bold leading-snug">{w.title}</span>
                        <span className="mt-0.5 block text-[0.92rem] leading-snug text-muted">{w.meta}</span>
                      </span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          )}

          {campRows.length > 0 && (
            <Section id="camps" title="The camps" aside={<Link href="/123admin/camps" className="inline-flex min-h-8 items-center gap-1 font-semibold text-purple hover:underline pointer-coarse:min-h-11">All applications <ArrowRight className="size-4" aria-hidden /></Link>}>
              <ul>
                {campRows.map((c) => {
                  const seg = [
                    { n: c.approved, cls: "bg-ok", label: "approved" },
                    { n: c.review, cls: "bg-purple", label: "to review" },
                    { n: c.fix, cls: "bg-gold", label: "need correction" },
                    { n: c.declined, cls: "bg-rule", label: "declined" },
                  ];
                  return (
                    <li key={c.id} className="border-b border-rule px-1 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                        <Link href={`/123admin/camps?status=Approved`} className="font-bold leading-snug hover:underline">{c.title}</Link>
                        <span className="text-[0.92rem] text-muted">{c.event ? formatEventDates(c.event.start, c.event.end) : ""}{c.when.label ? <> · <span className={c.when.tone === "new" ? "font-semibold text-purple" : ""}>{c.when.label}</span></> : null}</span>
                      </div>
                      <div aria-hidden className="mt-3 flex h-2 overflow-hidden bg-paper-2">
                        {seg.filter((s) => s.n > 0).map((s) => <span key={s.label} className={s.cls} style={{ width: `${(s.n / c.total) * 100}%` }} />)}
                      </div>
                      <p className="mt-2.5 text-[0.92rem] text-muted">
                        <strong className="font-bold text-ink">{c.total}</strong> {c.total === 1 ? "application" : "applications"}
                        {seg.filter((s) => s.n > 0).map((s) => <span key={s.label}> · {s.n} {s.label}</span>)}
                        {c.approved > 0 ? <span> · {c.paid} of {c.approved} paid</span> : null}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>

        {showSide && (
          <aside aria-label="Recent changes" className="grid gap-9">
            <Section id="recent" title="Recent changes" aside={<Link href="/123admin/activity" className="font-semibold text-purple hover:underline">Everything</Link>}>
              <ul>
                {changes.map((a) => (
                  <li key={a.id} className="border-b border-rule py-2.5">
                    <p className="leading-snug"><span className="font-semibold">{a.by}</span> {a.action.toLowerCase()}{a.target ? <>: <span className="text-muted">{a.target}</span></> : null}</p>
                    <time dateTime={a.at} className="text-[0.85rem] text-muted">{ago(a.at)}</time>
                  </li>
                ))}
              </ul>
            </Section>
          </aside>
        )}
      </div>

      <Section id="all" title="Everything you can change">
        <div className="mt-5 grid gap-x-10 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
          {nav.filter((g) => g.title !== "Start").map((g) => (
            <div key={g.title}>
              <h3 className="text-[0.95rem] text-muted">{g.title}</h3>
              <ul className="mt-1">
                {g.items.filter((i) => i.href !== `${ADMIN_PATH}/account`).map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="group -mx-1 flex items-start gap-3 px-1 py-2 hover:bg-paper-2">
                      <Icon name={i.icon} className="mt-0.5 size-[1.1rem] shrink-0 text-purple" />
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug group-hover:underline">{i.label}</span>
                        {blurbs[i.href] && <span className="hidden text-[0.88rem] leading-snug text-muted sm:block">{blurbs[i.href]}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
