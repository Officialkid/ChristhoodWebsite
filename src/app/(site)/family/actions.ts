"use server";

import { redirect } from "next/navigation";
import { checkPassword, clientKey, hashPassword, newId, passwordProblem } from "@/lib/auth";
import {
  campers, claimPhone, codeHash, endFamilySession, families, familyByPhone, familyChildren, getFamily, startFamilySession, tooManyFamilyAttempts,
} from "@/lib/family";
import { normalisePhone, phoneOk } from "@/lib/phone";
import { store } from "@/lib/store";
import { site } from "@/content/site";
import type { Family, FamilyChild } from "@/lib/types";
import type { FormState } from "../connect-actions";

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const fail = (message: string, errors?: Record<string, string>): FormState => ({ ok: false, message, errors });
const callUs = `call or WhatsApp the camp office on 0${site.whatsapp.camps.replace(/^254/, "")}`;
const trapped = (fd: FormData) => Boolean(clean(fd.get("website"))) || Number(fd.get("elapsedMs") ?? 0) < 3000;

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
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  else if (password !== String(fd.get("again") ?? "")) errors.again = "The two passwords are not the same.";
  if (Object.keys(errors).length) return fail("Please check the highlighted answers.", errors);

  const phone = normalisePhone(phoneRaw);
  if (await familyByPhone(phone)) return fail("There is already a family account for that number.", { phone: "This number already has an account. Sign in instead, or ask the camp office for help." });

  const family: Family = { id: newId(), phone, name, email: email || undefined, hash: await hashPassword(password), active: true, createdAt: new Date().toISOString() };
  try {
    await families.put(family);
    await claimPhone(phone, family.id);
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
  const problem = passwordProblem(next);
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
