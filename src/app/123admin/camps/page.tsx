import { Download, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campScope } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { shortCamp } from "@/lib/names";
import CampApplications, { type AppRow } from "@/components/admin/CampApplications";
import { PageHeader } from "@/components/admin/kit/PageHeader";
import { btnClass, LinkButton } from "@/components/admin/ui";
import type { CampApplication } from "@/lib/types";

export const metadata = { title: "Camp applications" };

export default async function CampsPage({ searchParams }: { searchParams: Promise<{ status?: string; camp?: string }> }) {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const scope = campScope(user);
  if (scope !== "all" && scope.length === 0) redirect(`${ADMIN_PATH}/no-access`);
  const { status, camp } = await searchParams;
  const all = (await collection<CampApplication>("camp-applications").list().catch(() => [])).filter((a) => scope === "all" || (a.camp !== "other" && scope.includes(a.camp)));
  // The list gets only what it shows and what the review panel needs. Sealed answers, email and ID numbers stay on the server.
  const rows: AppRow[] = all.map((a) => ({
    id: a.id,
    childName: a.childName,
    age: a.ageAtCamp,
    ageReview: a.ageReview,
    camp: a.camp,
    campLabel: shortCamp(a.eventTitle),
    guardian: a.guardian,
    phone: a.phone,
    createdAt: a.createdAt,
    status: a.status,
    paid: a.paymentVerified,
    note: a.reviewNote,
    reviewedBy: a.reviewedBy,
  }));
  return (
    <div className="grid gap-5">
      <PageHeader
        title="Camp applications"
        description="Applications from parents for the Jewels and Teen Life camps. Open one to check the payment and make the decision."
        actions={<><LinkButton href="/123admin/camps/returning"><Users className="size-4" aria-hidden /> Returning campers</LinkButton><a href="/api/admin/export?kind=camps" className={btnClass.secondary}><Download className="size-4" aria-hidden /> Download list</a></>}
      />
      <CampApplications rows={rows} initialTab={status} initialCamp={camp} canDelete={user.role === "admin"} writable={store.writable} />
    </div>
  );
}
