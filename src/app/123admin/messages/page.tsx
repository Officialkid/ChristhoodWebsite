import { Plus } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { messagesDb } from "@/lib/content";
import { Empty, LinkButton, PageTitle, Row } from "@/components/admin/ui";

export const metadata = { title: "Messages to watch" };

export default async function MessagesPage() {
  await requirePerm("messages");
  const list = (await messagesDb.list().catch(() => [])).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return (
    <>
      <PageTitle title="Messages to watch" icon="play" lead="Add a sermon video. The newest one plays in the “Watch online” section of the home page." actions={<LinkButton href="/123admin/messages/new" variant="primary"><Plus className="size-4" aria-hidden /> Add a message</LinkButton>} />
      <div className="mt-8">
        {list.length === 0 ? (
          <Empty icon="play" title="No messages yet">Paste a YouTube link to add the first one.</Empty>
        ) : (
          <div className="border-t border-rule">{list.map((m) => <Row key={m.id} href={`/123admin/messages/${m.id}`} icon="play" title={m.title} meta={[m.speaker, m.date].filter(Boolean).join(" · ") || undefined} />)}</div>
        )}
      </div>
    </>
  );
}
