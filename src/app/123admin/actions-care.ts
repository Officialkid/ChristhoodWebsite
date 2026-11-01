"use server";

import { requirePerm, log } from "@/lib/auth";
import { canReadPrayer } from "@/lib/rbac";
import { collection, StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { Prayer, Visitor } from "@/lib/types";

const visitors = collection<Visitor>("visitors");
const prayers = collection<Prayer>("prayers");
const text = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const ok = (message: string): Result => ({ ok: true, message, stamp: Date.now() });
const bad = (message: string): Result => ({ ok: false, message, stamp: Date.now() });

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

export async function updateGuest(fd: FormData): Promise<Result> {
  const user = await requirePerm("visitors");
  return guard(async () => {
    const v = await visitors.get(text(fd, "id", 40));
    if (!v) return bad("That guest is no longer in the list.");
    const status = text(fd, "status", 12) as Visitor["status"];
    if (!["new", "contacted", "settled"].includes(status)) return bad("Choose a status.");
    await visitors.put({ ...v, status, notes: text(fd, "notes") || undefined, followedUpBy: status === "new" ? undefined : v.followedUpBy && v.status !== "new" ? v.followedUpBy : user.name });
    await log(user, "Updated a guest", v.fullName);
    return ok("Saved.");
  });
}

export async function deleteGuest(fd: FormData): Promise<Result> {
  const user = await requirePerm("visitors");
  if (user.role !== "admin" && !user.departments.includes("pastoral")) return bad("Only the pastoral team or an administrator can delete guest records.");
  return guard(async () => {
    const v = await visitors.get(text(fd, "id", 40));
    if (!v) return bad("That guest is already gone.");
    await visitors.remove(v.id);
    await log(user, "Deleted a guest record", v.fullName);
    return ok("Guest record deleted.");
  });
}

export async function updatePrayer(fd: FormData): Promise<Result> {
  const user = await requirePerm("prayers");
  return guard(async () => {
    const p = await prayers.get(text(fd, "id", 40));
    if (!p || !canReadPrayer(user, p)) return bad("That request is not available to you.");
    const status = text(fd, "status", 12) as Prayer["status"];
    if (!["new", "praying", "done"].includes(status)) return bad("Choose a status.");
    await prayers.put({ ...p, status, notes: text(fd, "notes") || undefined, handledBy: status === "new" ? undefined : p.handledBy && p.status !== "new" ? p.handledBy : user.name });
    await log(user, "Updated a prayer request");
    return ok("Saved.");
  });
}

export async function deletePrayer(fd: FormData): Promise<Result> {
  const user = await requirePerm("prayers");
  return guard(async () => {
    const p = await prayers.get(text(fd, "id", 40));
    if (!p || !canReadPrayer(user, p)) return bad("That request is not available to you.");
    await prayers.remove(p.id);
    await log(user, "Deleted a prayer request");
    return ok("Request deleted.");
  });
}
