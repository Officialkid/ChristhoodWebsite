import { redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campUpdates } from "@/lib/family";
import { campScope } from "@/lib/rbac";
import { store } from "@/lib/store";
import { formatStamp } from "@/lib/time";
import { RemoveUpdate, UpdateForm } from "@/components/admin/FamilyAdmin";
import { Chip, Empty, Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Updates to families" };

const names = { all: "All camps", jewels: "Jewels", "teen-life": "Teen Life" } as const;

export default async function UpdatesPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const scope = campScope(user);
  if (scope !== "all" && scope.length === 0) redirect(`${ADMIN_PATH}/no-access`);

  const groups = (scope === "all" ? (["all", "jewels", "teen-life"] as const) : scope).map((v) => ({ value: v, label: v === "all" ? "Every family with a child at camp" : `${names[v]} families` }));
  const mine = (await campUpdates.list().catch(() => [])).filter((u) => scope === "all" || (u.camp !== "all" && scope.includes(u.camp))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageTitle title="Updates to families" icon="megaphone" lead="Short messages parents read on their family page: what to bring, pick-up times, news from camp." crumbs={[{ label: "Camp applications", href: "/123admin/camps" }, { label: "Updates to families" }]} />
      <div className="mt-8 grid gap-12">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Updates cannot be posted until the database is connected.</Notice>}
        <UpdateForm groups={groups} />
        <section aria-labelledby="posted">
          <h2 id="posted" className="text-xl">Posted so far</h2>
          {mine.length === 0 ? (
            <div className="mt-4"><Empty icon="megaphone" title="Nothing posted yet">Your first update will appear here.</Empty></div>
          ) : (
            <ul className="mt-4 border-t border-rule">
              {mine.map((u) => (
                <li key={u.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-rule py-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{u.title} <Chip>{names[u.camp]}</Chip></p>
                    <p className="text-[0.9rem] text-muted">{u.by} · {formatStamp(u.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-line break-words text-muted">{u.body}</p>
                  </div>
                  <RemoveUpdate id={u.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
