import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { clientKey, newId, secretKey } from "./auth";
import { seal } from "./crypto";
import { collection, store } from "./store";
import type { CampSealed, Camper, CampUpdate, ChildProfile, Family, FamilyChild } from "./types";

/**
 * Parents sign in with a phone number and a password. They are kept apart from the team's accounts, and a family
 * can only ever reach its own children. Nothing is charged here; the camp office confirms payments.
 */
export const families = collection<Family>("families");
export const familyChildren = collection<FamilyChild>("family-children");
export const campUpdates = collection<CampUpdate>("camp-updates");
export const campers = collection<Camper>("campers");

const COOKIE = "ch_family";
const DAYS = 14;
const fingerprint = (f: Family) => f.hash.slice(-12);

/* ---------- one account per phone number ---------- */
const phoneKey = (phone: string) => `family-phone:${phone}`;

export async function familyByPhone(phone: string): Promise<Family | null> {
  const id = await store.getDoc<string>(phoneKey(phone));
  return id ? families.get(id) : null;
}
export const claimPhone = (phone: string, id: string) => store.setDoc(phoneKey(phone), id);

/* ---------- the session ---------- */
export async function startFamilySession(family: Family) {
  const key = await secretKey();
  if (!key) throw new Error("Sign-in is not set up on this site yet.");
  const token = await new SignJWT({ f: fingerprint(family), k: "family" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(family.id)
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(key);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL),
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 86400,
  });
}

export async function endFamilySession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in parent, checked against the saved record every time so a changed password signs old devices out. */
export const getFamily = cache(async (): Promise<Family | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  const key = await secretKey();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (payload.k !== "family" || !payload.sub) return null;
    const family = await families.get(payload.sub);
    if (!family || !family.active || payload.f !== fingerprint(family)) return null;
    return family;
  } catch {
    return null;
  }
});

/** True while this number or place has made too many sign-in attempts. */
export async function tooManyFamilyAttempts(phone: string): Promise<boolean> {
  const [byIp, byPhone] = await Promise.all([store.hit(`family-ip:${await clientKey()}`, 600), store.hit(`family-phone-try:${phone}`, 900)]);
  return byIp > 20 || byPhone > 8;
}

/* ---------- codes from the camp office ---------- */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Eight easy-to-read characters, written XXXX-XXXX. */
export function newCode(): string {
  const raw = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
export const codeHash = (code: string) => createHash("sha256").update(code.toUpperCase().replace(/[^A-Z0-9]/g, "")).digest("hex");
export const CODE_DAYS = 14;

/* ---------- a child's saved details ---------- */
const profileFields = ["dob", "nickname", "gender", "school", "grade", "guardianId", "residence", "house", "doctor", "hospital", "doctorPhone", "blood", "insurer", "policy", "conditions", "allergies", "disabilities", "otherConditions", "medication", "specialNeeds", "swimming"] as const;

/** The parts of an application worth keeping for next time. Consent and payment are asked again every year. */
export function profileOf(d: CampSealed): ChildProfile {
  const p = { emergencies: d.emergencies } as ChildProfile;
  for (const k of profileFields) if (d[k]) (p as Record<string, unknown>)[k] = d[k];
  return p;
}

/** A child's saved details as plain text answers, ready to fill the application form. */
export function prefillOf(family: Family, child: FamilyChild | null, profile: ChildProfile | null): Record<string, string> {
  const out: Record<string, string> = { guardian: family.name, phone: family.phone, ...(family.email ? { email: family.email } : {}) };
  if (!child) return out;
  out.childId = child.id;
  out.name = child.name;
  if (profile) {
    for (const k of profileFields) if (profile[k]) out[k] = profile[k] as string;
    profile.emergencies.slice(0, 3).forEach((e, i) => {
      out[`em${i + 1}Name`] = e.name;
      out[`em${i + 1}Rel`] = e.relationship ?? "";
      out[`em${i + 1}Phone`] = e.phone;
      out[`em${i + 1}Email`] = e.email ?? "";
    });
  }
  return out;
}

/** Remembers the child under the signed-in family (found by id, then by name) so next year's application starts filled in. Returns the child's id. */
export async function saveChild(family: Family, wantedId: string, name: string, camp: FamilyChild["camp"], profile: ChildProfile): Promise<string> {
  const mine = (await familyChildren.list()).filter((c) => c.familyId === family.id);
  const found = mine.find((c) => c.id === wantedId) ?? mine.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const now = new Date().toISOString();
  const sealed = await seal(profile);
  const next: FamilyChild = found
    ? { ...found, name, camp: camp ?? found.camp, sealed, updatedAt: now }
    : { id: newId(), familyId: family.id, name, camp, sealed, createdAt: now, updatedAt: now };
  await familyChildren.put(next);
  return next.id;
}
