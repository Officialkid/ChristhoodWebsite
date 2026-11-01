import { notFound } from "next/navigation";
import { requirePerm, users } from "@/lib/auth";
import { departments } from "@/lib/rbac";
import { ministries } from "@/content/ministries";
import { programmes } from "@/content/programmes";
import TeamForm from "@/components/admin/TeamForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Team member" };

export default async function TeamMember({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requirePerm("users");
  const user = id === "new" ? undefined : await users.get(id);
  if (id !== "new" && !user) notFound();

  const m = new Set(ministries.map((x) => x.slug));
  const p = new Set(programmes.map((x) => x.slug));
  const groups = [
    { title: "Shared teams", items: departments.filter((d) => ["web", "media", "pastoral"].includes(d.id)) },
    { title: "Ministries", items: departments.filter((d) => m.has(d.id) && d.id !== "media") },
    { title: "Programmes", items: departments.filter((d) => p.has(d.id)) },
  ];
  return (
    <>
      <PageTitle title={user ? user.name : "Add a person"} icon="shield" crumbs={[{ label: "Team and access", href: "/123admin/team" }, { label: user ? "Edit" : "New" }]} />
      <div className="mt-8"><TeamForm user={user ?? undefined} groups={groups} selfId={me.id} /></div>
    </>
  );
}
