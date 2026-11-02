import { redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { families, familyChildren } from "@/lib/family";
import { campScope } from "@/lib/rbac";
import { formatStamp } from "@/lib/time";
import { ResetPasswordButton } from "@/components/admin/FamilyAdmin";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Family accounts" };

export default async function FamiliesPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (campScope(user) !== "all") redirect(`${ADMIN_PATH}/no-access`);

  const [list, kids] = await Promise.all([families.list().catch(() => []), familyChildren.list().catch(() => [])]);
  const rows = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageTitle title="Family accounts" icon="users" lead="Parents who made a family page. If someone forgets their password, give them a temporary one here." crumbs={[{ label: "Camp applications", href: "/123admin/camps" }, { label: "Family accounts" }]} />
      <div className="mt-8">
        {rows.length === 0 ? (
          <Empty icon="users" title="No family accounts yet">Parents make one from the Camps menu on the website.</Empty>
        ) : (
          <ul className="border-t border-rule">
            {rows.map((f) => (
              <li key={f.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-rule py-5">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{f.name}</p>
                  <p className="text-[0.92rem] text-muted">{[f.phone, f.email, `${kids.filter((k) => k.familyId === f.id).length} child${kids.filter((k) => k.familyId === f.id).length === 1 ? "" : "ren"}`, `joined ${formatStamp(f.createdAt)}`].filter(Boolean).join(" · ")}</p>
                </div>
                <ResetPasswordButton id={f.id} name={f.name} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
