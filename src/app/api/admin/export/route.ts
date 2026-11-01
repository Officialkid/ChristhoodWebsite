import { getUser } from "@/lib/auth";
import { can, canReadPrayer, mayOpenCamp } from "@/lib/rbac";
import { unseal } from "@/lib/crypto";
import { collection } from "@/lib/store";
import type { CampApplication, CampSealed, Camper, CamperSealed, Prayer, Visitor } from "@/lib/types";

export const runtime = "nodejs";

/** Stops a spreadsheet from running typed text as a formula. */
const cell = (v: unknown) => {
  const s = String(v ?? "").replace(/\r?\n/g, " ").trim();
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
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
      ["Received", "Date of visit", "Full name", "Phone", "Email", "Lives in", "Age group", "First visit?", "Heard about us", "Invited by", "Home church", "Would like to", "Prayer request", "Status", "Followed up by", "Notes"],
      ...list.map((g) => [g.createdAt, g.visitDate, g.fullName, g.phone, g.email, g.area, g.ageGroup, g.firstVisit, g.heardFrom, g.invitedBy, g.homeChurch, g.interests.join("; "), g.prayerRequest, g.status, g.followedUpBy, g.notes].map((v) => String(v ?? ""))),
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
    if (!list.length && !(user.role === "admin" || user.departments.some((d) => d === "jewels" || d === "teen-life"))) return new Response("No access.", { status: 403 });
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
  } else return new Response("Unknown list.", { status: 400 });

  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="christhood-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
