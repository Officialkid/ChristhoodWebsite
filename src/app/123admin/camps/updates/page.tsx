import { redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campUpdates, families, familyChildren } from "@/lib/family";
import { campScope } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { formatStamp } from "@/lib/time";
import UpdatesWorkspace, { type Audience, type UpdateRow } from "@/components/admin/UpdatesWorkspace";
import { PageHeader } from "@/components/admin/kit/PageHeader";
import { Notice } from "@/components/admin/ui";
import type { CampApplication } from "@/lib/types";

export const metadata = { title: "Updates to families" };

const names = { all: "All camps", jewels: "Jewels", "teen-life": "Teen Life" } as const;

export default async function UpdatesPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const scope = campScope(user);
  if (scope !== "all" && scope.length === 0) redirect(`${ADMIN_PATH}/no-access`);

  const [list, fams, kids, apps] = await Promise.all([
    campUpdates.list().catch(() => []),
    families.list().catch(() => []),
    familyChildren.list().catch(() => []),
    collection<CampApplication>("camp-applications").list().catch(() => []),
  ]);

  // How many family pages will show each message. A family sees "all" always, and a camp's messages when a child or application is in that camp.
  const active = new Set(fams.filter((f) => f.active).map((f) => f.id));
  const reach = (camp: "jewels" | "teen-life") => new Set([...kids.filter((k) => k.camp === camp).map((k) => k.familyId), ...apps.filter((a) => a.camp === camp && a.familyId).map((a) => a.familyId as string)].filter((id) => active.has(id))).size;
  const counts = { all: active.size, jewels: reach("jewels"), "teen-life": reach("teen-life") };

  const audiences: Audience[] = (scope === "all" ? (["all", "jewels", "teen-life"] as const) : scope).map((v) => ({ value: v, label: v === "all" ? "Every family with a child at camp" : `${names[v]} families`, short: names[v], families: counts[v] }));
  const mine: UpdateRow[] = list
    .filter((u) => scope === "all" || (u.camp !== "all" && scope.includes(u.camp)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => ({ id: u.id, title: u.title, body: u.body, camp: u.camp, audience: names[u.camp], by: u.by, createdAt: u.createdAt, stamp: formatStamp(u.createdAt) }));

  return (
    <div className="grid gap-6">
      <PageHeader title="Updates to families" description="Short messages parents read on their family page: what to bring, pick-up times, news from camp." />
      {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Updates cannot be posted until the database is connected.</Notice>}
      <UpdatesWorkspace audiences={audiences} updates={mine} writable={store.writable} />
    </div>
  );
}
