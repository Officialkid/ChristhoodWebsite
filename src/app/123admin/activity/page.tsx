import { recentActivity, requirePerm } from "@/lib/auth";
import { formatStamp } from "@/lib/time";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Activity log" };

export default async function ActivityPage() {
  await requirePerm("system");
  const list = await recentActivity(150);
  return (
    <>
      <PageTitle title="Activity log" icon="history" lead="Who changed what, and when. The latest 150 changes." />
      <div className="mt-8">
        {list.length === 0 ? (
          <Empty icon="history" title="Nothing yet">Changes will be listed here as the team works.</Empty>
        ) : (
          <ul className="border-t border-rule">
            {list.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-1 py-3">
                <span><span className="font-semibold">{a.by}</span> {a.action.toLowerCase()}{a.target ? <>: <span className="text-muted">{a.target}</span></> : null}</span>
                <time dateTime={a.at} className="text-[0.9rem] text-muted">{formatStamp(a.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
