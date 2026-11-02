import { recentActivity, requirePerm } from "@/lib/auth";
import { ago } from "@/lib/ago";
import { formatStamp } from "@/lib/time";
import { DataTable, Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Activity log" };

export default async function ActivityPage() {
  await requirePerm("system");
  const list = await recentActivity(150);
  return (
    <>
      <PageTitle title="Activity log" lead="Who changed what, and when. The latest 150 changes." />
      <div className="mt-8">
        {list.length === 0 ? (
          <Empty icon="history" title="Nothing yet">Changes will be listed here as the team works.</Empty>
        ) : (
          <DataTable caption="The latest changes" head={[{ label: "Who" }, { label: "What" }, { label: "When", className: "r" }]}>
            {list.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold">{a.by}</td>
                <td>{a.action}{a.target ? <>: <span className="text-muted">{a.target}</span></> : null}</td>
                <td className="r"><time dateTime={a.at} title={formatStamp(a.at)}>{ago(a.at)}</time></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </>
  );
}
