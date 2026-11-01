import { CalendarPlus } from "lucide-react";
import { Button } from "./ui";
import { Until } from "./Countdown";
import { categoryLabel } from "@/content/events";
import { formatEventDates, formatMoney, googleCalendarUrl } from "@/lib/time";
import type { EventDoc } from "@/lib/types";

/** One event as a row: date, what and where, then the action. No box, no photo to compete with the words. */
export function EventRow({ event, showCountdown, level = 3 }: { event: EventDoc; showCountdown?: boolean; level?: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  const d = new Date(event.start);
  const day = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", day: "numeric" }).format(d);
  const mon = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", month: "short", year: "numeric" }).format(d);
  return (
    <article className="grid gap-x-8 gap-y-4 border-b border-rule py-8 md:grid-cols-[7rem_minmax(0,1fr)_auto] md:items-start">
      <p aria-hidden className="flex items-baseline gap-2 md:block">
        <span className="block text-[3.2rem] font-extrabold leading-none [font-variation-settings:'wdth'_86] md:text-[4rem]">{day}</span>
        <span className="text-[0.95rem] font-semibold text-muted">{mon}</span>
      </p>
      <div>
        <p className="text-[0.9rem] font-semibold text-purple">{categoryLabel[event.category]}</p>
        <Heading className="mt-1 text-[1.6rem] leading-tight">{event.title}</Heading>
        {event.subtitle && <p className="mt-1 text-muted">{event.subtitle}</p>}
        <dl className="mt-4 grid gap-x-8 gap-y-1 text-[0.98rem] sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold">When</dt><dd className="text-muted">{formatEventDates(event.start, event.end)}</dd>
          {event.location && <><dt className="font-semibold">Where</dt><dd className="text-muted">{event.location}</dd></>}
          {typeof event.fee === "number" && event.fee > 0 && <><dt className="font-semibold">Cost</dt><dd className="text-muted">{formatMoney(event.fee)} per person</dd></>}
        </dl>
        {event.details && <p className="reading mt-3 text-muted">{event.details}</p>}
        {showCountdown && <p className="mt-3 font-semibold text-purple"><Until to={event.start} /></p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:flex-col md:items-end">
        {event.registrationOpen ? <Button href={event.registerHref || "/events/register"}>Register</Button> : <p className="font-semibold text-muted">Registration closed</p>}
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-semibold text-purple underline decoration-purple/40 underline-offset-[6px] hover:decoration-purple"><CalendarPlus className="size-4" aria-hidden /> Add to calendar</a>
      </div>
    </article>
  );
}
