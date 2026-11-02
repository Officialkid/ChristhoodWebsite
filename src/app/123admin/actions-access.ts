"use server";

import { log, newId, requirePerm, users } from "@/lib/auth";
import { accessRequests } from "@/lib/access";
import { departments } from "@/lib/rbac";
import { StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { Role, StoredUser } from "@/lib/types";

const text = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
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

/** An administrator gives someone who asked the access they need. They sign in with Google from then on. */
export async function approveRequest(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const req = await accessRequests.get(text(fd, "id", 40));
    if (!req) return bad("That request is already gone.");
    const role: Role = text(fd, "role", 10) === "admin" ? "admin" : "head";
    const deps = fd.getAll("departments").map(String).filter((d) => departments.some((x) => x.id === d));
    if (role === "head" && !deps.length) return bad("Choose at least one department.", { departments: "Choose at least one department." });
    if ((await users.list()).some((u) => u.email.toLowerCase() === req.email)) {
      await accessRequests.remove(req.id);
      return bad("That person is already on the team.");
    }
    const user: StoredUser = { id: newId(), email: req.email, name: req.name, role, departments: role === "admin" ? [] : deps, hash: "", active: true, googleSub: req.sub, createdAt: new Date().toISOString() };
    await users.put(user);
    await accessRequests.remove(req.id);
    await log(admin, "Approved team access", `${req.name} (${role === "admin" ? "administrator" : deps.join(", ")})`);
    return ok(`${req.name} can now sign in with Google.`);
  });
}

export async function declineRequest(fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const req = await accessRequests.get(text(fd, "id", 40));
    if (!req) return bad("That request is already gone.");
    await accessRequests.put({ ...req, status: "declined" });
    await log(admin, "Declined team access", req.name);
    return ok("Declined. They are not told, and the request is kept so it does not come back.");
  });
}

export async function reopenRequest(fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const req = await accessRequests.get(text(fd, "id", 40));
    if (!req) return bad("That request is already gone.");
    await accessRequests.put({ ...req, status: "pending" });
    await log(admin, "Reopened a request for team access", req.name);
    return ok("Back in the waiting list.");
  });
}

export async function deleteRequest(fd: FormData): Promise<Result> {
  await requirePerm("users");
  return guard(async () => {
    await accessRequests.remove(text(fd, "id", 40));
    return ok("Removed.");
  });
}
