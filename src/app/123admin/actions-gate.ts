"use server";

import { log, newId, requireUser } from "@/lib/auth";
import { attendanceId, campAttendance, campDays, dateOk } from "@/lib/camp-day";
import { arrivalId, campArrivals, campOfEvent, campWalkIns, gateFind } from "@/lib/camp-gate";
import { getEvents } from "@/lib/content";
import { mayRunCampDay } from "@/lib/rbac";
import { StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";

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

/** The camp and a day of it, or a reason it cannot be used. */
async function whichDay(fd: FormData): Promise<{ event: Awaited<ReturnType<typeof getEvents>>[number]; date: string } | string> {
  const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
  if (!event) return "That camp is no longer on the events list.";
  const date = text(fd, "date", 10);
  if (!dateOk(date) || !campDays(event).includes(date)) return "That is not a day of this camp.";
  return { event, date };
}

const stamp = () => new Date().toISOString();

/** Receives a child at the gate: who brought them, who else may collect them, and whether medicine was handed in. */
export async function checkIn(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const when = await whichDay(fd);
    if (typeof when === "string") return bad(when);
    const key = text(fd, "key", 80);
    const person = await gateFind(when.event.id, key);
    if (!person) return bad("That child is not on this camp's list.");
    const droppedBy = text(fd, "droppedBy", 80);
    if (droppedBy.length < 2) return bad("Write who brought the child.");
    const id = arrivalId(key, when.date);
    if (await campArrivals.get(id)) return ok(`${person.name} is already checked in.`);
    const mayCollect = text(fd, "mayCollect", 160);
    await campArrivals.put({ id, key, eventId: when.event.id, date: when.date, status: "in", droppedBy, ...(mayCollect ? { mayCollect } : {}), ...(fd.get("medication") === "yes" ? { medication: true } : {}), arrivedAt: stamp(), arrivedBy: user.name });
    // Keeps the camp day register and its counts in step for children who have an application.
    if (person.applicationId && !(await campAttendance.get(attendanceId(person.applicationId, when.date)))) {
      await campAttendance.put({ id: attendanceId(person.applicationId, when.date), applicationId: person.applicationId, eventId: when.event.id, date: when.date, status: "present", by: user.name, at: stamp() });
    }
    return ok(`${person.name} is checked in.`);
  });
}

/** Hands a child back to the person collecting them. */
export async function signOut(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const when = await whichDay(fd);
    if (typeof when === "string") return bad(when);
    const arrival = await campArrivals.get(arrivalId(text(fd, "key", 80), when.date));
    if (!arrival || arrival.status !== "in") return bad("That child is not checked in.");
    const collectedBy = text(fd, "collectedBy", 80);
    if (collectedBy.length < 2) return bad("Write who is collecting the child.");
    await campArrivals.put({ ...arrival, status: "out", collectedBy, leftAt: stamp(), leftBy: user.name });
    return ok("Signed out.");
  });
}

/** Takes back a wrong tap: a sign-out goes back to checked in, a check-in is removed. */
export async function undoArrival(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const when = await whichDay(fd);
    if (typeof when === "string") return bad(when);
    const key = text(fd, "key", 80);
    const id = arrivalId(key, when.date);
    const arrival = await campArrivals.get(id);
    if (!arrival) return ok("Nothing to undo.");
    if (arrival.status === "out") {
      const { collectedBy: _c, leftAt: _l, leftBy: _b, ...rest } = arrival;
      await campArrivals.put({ ...rest, status: "in" });
      await log(user, "Undid a camper sign-out", id);
      return ok("Back to checked in.");
    }
    await campArrivals.remove(id);
    const mark = key.includes(":") ? undefined : await campAttendance.get(attendanceId(key, when.date));
    if (mark?.status === "present") await campAttendance.remove(mark.id);
    await log(user, "Undid a camper check-in", id);
    return ok("Check-in removed.");
  });
}

/** Adds a child who is not on the list. They stay on it for the rest of the camp. */
export async function addWalkIn(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (!mayRunCampDay(user)) return bad("Camp days are not part of your department.");
  return guard(async () => {
    const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
    if (!event) return bad("That camp is no longer on the events list.");
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
    const id = newId();
    await campWalkIns.put({ id, eventId: event.id, camp: campOfEvent(event) ?? "other", name, age, guardian, phone, addedBy: user.name, createdAt: stamp() });
    await log(user, "Added a camper at the gate", id);
    return ok(`${name} is on the list. Check them in below.`, { id: `walkin:${id}` });
  });
}
