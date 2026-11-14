import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePerm, users } from "@/lib/auth";
import { departmentName } from "@/lib/rbac";
import { ago } from "@/lib/ago";
import { formatStamp } from "@/lib/time";
import { pendingRequestCount } from "@/lib/access";
import { DataTable, LinkButton, PageTitle, Section, Status } from "@/components/admin/ui";

export const metadata = { title: "Team and access" };

export default async function TeamPage() {
  await requirePerm("users");
  const list = (await users.list()).sort((a, b) => a.name.localeCompare(b.name));
  const waiting = await pendingRequestCount();
  const activeAdmins = list.filter((u) => u.role === "admin" && u.active).map((u) => u.name).join(", ") || "No active administrators";
  const activeHeads = list.filter((u) => u.role === "head" && u.active);
  const campAssignments = [
    { label: "Camps Department", id: "camps", access: "All camp applications and camp operations" },
    { label: "Jewels", id: "jewels", access: "Jewels applications and programme" },
    { label: "Teen Life", id: "teen-life", access: "Teen Life applications and programme" },
  ];
  return (
    <>
      <PageTitle title="Team and access" lead="Everyone who can sign in. Each department head can change only what their department owns." actions={<><LinkButton href="/123admin/team/requests" icon="guest">Access requests{waiting ? ` (${waiting})` : ""}</LinkButton><LinkButton href="/123admin/team/door" icon="key">Team door</LinkButton><LinkButton href="/123admin/team/new" variant="primary"><Plus className="size-4" aria-hidden /> Add a person</LinkButton></>} />
      <div className="mt-8 grid gap-10">
        <Section id="camp-access-summary" title="Camp application access" aside={<LinkButton href="/123admin/team/camps" icon="tent">Manage camp access</LinkButton>}>
          <p className="mt-3 max-w-[70ch] text-muted">Active administrators can review all applications. Give camp access to department heads and delegates approved by the relevant department head.</p>
          <DataTable caption="Camp application access by team" head={[{ label: "Team" }, { label: "Active people" }, { label: "Access" }]}>
            <tr><th scope="row">Administrators</th><td data-label="Active people">{activeAdmins}</td><td data-label="Access">All camp applications and the full team area</td></tr>
            {campAssignments.map((team) => (
              <tr key={team.id}>
                <th scope="row">{team.label}</th>
                <td data-label="Active people">{activeHeads.filter((u) => u.departments.includes(team.id)).map((u) => u.name).join(", ") || "No one assigned"}</td>
                <td data-label="Access">{team.access}</td>
              </tr>
            ))}
          </DataTable>
        </Section>
        <div>
        <DataTable caption="Everyone who can sign in" head={[{ label: "Name" }, { label: "Can change" }, { label: "Last signed in" }, { label: "State" }]}>
          {list.map((u) => (
            <tr key={u.id}>
              <td><Link href={`/123admin/team/${u.id}`} className="a-go font-bold">{u.name}</Link> <span className="text-muted">{u.email}</span></td>
              <td>{u.role === "admin" ? "Everything" : u.departments.map(departmentName).join(", ")}{u.googleSub ? " · Google" : ""}</td>
              <td>{u.lastLogin ? <time dateTime={u.lastLogin} title={formatStamp(u.lastLogin)}>{ago(u.lastLogin)}</time> : "Never"}</td>
              <td className="k">{!u.active ? <Status tone="warn">Switched off</Status> : u.mustChange ? <Status tone="new">Has not signed in yet</Status> : <Status tone="ok">Active</Status>}</td>
            </tr>
          ))}
        </DataTable>
        </div>
      </div>
    </>
  );
}
