"use server";

import { createHash, randomInt } from "node:crypto";
import { after } from "next/server";
import { clientKey, hashPassword, newId } from "@/lib/auth";
import { campOfEvent } from "@/lib/camp-gate";
import { placesLeft } from "@/lib/camp-day";
import { getEvents } from "@/lib/content";
import { seal, sealingReady } from "@/lib/crypto";
import { claimPhoneIfFree, familyByPhone, familyChildren, families, getFamily, profileOf, saveChild, startFamilySession } from "@/lib/family";
import { sendCampApplicationTexts } from "@/lib/httpsms";
import { notifyTeam } from "@/lib/notify";
import { normalisePhone, phoneOk } from "@/lib/phone";
import { collection, store } from "@/lib/store";
import { site } from "@/content/site";
import type { CampApplication, CampSealed, Family } from "@/lib/types";
import type { FormState } from "./connect-actions";

const applications = collection<CampApplication>("camp-applications");

const clean = (v: FormDataEntryValue | null, max = 300) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const money = (v: FormDataEntryValue | null) => {
  const n = Number(clean(v, 12) || 0);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
type CalendarDate = { year: number; month: number; day: number };
function dateOnly(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
    ? { year, month, day }
    : null;
}
function nairobiDate(value: string): CalendarDate | null {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (type: "year" | "month" | "day") => Number(parts.find((item) => item.type === type)?.value);
  const result = { year: part("year"), month: part("month"), day: part("day") };
  return Object.values(result).every(Number.isFinite) ? result : null;
}
function compareDate(a: CalendarDate, b: CalendarDate) {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
function ageOn(birth: CalendarDate, date: CalendarDate) {
  return date.year - birth.year - (date.month < birth.month || (date.month === birth.month && date.day < birth.day) ? 1 : 0);
}
const fail = (message: string, errors?: Record<string, string>): FormState => ({ ok: false, message, errors });
const callUs = `please call or WhatsApp the camp office on 0${site.whatsapp.camps.replace(/^254/, "")}`;
const temporaryFamilyPassword = () => Array.from({ length: 8 }, () => randomInt(10)).join("");

function familySignInError(family: Family): FormState {
  if (!family.active) return fail(`This phone number is linked to an inactive family page. Please ${callUs}.`, { phone: "Please contact the camp office." });
  return {
    ...fail("A family page already uses this number. Sign in first, then return here and send this application.", { phone: "Sign in to the existing family page before applying." }),
    familySignInRequired: true,
  };
}

async function removeNewFamily(familyId: string, applicationIds: string[] = []) {
  await Promise.allSettled(applicationIds.map((id) => applications.remove(id)));
  const children = await familyChildren.list().catch(() => []);
  await Promise.allSettled(children.filter((child) => child.familyId === familyId).map((child) => familyChildren.remove(child.id)));
  await families.remove(familyId).catch(() => undefined);
}

/** Which programme an event belongs to, so the right department head sees its applications. */
async function campOf(event: { id: string; department?: string; title: string }): Promise<CampApplication["camp"]> {
  return campOfEvent(event) ?? "other";
}

export async function submitCampApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  if (clean(fd.get("website"))) return { ok: true, name: "your child" };
  // A real parent who is very quick is told so, instead of being shown a success that saved nothing.
  if (Number(fd.get("elapsedMs") ?? 0) < 12000) return fail("That was very quick. Please check your answers and send the application again.");
  if ((await store.hit(`camp:${await clientKey()}`, 3600)) > 8) return fail("That is a lot of applications from one place. Please try again in an hour.");
  if (!store.writable || !(await sealingReady())) return fail(`Online applications are not switched on yet, ${callUs} and we will register your child.`);

  const event = (await getEvents()).find((e) => e.id === clean(fd.get("eventId"), 120));
  const eventStart = event ? Date.parse(event.start) : NaN;
  const eventEnd = event ? Date.parse(event.end ?? event.start) : NaN;
  if (!event || event.category !== "camp" || !event.registrationOpen || !Number.isFinite(eventStart) || !Number.isFinite(eventEnd) || eventEnd < Date.now() || eventStart <= Date.now()) {
    return fail(`That camp is not open for applications. To bring a child to a camp that has started, ${callUs}.`, { eventId: "Choose a camp that is open." });
  }

  const rawChildKeys = fd.get("childKeys");
  const legacySingle = rawChildKeys === null;
  if (!legacySingle && (typeof rawChildKeys !== "string" || rawChildKeys.length > 40)) {
    return fail("Please keep one to eight children in an application.");
  }
  const childIds = legacySingle ? [0] : String(rawChildKeys).split(",").map(Number);
  if (!childIds.length || childIds.length > 8 || childIds.some((id) => !Number.isSafeInteger(id) || id < 0 || id > 1000) || new Set(childIds).size !== childIds.length) {
    return fail("Please keep one to eight children in an application.");
  }

  const left = await placesLeft(event.id, event.capacity);
  if (left !== null && childIds.length > left) {
    return fail(left === 0 ? `This camp is full. ${callUs} to be put on the waiting list.` : `Only ${left} ${left === 1 ? "place is" : "places are"} left and you listed ${childIds.length} children. Remove some, or ${callUs}.`);
  }

  const childKey = (id: number, field: string) => legacySingle ? (field === "profileId" ? "childId" : field) : `child.${id}.${field}`;
  const childValue = (id: number, field: string, max = 300) => clean(fd.get(childKey(id, field)), max);
  const errors: Record<string, string> = {};
  const campStartDate = nairobiDate(event.start);
  const guardian = clean(fd.get("guardian"), 120);
  const phoneRaw = clean(fd.get("phone"), 20);
  const email = clean(fd.get("email"), 120);
  const smsUpdates = fd.get("smsUpdates") === "yes";
  if (guardian.length < 2) errors.guardian = "Enter the parent or guardian's name.";
  if (!phoneOk(phoneRaw)) errors.phone = "Enter a phone number we can reach you on.";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "That email address does not look right.";

  const emergencies = [1, 2, 3]
    .map((n) => ({ name: clean(fd.get(`em${n}Name`), 120), relationship: clean(fd.get(`em${n}Rel`), 60), gender: "", email: clean(fd.get(`em${n}Email`), 120), phone: clean(fd.get(`em${n}Phone`), 20) }))
    .filter((e) => e.name || e.phone);
  if (!emergencies[0]?.name || !emergencies[0]?.phone) errors.em1Name = "Add at least one emergency contact with a name and a phone number.";
  else if (emergencies.some((e) => e.phone && !phoneOk(e.phone))) errors.em1Name = "Check the emergency contact phone numbers.";

  const signature = clean(fd.get("signature"), 120);
  if (!signature) errors.signature = "Type your full name as your signature.";
  const paymentDate = clean(fd.get("paymentDate"), 10);
  const balanceDate = clean(fd.get("balanceDate"), 10);
  const paymentMode = clean(fd.get("paymentMode"), 30) || undefined;
  const paymentReference = clean(fd.get("paymentReference"), 80) || undefined;
  if (paymentDate && !dateOnly(paymentDate)) errors.paymentDate = "Enter a valid payment date.";
  if (balanceDate && !dateOnly(balanceDate)) errors.balanceDate = "Enter a valid balance date.";

  const camp = await campOf(event);
  const drafts = childIds.map((id) => {
    const key = (field: string) => childKey(id, field);
    const childName = childValue(id, "name", 120);
    const dob = childValue(id, "dob", 10);
    const gender = childValue(id, "gender", 20);
    const grade = childValue(id, "grade", 40);
    const birthDate = dateOnly(dob);
    const mediaConsent = childValue(id, "mediaConsent", 3);
    const amount = money(fd.get(key("amount")));
    const pocketMoney = money(fd.get(key("pocketMoney")));
    if (childName.length < 2) errors[key("name")] = "Enter the child's full name.";
    if (!birthDate) errors[key("dob")] = "Enter a valid date of birth.";
    else if (!campStartDate || compareDate(birthDate, campStartDate) > 0) errors[key("dob")] = "The birth date must be on or before the camp starts.";
    if (gender !== "Female" && gender !== "Male") errors[key("gender")] = "Choose male or female.";
    if (!grade) errors[key("grade")] = "Enter the child's class or grade.";
    if (fd.get(key("participationConsent")) !== "yes") errors[key("participationConsent")] = "Please confirm you have read and agree to this child's participation.";
    if (fd.get(key("medicalConsent")) !== "yes") errors[key("medicalConsent")] = "Please confirm the medical authorization for this child.";
    if (mediaConsent !== "Yes" && mediaConsent !== "No") errors[key("mediaConsent")] = "Choose yes or no. Media consent is optional.";
    if (Number.isNaN(amount)) errors[key("amount")] = "Enter a valid amount in shillings, or leave it empty.";
    if (Number.isNaN(pocketMoney)) errors[key("pocketMoney")] = "Enter a valid amount in shillings, or leave it empty.";
    return { id, key, childName, dob, birthDate, mediaConsent, amount, pocketMoney, dedupe: "" };
  });
  if (Object.keys(errors).length) return fail("Please check the highlighted answers.", errors);

  const phone = normalisePhone(phoneRaw);
  let existing: CampApplication[];
  try {
    existing = await applications.list();
  } catch {
    return fail(`We could not check for an existing application just now. Please try again or ${callUs}.`);
  }
  const alreadyApplied = new Set(existing.map((a) => (a as CampApplication & { dedupe?: string }).dedupe).filter((v): v is string => Boolean(v)));
  const thisSubmission = new Set<string>();
  for (const draft of drafts) {
    draft.dedupe = createHash("sha256").update(`${draft.childName.toLowerCase().replace(/\s+/g, " ")}|${draft.dob}|${phone}|${event.id}`).digest("hex");
    if (alreadyApplied.has(draft.dedupe)) errors[draft.key("name")] = `We already have an application for this child for this camp. If you need to change something, ${callUs}.`;
    else if (thisSubmission.has(draft.dedupe)) errors[draft.key("name")] = "This child is listed more than once. Check the names and dates of birth.";
    thisSubmission.add(draft.dedupe);
  }
  if (Object.keys(errors).length) return fail("Please check the highlighted answers.", errors);

  let family: Family | null;
  try {
    family = await getFamily();
    if (!family) {
      const existingFamily = await familyByPhone(phone);
      if (existingFamily) return familySignInError(existingFamily);
    }
  } catch {
    return fail(`We could not confirm your family page just now. No applications were sent; please try again or ${callUs}.`);
  }
  const now = new Date().toISOString();
  const prepared = await Promise.all(drafts.map(async (draft) => {
    const g = (field: string, max = 300) => childValue(draft.id, field, max);
    const ageAtCamp = campStartDate && draft.birthDate ? ageOn(draft.birthDate, campStartDate) : 0;
    // Ages outside the published programme range are sent to the camp team for review.
    const ageReview = camp === "jewels" ? ageAtCamp < 7 || ageAtCamp > 12 : camp === "teen-life" ? ageAtCamp < 13 || ageAtCamp > 19 : false;
    const sealedData: CampSealed = {
      dob: draft.dob,
      nickname: g("nickname", 60) || undefined,
      gender: g("gender", 20) || undefined,
      school: g("school", 120) || undefined,
      grade: g("grade", 40) || undefined,
      guardianId: clean(fd.get("guardianId"), 30) || undefined,
      residence: clean(fd.get("residence"), 120) || undefined,
      house: clean(fd.get("house"), 60) || undefined,
      doctor: g("doctor", 120) || undefined,
      hospital: g("hospital", 120) || undefined,
      doctorPhone: g("doctorPhone", 20) || undefined,
      blood: g("blood", 10) || undefined,
      insurer: g("insurer", 120) || undefined,
      policy: g("policy", 60) || undefined,
      conditions: g("conditions", 1000) || undefined,
      allergies: g("allergies", 1000) || undefined,
      disabilities: g("disabilities", 1000) || undefined,
      otherConditions: g("otherConditions", 1000) || undefined,
      medication: g("medication", 1000) || undefined,
      specialNeeds: g("specialNeeds", 1000) || undefined,
      swimming: g("swimming", 20) || undefined,
      emergencies: emergencies.map((e) => ({ ...e, phone: normalisePhone(e.phone) })),
      mediaConsent: draft.mediaConsent as "Yes" | "No",
      signature,
      consentVersion: "Teenlife Registration Form (2026) Part D",
      consentAt: now,
      paymentType: g("paymentType", 30) || undefined,
      amount: draft.amount,
      paymentDate: paymentDate || undefined,
      paymentMode,
      paymentReference,
      balanceDate: balanceDate || undefined,
      pocketMoney: draft.pocketMoney,
    };
    return { draft, ageAtCamp, ageReview, sealedData };
  }));

  let familyPassword: string | undefined;
  let createdFamily = false;
  if (!family) {
    familyPassword = temporaryFamilyPassword();
    family = {
      id: newId(),
      phone,
      name: guardian,
      email: email || undefined,
      smsUpdates,
      hash: await hashPassword(familyPassword),
      active: true,
      mustChange: true,
      createdAt: now,
    };
    try {
      await families.put(family);
      createdFamily = true;
    } catch {
      await families.remove(family.id).catch(() => undefined);
      return fail(`We could not set up your family page just now. No applications were sent; please try again or ${callUs}.`);
    }
  }
  const linkedFamily = family;

  const familyChildIds = new Map<number, string>();
  try {
    for (const { draft, sealedData } of prepared) {
      const id = await saveChild(linkedFamily, childValue(draft.id, "profileId", 40), draft.childName, camp === "other" ? undefined : camp, profileOf(sealedData));
      familyChildIds.set(draft.id, id);
    }
  } catch {
    if (createdFamily) await removeNewFamily(linkedFamily.id);
    return fail(`We could not save your family details just now. No applications were sent; please try again or ${callUs}.`);
  }

  const apps: (CampApplication & { dedupe: string })[] = await Promise.all(prepared.map(async ({ draft, ageAtCamp, ageReview, sealedData }) => ({
    id: newId(),
    createdAt: now,
    updatedAt: now,
    eventId: event.id,
    eventTitle: event.title,
    camp,
    childName: draft.childName,
    guardian,
    phone,
    email: email || undefined,
    smsUpdates,
    ageAtCamp,
    ageReview,
    status: "Pending review" as const,
    paymentVerified: false,
    sealed: await seal(sealedData),
    familyId: linkedFamily.id,
    childId: familyChildIds.get(draft.id),
    dedupe: draft.dedupe,
  })));
  const written: string[] = [];
  try {
    for (const app of apps) {
      written.push(app.id);
      await applications.put(app);
    }
  } catch (error) {
    console.error("Could not save camp application", error);
    await Promise.allSettled(written.map((id) => applications.remove(id)));
    if (createdFamily) await removeNewFamily(linkedFamily.id);
    return fail(`We could not save that just now, ${callUs}.`);
  }

  if (createdFamily) {
    let claimed = false;
    try {
      claimed = await claimPhoneIfFree(phone, linkedFamily.id);
    } catch {
      const owner = await familyByPhone(phone).catch(() => null);
      if (owner?.id === linkedFamily.id) claimed = true;
      else {
        await removeNewFamily(linkedFamily.id, apps.map((app) => app.id));
        return owner ? familySignInError(owner) : fail(`We could not finish setting up your family page. No applications were sent; please try again or ${callUs}.`);
      }
    }
    if (!claimed) {
      const owner = await familyByPhone(phone).catch(() => null);
      await removeNewFamily(linkedFamily.id, apps.map((app) => app.id));
      return owner ? familySignInError(owner) : fail(`We could not finish setting up your family page. No applications were sent; please try again or ${callUs}.`);
    }
    // The temporary password is shown in the confirmation, so a failed cookie write does not lose the credentials.
    await startFamilySession(linkedFamily).catch(() => undefined);
  }
  after(async () => {
    await Promise.all([
      notifyTeam("camp"),
      sendCampApplicationTexts({ parentPhone: phone, campTitle: event.title, count: drafts.length, parentOptIn: smsUpdates }),
    ]);
  });
  return {
    ok: true,
    name: drafts[0].childName.split(/\s+/)[0],
    type: "family",
    count: drafts.length,
    ...(familyPassword ? { familyLogin: { phone, temporaryPassword: familyPassword } } : {}),
  };
}
