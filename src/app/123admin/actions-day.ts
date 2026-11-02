"use server";

import { log, newId, requireUser, users } from "@/lib/auth";
import { attendanceId, campApplications, campAssignments, campAttendance, campDays, campNotes, campSessions, dateOk, mayMarkFor, mayOpenCare, timeOk } from "@/lib/camp-day";
import { getEvents } from "@/lib/content";
import { seal } from "@/lib/crypto";
import { mayCareForCampers, mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { CampSession } from "@/lib/types";

const text = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const ok = (message: string, extra: Partial<Result> = {}): Result => ({ ok: true, message, stamp: Date.now(), ...extra });
const bad = (message: string, errors?: Record<string, string>): Result => ({ ok: false, message, errors, stamp: Date.now() });

async function guard(fn: () => Promise<Result>): Promise<Result> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof StorageUnavailable) return bad(error.message);
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error(error);
    return bad("Something went wrong. Please try again.");
  }
}

/** The days a camp runs, when the camp is still on the events list. */
async function daysOf(eventId: string): Promise<string[] | null> {
  const event = (await getEvents()).find((e) => e.id === eventId);
  return event ? campDays(event) : null;
}

/* ================= attendance ================= */

/** Marks one camper here or away for one day. Sending "clear" takes the mark off again. */
export async function markAttendance(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const app = await campApplications.get(text(fd, "id", 60));
    if (!app || app.status !== "Approved") return bad("That camper is not on the expected list.");
    const date = text(fd, "date", 10);
    const days = await daysOf(app.eventId);
    if (!dateOk(date) || (days && !days.includes(date))) return bad("That is not a day of this camp.");
    const assignment = await campAssignments.get(app.id);
    if (!mayMarkFor(user, assignment)) return bad("You can mark only the campers you look after.");
    const status = text(fd, "status", 10);
    const id = attendanceId(app.id, date);
    if (status === "clear") {
      await campAttendance.remove(id);
      return ok("Mark removed.");
    }
    if (status !== "present" && status !== "absent") return bad("Choose here or away.");
    await campAttendance.put({ id, applicationId: app.id, eventId: app.eventId, date, status, by: user.name, at: new Date().toISOString() });
    return ok(status === "present" ? "Here." : "Away.");
  });
}

/* ================= who looks after whom ================= */

export async function assignCamper(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayKeepRoster(user)) return bad("Only the head facilitators and the camp office can give campers to facilitators.");
  return guard(async () => {
    const app = await campApplications.get(text(fd, "id", 60));
    if (!app || app.status !== "Approved") return bad("That camper is not on the expected list.");
    const userId = text(fd, "userId", 60);
    if (!userId) {
      await campAssignments.remove(app.id);
      await log(user, "Took a camper off a facilitator", app.childName);
      return ok("Not assigned.");
    }
    const facilitator = await users.get(userId);
    if (!facilitator || !facilitator.active || !mayCareForCampers(facilitator)) return bad("That person cannot be given campers. Add them to Camp facilitators first.");
    await campAssignments.put({ id: app.id, eventId: app.eventId, userId: facilitator.id, userName: facilitator.name, by: user.name, at: new Date().toISOString() });
    await log(user, "Gave a camper to a facilitator", `${app.childName} → ${facilitator.name}`);
    return ok(`${app.childName} is with ${facilitator.name}.`);
  });
}

/** Shares every camper who has nobody yet among the facilitators, keeping the groups as even as possible. */
export async function shareOutCampers(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayKeepRoster(user)) return bad("Only the head facilitators and the camp office can give campers to facilitators.");
  return guard(async () => {
    const eventId = text(fd, "eventId", 80);
    const team = (await users.list()).filter((u) => u.active && mayCareForCampers(u));
    if (!team.length) return bad("There are no facilitators yet. Add people to Camp facilitators in Team and access.");
    const apps = (await campApplications.list()).filter((a) => a.eventId === eventId && a.status === "Approved").sort((a, b) => a.childName.localeCompare(b.childName));
    const mine = await campAssignments.list();
    const load = new Map(team.map((u) => [u.id, mine.filter((m) => m.eventId === eventId && m.userId === u.id).length]));
    const done = new Set(mine.map((m) => m.id));
    let n = 0;
    for (const app of apps) {
      if (done.has(app.id)) continue;
      const next = team.reduce((a, b) => ((load.get(b.id) ?? 0) < (load.get(a.id) ?? 0) ? b : a));
      load.set(next.id, (load.get(next.id) ?? 0) + 1);
      await campAssignments.put({ id: app.id, eventId, userId: next.id, userName: next.name, by: user.name, at: new Date().toISOString() });
      n++;
    }
    if (n) await log(user, "Shared campers among the facilitators", `${n}`);
    return ok(n ? `${n} ${n === 1 ? "camper was" : "campers were"} shared among ${team.length} ${team.length === 1 ? "facilitator" : "facilitators"}.` : "Everyone already has a facilitator.");
  });
}

/* ================= the timetable ================= */

export async function saveSession(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayKeepRoster(user)) return bad("Only the head facilitators and the camp office can change the timetable.");
  return guard(async () => {
    const eventId = text(fd, "eventId", 80);
    const date = text(fd, "date", 10);
    const start = text(fd, "start", 5);
    const end = text(fd, "end", 5);
    const title = text(fd, "title", 120);
    const errors: Record<string, string> = {};
    const days = await daysOf(eventId);
    if (!dateOk(date) || (days && !days.includes(date))) errors.date = "Choose a day of the camp.";
    if (!timeOk(start)) errors.start = "Give the start time, like 09:30.";
    if (end && !timeOk(end)) errors.end = "Give the end time, like 10:30, or leave it empty.";
    else if (end && end <= start) errors.end = "The end must come after the start.";
    if (title.length < 2) errors.title = "Give the session a name.";
    if (Object.keys(errors).length) return bad("Please check the highlighted answers.", errors);

    const wanted = text(fd, "id", 40);
    const found = wanted ? (await campSessions.list()).find((s) => s.id === wanted && s.eventId === eventId) : undefined;
    const session: CampSession = {
      id: found?.id ?? newId(),
      eventId,
      date,
      start,
      ...(end ? { end } : {}),
      title,
      ...(text(fd, "place", 120) ? { place: text(fd, "place", 120) } : {}),
      ...(text(fd, "lead", 120) ? { lead: text(fd, "lead", 120) } : {}),
      ...(text(fd, "note", 500) ? { note: text(fd, "note", 500) } : {}),
      updatedBy: user.name,
      updatedAt: new Date().toISOString(),
    };
    await campSessions.put(session);
    await log(user, found ? "Changed a camp timetable line" : "Added a camp timetable line", title);
    return ok(found ? "Session saved." : "Session added.");
  });
}

export async function deleteSession(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayKeepRoster(user)) return bad("Only the head facilitators and the camp office can change the timetable.");
  return guard(async () => {
    const session = await campSessions.get(text(fd, "id", 40));
    if (!session) return bad("That session is already gone.");
    await campSessions.remove(session.id);
    await log(user, "Removed a camp timetable line", session.title);
    return ok("Removed.");
  });
}

/* ================= notes ================= */

export async function addNote(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const app = await campApplications.get(text(fd, "id", 60));
    if (!app || app.status !== "Approved") return bad("That camper is not on the expected list.");
    if (!mayOpenCare(user, app, await campAssignments.get(app.id))) return bad("You can write notes only about the campers you look after.");
    const words = text(fd, "text", 2000);
    if (words.length < 3) return bad("Write the note.", { text: "Write the note." });
    await campNotes.put({ id: newId(), applicationId: app.id, eventId: app.eventId, byId: user.id, by: user.name, createdAt: new Date().toISOString(), shared: fd.get("shared") === "yes", sealed: await seal({ text: words }) });
    return ok(fd.get("shared") === "yes" ? "Note saved and shared with the family." : "Note saved for the camp team.");
  });
}

export async function deleteNote(fd: FormData): Promise<Result> {
  const user = await requireUser();
  return guard(async () => {
    const note = await campNotes.get(text(fd, "id", 40));
    if (!note) return bad("That note is already gone.");
    if (note.byId !== user.id && user.role !== "admin" && !mayKeepRoster(user)) return bad("You can remove only your own notes.");
    await campNotes.remove(note.id);
    return ok("Removed.");
  });
}
