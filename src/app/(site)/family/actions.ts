"use server";

import { redirect } from "next/navigation";
import { checkPassword, clientKey, familyPasswordProblem, hashPassword, newId } from "@/lib/auth";
import { randomInt, createHash, timingSafeEqual } from "node:crypto";
import { getEvents } from "@/lib/content";
import { seal, unseal } from "@/lib/crypto";
import {
  campers, claimPhone, claimPhoneIfFree, codeHash, endFamilySession, families, familyByPhone, familyChildren, getFamily, startFamilySession, tooManyFamilyAttempts,
} from "@/lib/family";
import { sendPhoneVerificationCode } from "@/lib/httpsms";
import { normalisePhone, phoneOk } from "@/lib/phone";
import { collection, store } from "@/lib/store";
import { site } from "@/content/site";
import type { CampApplication, CampSealed, ChildProfile, Family, FamilyChild } from "@/lib/types";
import type { FormState } from "../connect-actions";

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const fail = (message: string, errors?: Record<string, string>): FormState => ({ ok: false, message, errors });
const callUs = `call or WhatsApp the camp office on 0${site.whatsapp.camps.replace(/^254/, "")}`;
const trapped = (fd: FormData) => Boolean(clean(fd.get("website"))) || Number(fd.get("elapsedMs") ?? 0) < 3000;
const applications = collection<CampApplication>("camp-applications");
type PhoneChange = { phone: string; hash: string; expiresAt: number };
type CalendarDate = { year: number; month: number; day: number };

function dateOnly(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
}

function nairobiDate(value: string): CalendarDate | null {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (type: "year" | "month" | "day") => Number(parts.find((item) => item.type === type)?.value);
  const result = { year: part("year"), month: part("month"), day: part("day") };
  return Object.values(result).every(Number.isFinite) ? result : null;
}

function ageOn(birth: CalendarDate, date: CalendarDate) {
  return date.year - birth.year - (date.month < birth.month || (date.month === birth.month && date.day < birth.day) ? 1 : 0);
}

const childProfileFields = [
  "dob", "nickname", "gender", "school", "grade", "guardianId", "residence", "house", "doctor", "hospital", "doctorPhone", "blood", "insurer", "policy", "conditions", "allergies", "disabilities", "otherConditions", "medication", "specialNeeds", "swimming",
] as const;

export async function updateFamilyContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) return fail("Please sign in again.");
  const name = clean(fd.get("name"), 120);
  const email = clean(fd.get("email"), 120);
  const smsUpdates = fd.get("smsUpdates") === "yes";
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your full name.";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "That email address does not look right.";
  if (Object.keys(errors).length) return fail("Please check your details.", errors);

  const updated = { ...family, name, email: email || undefined, smsUpdates };
  const changed: CampApplication[] = [];
  try {
    const previous = (await applications.list()).filter((app) => app.familyId === family.id);
    await families.put(updated);
    for (const app of previous) {
      changed.push(app);
      await applications.put({ ...app, guardian: name, email: email || undefined, smsUpdates });
    }
  } catch {
    await Promise.allSettled(changed.map((app) => applications.put(app)));
    await families.put(family).catch(() => undefined);
    return fail("We could not save your contact details just now. Please try again.");
  }
  return { ok: true, message: "Your contact details have been updated." };
}

/** Parents can update a saved child's care details and any camp that has not finished yet. */
export async function updateFamilyChildProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) return fail("Please sign in again.");
  if ((await store.hit(`family-child-update:${family.id}`, 900)) > 12) return fail("Too many updates. Please wait a little and try again.");

  const childId = clean(fd.get("childId"), 60);
  const child = await familyChildren.get(childId);
  if (!child || child.familyId !== family.id) return fail("That child is not on your family page.");

  const name = clean(fd.get("name"), 120);
  const dob = clean(fd.get("dob"), 10);
  const birthDate = dateOnly(dob);
  const gender = clean(fd.get("gender"), 20);
  const grade = clean(fd.get("grade"), 40);
  const school = clean(fd.get("school"), 120);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter the child's full name.";
  if (!birthDate) errors.dob = "Enter a valid date of birth.";
  else {
    const today = nairobiDate(new Date().toISOString());
    if (today && ageOn(birthDate, today) < 0) errors.dob = "The birth date cannot be in the future.";
  }
  if (gender !== "Female" && gender !== "Male") errors.gender = "Choose male or female.";
  if (!grade) errors.grade = "Enter the child's class or grade.";

  const emergencies = [1, 2, 3].map((n) => ({
    name: clean(fd.get(`em${n}Name`), 120),
    relationship: clean(fd.get(`em${n}Rel`), 60),
    email: clean(fd.get(`em${n}Email`), 120),
    phone: clean(fd.get(`em${n}Phone`), 20),
  }));
  emergencies.forEach((contact, index) => {
    if (contact.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) errors[`em${index + 1}Email`] = "Check this email address.";
    if ((contact.name || contact.phone || contact.relationship || contact.email) && (!contact.name || !contact.phone)) {
      errors[`em${index + 1}Name`] = "Add both a name and phone number, or leave this contact empty.";
    } else if (contact.phone && !phoneOk(contact.phone)) {
      errors[`em${index + 1}Phone`] = "Check this phone number.";
    }
  });
  if (!emergencies[0].name || !emergencies[0].phone) errors.em1Name = "Keep at least one emergency contact with a name and phone number.";

  const swimming = clean(fd.get("swimming"), 20);
  if (swimming && !["None", "Beginner", "Intermediate", "Advanced"].includes(swimming)) errors.swimming = "Choose a swimming level.";
  if (Object.keys(errors).length) return fail("Please check the highlighted answers.", errors);

  const optional = (key: string, max = 300) => clean(fd.get(key), max) || undefined;
  const profile: ChildProfile = {
    dob,
    nickname: optional("nickname", 60),
    gender,
    school: school || undefined,
    grade,
    guardianId: optional("guardianId", 30),
    residence: optional("residence", 120),
    house: optional("house", 60),
    doctor: optional("doctor", 120),
    hospital: optional("hospital", 120),
    doctorPhone: optional("doctorPhone", 20),
    blood: optional("blood", 10),
    insurer: optional("insurer", 120),
    policy: optional("policy", 60),
    conditions: optional("conditions", 1000),
    allergies: optional("allergies", 1000),
    disabilities: optional("disabilities", 1000),
    otherConditions: optional("otherConditions", 1000),
    medication: optional("medication", 1000),
    specialNeeds: optional("specialNeeds", 1000),
    swimming: swimming || undefined,
    emergencies: emergencies
      .filter((contact) => contact.name && contact.phone)
      .map((contact) => ({ ...contact, phone: normalisePhone(contact.phone), email: contact.email || undefined, relationship: contact.relationship || undefined })),
  };

  let saved: { before: CampApplication; after: CampApplication }[];
  try {
    const [allApps, events] = await Promise.all([applications.list(), getEvents()]);
    const current = allApps.filter((app) => app.familyId === family.id && app.childId === child.id && app.status !== "Declined");
    saved = [];
    for (const app of current) {
      const event = events.find((item) => item.id === app.eventId && item.category === "camp");
      if (!event || Date.parse(event.end ?? event.start) < Date.now()) continue;
      const old = await unseal<CampSealed>(app.sealed);
      const start = nairobiDate(event.start);
      const ageAtCamp = start ? ageOn(birthDate!, start) : app.ageAtCamp;
      const ageReview = app.camp === "jewels" ? ageAtCamp < 7 || ageAtCamp > 12 : app.camp === "teen-life" ? ageAtCamp < 13 || ageAtCamp > 19 : app.ageReview;
      const next: CampApplication = {
        ...app,
        childName: name,
        ageAtCamp,
        ageReview,
        sealed: await seal({ ...old, ...profile } satisfies CampSealed),
        updatedAt: new Date().toISOString(),
        parentUpdatedAt: new Date().toISOString(),
      };
      saved.push({ before: app, after: next });
    }
  } catch {
    return fail("We could not open the child's camp details. Nothing was changed; please try again or contact the camp office.");
  }

  const updatedChild: FamilyChild = { ...child, name, sealed: await seal(profile), updatedAt: new Date().toISOString() };
  const changedApps: CampApplication[] = [];
  try {
    await familyChildren.put(updatedChild);
    for (const item of saved) {
      changedApps.push(item.before);
      await applications.put(item.after);
    }
  } catch {
    await familyChildren.put(child).catch(() => undefined);
    await Promise.allSettled(changedApps.map((app) => applications.put(app)));
    return fail("We could not save those details just now. Please try again.");
  }
  return { ok: true, message: "Your child's details are updated. The camp team can see the latest information." };
}

export async function requestFamilyPhoneChange(_prev: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) return fail("Please sign in again.");
  if ((await store.hit(`family-phone-change-rate:${family.id}`, 900)) > 4) return fail("Too many codes were requested. Please wait a little and try again.");
  const raw = clean(fd.get("phone"), 20);
  if (!phoneOk(raw)) return fail("Enter a mobile number we can reach you on.", { phone: "Check the phone number." });
  const phone = normalisePhone(raw);
  if (phone === family.phone) return fail("That is already the phone number on your account.");
  const claimed = await familyByPhone(phone);
  if (claimed && claimed.id !== family.id) return fail("That phone number is already linked to another family page.", { phone: "Use a different phone number or contact the camp office." });

  const code = randomInt(100000, 1000000).toString();
  const challenge: PhoneChange = {
    phone,
    hash: createHash("sha256").update(`${family.id}:${phone}:${code}`).digest("hex"),
    expiresAt: Date.now() + 10 * 60_000,
  };
  await store.setDoc(`family-phone-change:${family.id}`, challenge);
  if (!(await sendPhoneVerificationCode(phone, code))) {
    await store.setDoc(`family-phone-change:${family.id}`, { ...challenge, expiresAt: 0 });
    return fail("Text verification is not available yet. Please ask the camp office to update this phone number.");
  }
  return { ok: true, message: `A verification code was sent to ${phone}. It expires in 10 minutes.` };
}

export async function confirmFamilyPhoneChange(_prev: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) return fail("Please sign in again.");
  if ((await store.hit(`family-phone-confirm:${family.id}`, 900)) > 8) return fail("Too many attempts. Please wait a little and try again.");
  const code = clean(fd.get("code"), 8).replace(/\s/g, "");
  const challenge = await store.getDoc<PhoneChange>(`family-phone-change:${family.id}`);
  if (!challenge || challenge.expiresAt < Date.now() || !/^\d{6}$/.test(code)) return fail("That code has expired or is not right. Request a new one.", { code: "Enter the six-digit code." });
  const supplied = createHash("sha256").update(`${family.id}:${challenge.phone}:${code}`).digest();
  const expected = Buffer.from(challenge.hash, "hex");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return fail("That code has expired or is not right.", { code: "Check the six digits and try again." });
  const claimed = await familyByPhone(challenge.phone);
  if (claimed && claimed.id !== family.id) return fail("That number has been linked to another family page. Contact the camp office.");

  const updated = { ...family, phone: challenge.phone };
  const previous = (await applications.list()).filter((app) => app.familyId === family.id);
  const changed: CampApplication[] = [];
  try {
    await families.put(updated);
    await claimPhone(challenge.phone, family.id);
    for (const app of previous) {
      changed.push(app);
      await applications.put({ ...app, phone: challenge.phone });
    }
    await store.setDoc(`family-phone-change:${family.id}`, { ...challenge, expiresAt: 0 });
    await startFamilySession(updated);
  } catch {
    await Promise.allSettled(changed.map((app) => applications.put(app)));
    await families.put(family).catch(() => undefined);
    return fail("We could not update your phone number just now. Please try again.");
  }
  return { ok: true, message: "Your sign-in and camp contact number have been updated." };
}

export async function registerFamily(_prev: FormState, fd: FormData): Promise<FormState> {
  if (trapped(fd)) return fail("Please try again.");
  if (!store.writable) return fail(`Family accounts are not switched on yet, please ${callUs}.`);
  if ((await store.hit(`family-new:${await clientKey()}`, 3600)) > 10) return fail("That is a lot of new accounts from one place. Please try again in an hour.");

  const errors: Record<string, string> = {};
  const name = clean(fd.get("name"), 120);
  const phoneRaw = clean(fd.get("phone"), 20);
  const email = clean(fd.get("email"), 120);
  const password = String(fd.get("password") ?? "");
  if (name.length < 2) errors.name = "Enter your full name.";
  if (!phoneOk(phoneRaw)) errors.phone = "Enter the mobile number you want to sign in with.";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "That email address does not look right.";
  const problem = familyPasswordProblem(password);
  if (problem) errors.password = problem;
  else if (password !== String(fd.get("again") ?? "")) errors.again = "The two passwords are not the same.";
  if (Object.keys(errors).length) return fail("Please check the highlighted answers.", errors);

  const phone = normalisePhone(phoneRaw);
  if (await familyByPhone(phone)) return fail("There is already a family account for that number.", { phone: "This number already has an account. Sign in instead, or ask the camp office for help." });

  const family: Family = { id: newId(), phone, name, email: email || undefined, hash: await hashPassword(password), active: true, createdAt: new Date().toISOString() };
  try {
    await families.put(family);
    if (!(await claimPhoneIfFree(phone, family.id))) {
      await families.remove(family.id);
      return fail("There is already a family account for that number.", { phone: "This number already has an account. Sign in instead, or ask the camp office for help." });
    }
    await startFamilySession(family);
  } catch (error) {
    console.error("Could not create a family account", error);
    return fail(`We could not create the account just now, please ${callUs}.`);
  }
  redirect("/family");
}

export async function signInFamily(_prev: FormState, fd: FormData): Promise<FormState> {
  const phone = normalisePhone(clean(fd.get("phone"), 20));
  const password = String(fd.get("password") ?? "");
  if (!phoneOk(phone) || !password) return fail("Enter your phone number and password.");
  if (await tooManyFamilyAttempts(phone)) return fail("Too many tries. Please wait a few minutes and try again.");
  const family = await familyByPhone(phone);
  const good = await checkPassword(password, family?.hash);
  if (!family || !family.active || !good) return fail("That phone number and password do not match.");
  await startFamilySession(family);
  redirect("/family");
}

export async function signOutFamily() {
  await endFamilySession();
  redirect("/family");
}

export async function changeFamilyPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) return fail("Please sign in again.");
  if ((await store.hit(`family-pw:${family.id}`, 900)) > 8) return fail("Too many tries. Please wait a few minutes.");
  if (!(await checkPassword(String(fd.get("current") ?? ""), family.hash))) return fail("Your current password is not right.", { current: "That is not your current password." });
  const next = String(fd.get("password") ?? "");
  const problem = familyPasswordProblem(next);
  if (problem) return fail("Please choose a stronger password.", { password: problem });
  if (next !== String(fd.get("again") ?? "")) return fail("Please choose a stronger password.", { again: "The two passwords are not the same." });
  const updated: Family = { ...family, hash: await hashPassword(next), mustChange: false };
  await families.put(updated);
  await startFamilySession(updated);
  return { ok: true, message: "Your password has been changed." };
}

/** A parent enters the code the camp office gave them, and last year's camper joins their family page. */
export async function connectCamper(_prev: FormState, fd: FormData): Promise<FormState> {
  const family = await getFamily();
  if (!family) return fail("Please sign in again.");
  if ((await store.hit(`family-code:${family.id}`, 900)) > 6) return fail("Too many tries. Please wait a few minutes, or ask the camp office.");
  const code = clean(fd.get("code"), 20);
  if (code.replace(/[^A-Za-z0-9]/g, "").length < 8) return fail("Enter the eight-character code from the camp office.", { code: "The code has eight letters and numbers." });

  const hash = codeHash(code);
  const camper = (await campers.list()).find((c) => c.code?.hash === hash);
  if (!camper?.code || new Date(camper.code.expires).getTime() < Date.now()) return fail("That code is not right, or it has expired. Please ask the camp office for a new one.", { code: "That code is not right or has expired." });

  const now = new Date().toISOString();
  const child: FamilyChild = { id: newId(), familyId: family.id, name: camper.name, camp: camper.camp, camperId: camper.id, createdAt: now, updatedAt: now };
  const used = { ...camper, familyId: family.id };
  delete used.code;
  await familyChildren.put(child);
  await campers.put(used);
  return { ok: true, name: camper.name.split(/\s+/)[0] };
}
