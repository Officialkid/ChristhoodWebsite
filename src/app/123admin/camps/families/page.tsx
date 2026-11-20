import { redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { families, familyChildren } from "@/lib/family";
import { maskEmail, maskPhone } from "@/lib/mask";
import { campScope } from "@/lib/rbac";
import { formatStamp } from "@/lib/time";
import FamilyAccounts, { type FamilyRow } from "@/components/admin/FamilyAccounts";
import { PageHeader } from "@/components/admin/kit/PageHeader";

export const metadata = { title: "Family accounts" };

export default async function FamiliesPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (campScope(user) !== "all") redirect(`${ADMIN_PATH}/no-access`);

  const [list, kids] = await Promise.all([families.list().catch(() => []), familyChildren.list().catch(() => [])]);
  // Phone numbers and emails are masked here. The full details are opened one family at a time, on request, and each look is logged.
  const rows: FamilyRow[] = list.map((f) => ({
    id: f.id,
    name: f.name,
    phoneMask: maskPhone(f.phone),
    emailMask: maskEmail(f.email),
    children: kids.filter((k) => k.familyId === f.id).map((k) => ({ name: k.name, camp: k.camp === "jewels" ? "Jewels" : k.camp === "teen-life" ? "Teen Life" : undefined })),
    createdAt: f.createdAt,
    joined: formatStamp(f.createdAt),
    active: f.active,
    mustChange: Boolean(f.mustChange),
    smsUpdates: Boolean(f.smsUpdates),
  }));

  return (
    <div className="grid gap-5">
      <PageHeader title="Family accounts" description="Parents who made a family page. Open one to see their children or, if they forget their password, give them a temporary one." />
      <FamilyAccounts rows={rows} />
    </div>
  );
}
