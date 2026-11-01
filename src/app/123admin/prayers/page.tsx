import { Download } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { canReadPrayer } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import { PrayerInbox } from "@/components/admin/Inbox";
import { Notice, PageTitle } from "@/components/admin/ui";
import type { Prayer } from "@/lib/types";

export const metadata = { title: "Prayer requests" };

export default async function PrayersPage() {
  const user = await requirePerm("prayers");
  const all = await collection<Prayer>("prayers").list().catch(() => []);
  const prayers = all.filter((p) => canReadPrayer(user, p));
  const hidden = all.length - prayers.length;
  return (
    <>
      <PageTitle
        title="Prayer requests"
        icon="prayer"
        lead="Prayer requests and thanksgivings. Please keep what you read here in confidence."
        actions={<a href="/api/admin/export?kind=prayers" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/35 px-5 text-[0.95rem] font-semibold hover:bg-ink hover:text-paper"><Download className="size-4" aria-hidden /> Download list</a>}
      />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Requests sent from the website cannot be kept until the database is connected.</Notice>}
        {hidden > 0 && <Notice>{hidden} {hidden === 1 ? "request is" : "requests are"} for the pastoral team only and {hidden === 1 ? "is" : "are"} not shown to you. This keeps the promise made on the form.</Notice>}
        <PrayerInbox prayers={prayers} />
      </div>
    </>
  );
}
