/** Nairobi has no clock changes and is always 3 hours ahead of UTC. */
const NAIROBI_OFFSET_MS = 3 * 3600 * 1000;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type GatheringWindow = { start: number; end: number };

/** The current or next occurrence of the weekly gathering, as UTC milliseconds. */
export function gatheringWindow(day: string, start: string, end: string, now = Date.now()): GatheringWindow {
  const target = Math.max(0, DAYS.indexOf(day));
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const nairobi = new Date(now + NAIROBI_OFFSET_MS);
  const ahead = (target - nairobi.getUTCDay() + 7) % 7;
  const at = (offsetDays: number, h: number, m: number) =>
    Date.UTC(nairobi.getUTCFullYear(), nairobi.getUTCMonth(), nairobi.getUTCDate() + offsetDays, h, m) - NAIROBI_OFFSET_MS;
  let s = at(ahead, sh, sm);
  let e = at(ahead, eh, em);
  if (e <= now) {
    s += 7 * 86400000;
    e += 7 * 86400000;
  }
  return { start: s, end: e };
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", ...opts });

export function formatEventDates(startIso: string, endIso?: string) {
  const s = new Date(startIso);
  const e = endIso ? new Date(endIso) : undefined;
  const day = fmt({ day: "numeric" });
  const mon = fmt({ month: "short" });
  const year = fmt({ year: "numeric" });
  if (!e || s.toDateString() === e.toDateString()) return `${day.format(s)} ${mon.format(s)} ${year.format(s)}`;
  if (mon.format(s) === mon.format(e) && year.format(s) === year.format(e)) return `${day.format(s)}–${day.format(e)} ${mon.format(e)} ${year.format(e)}`;
  return `${day.format(s)} ${mon.format(s)} – ${day.format(e)} ${mon.format(e)} ${year.format(e)}`;
}

export const formatMoney = (kes: number) => `KES ${kes.toLocaleString("en-KE")}`;

/** A link that adds an event to the visitor's own Google Calendar. */
export function googleCalendarUrl(e: { title: string; start: string; end?: string; location?: string; details?: string }) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = e.end ?? new Date(new Date(e.start).getTime() + 3600_000).toISOString();
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${stamp(e.start)}/${stamp(end)}`, details: e.details ?? "Christhood Ministries", location: e.location ?? "" });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
