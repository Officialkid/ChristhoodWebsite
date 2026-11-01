import Link from "next/link";
import { Download } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campScope } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { redirect } from "next/navigation";
import { formatStamp } from "@/lib/time";
import { Chip, Empty, LinkButton, Notice, PageTitle, Row } from "@/components/admin/ui";
import type { CampApplication } from "@/lib/types";

export const metadata = { title: "Camp applications" };

const tone = (s: CampApplication["status"]) => (s === "Approved" ? "ok" : s === "Pending review" ? "new" : "warn");

export default async function CampsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const scope = campScope(user);
  if (scope !== "all" && scope.length === 0) redirect(`${ADMIN_PATH}/no-access`);
  const { status } = await searchParams;
  const all = (await collection<CampApplication>("camp-applications").list().catch(() => [])).filter((a) => scope === "all" || (a.camp !== "other" && scope.includes(a.camp)));
  const list = all.filter((a) => !status || a.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (s: string) => all.filter((a) => a.status === s).length;
  const tabs = ["Pending review", "Needs correction", "Approved", "Declined"];
  return (
    <>
      <PageTitle
        title="Camp applications"
        icon="tent"
        lead="Applications from parents for the Jewels and Teen Life camps. Open one to read the details, check the payment and approve it."
        actions={<><LinkButton href="/123admin/camps/returning" icon="users">Returning campers</LinkButton><a href="/api/admin/export?kind=camps" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/35 px-5 text-[0.95rem] font-semibold hover:bg-ink hover:text-paper"><Download className="size-4" aria-hidden /> Download list</a></>}
      />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Applications cannot be kept until the database is connected.</Notice>}
        <nav aria-label="Filter by decision" className="flex flex-wrap gap-1">
          <Link href="/123admin/camps" aria-current={!status ? "page" : undefined} className={`inline-flex min-h-11 items-center px-4 text-[0.95rem] font-semibold ${!status ? "bg-purple text-on-purple" : "border border-rule hover:border-ink"}`}>All <span className="ml-2 opacity-75">{all.length}</span></Link>
          {tabs.map((t) => <Link key={t} href={`/123admin/camps?status=${encodeURIComponent(t)}`} aria-current={status === t ? "page" : undefined} className={`inline-flex min-h-11 items-center px-4 text-[0.95rem] font-semibold ${status === t ? "bg-purple text-on-purple" : "border border-rule hover:border-ink"}`}>{t} <span className="ml-2 opacity-75">{count(t)}</span></Link>)}
        </nav>
        {list.length === 0 ? (
          <Empty icon="tent" title={all.length ? "Nothing matches" : "No applications yet"}>{all.length ? "Try a different filter." : "They appear here as soon as a parent sends the camp application."}</Empty>
        ) : (
          <div className="border-t border-rule">
            {list.map((a) => (
              <Row
                key={a.id}
                href={`/123admin/camps/${a.id}`}
                icon="tent"
                title={<>{a.childName} <span className="font-normal text-muted">· age {a.ageAtCamp}</span></>}
                meta={`${a.eventTitle} · ${a.guardian} · ${formatStamp(a.createdAt)}`}
                aside={<span className="flex flex-wrap justify-end gap-1.5"><Chip tone={tone(a.status)}>{a.status}</Chip>{a.ageReview && <Chip tone="warn">Check age</Chip>}{a.paymentVerified && <Chip tone="ok">Paid</Chip>}</span>}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
