import { requirePerm, users } from "@/lib/auth";
import CampAccessManager from "@/components/admin/CampAccessManager";
import { LinkButton, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Camp access" };

export default async function CampAccessPage() {
  await requirePerm("users");
  const list = await users.list();
  const administrators = list
    .filter((user) => user.role === "admin")
    .map(({ id, name, email, active }) => ({ id, name, email, active }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const team = list
    .filter((user) => user.role === "head")
    .map(({ id, name, email, departments, active }) => ({ id, name, email, departments, active }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageTitle
        title="Camp access"
        lead="Choose who can review every camp application or only the programme they have been approved to support."
        crumbs={[{ label: "Team and access", href: "/123admin/team" }, { label: "Camp access" }]}
        actions={<LinkButton href="/123admin/team/new" variant="primary" icon="guest">Add a person</LinkButton>}
      />
      <div className="mt-8">
        <CampAccessManager administrators={administrators} team={team} />
      </div>
    </>
  );
}
