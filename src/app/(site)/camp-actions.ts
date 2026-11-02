"use server";

import { createHash } from "node:crypto";
import { after } from "next/server";
import { clientKey, newId } from "@/lib/auth";
import { getEvents } from "@/lib/content";
import { seal, sealingReady } from "@/lib/crypto";
import { getFamily, profileOf, saveChild } from "@/lib/family";
import { notifyTeam } from "@/lib/notify";
import { normalisePhone, phoneOk } from "@/lib/phone";
import { collection, store } from "@/lib/store";
import { site } from "@/content/site";
import type { CampApplication, CampSealed } from "@/lib/types";
import type { FormState } from "./connect-actions";

const applications = collection<CampApplication>("camp-applications");

const clean = (v: FormDataEntryValue | null, max = 300) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const money = (v: FormDataEntryValue | null) => {
  const n = Number(clean(v, 12) || 0);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
const fail = (message: string, errors?: Record<string, string>): FormState => ({ ok: false, message, errors });
const callUs = `please call or WhatsApp the camp office on 0${site.whatsapp.camps.replace(/^254/, "")}`;

/** Which programme an event belongs to, so the right department head sees its applications. */
async function campOf(event: { department?: string; title: string }): Promise<CampApplication["camp"]> {
  if (event.department === "jewels" || /jewels/i.test(event.title)) return "jewels";
  if (event.department === "teen-life" || /teen/i.test(event.title)) return "teen-life";
  return "other";
}

export async function submitCampApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  if (clean(fd.get("website")) || Number(fd.get("elapsedMs") ?? 0) < 12000) return { ok: true, name: "your child" };
  if ((await store.hit(`camp:${await clientKey()}`, 3600)) > 8) return fail("That is a lot of applications from one place. Please try again in an hour.");
  if (!store.writable || !(await sealingReady())) return fail(`Online applications are not switched on yet, ${callUs} and we will register your child.`);

  const event = (await getEvents()).find((e) => e.id === clean(fd.get("eventId"), 120));
  if (!event || event.category !== "camp" || !event.registrationOpen || new Date(event.end ?? event.start).getTime() < Date.now()) {
    return fail("That camp is not open for applications.", { eventId: "Choose a camp that is open." });
  }

  const errors: Record<string, string> = {};
  const childName = clean(fd.get("name"), 120);
  const dob = clean(fd.get("dob"), 10);
  const guardian = clean(fd.get("guardian"), 120);
  const phoneRaw = clean(fd.get("phone"), 20);
  const email = clean(fd.get("email"), 120);
  if (childName.length < 2) errors.name = "Enter the child's full name.";
  const birth = Date.parse(dob);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(birth)) errors.dob = "Enter a valid date of birth.";
  else if (new Date(dob) > new Date(event.start)) errors.dob = "The birth date must be before the camp starts.";
  if (guardian.length < 2) errors.guardian = "Enter the parent or guardian's name.";
  if (!phoneOk(phoneRaw)) errors.phone = "Enter a phone number we can reach you on.";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "That email address does not look right.";

  const emergencies = [1, 2, 3]
    .map((n) => ({ name: clean(fd.get(`em${n}Name`), 120), relationship: clean(fd.get(`em${n}Rel`), 60), gender: "", email: clean(fd.get(`em${n}Email`), 120), phone: clean(fd.get(`em${n}Phone`), 20) }))
    .filter((e) => e.name || e.phone);
  if (!emergencies[0]?.name || !emergencies[0]?.phone) errors.em1Name = "Add at least one emergency contact with a name and a phone number.";
  else if (emergencies.some((e) => e.phone && !phoneOk(e.phone))) errors.em1Name = "Check the emergency contact phone numbers.";

  const signature = clean(fd.get("signature"), 120);
  if (fd.get("participationConsent") !== "yes") errors.participationConsent = "Please confirm you have read and agree to your child's participation.";
  if (fd.get("medicalConsent") !== "yes") errors.medicalConsent = "Please confirm the medical authorization.";
  if (!signature) errors.signature = "Type your full name as your signature.";
  const mediaConsent = clean(fd.get("mediaConsent"), 3);
  if (mediaConsent !== "Yes" && mediaConsent !== "No") errors.mediaConsent = "Choose yes or no. Media consent is optional.";
  const amount = money(fd.get("amount"));
  const pocketMoney = money(fd.get("pocketMoney"));
  if (Number.isNaN(amount) || Number.isNaN(pocketMoney)) errors.amount = "Enter valid amounts in shillings, or leave them empty.";
  if (Object.keys(errors).length) return fail("Please check the highlighted answers.", errors);

  const start = new Date(event.start);
  const born = new Date(dob);
  const ageAtCamp = start.getUTCFullYear() - born.getUTCFullYear() - (start.getUTCMonth() < born.getUTCMonth() || (start.getUTCMonth() === born.getUTCMonth() && start.getUTCDate() < born.getUTCDate()) ? 1 : 0);
  const camp = await campOf(event);
  const ageReview = camp === "jewels" ? ageAtCamp < 6 || ageAtCamp > 12 : camp === "teen-life" ? ageAtCamp < 13 || ageAtCamp > 19 : false;
  const phone = normalisePhone(phoneRaw);

  const dedupe = createHash("sha256").update(`${childName.toLowerCase().replace(/\s+/g, " ")}|${dob}|${phone}|${event.id}`).digest("hex");
  const existing = (await applications.list()).find((a) => (a as CampApplication & { dedupe?: string }).dedupe === dedupe);
  if (existing) return fail(`We already have an application for this child for this camp. If you need to change something, ${callUs}.`);

  const sealedData: CampSealed = {
    dob,
    nickname: clean(fd.get("nickname"), 60) || undefined,
    gender: clean(fd.get("gender"), 20) || undefined,
    school: clean(fd.get("school"), 120) || undefined,
    grade: clean(fd.get("grade"), 40) || undefined,
    guardianId: clean(fd.get("guardianId"), 30) || undefined,
    residence: clean(fd.get("residence"), 120) || undefined,
    house: clean(fd.get("house"), 60) || undefined,
    doctor: clean(fd.get("doctor"), 120) || undefined,
    hospital: clean(fd.get("hospital"), 120) || undefined,
    doctorPhone: clean(fd.get("doctorPhone"), 20) || undefined,
    blood: clean(fd.get("blood"), 10) || undefined,
    insurer: clean(fd.get("insurer"), 120) || undefined,
    policy: clean(fd.get("policy"), 60) || undefined,
    conditions: clean(fd.get("conditions"), 1000) || undefined,
    allergies: clean(fd.get("allergies"), 1000) || undefined,
    disabilities: clean(fd.get("disabilities"), 1000) || undefined,
    otherConditions: clean(fd.get("otherConditions"), 1000) || undefined,
    medication: clean(fd.get("medication"), 1000) || undefined,
    specialNeeds: clean(fd.get("specialNeeds"), 1000) || undefined,
    swimming: clean(fd.get("swimming"), 20) || undefined,
    emergencies: emergencies.map((e) => ({ ...e, phone: normalisePhone(e.phone) })),
    mediaConsent: mediaConsent as "Yes" | "No",
    signature,
    consentVersion: "Teenlife Registration Form (2026) Part D",
    consentAt: new Date().toISOString(),
    paymentType: clean(fd.get("paymentType"), 30) || undefined,
    amount,
    paymentDate: clean(fd.get("paymentDate"), 10) || undefined,
    paymentMode: clean(fd.get("paymentMode"), 30) || undefined,
    paymentReference: clean(fd.get("paymentReference"), 80) || undefined,
    balanceDate: clean(fd.get("balanceDate"), 10) || undefined,
    pocketMoney,
  };

  // A signed-in family keeps the child's details for next year.
  const family = await getFamily();
  let childId: string | undefined;
  if (family) {
    try {
      childId = await saveChild(family, clean(fd.get("childId"), 40), childName, camp === "other" ? undefined : camp, profileOf(sealedData));
    } catch (error) {
      console.error("Could not save the child's details", error);
    }
  }

  const now = new Date().toISOString();
  const app: CampApplication & { dedupe: string } = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    eventId: event.id,
    eventTitle: event.title,
    camp,
    childName,
    guardian,
    phone,
    email: email || undefined,
    ageAtCamp,
    ageReview,
    status: "Pending review",
    paymentVerified: false,
    sealed: await seal(sealedData),
    familyId: family?.id,
    childId,
    dedupe,
  };
  try {
    await applications.put(app);
  } catch (error) {
    console.error("Could not save camp application", error);
    return fail(`We could not save that just now, ${callUs}.`);
  }
  after(() => notifyTeam("camp", childName));
  return { ok: true, name: childName.split(/\s+/)[0], type: family ? "family" : undefined };
}
