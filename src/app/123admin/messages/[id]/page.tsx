import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { messagesDb } from "@/lib/content";
import { MessageForm } from "@/components/admin/ContentForms";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Message" };

export default async function MessageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePerm("messages");
  const message = id === "new" ? undefined : await messagesDb.get(id);
  if (id !== "new" && !message) notFound();
  return (
    <>
      <PageTitle title={message ? message.title : "Add a message"} icon="play" crumbs={[{ label: "Messages", href: "/123admin/messages" }, { label: message ? "Edit" : "New" }]} />
      <div className="mt-8"><MessageForm message={message ?? undefined} /></div>
    </>
  );
}
