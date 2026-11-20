"use server";

import { log, newId, requireUser } from "@/lib/auth";
import { attendanceId, campAttendance, campDays, dateOk, todayInNairobi } from "@/lib/camp-day";
import { arrivalId, authorizedNames, campArrivals, campOfEvent, campWalkIns, gateFind, gateRoster, isCampEvent, mayCollectNormally, sameName } from "@/lib/camp-gate";
import { getEvents } from "@/lib/content";
import { mayKeepRoster, mayRunCampDay } from "@/lib/rbac";
import { StorageUnavailable } from "@/lib/store";
import { fmt } from "@/lib/time";
import type { Result } from "@/components/admin/forms";
import type { CampArrival } from "@/lib/types";

const text = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const ok = (message: string, extra: Partial<Result> = {}): Result => ({ ok: true, message, stamp: Date.now(), ...extra });
const bad = (message: string, errors?: Record<string, string>): Result => ({ ok: false, message, errors, stamp: Date.now() });
const clock = (iso?: string) => (iso ? fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)) : "");

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

type User = Awaited<ReturnType<typeof requireUser>>;

/** The camp and a day of it, or the reason it cannot be used. Only camps, only their own days, and only today unless a head facilitator is entering the paper list. */
async function whichDay(fd: FormData, user: User): Promise<{ event: Awaited<ReturnType<typeof getEvents>>[number]; date: string; late: boolean } | string> {
  const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
  if (!event || !isCampEvent(event)) return "That camp is no longer on the events list.";
  const date = text(fd, "date", 10);
  if (!dateOk(date) || !campDays(event).includes(date)) return "That is not a day of this camp.";
  const late = date !== todayInNairobi();
  if (late && !mayKeepRoster(user)) return "The gate records only today. A head facilitator can enter another day from the paper list.";
  return { event, date, late };
}

const stamp = () => new Date().toISOString();

/** Receives a child at the gate: who brought them, who else may collect them, and whether medicine was handed in. */
export async function checkIn(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const when = await whichDay(fd, user);
    if (typeof when === "string") return bad(when);
    const key = text(fd, "key", 80);
    const person = await gateFind(when.event, key);
    if (!person) return bad("That child is not on this camp's list.");
    const droppedBy = text(fd, "droppedBy", 80);
    if (droppedBy.length < 2) return bad("Write who brought the child.");
    // A returning camper is not registered for this camp: the parent must say so at the gate.
    if (person.source === "returning" && fd.get("confirmed") !== "yes") return bad(`${person.name} is not registered for this camp. Ask the parent to confirm they are joining, and tick the box.`);
    // One name per line (or separated by commas); the line breaks matter, so this field is not squashed like the others.
    const authorized = authorizedNames(String(fd.get("mayCollect") ?? "").slice(0, 200));
    const mayCollect = authorized.join(", ");
    const id = arrivalId(key, when.date);
    const arrival: CampArrival = { id, key, eventId: when.event.id, date: when.date, status: "in", source: person.source, droppedBy, ...(mayCollect ? { mayCollect, authorized } : {}), ...(fd.get("medication") === "yes" ? { medication: true } : {}), arrivedAt: stamp(), arrivedBy: user.name, ...(when.late ? { backfilled: true as const } : {}) };
    // Atomic: when two people receive the same child at once, exactly one record is kept.
    if (!(await campArrivals.create(arrival))) {
      const there = await campArrivals.get(id);
      return bad(there ? `${person.name} is already checked in (${there.status === "out" ? "collected" : `at ${clock(there.arrivedAt)}`}, by ${there.arrivedBy}).` : "Someone else changed this child at the same moment. Try again.");
    }
    // Keeps the camp day register and its counts in step for children who have an application.
    if (person.applicationId) {
      await campAttendance.create({ id: attendanceId(person.applicationId, when.date), applicationId: person.applicationId, eventId: when.event.id, date: when.date, status: "present", by: user.name, at: stamp() });
    }
    await log(user, "Checked a camper in at the gate", id);
    return ok(`${person.name} is checked in.`);
  });
}

/** Hands a child back. The collector is the person who brought them, someone the parent named, or an exception a head facilitator approves. */
export async function signOut(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const when = await whichDay(fd, user);
    if (typeof when === "string") return bad(when);
    const id = arrivalId(text(fd, "key", 80), when.date);
    const arrival = await campArrivals.get(id);
    if (!arrival || arrival.eventId !== when.event.id) return bad("That child is not checked in.");
    if (arrival.status !== "in") return bad(`That child was already collected${arrival.leftAt ? ` at ${clock(arrival.leftAt)}` : ""}.`);
    if (fd.get("confirm") !== "yes") return bad("Tick the box to say you have checked who is collecting.");

    const via = text(fd, "via", 12);
    let collectedBy = "";
    let exception: CampArrival["exception"];
    if (via === "dropper") {
      collectedBy = arrival.droppedBy;
    } else if (via === "named") {
      collectedBy = text(fd, "collectedBy", 80);
      if (!mayCollectNormally(arrival, collectedBy)) return bad("That name is not on the parent's list. Choose an exception and ask a head facilitator.");
    } else if (via === "exception") {
      if (!mayKeepRoster(user)) return bad("Only a head facilitator can approve a collection by someone the parent did not name. Ask one to come to the desk.");
      collectedBy = text(fd, "collectedBy", 80);
      const reason = text(fd, "reason", 200);
      if (collectedBy.length < 2) return bad("Write who is collecting the child.");
      if (reason.length < 5) return bad("Write why this person is collecting.");
      if (fd.get("idSeen") !== "yes") return bad("Check who the person is first, then tick that you have seen their identity.");
      exception = { reason, approvedBy: user.name, idSeen: true };
    } else return bad("Choose who is collecting.");

    const next: CampArrival = { ...arrival, status: "out", collectedBy, collectedVia: via as CampArrival["collectedVia"], ...(exception ? { exception } : {}), leftAt: stamp(), leftBy: user.name };
    // Only while the child is still checked in, so two people cannot both hand the same child over.
    if (!(await campArrivals.replaceIf(next, "status", "in"))) return bad("Someone else just changed this child. Check the list.");
    await log(user, exception ? "Approved an exception collection" : "Signed a camper out at the gate", id);
    return ok("Signed out.");
  });
}

/** Takes back a wrong tap. A sign-out goes back to checked in and is remembered; a check-in is removed within ten minutes (any time by a head facilitator). */
export async function undoArrival(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const when = await whichDay(fd, user);
    if (typeof when === "string") return bad(when);
    const key = text(fd, "key", 80);
    const id = arrivalId(key, when.date);
    const arrival = await campArrivals.get(id);
    if (!arrival || arrival.eventId !== when.event.id) return ok("Nothing to undo.");
    if (arrival.status === "out") {
      if (arrival.collectedVia === "exception" && !mayKeepRoster(user)) return bad("Only a head facilitator can take back an exception.");
      const { collectedBy, leftAt, leftBy, collectedVia: _v, exception: _x, ...rest } = arrival;
      const back: CampArrival = { ...rest, status: "in", corrections: [...(arrival.corrections ?? []), { collectedBy: collectedBy ?? "", leftAt, leftBy, undoneBy: user.name, undoneAt: stamp() }] };
      if (!(await campArrivals.replaceIf(back, "status", "out"))) return bad("Someone else just changed this child. Check the list.");
      await log(user, "Undid a camper sign-out", id);
      return ok("Back to checked in.");
    }
    if (!mayKeepRoster(user) && Date.now() - Date.parse(arrival.arrivedAt) > 10 * 60_000) return bad("A check-in can be taken back only in the first ten minutes. Ask a head facilitator.");
    if (!(await campArrivals.removeIf(id, "status", "in"))) return bad("Someone else just changed this child. Check the list.");
    // Takes back the register mark only if the gate made it.
    const mark = arrival.source === "application" ? await campAttendance.get(attendanceId(key, when.date)) : null;
    if (mark?.status === "present" && mark.by === arrival.arrivedBy) await campAttendance.remove(mark.id);
    await log(user, "Undid a camper check-in", id);
    return ok("Check-in removed.");
  });
}

/** Shows one parent's phone number. Only head facilitators and the camp office, and every opening is written to the activity log (never the number). */
export async function revealContact(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user) || !mayKeepRoster(user)) return bad("Only head facilitators and the camp office see phone numbers.");
  return guard(async () => {
    const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
    if (!event || !isCampEvent(event)) return bad("That camp is no longer on the events list.");
    const key = text(fd, "key", 80);
    const person = (await gateRoster(event)).find((p) => p.key === key);
    if (!person) return bad("That child is not on this camp's list.");
    if (!person.phone) return bad("No phone number is on file.");
    await log(user, "Opened a parent's phone number at the gate", key);
    return ok("Number shown.", { secret: person.phone });
  });
}

/** Adds a child who is not on the list. They stay on it for the rest of the camp. */
export async function addWalkIn(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
    if (!event || !isCampEvent(event)) return bad("That camp is no longer on the events list.");
    const name = text(fd, "name", 80);
    const guardian = text(fd, "guardian", 80);
    const phone = text(fd, "phone", 20);
    const age = Number(text(fd, "age", 3));
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Write the child's name.";
    if (!Number.isInteger(age) || age < 3 || age > 30) errors.age = "Write the age in years.";
    if (guardian.length < 2) errors.guardian = "Write the parent or guardian's name.";
    if (phone.replace(/\D/g, "").length < 9) errors.phone = "Write a phone number we can call.";
    if (Object.keys(errors).length) return bad("Please check the highlighted answers.", errors);
    const there = (await campWalkIns.list()).find((w) => w.eventId === event.id && sameName(w.name) === sameName(name) && sameName(w.guardian) === sameName(guardian));
    if (there) return ok(`${name} is already on the list. Check them in from there.`, { id: `walkin:${there.id}` });
    const id = newId();
    await campWalkIns.put({ id, eventId: event.id, camp: campOfEvent(event) ?? "other", name, age, guardian, phone, addedBy: user.name, createdAt: stamp() });
    await log(user, "Added a camper at the gate", id);
    return ok(`${name} is on the list. Check them in below.`, { id: `walkin:${id}` });
  });
}
