import { notFound, redirect } from "next/navigation";
import { ADMIN_PATH, requireEvents } from "@/lib/auth";
import { ensureSeeded, eventsDb } from "@/lib/content";
import { canEditEvent, eventDepartments, can } from "@/lib/rbac";
import { toNairobiInput } from "@/lib/time";
import EventForm from "@/components/admin/EventForm";
import { Notice, PageTitle } from "@/components/admin/ui";
import { store } from "@/lib/store";

export const metadata = { title: "Event" };

export default async function EventEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireEvents();
  await ensureSeeded("events").catch(() => undefined);
  const event = id === "new" ? undefined : await eventsDb.get(id);
  if (id !== "new" && !event) notFound();
  if (event && !canEditEvent(user, event)) redirect(`${ADMIN_PATH}/events`);
  const departments = eventDepartments(user).map((d) => ({ id: d.id, name: d.name }));
  return (
    <>
      <PageTitle title={event ? event.title : "Add an event"} icon="calendar" crumbs={[{ label: "Events", href: "/123admin/events" }, { label: event ? "Edit" : "New" }]} />
      <div className="mt-8 max-w-3xl">
        {!store.writable && <div className="mb-6"><Notice tone="warn" title="Saving is not switched on yet">You can look around, but nothing can be saved until the database is connected.</Notice></div>}
        <EventForm event={event ?? undefined} departments={departments} startValue={toNairobiInput(event?.start)} endValue={toNairobiInput(event?.end)} canPickNone={user.role === "admin" || can(user, "events:all")} />
      </div>
    </>
  );
}
