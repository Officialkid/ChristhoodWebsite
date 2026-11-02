import { Plus } from "lucide-react";
import { requireEvents } from "@/lib/auth";
import { ensureSeeded, eventsDb } from "@/lib/content";
import { store } from "@/lib/store";
import { canEditEvent, departmentName } from "@/lib/rbac";
import { events as shippedEvents } from "@/content/events";
import { formatEventDates, formatMoney } from "@/lib/time";
import { Chip, Empty, LinkButton, Notice, PageTitle, Row } from "@/components/admin/ui";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const user = await requireEvents();
  await ensureSeeded("events").catch(() => undefined);
  const all = store.writable ? await eventsDb.list() : shippedEvents;
  const events = [...all].sort((a, b) => b.start.localeCompare(a.start));
  const now = Date.now();
  return (
    <>
      <PageTitle title="Events" lead="Camps, mentorship seasons and gatherings. What you save here appears on the website straight away." actions={<LinkButton href="/123admin/events/new" variant="primary"><Plus className="size-4" aria-hidden /> Add an event</LinkButton>} />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">You can see the events below, but changes cannot be saved until the database is connected.</Notice>}
        {events.length === 0 ? (
          <Empty icon="calendar" title="No events yet">Add the next camp or gathering so people can register.</Empty>
        ) : (
          <div className="border-t border-rule">
            {events.map((e) => {
              const editable = canEditEvent(user, e);
              const past = new Date(e.end ?? e.start).getTime() < now;
              return (
                <Row
                  key={e.id}
                  href={editable ? `/123admin/events/${e.id}` : undefined}
                  icon="calendar"
                  title={e.title}
                  meta={<>{formatEventDates(e.start, e.end)}{e.location ? ` · ${e.location}` : ""}{typeof e.fee === "number" ? ` · ${formatMoney(e.fee)}` : ""}{e.department ? ` · ${departmentName(e.department)}` : ""}</>}
                  aside={<span className="flex flex-wrap justify-end gap-1.5">{!editable && <Chip>View only</Chip>}{past ? <Chip>Finished</Chip> : e.registrationOpen ? <Chip tone="new">Registration open</Chip> : <Chip tone="ok">Coming up</Chip>}</span>}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
