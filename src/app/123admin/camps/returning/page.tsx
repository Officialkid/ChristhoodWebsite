import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { unseal } from "@/lib/crypto";
import { campScope, mayOpenCamp } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { CamperImport, CamperList, type CamperView } from "@/components/admin/CamperList";
import { Notice, PageTitle } from "@/components/admin/ui";
import type { Camper, CamperSealed } from "@/lib/types";

export const metadata = { title: "Returning campers" };

export default async function ReturningCampersPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const scope = campScope(user);
  if (scope !== "all" && scope.length === 0) redirect(`${ADMIN_PATH}/no-access`);

  const records = (await collection<Camper>("campers").list().catch(() => [])).filter((c) => mayOpenCamp(user, c));
  let failed = 0;
  const campers: CamperView[] = [];
  for (const c of records) {
    let d: CamperSealed = {};
    try {
      d = await unseal<CamperSealed>(c.sealed);
    } catch {
      failed++;
    }
    campers.push({ id: c.id, name: c.name, camp: c.camp, year: c.year, age: d.age, guardian: d.guardian, location: d.location, contact: d.contact });
  }
  campers.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageTitle
        title="Returning campers"
        icon="users"
        lead="Children who came to camp before. Call their families to invite them back, then they apply online like everyone else."
        crumbs={[{ label: "Camp applications", href: "/123admin/camps" }, { label: "Returning campers" }]}
        actions={<a href="/api/admin/export?kind=campers" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/35 px-5 text-[0.95rem] font-semibold hover:bg-ink hover:text-paper"><Download className="size-4" aria-hidden /> Download list</a>}
      />
      <div className="mt-8 grid gap-8">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">The list cannot be kept until the database is connected.</Notice>}
        {failed > 0 && <Notice tone="bad" title="Some private details could not be opened">The registration key may have changed. Names are still shown.</Notice>}
        <Notice>Ages and attendance come from the 2025 register and have not been verified. Phone numbers were not in the register: add them by importing an updated file.</Notice>
        {scope === "all" && <CamperImport />}
        <CamperList campers={campers} />
      </div>
    </>
  );
}
