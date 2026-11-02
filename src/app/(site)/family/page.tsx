import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import PageHero from "@/components/PageHero";
import { ConnectForm, PasswordForm, RegisterForm, SignInForm, SignOutButton } from "@/components/family/FamilyForms";
import { Button, Section } from "@/components/ui";
import { site } from "@/content/site";
import { getEvents } from "@/lib/content";
import { campDays, campNotes, campSessions, dayLabel, todayInNairobi } from "@/lib/camp-day";
import { unseal } from "@/lib/crypto";
import { campUpdates, familyChildren, getFamily } from "@/lib/family";
import { collection } from "@/lib/store";
import { formatEventDates, formatStamp } from "@/lib/time";
import type { CampApplication } from "@/lib/types";

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
        <PageHero title="Your family page" tagline="Follow your child's camp application, apply again next year without retyping everything, and read updates from the camp team." crumbs={[{ label: "Camps", href: "/camps" }, { label: "Family page" }]} />
        <Section>
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2 className="t-h2">Sign in</h2>
              <p className="reading mt-3 text-muted">Use the phone number and password you chose.</p>
              <div className="mt-8"><SignInForm /></div>
            </div>
            <div className="border-t border-rule pt-12 lg:border-l lg:border-t-0 lg:pl-24 lg:pt-0">
              <h2 className="t-h2">New here?</h2>
              <p className="reading mt-3 text-muted">Make a family page in a minute. You do not need one to apply, but it saves your child&apos;s details so next year&apos;s application starts filled in.</p>
              <div className="mt-8"><RegisterForm /></div>
            </div>
          </div>
          <p className="mt-16 flex max-w-3xl items-start gap-3 border-t border-rule pt-6 text-muted"><Lock className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span>Health details are encrypted when saved and are seen only by the camp leaders. Forgotten your password? Call or WhatsApp the camp office on <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>.</span></p>
        </Section>
      </>
    );
  }

  if (family.mustChange) {
    return (
      <>
        <PageHero title="Choose your own password" tagline="The camp office gave you a temporary password. Please choose one only you know." crumbs={[{ label: "Camps", href: "/camps" }, { label: "Family page" }]} />
        <Section><PasswordForm forced /></Section>
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
  const children = kids.filter((c) => c.familyId === family.id).sort((a, b) => a.name.localeCompare(b.name));
  const mine = apps.filter((a) => a.familyId === family.id);
  const open = events.filter((e) => e.category === "camp" && e.registrationOpen && new Date(e.end ?? e.start).getTime() >= now);
  const programmes = new Set<string>(["all", ...children.flatMap((c) => (c.camp ? [c.camp] : [])), ...mine.map((a) => a.camp)]);
  const news = updates.filter((u) => programmes.has(u.camp)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const first = family.name.split(/\s+/)[0];

  // At camp: the timetable and the notes the facilitators chose to share, for children who have a place.
  const placed = mine.filter((a) => a.status === "Approved");
  const [sessions, notes] = placed.length ? await Promise.all([campSessions.list(), campNotes.list()]) : [[], []];
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
      return { id: eventId, title: event?.title ?? kids[0].eventTitle, when: event ? formatEventDates(event.start, event.end) : "", names: kids.map((k) => k.childName), days: finished ? [] : days.filter((d) => lines.some((x) => x.date === d)), lines, shared };
    }),
  );
  const alt = (n: number) => (n % 2 === 1 ? ("alt" as const) : undefined);
  const afterChildren = atCamp.length > 0 ? 2 : 1;

  return (
    <>
      <PageHero title={`Hello, ${first}`} tagline="Everything about your children and the camps, in one place." crumbs={[{ label: "Camps", href: "/camps" }, { label: "Family page" }]} actions={[{ label: "Apply for another child", href: "/events/apply" }]} />

      <Section>
        <h2 className="t-h2">Your children</h2>
        {children.length === 0 ? (
          <div className="mt-8 border-t border-rule py-8">
            <p className="reading max-w-xl text-muted">No children are saved yet. Apply for a camp and your child will appear here, or add one who came before using a code from the camp office (see below).</p>
            <div className="mt-6"><Button href="/events/apply">Apply for a camp</Button></div>
          </div>
        ) : (
          <div className="mt-8 border-t border-rule">
            {children.map((c) => {
              const theirs = mine.filter((a) => a.childId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              const can = open.filter((e) => !theirs.some((a) => a.eventId === e.id && a.status !== "Declined"));
              return (
                <article key={c.id} className="grid gap-x-12 gap-y-5 border-b border-rule py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div>
                    <h3 className="text-2xl leading-tight">{c.name}</h3>
                    {c.camp && <p className="mt-1 text-muted">{c.camp === "jewels" ? "Jewels" : "Teen Life"}</p>}
                  </div>
                  <div className="grid gap-5">
                    {theirs.length > 0 && (
                      <ul className="grid gap-4">
                        {theirs.map((a) => (
                          <li key={a.id}>
                            <p className="font-semibold">{a.eventTitle}</p>
                            <p className="text-muted">{statusLine[a.status]}</p>
                            <p className="text-[0.95rem] text-muted">Applied {formatStamp(a.createdAt)} · {a.paymentVerified ? "Payment confirmed" : "Payment not yet confirmed by the office"}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {can.length > 0 ? (
                      <ul className="grid gap-1">
                        {can.map((e) => (
                          <li key={e.id}><Link href={`/events/apply?camp=${encodeURIComponent(e.id)}&child=${c.id}`} className={link}>Apply for {e.title}, {formatEventDates(e.start, e.end)}<ArrowRight className="size-4" aria-hidden /></Link></li>
                        ))}
                      </ul>
                    ) : (
                      theirs.length === 0 && <p className="text-muted">No camp is taking applications right now.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      {atCamp.length > 0 && (
        <Section tone="alt">
          <h2 className="t-h2">At camp</h2>
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
                  {g.shared.filter((k) => k.notes.length > 0).map((k) => (
                    <div key={k.name}>
                      <h4 className="text-lg font-bold">Notes about {k.name}</h4>
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
                  {g.days.length === 0 && g.shared.every((k) => k.notes.length === 0) && <p className="text-muted">The timetable and notes from the facilitators appear here once camp begins.</p>}
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      <Section tone={alt(afterChildren)}>
        <h2 className="t-h2">Updates from the camp team</h2>
        {news.length === 0 ? (
          <p className="reading mt-4 max-w-xl text-muted">Nothing new yet. Updates about your children&apos;s camps will appear here.</p>
        ) : (
          <div className="mt-8 border-t border-rule">
            {news.map((u) => (
              <article key={u.id} className="border-b border-rule py-7">
                <h3 className="text-xl">{u.title}</h3>
                <p className="mt-1 text-[0.92rem] text-muted">{formatStamp(u.createdAt)}{u.camp !== "all" ? ` · ${u.camp === "jewels" ? "Jewels" : "Teen Life"}` : ""}</p>
                <p className="reading mt-3 whitespace-pre-line text-muted">{u.body}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section tone={alt(afterChildren + 1)}>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="t-h2">Did your child come before?</h2>
            <p className="reading mt-3 text-muted">If they were at a camp last year, the camp office can give you a code. Call or WhatsApp <a className="font-semibold text-purple underline underline-offset-4" href={`https://wa.me/${site.whatsapp.camps}`}>{call}</a>, and they will check you are the parent first.</p>
            <div className="mt-8"><ConnectForm /></div>
          </div>
          <div className="border-t border-rule pt-12 lg:border-l lg:border-t-0 lg:pl-24 lg:pt-0">
            <h2 className="t-h2">Your account</h2>
            <p className="mt-3 text-muted">{family.name} · {family.phone}</p>
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
