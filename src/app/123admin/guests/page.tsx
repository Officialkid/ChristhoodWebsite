import { Download } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { GuestInbox } from "@/components/admin/Inbox";
import { btnClass, LinkButton, Notice, PageTitle } from "@/components/admin/ui";
import type { Visitor } from "@/lib/types";

export const metadata = { title: "New members" };

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;
  const user = await requirePerm("visitors");
  const guests = await collection<Visitor>("visitors").list().catch(() => []);
  return (
    <>
      <PageTitle
        title="New members"
       
        lead="New members registered by the protocol team. Call, WhatsApp or email them, then mark them as contacted so the team knows who has been followed up."
        actions={<>{can(user, "members") && <LinkButton href="/123admin/guests/new" variant="primary" icon="guest">Register a new member</LinkButton>}<a href="/api/admin/export?kind=guests" className={btnClass.secondary}><Download className="size-4" aria-hidden /> Download list</a></>}
      />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Members cannot be saved until the database is connected.</Notice>}
        {!can(user, "members") && <Notice>Only the protocol team registers new members. You can follow them up here.</Notice>}
        <GuestInbox initialOpen={open} guests={guests} canDelete={user.role === "admin" || user.departments.includes("pastoral")} />
      </div>
    </>
  );
}
