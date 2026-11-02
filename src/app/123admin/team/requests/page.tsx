import { ministries } from "@/content/ministries";
import { programmes } from "@/content/programmes";
import { accessRequests } from "@/lib/access";
import { requirePerm } from "@/lib/auth";
import { departments } from "@/lib/rbac";
import { formatStamp } from "@/lib/time";
import { ApproveForm, DeclineButton, RemoveRequest, ReopenButton } from "@/components/admin/AccessAdmin";
import { Chip, Empty, Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Access requests" };

export default async function AccessRequestsPage() {
  await requirePerm("users");
  const all = (await accessRequests.list().catch(() => [])).sort((a, b) => b.lastTriedAt.localeCompare(a.lastTriedAt));
  const waiting = all.filter((r) => r.status === "pending");
  const declined = all.filter((r) => r.status === "declined");

  const m = new Set(ministries.map((x) => x.slug));
  const p = new Set(programmes.map((x) => x.slug));
  const groups = [
    { title: "Shared teams", items: departments.filter((d) => d.id === "media" || !(m.has(d.id) || p.has(d.id))) },
    { title: "Ministries", items: departments.filter((d) => m.has(d.id) && d.id !== "media") },
    { title: "Programmes", items: departments.filter((d) => p.has(d.id)) },
  ];

  return (
    <>
      <PageTitle
        title="Access requests"
        icon="guest"
        lead="People who signed in with Google but are not on the team yet. Give each the role they need, or decline. They are never told why."
        crumbs={[{ label: "Team and access", href: "/123admin/team" }, { label: "Access requests" }]}
      />
      <div className="mt-8 grid gap-12">
        <Notice title="Check before you approve">Only approve someone you know. The email shown is the one Google has checked, so it cannot be faked. Anyone who has the team sign-in can ask; only you decide.</Notice>

        <section aria-labelledby="waiting" className="grid gap-4">
          <h2 id="waiting" className="text-xl">Waiting for you ({waiting.length})</h2>
          {waiting.length === 0 ? (
            <Empty icon="guest" title="Nobody is waiting">When someone signs in with Google and is not on the team, they appear here.</Empty>
          ) : (
            <ul className="border-t border-rule">
              {waiting.map((r) => (
                <li key={r.id} className="grid gap-5 border-b border-rule py-6">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0">
                      <p className="text-lg font-bold">{r.name}</p>
                      <p className="break-all text-muted">{r.email}</p>
                      <p className="mt-1 text-[0.9rem] text-muted">Asked {formatStamp(r.createdAt)}{r.tries > 1 ? ` · tried ${r.tries} times, last ${formatStamp(r.lastTriedAt)}` : ""}</p>
                    </div>
                    <DeclineButton id={r.id} name={r.name} />
                  </div>
                  <ApproveForm id={r.id} name={r.name} groups={groups} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {declined.length > 0 && (
          <section aria-labelledby="declined" className="grid gap-4">
            <h2 id="declined" className="text-xl">Declined ({declined.length})</h2>
            <ul className="border-t border-rule">
              {declined.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-4">
                  <div className="min-w-0"><p className="font-bold">{r.name} <Chip>Declined</Chip></p><p className="break-all text-[0.92rem] text-muted">{r.email} · last tried {formatStamp(r.lastTriedAt)}</p></div>
                  <span className="flex flex-wrap items-center gap-2"><ReopenButton id={r.id} name={r.name} /><RemoveRequest id={r.id} /></span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
