import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { ensureSeeded, leadersDb, storiesDb } from "@/lib/content";
import { LeaderForm, StoryForm } from "@/components/admin/ContentForms";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Leader or story" };

export default async function PersonEditor({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  await requirePerm("people");
  if (kind !== "leader" && kind !== "story") notFound();
  await ensureSeeded("people").catch(() => undefined);
  const crumbs = (label: string) => [{ label: "Leaders and stories", href: "/123admin/people" }, { label }];

  if (kind === "leader") {
    const leader = id === "new" ? undefined : await leadersDb.get(id);
    if (id !== "new" && !leader) notFound();
    return (
      <>
        <PageTitle title={leader ? leader.name : "Add a leader"} icon="users" crumbs={crumbs(leader ? "Edit leader" : "New leader")} />
        <div className="mt-8"><LeaderForm leader={leader ?? undefined} /></div>
      </>
    );
  }
  const story = id === "new" ? undefined : await storiesDb.get(id);
  if (id !== "new" && !story) notFound();
  return (
    <>
      <PageTitle title={story ? story.name : "Add a story"} icon="quote" crumbs={crumbs(story ? "Edit story" : "New story")} />
      <div className="mt-8"><StoryForm story={story ?? undefined} /></div>
    </>
  );
}
