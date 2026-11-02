"use server";

import { log, requirePerm } from "@/lib/auth";
import { makeSecret, setCodeRequired, setPhrase } from "@/lib/door";
import { StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";

const ok = (message: string): Result => ({ ok: true, message, stamp: Date.now() });
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

export async function savePhrase(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const problem = await setPhrase(admin.name, String(fd.get("phrase") ?? ""));
    if (problem) return bad(problem, { phrase: problem });
    await log(admin, "Changed the team door phrase");
    return ok("The new phrase works now. Tell the team privately.");
  });
}

/** Makes the secret for the rotating code. Phones must add it again. */
export async function makeCode(): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    await makeSecret(admin.name);
    await log(admin, "Made a new secret for the team door code");
    return ok("New code made. Add it to your phone with the picture below.");
  });
}

export async function switchCode(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const on = String(fd.get("on") ?? "") === "yes";
    const problem = await setCodeRequired(admin.name, on, String(fd.get("code") ?? ""));
    if (problem) return bad(problem, { code: problem });
    await log(admin, on ? "Switched the team door code on" : "Switched the team door code off");
    return ok(on ? "The team door now asks for the code." : "The team door no longer asks for the code.");
  });
}
