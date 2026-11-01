import { Download } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { collection, store } from "@/lib/store";
import { GuestInbox } from "@/components/admin/Inbox";
import { LinkButton, Notice, PageTitle } from "@/components/admin/ui";
import type { Visitor } from "@/lib/types";

export const metadata = { title: "New guests" };

export default async function GuestsPage() {
  const user = await requirePerm("visitors");
  const guests = await collection<Visitor>("visitors").list().catch(() => []);
  return (
    <>
      <PageTitle
        title="New guests"
        icon="guest"
        lead="People who registered a visit. Call or WhatsApp them, then mark them as contacted so the team knows who has been followed up."
        actions={<><LinkButton href="/123admin/share" icon="qr">QR code for the entrance</LinkButton><a href="/api/admin/export?kind=guests" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/35 px-5 text-[0.95rem] font-semibold hover:bg-ink hover:text-paper"><Download className="size-4" aria-hidden /> Download list</a></>}
      />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Forms sent from the website cannot be kept until the database is connected.</Notice>}
        <GuestInbox guests={guests} canDelete={user.role === "admin" || user.departments.includes("pastoral")} />
      </div>
    </>
  );
}
