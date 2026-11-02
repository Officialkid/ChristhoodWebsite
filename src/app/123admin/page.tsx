import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ADMIN_PATH, getUser, needsSetup, recentActivity, systemStatus } from "@/lib/auth";
import { store } from "@/lib/store";
import { collection } from "@/lib/store";
import { buildNav } from "@/lib/admin-nav";
import { campScope, can, canReadPrayer, mayOpenCamp } from "@/lib/rbac";
import { formatStamp } from "@/lib/time";
import { FirstSetup, SignIn } from "@/components/admin/LoginForm";
import { Notice, PageTitle, Row } from "@/components/admin/ui";
import type { CampApplication, Prayer, StoredUser, Visitor } from "@/lib/types";

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
          <p className="mt-2 text-muted">{canCreate ? "This person can add everyone else and give each department head their own access." : "Use the email and password your administrator gave you."}</p>
          <div className="mt-8 grid gap-6">
            {!status.signIn && <Notice tone="warn" title="Sign-in is not switched on yet">The hosting settings need a secret key before anyone can sign in. The setup steps are in the README.</Notice>}
            {status.signIn && setup && !store.writable && <Notice tone="warn" title="Saving is not switched on yet">Connect the free database in the hosting dashboard first, then come back here to create the first administrator.</Notice>}
            {canCreate ? <FirstSetup needsKey={Boolean(process.env.VERCEL)} /> : !setup && status.signIn ? <SignIn /> : null}
          </div>
          <p className="mt-10 text-[0.9rem] text-muted">Forgotten your password? Ask your administrator to reset it for you.</p>
          <p className="mt-2 text-[0.9rem]"><Link href="/" className="font-semibold text-purple underline underline-offset-4">Back to the website</Link></p>
        </div>
      </section>
    </div>
  );
}

const hours = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" }).format(new Date()));

async function Overview({ user }: { user: StoredUser }) {
  const scope = campScope(user);
  const [guests, prayers, camps, status, activity] = await Promise.all([
    can(user, "visitors") ? collection<Visitor>("visitors").list().catch(() => []) : [],
    can(user, "prayers") ? collection<Prayer>("prayers").list().catch(() => []) : [],
    scope === "all" || scope.length ? collection<CampApplication>("camp-applications").list().catch(() => []) : [],
    user.role === "admin" ? systemStatus() : null,
    user.role === "admin" ? recentActivity(8) : [],
  ]);
  const newGuests = guests.filter((g) => g.status === "new").length;
  const newPrayers = prayers.filter((p) => p.status === "new" && canReadPrayer(user, p)).length;
  const newCamps = camps.filter((a) => a.status === "Pending review" && mayOpenCamp(user, a)).length;
  const h = hours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const links = buildNav(user, { guests: newGuests, prayers: newPrayers, camps: newCamps })
    .flatMap((g) => g.items)
    .filter((i) => i.href !== ADMIN_PATH && i.href !== `${ADMIN_PATH}/account`);
  const blurbs: Record<string, string> = {
    "/123admin/home": "The words and verse at the top of the home page.",
    "/123admin/pages": "Wording and pictures for your ministry or programme page.",
    "/123admin/events": "Camps, mentorship seasons and gatherings.",
    "/123admin/camps": "Parents' applications for the Jewels and Teen Life camps.",
    "/123admin/camps/day": "On camp days: the timetable, who is here, and notes for the children you look after.",
    "/123admin/banner": "A short message across the top of every page.",
    "/123admin/messages": "Add a sermon video for people to watch.",
    "/123admin/people": "Leaders' words and members' stories.",
    "/123admin/pictures": "Change the main picture on any page.",
    "/123admin/media": "Upload, brighten and keep the church's photos.",
    "/123admin/guests": "New members the protocol team registered. Follow them up.",
    "/123admin/prayers": "Requests and thanksgivings people sent.",
    "/123admin/share": "Print a QR code for the entrance and the bulletin.",
    "/123admin/settings": "Service times, address, phone numbers and giving details.",
    "/123admin/team": "Add department heads and choose what each can change.",
    "/123admin/status": "What is switched on, and what still needs setting up.",
    "/123admin/activity": "Who changed what, and when.",
  };

  return (
    <>
      <PageTitle title={`${greeting}, ${user.name.split(" ")[0]}`} lead="Pick up where you left off, or choose what you want to change." />

      <div className="mt-8 grid gap-10">
        {status && (!status.signIn || status.storage === "none") && (
          <Notice tone="warn" title="Finish setting up before the team starts">Saving is not switched on for the live site yet. <Link href="/123admin/status" className="font-semibold underline underline-offset-4">See what is missing</Link>.</Notice>
        )}

        {(newGuests > 0 || newPrayers > 0 || newCamps > 0) && (
          <section aria-labelledby="attention">
            <h2 id="attention" className="text-xl">Waiting for you</h2>
            <div className="mt-3 border-t border-rule">
              {newGuests > 0 && <Row href="/123admin/guests" icon="guest" title={`${newGuests} new ${newGuests === 1 ? "member" : "members"} to follow up`} meta="Call or WhatsApp them this week." aside={<ArrowRight className="size-4" aria-hidden />} />}
              {newCamps > 0 && <Row href="/123admin/camps" icon="tent" title={`${newCamps} camp ${newCamps === 1 ? "application" : "applications"} to review`} meta="Check the details and the payment, then approve." aside={<ArrowRight className="size-4" aria-hidden />} />}
              {newPrayers > 0 && <Row href="/123admin/prayers" icon="prayer" title={`${newPrayers} new ${newPrayers === 1 ? "prayer request" : "prayer requests"}`} meta="Handled in confidence." aside={<ArrowRight className="size-4" aria-hidden />} />}
            </div>
          </section>
        )}

        <section aria-labelledby="shortcuts">
          <h2 id="shortcuts" className="text-xl">What you can change</h2>
          <div className="mt-3 border-t border-rule">
            {links.map((l) => <Row key={l.href} href={l.href} icon={l.icon} title={l.label} meta={blurbs[l.href]} aside={<ArrowRight className="size-4" aria-hidden />} />)}
          </div>
        </section>

        {activity.length > 0 && (
          <section aria-labelledby="recent">
            <h2 id="recent" className="text-xl">Recent changes</h2>
            <ul className="mt-3 border-t border-rule">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-rule px-1 py-3">
                  <span><span className="font-semibold">{a.by}</span> {a.action.toLowerCase()}{a.target ? <>: <span className="text-muted">{a.target}</span></> : null}</span>
                  <time dateTime={a.at} className="text-[0.9rem] text-muted">{formatStamp(a.at)}</time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
