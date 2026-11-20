import Link from "next/link";
import { redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { mayCareForCampers, mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { site } from "@/content/site";
import { PrintButton } from "@/components/admin/PrintButton";
import { DataTable, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Facilitator guide" };

const office = `0${site.whatsapp.camps.replace(/^254/, "")}`;
const link = "font-semibold text-purple underline underline-offset-4";

/** The order a facilitator meets things in: a day on the job. Each part is one short job in plain words. */
const parts: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "start",
    title: "Signing in",
    body: (
      <>
        <p>Use the email and password the administrators gave you. The first time, you may be asked to choose a password of your own before anything else opens. Do that first.</p>
        <p>The team area works on a phone. Sign out when you hand your phone to someone else.</p>
      </>
    ),
  },
  {
    id: "camp-days",
    title: "Where camp lives",
    body: (
      <>
        <p>Open <strong>Camp days</strong> in the menu. It lists every camp that has approved campers. Open a camp and you land on one day of it, with the timetable on top and the register below.</p>
        <p>When a camp has several days, choose the day with the tabs above the timetable. The camp opens on today&rsquo;s date once it has started.</p>
      </>
    ),
  },
  {
    id: "gate",
    title: "At the gate: receiving and handing back",
    body: (
      <>
        <p>Open a camp and press <strong>Gate desk</strong>. It lists everyone expected that day: children with an approved application, children who came to this camp before, and any child added on the day. Type a name in the search box and the list narrows as you type.</p>
        <p>When a parent arrives: find the child, press <strong>Check in</strong>, and write who is bringing them. The box starts with the parent&rsquo;s name, so change it if someone else is dropping the child off. Write anyone else the parent allows to collect, and tick <strong>Medicine was handed in</strong> if it was. Check the <strong>No photos</strong> mark before anyone takes a picture.</p>
        <p>A child who is not on the list: open <strong>A child who is not on the list</strong> at the bottom, write their name, age, parent and a phone number, then check them in like the others. They stay on the list for the rest of the camp.</p>
        <p>At the end of the day, find the child, press <strong>Sign out</strong> and write who is collecting. If it is not the person who brought them or someone the parent named, ask to see who they are before the child goes. A tap in the wrong place is fixed with <strong>Undo</strong>.</p>
        <p>Children not yet received show under <strong>Not here yet</strong>. A head facilitator can call those parents. If the phones or the signal fail, the head facilitators download the <strong>Paper list</strong> and tick it by hand, then enter it later.</p>
      </>
    ),
  },
  {
    id: "campers",
    title: "Your campers",
    body: (
      <>
        <p>The head facilitators give each facilitator a group of children. Until they do, you can read the timetable but your list is empty. If it is still empty on the first morning, tell a head facilitator.</p>
        <p>Next to each name you will find the parent&rsquo;s phone number. Tap it to call.</p>
      </>
    ),
  },
  {
    id: "register",
    title: "Marking who is here",
    body: (
      <>
        <p>Press <strong>Here</strong> or <strong>Away</strong> beside a child. Pressing the same button again takes the mark off, so a wrong tap is easy to undo.</p>
        <p>The line above the list counts as you go: how many are here, how many are away, how many are not marked yet. Marks are kept for each day separately.</p>
        <p>The team on the ground keeps the register. You mark your own campers; head facilitators and the camp office can mark anyone.</p>
      </>
    ),
  },
  {
    id: "care",
    title: "Care details",
    body: (
      <>
        <p>Open <strong>Care details and notes</strong> under a child&rsquo;s name to see the parent and emergency contacts, allergies, conditions, medication and the doctor. This is the parent&rsquo;s private information and it is for the people looking after that child.</p>
        <p>You can open only the children given to you. Every time someone opens a child&rsquo;s care details, the activity log records who and when. It records the opening, never the content.</p>
        <p>A child marked <strong>No photos</strong> in the list must not be photographed or filmed. The same warning shows at the top of their page.</p>
      </>
    ),
  },
  {
    id: "notes",
    title: "Notes for the family",
    body: (
      <>
        <p>On a child&rsquo;s page, write a note about how they are getting on. Tick <strong>Share this note with the family</strong> and the parent reads it on their family page. Leave it unticked and only the camp team can read it.</p>
        <p>Never put health details in a note you share. A note can be removed by the person who wrote it or by a head facilitator.</p>
        <p>A shared note reaches a parent only if the family has a family page. The camp office can link an application to one.</p>
      </>
    ),
  },
  {
    id: "photos",
    title: "Photos for a family",
    body: (
      <p>Below the notes, a child&rsquo;s page can hold private photos for their own family. They are not added to the website photo library, and only that child&rsquo;s signed-in family can see them. You can add one when the parent allowed photos and the family has a family page.</p>
    ),
  },
  {
    id: "timetable",
    title: "The timetable",
    body: (
      <p>Facilitators read the timetable. Head facilitators write it and change it. Families can read the note on each line, so a line such as &ldquo;bring a towel&rdquo; reaches them too.</p>
    ),
  },
  {
    id: "stuck",
    title: "If something is not right",
    body: (
      <>
        <p>A child is missing from your list, or you cannot open a child&rsquo;s page: ask a head facilitator to check who the child is given to.</p>
        <p>A page says the private details could not be opened: tell an administrator. The details are safe; they just need someone with access to look.</p>
        <p>For anything else on camp, call or WhatsApp the camp office on <a className={link} href={`https://wa.me/${site.whatsapp.camps}`}>{office}</a>.</p>
      </>
    ),
  },
];

const yes = "Yes";
const no = "No";
const rows: [string, string, string, string][] = [
  ["Read the timetable", yes, yes, yes],
  ["Change the timetable", no, yes, yes],
  ["See everyone expected at camp", no, yes, yes],
  ["Give children to facilitators", no, yes, yes],
  ["Check children in and out at the gate", yes, yes, yes],
  ["See the parent’s phone number at the gate", no, yes, yes],
  ["Mark attendance", "Own campers", "Anyone", "Anyone"],
  ["Open care details and write notes", "Own campers", no, "Every camper"],
  ["Download the register", no, yes, yes],
  ["Review applications and payments", no, no, yes],
];

export default async function FacilitatorGuidePage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayRunCampDay(user)) redirect(`${ADMIN_PATH}/no-access`);

  const keeper = mayKeepRoster(user);
  const carer = mayCareForCampers(user);
  const who = user.role === "admin" ? "an administrator" : keeper && carer ? "a head facilitator with campers" : keeper ? "a head facilitator" : carer ? "a facilitator" : "on the camp team";

  return (
    <>
      <PageTitle
        title="Facilitator guide"
        lead={<>How camp days work in the team area, in the order you will meet them. You are signed in as {who}.</>}
        crumbs={[{ label: "Camp days", href: `${ADMIN_PATH}/camps/day` }, { label: "Facilitator guide" }]}
        actions={<PrintButton />}
      />

      <div className="mt-8 grid gap-x-16 gap-y-10 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="print:hidden xl:sticky xl:top-24 xl:self-start">
          <p className="text-[0.9rem] font-semibold text-muted">On this page</p>
          <ol className="mt-2 grid gap-x-6 sm:grid-cols-2 xl:grid-cols-1">
            {[...parts, { id: "access", title: "Who can do what", body: null }].map((p) => (
              <li key={p.id}>
                <a href={`#${p.id}`} className="inline-flex min-h-9 items-center text-[0.95rem] text-ink underline-offset-4 hover:text-purple hover:underline pointer-coarse:min-h-11">{p.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid min-w-0 gap-12">
          {parts.map((p) => (
            <section key={p.id} id={p.id} aria-labelledby={`${p.id}-h`} className="scroll-mt-24 print:break-inside-avoid">
              <h2 id={`${p.id}-h`} className="border-b border-ink/30 pb-2 text-[1.15rem] leading-snug">{p.title}</h2>
              <div className="mt-4 grid max-w-[62ch] gap-3 text-[1.02rem] leading-relaxed">{p.body}</div>
            </section>
          ))}

          <section id="access" aria-labelledby="access-h" className="scroll-mt-24 print:break-inside-avoid">
            <h2 id="access-h" className="border-b border-ink/30 pb-2 text-[1.15rem] leading-snug">Who can do what</h2>
            <p className="mt-4 max-w-[62ch] text-[1.02rem] leading-relaxed">Three groups run camp days. Administrators can do everything the camp office can. Head facilitators never see health details, so a head facilitator who also looks after children is given the facilitator role as well.</p>
            <div className="mt-5">
              <DataTable labelled caption="What each group can do on camp days" head={[{ label: "Task" }, { label: "Facilitator" }, { label: "Head facilitator" }, { label: "Camp office" }]}>
                {rows.map(([task, a, b, c]) => (
                  <tr key={task}>
                    <td className="font-semibold">{task}</td>
                    <td data-label="Facilitator">{a}</td>
                    <td data-label="Head facilitator">{b}</td>
                    <td data-label="Camp office">{c}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </section>

          <p className="print:hidden max-w-[62ch] border-t border-rule pt-5 text-muted">Ready? <Link href={`${ADMIN_PATH}/camps/day`} className={link}>Open camp days</Link>.</p>
        </div>
      </div>
    </>
  );
}
