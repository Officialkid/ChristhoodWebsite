import { getUser, log } from "@/lib/auth";
import { campScope, can, canReadPrayer, mayOpenCamp } from "@/lib/rbac";
import { unseal } from "@/lib/crypto";
import { collection } from "@/lib/store";
import { campAssignments, campAttendance, campDays } from "@/lib/camp-day";
import { campArrivals, campOfEvent, gateRoster, isCampEvent } from "@/lib/camp-gate";
import { getEvents } from "@/lib/content";
import type { CampApplication, CampSealed, Camper, CamperSealed, Prayer, Visitor } from "@/lib/types";

export const runtime = "nodejs";

/** Stops a spreadsheet from running typed text as a formula. */
const cell = (v: unknown) => {
  const s = String(v ?? "").replace(/[\r\n]+/g, " ").trim();
  // A phone number may start with + and holds only digits, spaces and hyphens, so it is left alone. Anything else that starts like a formula gets a quote in front.
  const safe = /^[=+\-@\t|%]/.test(s) && !/^\+?\d[\d\s-]{6,}$/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const user = await getUser();
  const kind = new URL(req.url).searchParams.get("kind");
  if (!user) return new Response("Please sign in.", { status: 401 });

  let rows: string[][];
  if (kind === "guests") {
    if (!can(user, "visitors")) return new Response("No access.", { status: 403 });
    const list = (await collection<Visitor>("visitors").list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    rows = [
      ["Received", "Date of visit", "Full name", "Phone", "Email", "Lives in", "Age group", "First visit?", "Heard about us", "Invited by", "Home church", "Would like to", "Status", "Followed up by", "Notes"],
      ...list.map((g) => [g.createdAt, g.visitDate, g.fullName, g.phone, g.email, g.area, g.ageGroup, g.firstVisit, g.heardFrom, g.invitedBy, g.homeChurch, g.interests.join("; "), g.status, g.followedUpBy, g.notes].map((v) => String(v ?? ""))),
    ];
  } else if (kind === "prayers") {
    if (!can(user, "prayers")) return new Response("No access.", { status: 403 });
    const list = (await collection<Prayer>("prayers").list()).filter((p) => canReadPrayer(user, p)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    rows = [
      ["Received", "Type", "Name", "Phone", "About", "Message", "Who may read it", "May share", "Call back", "Status", "Handled by", "Notes"],
      ...list.map((p) => [p.createdAt, p.type, p.anonymous ? "Anonymous" : p.name, p.phone, p.category, p.message, p.whoMaySee, p.mayShare, p.callBack ? "Yes" : "", p.status, p.handledBy, p.notes].map((v) => String(v ?? ""))),
    ];
  } else if (kind === "camps") {
    const list = (await collection<CampApplication>("camp-applications").list()).filter((a) => mayOpenCamp(user, a)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (campScope(user) !== "all" && !campScope(user).length) return new Response("No access.", { status: 403 });
    const body: string[][] = [];
    for (const a of list) {
      let d: CampSealed | null = null;
      try {
        d = await unseal<CampSealed>(a.sealed);
      } catch {
        d = null;
      }
      body.push([a.createdAt, a.eventTitle, a.status, a.childName, String(a.ageAtCamp), a.ageReview ? "Check age" : "", a.guardian, a.phone, a.email ?? "", d?.dob ?? "", d?.gender ?? "", d?.school ?? "", d?.residence ?? "", d?.emergencies.map((e) => `${e.name} ${e.phone}`).join("; ") ?? "", d?.allergies ?? "", d?.conditions ?? "", d?.medication ?? "", d?.specialNeeds ?? "", d?.mediaConsent ?? "", d?.paymentType ?? "", String(d?.amount ?? ""), d?.paymentReference ?? "", a.paymentVerified ? "Yes" : "", a.reviewNote ?? ""]);
    }
    rows = [
      ["Received", "Camp", "Decision", "Child", "Age at camp", "Age flag", "Guardian", "Phone", "Email", "Date of birth", "Gender", "School", "Residence", "Emergency contacts", "Allergies", "Conditions", "Medication", "Special needs", "Photos allowed", "Payment declared", "Amount", "Reference", "Payment checked", "Office note"],
      ...body,
    ];
  } else if (kind === "campers") {
    if (campScope(user) !== "all" && !campScope(user).length) return new Response("No access.", { status: 403 });
    const list = (await collection<Camper>("campers").list()).filter((c) => mayOpenCamp(user, c)).sort((a, b) => a.name.localeCompare(b.name));
    const body: string[][] = [];
    for (const c of list) {
      let d: CamperSealed = {};
      try {
        d = await unseal<CamperSealed>(c.sealed);
      } catch {
        d = {};
      }
      body.push([c.id, c.name, c.camp === "jewels" ? "Jewels" : "Teen Life", String(c.year), String(d.age ?? ""), d.guardian ?? "", d.location ?? "", d.contact ?? ""]);
    }
    rows = [["id", "name", "camp", "year", "age", "guardian", "location", "contact"], ...body];
  } else if (kind === "register") {
    // The day's paper list for head facilitators and the camp office: who was expected, who came, who collected. Phone numbers are here
    // because the list is the fallback when the screens fail. No health details: medicine is only a yes. Every download is logged.
    if (!can(user, "camps:roster")) return new Response("No access.", { status: 403 });
    const q = new URL(req.url).searchParams;
    const eventId = q.get("event") ?? "";
    const date = q.get("date") ?? "";
    const event = (await getEvents()).find((e) => e.id === eventId);
    if (!event || !isCampEvent(event)) return new Response("That camp is not on the events list.", { status: 404 });
    if (!campDays(event).includes(date)) return new Response("That is not a day of this camp.", { status: 400 });
    const [people, given, marks, arrivals] = await Promise.all([gateRoster(event), campAssignments.list(), campAttendance.list(), campArrivals.list()]);
    const camp = campOfEvent(event) === "jewels" ? "Jewels" : campOfEvent(event) === "teen-life" ? "Teen Life" : "Camp";
    const registration = { application: "Approved application", "walk-in": "Walk-in", returning: "Previous camper, not registered" } as const;
    // A previous camper who did not come is left off: the list is for this camp's children.
    const body: string[][] = people
      .filter((p) => p.expected || arrivals.some((x) => x.key === p.key && x.date === date && x.eventId === event.id))
      .map((p) => {
        const m = marks.find((x) => x.applicationId === p.key && x.eventId === event.id && x.date === date)?.status;
        const a = arrivals.find((x) => x.key === p.key && x.date === date && x.eventId === event.id);
        const here = a ? (a.status === "out" ? "Collected" : "At camp") : m === "present" ? "Here" : m === "absent" ? "Away" : "";
        return [p.name, String(p.age ?? ""), camp, registration[p.source], p.guardian ?? "", p.phone ?? "", p.photos === "No" ? "No photos" : p.photos ? "" : "Ask", given.find((g) => g.id === p.key && g.eventId === event.id)?.userName ?? "", here, a?.droppedBy ?? "", a?.mayCollect ?? "", a?.medication ? "Yes" : "", a?.collectedBy ?? "", a?.collectedVia === "exception" ? "Exception" : ""];
      });
    rows = [["Child", "Age", "Camp", "Registration", "Parent or guardian", "Phone", "Photos", "Looked after by", `Status on ${date}`, "Brought by", "May also collect", "Medicine handed in", "Collected by", "Exception"], ...body];
    await log(user, "Downloaded a list", `register ${eventId} ${date}, ${body.length} rows`);
  } else return new Response("Unknown list.", { status: 400 });

  if (kind !== "register") await log(user, "Downloaded a list", `${kind}, ${rows.length - 1} rows`);
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="christhood-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
