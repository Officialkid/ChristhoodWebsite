"use server";

import { randomInt } from "node:crypto";
import { hashPassword, log, newId, requireUser } from "@/lib/auth";
import { CODE_DAYS, campers, campUpdates, codeHash, families, newCode } from "@/lib/family";
import { campScope } from "@/lib/rbac";
import { StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { CampUpdate } from "@/lib/types";

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

/** Easy to read out loud: no 0/O or 1/l. */
const tempPassword = () => Array.from({ length: 12 }, () => "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"[randomInt(54)]).join("");

/** The camp office makes a one-time code after checking the person really is the child's parent. */
export async function issueFamilyCode(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (campScope(user) !== "all") return bad("Only an administrator or the Camps Department can give out family codes.");
  return guard(async () => {
    const camper = await campers.get(text(fd, "id", 60));
    if (!camper) return bad("That camper is not on the list.");
    if (camper.familyId) return bad(`${camper.name} is already on a family page.`);
    const code = newCode();
    await campers.put({ ...camper, code: { hash: codeHash(code), expires: new Date(Date.now() + CODE_DAYS * 86_400_000).toISOString() } });
    await log(user, "Made a family code", camper.name);
    return ok(`Give this code to the parent. It works once and runs out in ${CODE_DAYS} days.`, { secret: code });
  });
}

/** Which programmes this person may write to families about. */
const allowed = (user: Awaited<ReturnType<typeof requireUser>>): CampUpdate["camp"][] => {
  const scope = campScope(user);
  return scope === "all" ? ["all", "jewels", "teen-life"] : scope;
};

export async function postUpdate(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  return guard(async () => {
    const camp = text(fd, "camp", 20) as CampUpdate["camp"];
    if (!allowed(user).includes(camp)) return bad("You cannot write to that group.", { camp: "Choose who this is for." });
    const title = text(fd, "title", 120);
    const body = text(fd, "body", 3000);
    const errors: Record<string, string> = {};
    if (title.length < 3) errors.title = "Give the update a short title.";
    if (body.length < 3) errors.body = "Write the update.";
    if (Object.keys(errors).length) return bad("Please check the highlighted answers.", errors);
    await campUpdates.put({ id: newId(), createdAt: new Date().toISOString(), by: user.name, camp, title, body });
    await log(user, "Posted an update to families", title);
    return ok("Posted. Families can read it on their family page.");
  });
}

export async function deleteUpdate(fd: FormData): Promise<Result> {
  const user = await requireUser();
  return guard(async () => {
    const update = await campUpdates.get(text(fd, "id", 40));
    if (!update) return bad("That update is already gone.");
    if (!allowed(user).includes(update.camp)) return bad("That update is not yours to remove.");
    await campUpdates.remove(update.id);
    await log(user, "Removed an update to families", update.title);
    return ok("Removed.");
  });
}

/** A parent who forgot their password: the office gives a temporary one, and they choose their own when they sign in. */
export async function resetFamilyPassword(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (campScope(user) !== "all") return bad("Only an administrator or the Camps Department can reset a family password.");
  return guard(async () => {
    const family = await families.get(text(fd, "id", 40));
    if (!family) return bad("That family is not on the list.");
    const password = tempPassword();
    await families.put({ ...family, hash: await hashPassword(password), mustChange: true });
    await log(user, "Reset a family password", family.name);
    return ok(`New temporary password for ${family.name}.`, { secret: password });
  });
}
