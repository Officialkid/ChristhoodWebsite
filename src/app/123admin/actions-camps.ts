"use server";

import { after } from "next/server";
import { requireUser, log } from "@/lib/auth";
import { approvedFor, campAssignments, campAttendance, campNotes, campPhotos, nairobiDay } from "@/lib/camp-day";
import { campArrivals, campOfEvent, campWalkIns } from "@/lib/camp-gate";
import { getEvents } from "@/lib/content";
import { sendCampStatusText } from "@/lib/httpsms";
import { shortCamp } from "@/lib/names";
import { campScope, mayOpenCamp } from "@/lib/rbac";
import { collection, StorageUnavailable } from "@/lib/store";
import { camperRows } from "@/lib/camper-csv";
import { seal, sealingReady, unseal } from "@/lib/crypto";
import type { Result } from "@/components/admin/forms";
import type { CampApplication, CampAppStatus, Camper, CamperSealed, CampSealed } from "@/lib/types";

const applications = collection<CampApplication>("camp-applications");
const text = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const ok = (message: string): Result => ({ ok: true, message, stamp: Date.now() });
const bad = (message: string): Result => ({ ok: false, message, stamp: Date.now() });

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

const statuses: CampAppStatus[] = ["Pending review", "Approved", "Needs correction", "Declined"];

export async function reviewApplication(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  return guard(async () => {
    const app = await applications.get(text(fd, "id", 40));
    if (!app || !mayOpenCamp(user, app)) return bad("That application is not available to you.");
    const status = text(fd, "status", 30) as CampAppStatus;
    if (!statuses.includes(status)) return bad("Choose a decision.");
    const paid = fd.get("paymentVerified") === "yes";
    const note = text(fd, "note");
    if (status === "Approved" && !paid && note.length < 5) return bad("The payment has not been checked. Write a short note saying why this child is approved anyway, for example a bursary or a date the money is promised.");
    // A child who is at camp right now must be signed out before their place is taken away: the gate and the register depend on it.
    if (app.status === "Approved" && status !== "Approved" && (await campArrivals.list()).some((a) => a.key === app.id && a.status === "in")) return bad("This child is at camp right now. Sign them out at the gate first, then change the decision.");
    if (status === "Approved" && app.status !== "Approved") {
      const capacity = (await getEvents()).find((e) => e.id === app.eventId)?.capacity;
      if (capacity && (await approvedFor(app.eventId)).length >= capacity) return bad(`The camp is full: ${capacity} children are already approved. Raise the number of places on the event first, or choose another decision.`);
    }
    const now = new Date().toISOString();
    const next: CampApplication = { ...app, status, paymentVerified: paid, reviewNote: note || undefined, reviewedBy: user.name, reviewedAt: now, updatedAt: now };
    // Only while nobody else has changed it, so two reviewers cannot silently overwrite each other.
    if (!(await applications.replaceIf(next, "updatedAt", app.updatedAt))) return bad("Someone else just changed this application. Open it again to see their decision.");
    await log(user, `Marked a camp application "${status}" (was "${app.status}")`, app.id);
    // The parent hears the decision when they asked for texts. A change of payment alone sends nothing.
    const kind = status === "Approved" ? "approved" : status === "Declined" ? "declined" : status === "Needs correction" ? "fix" : null;
    if (kind && status !== app.status && app.smsUpdates) after(() => sendCampStatusText(app.phone, { kind, child: app.childName, camp: shortCamp(app.eventTitle) }));
    return ok("Saved.");
  });
}

export async function deleteApplication(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (user.role !== "admin") return bad("Only an administrator can delete an application.");
  return guard(async () => {
    const app = await applications.get(text(fd, "id", 40));
    if (!app) return bad("That application is already gone.");
    // Camp records belong to the camp's history. A child who was received, marked or written about is declined, never erased.
    const [arrivals, marks, notes, photos] = await Promise.all([campArrivals.list(), campAttendance.list(), campNotes.list(), campPhotos.list()]);
    if (arrivals.some((a) => a.key === app.id) || marks.some((m) => m.applicationId === app.id) || notes.some((n) => n.applicationId === app.id) || photos.some((p) => p.applicationId === app.id)) {
      return bad("This child already has camp records (arrival, register, notes or photos). Mark the application Declined instead of deleting it.");
    }
    await applications.remove(app.id);
    await campAssignments.remove(app.id).catch(() => undefined);
    await log(user, "Deleted a camp application", app.id);
    return ok("Application deleted.");
  });
}

/** Administrators and the Camps Department: add returning campers from a spreadsheet saved as CSV (id, name, camp, year, age, guardian, location, contact). */
export async function importCampers(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (campScope(user) !== "all") return bad("Only an administrator or the Camps Department can import campers.");
  return guard(async () => {
    if (!(await sealingReady())) return bad("The registration key is not set, so private details cannot be kept yet. See System status.");
    const { rows, skipped } = camperRows(text(fd, "csv", 2_000_000));
    if (!rows.length) return bad("No campers were found. The first row must name the columns: id, name, camp, year, age, guardian, location, contact.");
    const campers = collection<Camper>("campers");
    for (const r of rows) {
      const data: CamperSealed = { age: r.age, guardian: r.guardian, location: r.location, contact: r.contact };
      // An existing camper keeps the family link and any code already issued; only the register details change.
      const before = await campers.get(r.id);
      await campers.put({ ...(before?.familyId ? { familyId: before.familyId } : {}), ...(before?.code ? { code: before.code } : {}), id: r.id, camp: r.camp, name: r.name, year: r.year, sealed: await seal(data) });
    }
    await log(user, "Imported returning campers", `${rows.length}`);
    return ok(`${rows.length} campers imported${skipped ? `, ${skipped} rows skipped` : ""}.`);
  });
}

/** Opens one returning camper's phone number on request, so lists never carry it. Each look is written to the activity log by id, never by name. */
export async function revealCamperContact(id: string): Promise<Result> {
  const user = await requireUser();
  return guard(async () => {
    const camper = await collection<Camper>("campers").get(String(id).slice(0, 60));
    if (!camper || !mayOpenCamp(user, camper)) return bad("That camper is not available to you.");
    let d: CamperSealed;
    try {
      d = await unseal<CamperSealed>(camper.sealed);
    } catch {
      return bad("The private details could not be opened.");
    }
    if (!d.contact) return bad("No phone number is on file.");
    await log(user, "Opened a camper's phone number", camper.id);
    return { ok: true, stamp: Date.now(), secret: d.contact };
  });
}

/** The year a camp was held, from its start date. */
const yearOf = (start: string) => Number(nairobiDay(start).slice(0, 4));

/**
 * After (or during) a camp: children who came become next year's returning campers, so the register fills itself and nobody has
 * to re-type a spreadsheet. Runs again safely: a child already on the list is updated, not doubled.
 */
export async function addAttendeesToReturning(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (campScope(user) !== "all") return bad("Only an administrator or the Camps Department can do this.");
  return guard(async () => {
    const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
    const camp = event ? campOfEvent(event) : undefined;
    if (!event || !camp) return bad("That camp is not one of the Jewels or Teen Life camps.");
    if (!(await sealingReady())) return bad("The registration key is not set, so private details cannot be kept yet. See System status.");
    const year = yearOf(event.start);
    const campers = collection<Camper>("campers");
    const [apps, arrivals, marks, walkins] = await Promise.all([approvedFor(event.id), campArrivals.list(), campAttendance.list(), campWalkIns.list()]);
    const came = new Set([...arrivals.filter((a) => a.eventId === event.id).map((a) => a.key), ...marks.filter((m) => m.eventId === event.id && m.status === "present").map((m) => m.applicationId)]);
    let n = 0;
    const keep = async (id: string, name: string, data: CamperSealed, familyId?: string) => {
      const before = await campers.get(id);
      const link = familyId ?? before?.familyId;
      await campers.put({ ...(link ? { familyId: link } : {}), ...(before?.code ? { code: before.code } : {}), id, camp, name, year, sealed: await seal(data) });
      n++;
    };
    for (const app of apps.filter((a) => came.has(a.id))) {
      let residence: string | undefined;
      try {
        residence = (await unseal<CampSealed>(app.sealed)).residence;
      } catch {
        residence = undefined;
      }
      await keep(`app-${app.id}`, app.childName, { age: app.ageAtCamp, guardian: app.guardian, location: residence, contact: app.phone }, app.familyId);
    }
    for (const w of walkins.filter((x) => x.eventId === event.id && came.has(`walkin:${x.id}`))) await keep(`walkin-${w.id}`, w.name, { age: w.age, guardian: w.guardian, contact: w.phone });
    if (!n) return bad("Nobody was received at the gate or marked here for this camp yet.");
    await log(user, "Added a camp's children to the returning campers", `${event.id}: ${n}`);
    return ok(`${n} ${n === 1 ? "child" : "children"} added to Returning campers for ${year}.`);
  });
}

const HEALTH: (keyof CampSealed)[] = ["conditions", "allergies", "disabilities", "otherConditions", "medication", "specialNeeds", "doctor", "hospital", "doctorPhone", "blood", "insurer", "policy"];

/**
 * Sixty days after a camp, an administrator removes the children's health answers, the care notes and the photos taken at that
 * camp. Contact, consent and payment answers stay. It cannot be undone, so it asks for the word REMOVE and is never automatic.
 */
export async function clearCampPrivateData(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (user.role !== "admin") return bad("Only an administrator can remove a camp's private details.");
  return guard(async () => {
    if (text(fd, "confirm", 12) !== "REMOVE") return bad("Type REMOVE in capitals to confirm.");
    const event = (await getEvents()).find((e) => e.id === text(fd, "eventId", 80));
    if (!event) return bad("That camp is not on the events list.");
    if (Date.parse(event.end ?? event.start) + 60 * 86_400_000 > Date.now()) return bad("Private details can be removed only sixty days after the camp has ended.");
    if (!(await sealingReady())) return bad("The registration key is not set.");
    const [notes, photos, apps, walkins, arrivals] = await Promise.all([campNotes.list(), campPhotos.list(), applications.list(), campWalkIns.list(), campArrivals.list()]);
    const mine = <T extends { eventId: string }>(list: T[]) => list.filter((x) => x.eventId === event.id);
    for (const x of mine(notes)) await campNotes.remove(x.id);
    for (const x of mine(photos)) await campPhotos.remove(x.id);
    let cleared = 0;
    let unreadable = 0;
    for (const app of mine(apps).filter((a) => !a.healthClearedAt)) {
      let d: CampSealed;
      try {
        d = await unseal<CampSealed>(app.sealed);
      } catch {
        unreadable++;
        continue;
      }
      for (const k of HEALTH) delete d[k];
      const now = new Date().toISOString();
      if (await applications.replaceIf({ ...app, sealed: await seal(d), healthClearedAt: now, updatedAt: now }, "updatedAt", app.updatedAt)) cleared++;
    }
    for (const w of mine(walkins).filter((x) => x.sealed)) await campWalkIns.put({ ...w, sealed: undefined });
    for (const a of mine(arrivals).filter((x) => x.sealed)) await campArrivals.put({ ...a, sealed: undefined });
    await log(user, "Removed a camp's private details", `${event.id}: ${cleared} applications, ${mine(notes).length} notes, ${mine(photos).length} photos`);
    return ok(`Done. ${cleared} applications cleared, ${mine(notes).length} notes and ${mine(photos).length} photos removed${unreadable ? `. ${unreadable} could not be opened and were left as they are` : ""}.`);
  });
}
