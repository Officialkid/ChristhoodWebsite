import { notFound, redirect } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { ADMIN_PATH, log, requireUser } from "@/lib/auth";
import { campApplications, campAssignments, campNotes, mayOpenCare } from "@/lib/camp-day";
import { unseal } from "@/lib/crypto";
import { mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { store } from "@/lib/store";
import { formatStamp } from "@/lib/time";
import { NoteForm, RemoveNote } from "@/components/admin/CampDay";
import { btnClass, Chip, Empty, Notice, PageTitle } from "@/components/admin/ui";
import type { CampSealed } from "@/lib/types";

export const metadata = { title: "Care details" };

const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "254")}`;
const Fact = ({ label, value }: { label: string; value?: React.ReactNode }) => (value ? <div><dt className="text-[0.85rem] font-semibold text-muted">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{value}</dd></div> : null);

export default async function CamperCarePage({ params }: { params: Promise<{ eventId: string; appId: string }> }) {
  const { eventId, appId } = await params;
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayRunCampDay(user)) redirect(`${ADMIN_PATH}/no-access`);

  const app = await campApplications.get(appId);
  if (!app || app.eventId !== eventId || app.status !== "Approved") notFound();
  const assignment = await campAssignments.get(app.id);
  if (!mayOpenCare(user, app, assignment)) redirect(`${ADMIN_PATH}/no-access`);

  let d: CampSealed | null = null;
  try {
    d = await unseal<CampSealed>(app.sealed);
  } catch {
    d = null;
  }
  // Opening a child's health details is written to the activity log, at most once every ten minutes per person and child.
  if ((await store.hit(`care:${user.id}:${app.id}`, 600).catch(() => 2)) === 1) await log(user, "Opened a camper's care details", app.childName);

  const all = (await campNotes.list()).filter((n) => n.applicationId === app.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notes = await Promise.all(all.map(async (n) => {
    try {
      return { ...n, words: (await unseal<{ text: string }>(n.sealed)).text };
    } catch {
      return { ...n, words: "" };
    }
  }));
  const keeper = mayKeepRoster(user);
  const back = `${ADMIN_PATH}/camps/day/${eventId}`;

  return (
    <>
      <PageTitle
        title={app.childName}
        icon="clipboard"
        lead={`${app.eventTitle} · age ${app.ageAtCamp}${d?.gender ? ` · ${d.gender}` : ""}`}
        crumbs={[{ label: "Camp days", href: `${ADMIN_PATH}/camps/day` }, { label: app.eventTitle, href: back }, { label: app.childName }]}
      />
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="grid content-start gap-10">
          {d?.mediaConsent === "No" && <Notice tone="warn" title="Do not photograph or film this child">The parent did not allow photos or videos.</Notice>}
          {!d && <Notice tone="bad" title="The private details could not be opened">The registration key may have changed. Ask an administrator.</Notice>}

          <section aria-labelledby="who">
            <h2 id="who" className="text-xl">Parent and emergency contacts</h2>
            <ul className="mt-4 border-t border-rule">
              <li className="flex flex-wrap items-center justify-between gap-x-6 border-b border-rule py-3">
                <span><span className="font-bold">{app.guardian}</span><span className="text-muted"> · parent or guardian</span></span>
                <span className="flex flex-wrap gap-2"><a href={`tel:${app.phone}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> {app.phone}</a><a href={wa(app.phone)} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a></span>
              </li>
              {d?.emergencies.map((e, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-rule py-3">
                  <span><span className="font-bold">{e.name}</span>{e.relationship ? <span className="text-muted"> · {e.relationship}</span> : null}</span>
                  <a href={`tel:${e.phone}`} className="inline-flex min-h-11 items-center font-semibold text-purple underline underline-offset-4">{e.phone}</a>
                </li>
              ))}
            </ul>
          </section>

          {d && (
            <section aria-labelledby="care">
              <h2 id="care" className="text-xl">Health and care <span className="text-[0.9rem] font-normal text-muted">(confidential: for the people looking after this child only)</span></h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Fact label="Allergies" value={d.allergies} />
                <Fact label="Existing conditions" value={d.conditions} />
                <Fact label="Medication" value={d.medication} />
                <Fact label="Special needs" value={d.specialNeeds} />
                <Fact label="Physical disabilities or support" value={d.disabilities} />
                <Fact label="Other conditions" value={d.otherConditions} />
                <Fact label="Swimming" value={d.swimming} />
                <Fact label="Doctor" value={[d.doctor, d.doctorPhone].filter(Boolean).join(" · ")} />
                <Fact label="Hospital" value={d.hospital} />
                <Fact label="Blood group" value={d.blood} />
                <Fact label="Insurance" value={[d.insurer, d.policy].filter(Boolean).join(" · ")} />
                <Fact label="Preferred name" value={d.nickname} />
              </dl>
              {!(d.allergies || d.conditions || d.medication || d.specialNeeds || d.disabilities || d.otherConditions) && <p className="mt-4 text-muted">The parent noted no allergies, conditions or medication.</p>}
            </section>
          )}
        </div>

        <aside aria-labelledby="notes" className="lg:self-start">
          <h2 id="notes" className="text-xl">Notes</h2>
          <p className="mt-2 text-muted">Write what you notice: how they are getting on, what they enjoyed, anything the family would like to hear. A shared note is also read by the parent.</p>
          <div className="mt-5"><NoteForm applicationId={app.id} onFamilyPage={Boolean(app.familyId)} /></div>
          <div className="mt-10 border-t border-rule">
            {notes.length === 0 ? (
              <div className="pt-6"><Empty icon="clipboard" title="No notes yet">Your first note appears here.</Empty></div>
            ) : (
              notes.map((n) => (
                <article key={n.id} className="border-b border-rule py-5">
                  <p className="flex flex-wrap items-center gap-2 text-[0.92rem] text-muted"><span className="font-semibold text-ink">{n.by}</span> · {formatStamp(n.createdAt)} {n.shared ? <Chip tone="ok">Shared with the family</Chip> : <Chip>Camp team only</Chip>}</p>
                  <p className="mt-2 whitespace-pre-line break-words">{n.words || "This note could not be opened."}</p>
                  {(n.byId === user.id || keeper) && <div className="mt-3"><RemoveNote id={n.id} /></div>}
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
