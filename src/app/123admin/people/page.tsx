import { Plus } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { ensureSeeded, leadersDb, shipped, storiesDb } from "@/lib/content";
import { store } from "@/lib/store";
import { LinkButton, Notice, PageTitle, Row } from "@/components/admin/ui";

export const metadata = { title: "Leaders and stories" };

export default async function PeoplePage() {
  await requirePerm("people");
  await ensureSeeded("people").catch(() => undefined);
  const [leaders, stories] = store.writable ? await Promise.all([leadersDb.list(), storiesDb.list()]) : [shipped.leaders, shipped.stories];
  return (
    <>
      <PageTitle title="Leaders and stories" icon="users" lead="The leadership page and the “In their words” quotes on the home page." />
      <div className="mt-8 grid gap-12">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">You can see what is on the site, but changes cannot be saved until the database is connected.</Notice>}
        <section aria-labelledby="leaders">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="leaders" className="text-2xl">Leaders</h2>
            <LinkButton href="/123admin/people/leader/new" variant="primary"><Plus className="size-4" aria-hidden /> Add a leader</LinkButton>
          </div>
          <div className="mt-4 border-t border-rule">{[...leaders].sort((a, b) => a.order - b.order).map((l) => <Row key={l.id} href={`/123admin/people/leader/${l.id}`} icon="users" title={l.name} meta={l.role} />)}</div>
        </section>
        <section aria-labelledby="stories">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="stories" className="text-2xl">Stories</h2>
            <LinkButton href="/123admin/people/story/new" variant="primary"><Plus className="size-4" aria-hidden /> Add a story</LinkButton>
          </div>
          <div className="mt-4 border-t border-rule">{[...stories].sort((a, b) => a.order - b.order).map((s) => <Row key={s.id} href={`/123admin/people/story/${s.id}`} icon="quote" title={s.name} meta={s.role || s.quote.slice(0, 90)} />)}</div>
        </section>
      </div>
    </>
  );
}
