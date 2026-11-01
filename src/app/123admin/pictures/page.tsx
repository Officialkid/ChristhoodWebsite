import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { getSlots } from "@/lib/content";
import { slotGroups } from "@/content/slots";
import { store } from "@/lib/store";
import SlotEditor from "@/components/admin/SlotEditor";
import { Notice, PageTitle } from "@/components/admin/ui";
import { Icon } from "@/components/icons";

export const metadata = { title: "Page pictures" };

const groupIcon: Record<string, string> = { home: "home", about: "about", lists: "compass", connect: "guest", ministry: "church", programme: "sprout" };

export default async function PicturesPage() {
  await requirePerm("images");
  const slots = store.writable ? await getSlots() : {};
  return (
    <>
      <PageTitle title="Page pictures" icon="image-plus" lead="Pick a page, choose a new picture, and it changes on the website straight away. Pictures from the photo library or the church's own photos both work." />
      <div className="mt-8 grid gap-12">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">You can look around, but changes cannot be saved until the database is connected.</Notice>}
        <nav aria-label="Jump to a group" className="flex flex-wrap gap-2">
          {slotGroups.map((g) => <a key={g.id} href={`#${g.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-rule px-3.5 text-[0.95rem] font-semibold hover:border-ink"><Icon name={groupIcon[g.id]} className="size-4 text-purple" />{g.title}</a>)}
        </nav>
        {slotGroups.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id={`${g.id}-h`} className="flex items-center gap-3 text-2xl"><Icon name={groupIcon[g.id]} className="size-6 text-purple" />{g.title}</h2>
              <Link href={g.href} target="_blank" className="text-[0.95rem] font-semibold text-purple underline underline-offset-4">View on the website</Link>
            </div>
            <ul className="mt-3 border-t border-rule">
              {g.slots.map((s) => <SlotEditor key={s.key} slotKey={s.key} label={s.label} fallback={s.fallback} defaultFocus={s.focus} src={slots[s.key]?.src} focus={slots[s.key]?.focus} changedBy={slots[s.key]?.updatedBy} />)}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
