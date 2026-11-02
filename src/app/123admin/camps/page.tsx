import Link from "next/link";
import { Download } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { campScope } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { redirect } from "next/navigation";
import { formatStamp } from "@/lib/time";
import { ago } from "@/lib/ago";
import { shortCamp } from "@/lib/names";
import { btnClass, DataTable, Empty, FilterLinks, LinkButton, Notice, PageTitle, Status } from "@/components/admin/ui";
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
        lead="Applications from parents for the Jewels and Teen Life camps. Open one to read the details, check the payment and approve it."
        actions={<><LinkButton href="/123admin/camps/returning" icon="users">Returning campers</LinkButton><a href="/api/admin/export?kind=camps" className={btnClass.secondary}><Download className="size-4" aria-hidden /> Download list</a></>}
      />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Applications cannot be kept until the database is connected.</Notice>}
        <FilterLinks label="Filter by decision" items={[{ href: "/123admin/camps", label: "All", count: all.length, current: !status }, ...tabs.map((t) => ({ href: `/123admin/camps?status=${encodeURIComponent(t)}`, label: t, count: count(t), current: status === t }))]} />
        {list.length === 0 ? (
          <Empty icon="tent" title={all.length ? "Nothing matches" : "No applications yet"}>{all.length ? "Try a different filter." : "They appear here as soon as a parent sends the camp application."}</Empty>
        ) : (
          <DataTable caption="Camp applications" head={[{ label: "Child" }, { label: "Camp" }, { label: "Parent or guardian" }, { label: "Received" }, { label: "Decision" }, { label: "Payment" }]}>
            {list.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/123admin/camps/${a.id}`} className="a-go font-bold">{a.childName}</Link> <span className="text-muted">· age {a.ageAtCamp}</span>{a.ageReview && <span className="ml-3"><Status tone="warn">Check age</Status></span>}</td>
                <td>{shortCamp(a.eventTitle)}</td>
                <td>{a.guardian}</td>
                <td><time dateTime={a.createdAt} title={formatStamp(a.createdAt)}>{ago(a.createdAt)}</time></td>
                <td className="k"><Status tone={tone(a.status)}>{a.status}</Status></td>
                <td>{a.status === "Declined" ? null : a.paymentVerified ? <Status tone="ok">Paid</Status> : <Status>Not checked</Status>}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </>
  );
}
