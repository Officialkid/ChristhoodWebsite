import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, CircleAlert, Clock3, Lock, XCircle } from "lucide-react";
import PageHero from "@/components/PageHero";
import { ChildProfileForm, ConnectForm, ContactDetailsForm, FamilyPhoneForm, PasswordForm, RegisterForm, SignInForm, SignOutButton } from "@/components/family/FamilyForms";
import { Button, Section } from "@/components/ui";
import { site } from "@/content/site";
import { getEvents } from "@/lib/content";
import { campAttendance, campDays, campNotes, campPhotos, campSessions, dayLabel, todayInNairobi } from "@/lib/camp-day";
import { unseal } from "@/lib/crypto";
import { campUpdates, familyChildren, getFamily } from "@/lib/family";
import { collection } from "@/lib/store";
import { formatEventDates, formatStamp } from "@/lib/time";
import type { CampApplication, ChildProfile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Family page",
  description: "Sign in to follow your child's camp application, apply again next year and read updates from the camp team.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/family" },
};

/** What a parent is told about an application, in plain words. */
const statusLine: Record<CampApplication["status"], string> = {
  "Pending review": "Received. The camp office will review it and contact you.",
  Approved: "Your child has a place.",
  "Needs correction": "The camp office needs something corrected and will contact you.",
  Declined: "Not accepted this time. The camp office will explain.",
};
const link = "inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline decoration-purple/40 underline-offset-[6px] hover:decoration-purple";

export default async function FamilyPage() {
  const family = await getFamily();
  const call = `0${site.whatsapp.camps.replace(/^254/, "")}`;

  if (!family) {
    return (
      <>
        <PageHero compact title="Your family camp page" tagline="Keep your children’s camp applications, updates and details together." crumbs={[{ label: "Camps", href: "/camps" }, { label: "Family page" }]} />
        <nav aria-label="Family page options" className="border-y border-rule bg-paper">
          <ul className="wrap flex flex-wrap gap-x-8 gap-y-0">
            <li><a className="inline-flex min-h-12 items-center font-semibold text-purple underline decoration-purple/40 underline-offset-4 hover:decoration-purple" href="#create-family">Create a family page</a></li>
            <li><a className="inline-flex min-h-12 items-center font-semibold text-ink underline decoration-rule underline-offset-4 hover:text-purple hover:decoration-purple" href="#family-sign-in">Sign in</a></li>
          </ul>
        </nav>
        <Section tight className="border-t border-rule">
          <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12 lg:gap-20">
            <section id="create-family" aria-labelledby="create-family-title" className="min-w-0 scroll-mt-24">
              <h2 id="create-family-title" className="t-h2">Create your family page</h2>
              <p className="reading mt-3 max-w-xl text-muted">Set up one account to save your children’s details and follow their camp applications.</p>
              <p className="mt-3 max-w-xl text-muted">Prefer to apply first? We’ll create your family page when you submit an application.</p>
              <div className="mt-7 max-w-xl"><RegisterForm /></div>
            </section>

            <section id="family-sign-in" aria-labelledby="family-sign-in-title" className="min-w-0 scroll-mt-24 border-t border-rule pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
              <h2 id="family-sign-in-title" className="t-h2">Sign in to your family page</h2>
              <p className="reading mt-3 max-w-xl text-muted">Use the phone number on your application and your password. If the camp office gave you a temporary password, enter it first, then choose a password you’ll remember.</p>
              <div className="mt-7 max-w-xl"><SignInForm /></div>
              <p className="mt-7 flex items-start gap-3 border-t border-rule pt-5 text-muted"><Lock className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span>Your child’s health details are encrypted when saved and are seen only by the camp leaders.</span></p>
              <p className="mt-5 max-w-xl text-muted">Applied before family pages were available? The camp office can link your application after confirming you are the parent. Call or WhatsApp <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>.</p>
            </section>
          </div>
        </Section>
      </>
    );
  }

  if (family.mustChange) {
    return (
      <>
        <PageHero compact title="Choose your password" tagline="For your privacy, replace the temporary password before opening your family page." crumbs={[{ label: "Camps", href: "/camps" }, { label: "Family page" }]} />
        <Section tight className="border-t border-rule"><div className="max-w-xl"><PasswordForm forced /></div></Section>
      </>
    );
  }

  const now = Date.now();
  const [events, kids, apps, updates] = await Promise.all([
    getEvents(),
    familyChildren.list(),
    collection<CampApplication>("camp-applications").list(),
    campUpdates.list(),
  ]);
  const savedChildren = kids.filter((c) => c.familyId === family.id).sort((a, b) => a.name.localeCompare(b.name));
  const children = await Promise.all(savedChildren.map(async (child) => {
    if (!child.sealed) return { ...child, profile: undefined, profileReady: true };
    try {
      return { ...child, profile: await unseal<ChildProfile>(child.sealed), profileReady: true };
    } catch {
      return { ...child, profile: undefined, profileReady: false };
    }
  }));
  const mine = apps.filter((a) => a.familyId === family.id);
  const open = events.filter((e) => e.category === "camp" && e.registrationOpen && new Date(e.end ?? e.start).getTime() >= now);
  const programmes = new Set<string>(["all", ...children.flatMap((c) => (c.camp ? [c.camp] : [])), ...mine.map((a) => a.camp)]);
  const news = updates.filter((u) => programmes.has(u.camp)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const first = family.name.split(/\s+/)[0];

  // At camp: the timetable and the notes the facilitators chose to share, for children who have a place.
  const placed = mine.filter((a) => a.status === "Approved");
  const [sessions, notes, attendance, photos] = placed.length ? await Promise.all([campSessions.list(), campNotes.list(), campAttendance.list(), campPhotos.list()]) : [[], [], [], []];
  const today = todayInNairobi();
  const atCamp = await Promise.all(
    [...new Set(placed.map((a) => a.eventId))].map(async (eventId) => {
      const event = events.find((e) => e.id === eventId);
      const kids = placed.filter((a) => a.eventId === eventId);
      const days = event ? campDays(event) : [];
      const finished = days.length > 0 && days[days.length - 1] < today;
      const lines = sessions.filter((x) => x.eventId === eventId).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
      const shared = await Promise.all(
        kids.map(async (kid) => {
          const mineNotes = notes.filter((n) => n.applicationId === kid.id && n.shared).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          const read = await Promise.all(mineNotes.map(async (n) => {
            try {
              return { id: n.id, by: n.by, at: n.createdAt, words: (await unseal<{ text: string }>(n.sealed)).text };
            } catch {
              return null;
            }
          }));
          return { name: kid.childName, notes: read.filter((n) => n !== null) };
        }),
      );
      const progress = kids.map((kid) => ({
        id: kid.id,
        name: kid.childName,
        marks: days.map((date) => ({ date, status: attendance.find((a) => a.applicationId === kid.id && a.date === date)?.status })),
        photos: photos.filter((photo) => photo.applicationId === kid.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }));
      return { id: eventId, title: event?.title ?? kids[0].eventTitle, when: event ? formatEventDates(event.start, event.end) : "", names: kids.map((k) => k.childName), days: finished ? [] : days.filter((d) => lines.some((x) => x.date === d)), lines, shared, progress };
    }),
  );
  const alt = (n: number) => (n % 2 === 1 ? ("alt" as const) : undefined);
  const afterChildren = atCamp.length > 0 ? 2 : 1;

  return (
    <>
      <header className="border-b border-rule bg-paper">
        <div className="wrap max-w-[76rem] py-5 md:py-7">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              <li><Link href="/" className="inline-flex min-h-9 items-center underline-offset-4 hover:text-purple hover:underline">Home</Link></li>
              <li className="flex items-center gap-2"><span aria-hidden>/</span><Link href="/camps" className="inline-flex min-h-9 items-center underline-offset-4 hover:text-purple hover:underline">Camps</Link></li>
              <li className="flex items-center gap-2"><span aria-hidden>/</span><span aria-current="page" className="text-ink">Family page</span></li>
            </ol>
          </nav>
          <div className="mt-4 grid items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
            <div>
              <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl">Welcome back, {first}</h1>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">Your children&apos;s camp applications, updates and details are together here.</p>
            </div>
            <Button href="/events/apply" className="w-full sm:w-fit">Apply for another child</Button>
          </div>
        </div>
      </header>

      <nav aria-label="Family page sections" className="border-y border-rule bg-paper">
        <ul className="wrap max-w-[76rem] flex flex-wrap gap-x-7 gap-y-0">
          <li><a className="inline-flex min-h-12 items-center font-semibold text-muted underline decoration-rule underline-offset-4 hover:text-purple hover:decoration-purple" href="#children">Children</a></li>
          {atCamp.length > 0 && <li><a className="inline-flex min-h-12 items-center font-semibold text-muted underline decoration-rule underline-offset-4 hover:text-purple hover:decoration-purple" href="#progress">Camp progress</a></li>}
          {news.length > 0 && <li><a className="inline-flex min-h-12 items-center font-semibold text-muted underline decoration-rule underline-offset-4 hover:text-purple hover:decoration-purple" href="#updates">Updates</a></li>}
          <li><a className="inline-flex min-h-12 items-center font-semibold text-muted underline decoration-rule underline-offset-4 hover:text-purple hover:decoration-purple" href="#account">Account</a></li>
        </ul>
      </nav>

      <Section id="children" tight containerClassName="max-w-[76rem]">
        <header className="mb-5 grid gap-2 border-b border-rule pb-5 sm:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)] sm:items-end sm:gap-8">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Children and applications</h2>
          <p className="max-w-xl text-muted">Check each child&apos;s camp place, payment and next steps here.</p>
        </header>
        {children.length === 0 ? (
          <div className="py-3">
            <p className="reading max-w-xl text-muted">No children are saved yet. Apply for a camp and your child will appear here, or add one who came before using a code from the camp office (see below).</p>
            <p className="reading mt-4 max-w-xl text-muted">If you applied before creating this page, call or WhatsApp <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>. The camp office will verify you and link the application so you can follow it here.</p>
            <div className="mt-6"><Button href="/events/apply">Apply for a camp</Button></div>
          </div>
        ) : (
          <div>
            {children.map((c) => {
              const theirs = mine.filter((a) => a.childId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              const can = open.filter((e) => !theirs.some((a) => a.eventId === e.id && a.status !== "Declined"));
              return (
                <article key={c.id} className="grid gap-x-10 gap-y-5 border-b border-rule py-6 md:grid-cols-[minmax(13rem,0.8fr)_minmax(0,2fr)] md:py-7">
                  <div>
                    <h3 className="text-2xl font-bold leading-tight">{c.name}</h3>
                    {c.camp && <p className="mt-1 text-muted">{c.camp === "jewels" ? "Jewels" : "Teen Life"} programme</p>}
                  </div>
                  <div className="grid gap-5">
                    {theirs.length > 0 && (
                      <ul className="border-t border-rule">
                        {theirs.map((a) => {
                          const event = events.find((item) => item.id === a.eventId);
                          const StatusIcon = a.status === "Approved" ? CheckCircle2 : a.status === "Pending review" ? Clock3 : a.status === "Needs correction" ? CircleAlert : XCircle;
                          const statusTone = a.status === "Approved" ? "text-ok" : a.status === "Declined" ? "text-danger" : a.status === "Needs correction" ? "text-purple" : "text-muted";
                          return (
                            <li key={a.id} className="grid gap-4 border-b border-rule py-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-8">
                              <div>
                                <h4 className="text-lg font-bold leading-snug">{a.eventTitle}</h4>
                                {event && <p className="mt-1 text-sm text-muted">Camp dates · {formatEventDates(event.start, event.end)}</p>}
                                <p className={`mt-3 flex items-center gap-2 font-semibold ${statusTone}`}><StatusIcon className="size-4 shrink-0" aria-hidden />{a.status}</p>
                                <p className="mt-1 text-muted">{statusLine[a.status]}</p>
                              </div>
                              <div className="border-t border-rule pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                                <p className="text-sm text-muted">Payment</p>
                                <p className="mt-1 font-semibold">{a.paymentVerified ? "Confirmed by the camp office" : "Waiting for the camp office to check"}</p>
                                <p className="mt-2 text-sm text-muted">Applied {formatStamp(a.createdAt)}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {can.length > 0 ? (
                      <ul className="grid gap-3 pt-1">
                        {can.map((e) => (
                          <li key={e.id}>
                            <p className="text-sm font-semibold text-muted">Available for {c.name}</p>
                            <Link href={`/events/apply?camp=${encodeURIComponent(e.id)}&child=${c.id}`} className={link}>Apply for {e.title} · {formatEventDates(e.start, e.end)}<ArrowRight className="size-4" aria-hidden /></Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      theirs.length === 0 && <p className="text-muted">No camp is taking applications right now.</p>
                    )}
                    <details className="group border-t border-rule pt-2">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-purple [&::-webkit-details-marker]:hidden">
                        <span>Update {c.name}&apos;s details</span><ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <div className="pb-4 pt-2">
                        {c.profileReady ? <ChildProfileForm childId={c.id} name={c.name} profile={c.profile} /> : <p role="alert" className="text-muted">We could not open the saved details. Please contact the camp office before making changes.</p>}
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      {atCamp.length > 0 && (
        <Section id="progress" tone="alt" tight containerClassName="max-w-[76rem]">
          <h2 className="t-h2">Camp progress</h2>
          <p className="reading mt-3 max-w-2xl text-muted">See each day&apos;s check-in, the camp timetable, private updates and photos shared with your family.</p>
          <div className="mt-8 border-t border-rule">
            {atCamp.map((g) => (
              <article key={g.id} className="grid gap-x-12 gap-y-6 border-b border-rule py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div>
                  <h3 className="text-2xl leading-tight">{g.title}</h3>
                  {g.when && <p className="mt-1 text-muted">{g.when}</p>}
                  <p className="mt-2 text-muted">{g.names.join(", ")} {g.names.length === 1 ? "has" : "have"} a place.</p>
                </div>
                <div className="grid gap-8">
                  {g.days.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold">Timetable</h4>
                      <div className="mt-3 grid gap-5">
                        {g.days.map((d) => (
                          <div key={d}>
                            <p className="font-semibold">{dayLabel(d)}</p>
                            <ol className="mt-1 border-t border-rule">
                              {g.lines.filter((x) => x.date === d).map((x) => (
                                <li key={x.id} className="grid gap-x-6 border-b border-rule py-2 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                                  <span className="font-semibold tabular-nums">{x.start}{x.end ? `–${x.end}` : ""}</span>
                                  <span><span className="font-semibold">{x.title}</span>{(x.place || x.lead) && <span className="text-muted"> · {[x.place, x.lead && `led by ${x.lead}`].filter(Boolean).join(" · ")}</span>}{x.note && <span className="block text-[0.95rem] text-muted">{x.note}</span>}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {g.progress.map((kid) => (
                    <div key={kid.id} className="border-t border-rule pt-5">
                      <h4 className="text-lg font-bold">{kid.name}&apos;s daily check-ins</h4>
                      {kid.marks.length === 0 ? <p className="mt-2 text-muted">The camp dates are not available yet.</p> : (
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {kid.marks.map((mark) => (
                            <li key={mark.date} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
                              <span>{dayLabel(mark.date)}</span>
                              <span className={mark.status === "absent" ? "font-semibold text-danger" : "font-semibold"}>{mark.status === "present" ? "Checked in" : mark.status === "absent" ? "Away recorded" : mark.date > today ? "Coming up" : "No check-in yet"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {g.shared.filter((k) => k.notes.length > 0).map((k) => (
                    <div key={k.name}>
                      <h4 className="text-lg font-bold">Messages about {k.name}</h4>
                      <div className="mt-3 border-t border-rule">
                        {k.notes.map((n) => (
                          <div key={n.id} className="border-b border-rule py-4">
                            <p className="text-[0.92rem] text-muted">{n.by} · {formatStamp(n.at)}</p>
                            <p className="reading mt-1 whitespace-pre-line">{n.words}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {g.progress.filter((kid) => kid.photos.length > 0).map((kid) => (
                    <div key={kid.id}>
                      <h4 className="text-lg font-bold">Photos of {kid.name}</h4>
                      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {kid.photos.map((photo) => (
                          <li key={photo.id} className="overflow-hidden border border-rule">
                            <a href={`/api/family/photos/${encodeURIComponent(photo.id)}`} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-purple">
                              <img src={`/api/family/photos/${encodeURIComponent(photo.id)}`} alt={photo.caption || `${kid.name} at camp`} width={720} height={720} loading="lazy" className="aspect-square w-full object-cover" />
                              <span className="block p-2 text-sm">{photo.caption || "Camp photo"}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {g.days.length === 0 && g.shared.every((k) => k.notes.length === 0) && g.progress.every((kid) => kid.photos.length === 0) && <p className="text-muted">The timetable, check-ins, messages and photos appear here as the camp team shares them.</p>}
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {news.length > 0 && (
        <Section id="updates" tone={alt(afterChildren)} tight containerClassName="max-w-[76rem]">
          <h2 className="t-h2">Updates from the camp team</h2>
          <div className="mt-8 border-t border-rule">
            {news.map((u) => (
              <article key={u.id} className="border-b border-rule py-7">
                <h3 className="text-xl">{u.title}</h3>
                <p className="mt-1 text-[0.92rem] text-muted">{formatStamp(u.createdAt)}{u.camp !== "all" ? ` · ${u.camp === "jewels" ? "Jewels" : "Teen Life"}` : ""}</p>
                <p className="reading mt-3 whitespace-pre-line text-muted">{u.body}</p>
              </article>
            ))}
          </div>
        </Section>
      )}

      <Section id="account" tone={alt(afterChildren + 1)} tight containerClassName="max-w-[76rem]">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="t-h2">Did your child come before?</h2>
            <p className="reading mt-3 text-muted">If they were at a camp last year, the camp office can give you a code. Call or WhatsApp <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>, and they will check you are the parent first.</p>
            <div className="mt-8"><ConnectForm /></div>
          </div>
          <div className="border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <h2 className="t-h2">Your account</h2>
            <h3 className="mt-5 text-lg font-bold">Contact details</h3>
            <p className="mt-2 mb-4 text-muted">These details are used by the camp office for your family&apos;s applications.</p>
            <ContactDetailsForm name={family.name} email={family.email} smsUpdates={family.smsUpdates} />
            <details className="mt-6 max-w-xl">
              <summary className="min-h-11 cursor-pointer font-semibold text-purple">Change sign-in phone</summary>
              <div className="mt-4"><FamilyPhoneForm currentPhone={family.phone} /></div>
            </details>
            <details className="mt-6 max-w-md">
              <summary className="min-h-11 cursor-pointer font-semibold text-purple">Change my password</summary>
              <div className="mt-4"><PasswordForm /></div>
            </details>
            <div className="mt-8"><SignOutButton /></div>
          </div>
        </div>
      </Section>
    </>
  );
}
