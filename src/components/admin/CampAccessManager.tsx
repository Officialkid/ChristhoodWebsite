"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addCampDepartment, removeCampDepartment } from "@/app/123admin/actions-team";
import { DeleteButton } from "./forms";
import { btnClass, Empty, LinkButton, Notice, Section, Status } from "./ui";

type CampDepartment = "camps" | "jewels" | "teen-life";
type TeamAccount = { id: string; name: string; email: string; active: boolean; departments: string[] };
type Administrator = { id: string; name: string; email: string; active: boolean };

const campTeams: { id: CampDepartment; title: string; access: string }[] = [
  { id: "camps", title: "Camps Department", access: "All camp applications, returning campers, camp days and both camp programme pages." },
  { id: "jewels", title: "Jewels", access: "Jewels applications and the Jewels programme page and events." },
  { id: "teen-life", title: "Teen Life", access: "Teen Life applications and the Teen Life programme page and events." },
];

export default function CampAccessManager({ administrators, team }: { administrators: Administrator[]; team: TeamAccount[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");

  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await addCampDepartment(data);
      const message = result.message ?? (result.ok ? "Camp access added." : "Could not add camp access.");
      setNotice(message);
      if (result.ok) {
        toast.success(message);
        form.reset();
        router.refresh();
      } else toast.error(message);
    });
  }

  return (
    <div className="grid gap-10">
      <Notice title="Choose the access each person needs">
        <p>Confirm the relevant department head approved each person before you give access. Administrators already have access to every camp and the rest of the team area.</p>
      </Notice>

      <Section id="camp-administrators" title="Administrators">
        <p className="mt-3 max-w-[70ch] text-muted">An active administrator can review all camp applications and manage every part of the site. To add someone with that full access, choose Administrator when you add their team account.</p>
        {administrators.length ? (
          <ul className="mt-4 border-t border-rule">
            {administrators.map((person) => (
              <li key={person.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule py-3">
                <div className="min-w-0"><Link href={`/123admin/team/${person.id}`} className="a-go font-bold">{person.name}</Link><p className="break-all text-[0.92rem] text-muted">{person.email}</p></div>
                <Status tone={person.active ? "ok" : "warn"}>{person.active ? "Full access · active" : "Switched off"}</Status>
              </li>
            ))}
          </ul>
        ) : <Empty icon="shield" title="No administrator accounts">Add an administrator from Team and access before camp applications are reviewed.</Empty>}
      </Section>

      {campTeams.map((campTeam) => {
        const assigned = team.filter((person) => person.departments.includes(campTeam.id));
        const eligible = team.filter((person) => person.active && !person.departments.includes(campTeam.id) && !(campTeam.id !== "camps" && person.departments.includes("camps")));
        const id = `camp-member-${campTeam.id}`;
        return (
          <Section key={campTeam.id} id={`camp-access-${campTeam.id}`} title={campTeam.title} aside={<Status tone={assigned.some((person) => person.active) ? "ok" : "warn"}>{assigned.filter((person) => person.active).length} active</Status>}>
            <p className="mt-3 max-w-[70ch] text-muted">{campTeam.access}</p>
            {assigned.length ? (
              <ul className="mt-4 border-t border-rule">
                {assigned.map((person) => {
                  const canRemoveHere = person.departments.some((department) => department !== campTeam.id);
                  return (
                    <li key={person.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-rule py-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/123admin/team/${person.id}`} className="a-go font-bold">{person.name}</Link>
                        <p className="break-all text-[0.92rem] text-muted">{person.email}{!person.active && " · account switched off"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link className={btnClass.ghost} href={`/123admin/team/${person.id}`}>Edit access</Link>
                        {canRemoveHere ? (
                          <DeleteButton
                            label="Remove access"
                            confirmText="Yes, remove access"
                            fields={{ userId: person.id, department: campTeam.id }}
                            action={async (formData) => {
                              const result = await removeCampDepartment(formData);
                              if (result.ok) {
                                const message = result.message ?? "Camp access removed.";
                                setNotice(message);
                                toast.success(message);
                                router.refresh();
                              }
                              return result;
                            }}
                          />
                        ) : (
                          <span className="max-w-56 text-[0.88rem] text-muted">Their only department. Add another one before removing access.</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4"><Empty icon="users" title="No one assigned yet">Choose an approved, active team member below. They will only receive the access described here.</Empty></div>
            )}

            {eligible.length ? (
              <form onSubmit={assign} className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
                <input type="hidden" name="department" value={campTeam.id} />
                <div className="w-full min-w-0 sm:max-w-lg">
                  <label htmlFor={id} className="f-label">Add an existing team member</label>
                  <select id={id} name="userId" className="f-input" defaultValue="" required disabled={pending}>
                    <option value="" disabled>Choose an active team member</option>
                    {eligible.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}
                  </select>
                </div>
                <label className="f-choice !items-start sm:max-w-[24rem]">
                  <input type="checkbox" name="departmentHeadApproved" value="yes" required disabled={pending} className="mt-1" />
                  <span className="leading-snug"><span className="font-semibold">The department head approved this person</span><span className="block text-[0.9rem] text-muted">Confirm before giving them camp access.</span></span>
                </label>
                <button type="submit" disabled={pending} className={btnClass.secondary}>
                  <Plus className="size-4" aria-hidden /> {pending ? "Saving…" : "Give access"}
                </button>
              </form>
            ) : (
              <p className="mt-5 text-[0.92rem] text-muted">There are no other active team members to add to this access group.</p>
            )}
          </Section>
        );
      })}

      <div className="grid gap-3 border-t border-rule pt-6 sm:flex sm:items-center sm:gap-5">
        <LinkButton href="/123admin/team/new" icon="guest">Add a person to the team</LinkButton>
        <p className="max-w-[65ch] text-[0.92rem] text-muted">Choose Administrator for full site access, or Department head and the approved department for limited access. A person can have more than one department.</p>
      </div>
      <p aria-live="polite" className="sr-only">{notice}</p>
    </div>
  );
}
