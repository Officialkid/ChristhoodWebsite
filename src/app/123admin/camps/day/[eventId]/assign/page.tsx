import { notFound, redirect } from "next/navigation";
import { ADMIN_PATH, requireUser, users } from "@/lib/auth";
import { approvedFor, campAssignments } from "@/lib/camp-day";
import { getEvents } from "@/lib/content";
import { mayCareForCampers, mayKeepRoster } from "@/lib/rbac";
import { AssignSelect, ShareOutButton } from "@/components/admin/CampDay";
import { Chip, Empty, Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Who looks after whom" };

export default async function AssignPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!mayKeepRoster(user)) redirect(`${ADMIN_PATH}/no-access`);

  const [events, approved, assignments, everyone] = await Promise.all([getEvents(), approvedFor(eventId), campAssignments.list(), users.list()]);
  const event = events.find((e) => e.id === eventId);
  if (!event && approved.length === 0) notFound();
  const title = event?.title ?? approved[0].eventTitle;
  const team = everyone.filter((u) => u.active && mayCareForCampers(u)).sort((a, b) => a.name.localeCompare(b.name));
  const given = new Map(assignments.filter((a) => a.eventId === eventId).map((a) => [a.id, a]));
  const load = new Map(team.map((u) => [u.id, approved.filter((a) => given.get(a.id)?.userId === u.id).length]));
  const unassigned = approved.filter((a) => !given.has(a.id)).length;
  // Someone who was given a camper and then left or was switched off still shows, so the camper is not hidden.
  const options = team.map((u) => ({ value: u.id, label: `${u.name} (${load.get(u.id) ?? 0})` }));

  return (
    <>
      <PageTitle
        title="Who looks after whom"
        icon="users"
        lead={`${title}. Each facilitator sees, and opens the care details of, only the children given to them. Head facilitators never see health details.`}
        crumbs={[{ label: "Camp days", href: `${ADMIN_PATH}/camps/day` }, { label: title, href: `${ADMIN_PATH}/camps/day/${eventId}` }, { label: "Who looks after whom" }]}
        actions={team.length && unassigned ? <ShareOutButton eventId={eventId} /> : undefined}
      />
      <div className="mt-8 grid gap-6">
        {team.length === 0 && <Notice tone="warn" title="There are no facilitators yet">An administrator adds people to the Camp facilitators department in Team and access. They then appear here.</Notice>}
        {approved.length === 0 ? (
          <Empty icon="users" title="Nobody is approved for this camp yet">Approve applications and the children appear here.</Empty>
        ) : (
          <>
            <p className="text-muted">{approved.length} expected · {unassigned === 0 ? "everyone has a facilitator" : `${unassigned} still without one`}</p>
            <ul className="border-t border-rule">
              {approved.map((a) => {
                const owner = given.get(a.id);
                const stale = owner && !team.some((u) => u.id === owner.userId);
                return (
                  <li key={`${a.id}${owner?.userId ?? ""}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-3">
                    <p className="min-w-0 flex-1 basis-56 font-bold leading-snug">{a.childName} <span className="font-normal text-muted">· age {a.ageAtCamp}</span>{stale && <> <Chip tone="warn">{owner.userName} can no longer be given campers</Chip></>}</p>
                    <AssignSelect id={a.id} name={a.childName} current={stale ? "" : (owner?.userId ?? "")} options={options} />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
