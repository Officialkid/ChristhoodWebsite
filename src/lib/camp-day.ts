import "server-only";
import { unseal } from "./crypto";
import { mayCareForCampers, mayKeepRoster, mayOpenCamp } from "./rbac";
import { collection } from "./store";
import { fmt, toNairobiInput } from "./time";
import type { CampApplication, CampAssignment, CampAttendance, CampNote, CampSealed, CampSession, StoredUser } from "./types";

/**
 * Camp days: the timetable, the expected list, who looks after which camper, attendance and notes.
 * Head facilitators see names, ages, phone numbers and the photo rule, never health details. A facilitator opens the care
 * details of only the campers they were given.
 */
export const campApplications = collection<CampApplication>("camp-applications");
export const campSessions = collection<CampSession>("camp-sessions");
export const campAssignments = collection<CampAssignment>("camp-assignments");
export const campAttendance = collection<CampAttendance>("camp-attendance");
export const campNotes = collection<CampNote>("camp-notes");

export const attendanceId = (applicationId: string, date: string) => `${applicationId}~${date}`;

/** The Nairobi calendar day of a moment, like 2026-12-01. */
export const nairobiDay = (iso: string) => toNairobiInput(iso).slice(0, 10);
export const todayInNairobi = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

/** Every day a camp runs, first to last (at most 31). */
export function campDays(event: { start: string; end?: string }): string[] {
  const first = nairobiDay(event.start);
  const last = event.end ? nairobiDay(event.end) : first;
  if (!first) return [];
  const out: string[] = [];
  const stop = Date.parse(`${last >= first ? last : first}T00:00:00Z`);
  for (let t = Date.parse(`${first}T00:00:00Z`); t <= stop && out.length < 31; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/** The day to open first: the one asked for, else today if the camp is on, else the nearest end. */
export function pickDay(days: string[], wanted?: string): string {
  if (wanted && days.includes(wanted)) return wanted;
  const today = todayInNairobi();
  if (days.includes(today)) return today;
  return today < days[0] ? days[0] : days[days.length - 1];
}

export const dayLabel = (date: string) => fmt({ weekday: "long", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00+03:00`));
export const dayShort = (date: string) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00+03:00`));

export const timeOk = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const dateOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** Approved campers for one camp, by name. */
export async function approvedFor(eventId: string): Promise<CampApplication[]> {
  return (await campApplications.list()).filter((a) => a.eventId === eventId && a.status === "Approved").sort((a, b) => a.childName.localeCompare(b.childName));
}

/** Only the photo rule is read from the sealed details, so a list can warn "no photos" without showing anything else. */
export async function photoRule(app: CampApplication): Promise<"Yes" | "No" | undefined> {
  try {
    return (await unseal<CampSealed>(app.sealed)).mediaConsent;
  } catch {
    return undefined;
  }
}

/** May this person mark this camper present or away? Head facilitators and the camp office can mark anyone. */
export const mayMarkFor = (user: Pick<StoredUser, "id" | "role" | "departments">, assignment?: CampAssignment | null) => mayKeepRoster(user) || assignment?.userId === user.id;

/** May this person open this camper's care details and notes? Their own campers (while they are still a facilitator), or anyone the camp office already reads. */
export const mayOpenCare = (user: Pick<StoredUser, "id" | "role" | "departments">, app: CampApplication, assignment?: CampAssignment | null) => (assignment?.userId === user.id && mayCareForCampers(user)) || mayOpenCamp(user, app);
