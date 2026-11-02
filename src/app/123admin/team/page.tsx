import { Plus } from "lucide-react";
import { requirePerm, users } from "@/lib/auth";
import { departmentName } from "@/lib/rbac";
import { formatStamp } from "@/lib/time";
import { pendingRequestCount } from "@/lib/access";
import { Chip, LinkButton, PageTitle, Row } from "@/components/admin/ui";

export const metadata = { title: "Team and access" };

export default async function TeamPage() {
  await requirePerm("users");
  const list = (await users.list()).sort((a, b) => a.name.localeCompare(b.name));
  const waiting = await pendingRequestCount();
  return (
    <>
      <PageTitle title="Team and access" icon="shield" lead="Everyone who can sign in. Each department head can change only what their department owns." actions={<><LinkButton href="/123admin/team/requests" icon="guest">Access requests{waiting ? ` (${waiting})` : ""}</LinkButton><LinkButton href="/123admin/team/door" icon="key">Team door</LinkButton><LinkButton href="/123admin/team/new" variant="primary"><Plus className="size-4" aria-hidden /> Add a person</LinkButton></>} />
      <div className="mt-8 border-t border-rule">
        {list.map((u) => (
          <Row
            key={u.id}
            href={`/123admin/team/${u.id}`}
            icon={u.role === "admin" ? "shield" : "users"}
            title={<>{u.name} <span className="font-normal text-muted">{u.email}</span></>}
            meta={`${u.role === "admin" ? "Administrator: can change everything" : u.departments.map(departmentName).join(", ")}${u.googleSub ? " · Google" : ""}`}
            aside={<span className="flex flex-col items-end gap-1">{!u.active ? <Chip tone="warn">Switched off</Chip> : u.mustChange ? <Chip tone="new">Has not signed in yet</Chip> : <Chip tone="ok">Active</Chip>}{u.lastLogin && <span className="text-[0.82rem] text-muted">Last in {formatStamp(u.lastLogin)}</span>}</span>}
          />
        ))}
      </div>
    </>
  );
}
